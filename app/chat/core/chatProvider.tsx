import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { ChatClient } from "@sparkstrand/chat-api-client/v2/frontend";
import { SocketEvent } from "@sparkstrand/chat-api-client/v2/types";
import type { ChatUser, ConnectionState, TokenProvider, ChatAttachment } from "@sparkstrand/chat-api-client/v2/types";

interface ChatContextValue {
    client: ChatClient;
    connectionState: ConnectionState;
    user: ChatUser | null;
    uploadFiles: (files: MobileFile[], type?: string) => Promise<ChatAttachment[]>;
}

/** React Native file descriptor (from expo-image-picker / expo-document-picker) */
export interface MobileFile {
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
    apiKey: string;
    baseURL: string;
    user: ChatUser;
    tokenOrProvider: string | TokenProvider;
    children: React.ReactNode;
}

export function ChatProvider({ apiKey, baseURL, user, tokenOrProvider, children }: ChatProviderProps) {
    const clientRef = useRef(ChatClient.getInstance(apiKey, baseURL));
    const client = clientRef.current;
    const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const handleChange = ({ status }: { status: ConnectionState }) => setConnectionState(status);
        client.on(SocketEvent.CONNECTION_CHANGED, handleChange);
        client.connectUser(user, tokenOrProvider);

        return () => {
            client.off(SocketEvent.CONNECTION_CHANGED, handleChange);
            client.disconnectUser();
            initialized.current = false;
        };
    }, []);

    /**
     * Mobile uploadFiles — mirrors the web exactly:
     * 1. Get pre-signed S3 URLs from the chat API
     * 2. PUT each file to S3 using { uri, type, name } body
     *    (React Native fetch resolves local URIs to binary natively)
     * 3. Return ChatAttachment[]
     *
     * The web does: body: file (File object)
     * RN equivalent: body: { uri, type, name } — same binary result, no extra headers
     */
    const uploadFiles = useCallback(async (files: MobileFile[], type = "file"): Promise<ChatAttachment[]> => {
        if (!client.isConnected()) throw new Error("Chat client disconnected");

        // Step 1: request pre-signed upload URLs
        const payload = files.map((f) => ({
            name: f.name,
            type,
            mime: f.mimeType,
            size: f.size ?? 0,
        }));

        const uploadUrls: Array<{
            uploadUrl: string;
            fileUrl: string;
            key: string;
            name: string;
            mime: string;
            type: string;
            size: number;
        }> = await (client as any).apiFetch("/api/v2/chat/storage/upload-url", {
            method: "POST",
            body: JSON.stringify({ files: payload }),
        });

        const attachments: ChatAttachment[] = [];

        // Step 2: PUT each file directly to S3
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const uploadData = uploadUrls[i];
            const contentType = uploadData.mime || file.mimeType || "application/octet-stream";

            // React Native fetch supports { uri, type, name } as body —
            // it reads the local file and sends raw binary, exactly like web's body: File
            const putResponse = await fetch(uploadData.uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": contentType },
                body: { uri: file.uri, type: contentType, name: file.name } as any,
            });

            if (!putResponse.ok) {
                const errText = await putResponse.text().catch(() => "");
                console.error(`[uploadFiles] S3 PUT ${putResponse.status}:`, errText.substring(0, 500));
                throw new Error(`Failed to upload ${file.name}: ${putResponse.status}`);
            }

            console.log(`[uploadFiles] ✓ Uploaded "${file.name}" → ${uploadData.fileUrl}`);

            attachments.push({
                type: uploadData.type as any,
                url: uploadData.fileUrl,
                name: uploadData.name,
                mime: uploadData.mime,
                size: uploadData.size,
            });
        }

        return attachments;
    }, [client]);

    return (
        <ChatContext.Provider value={{ client, connectionState, user: client.user, uploadFiles }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatClient(): ChatContextValue {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChatClient must be used inside <ChatProvider>");
    return ctx;
}
