/**
 * chatProvider.tsx
 *
 * Thin compatibility shim — all real connection logic lives in
 * contexts/ChatContext.tsx (ChatAppProvider) which is mounted once at
 * the app root.
 *
 * useChatClient() now reads from the global ChatAppProvider so it works
 * anywhere in the tree without needing a local <ChatProvider> wrapper.
 *
 * ChatProvider is kept as a passthrough so any remaining imports don't break.
 */

import React, { useCallback } from "react";
import { useChatAppClient } from "@/contexts/ChatContext";
import type { ChatClient } from "@sparkstrand/chat-api-client/v2/frontend";
import type { ChatUser, ConnectionState, ChatAttachment } from "@sparkstrand/chat-api-client/v2/types";

/** React Native file descriptor (from expo-image-picker / expo-document-picker) */
export interface MobileFile {
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
}

export interface ChatContextValue {
    client: ChatClient;
    connectionState: ConnectionState;
    user: ChatUser | null;
    uploadFiles: (files: MobileFile[], type?: string) => Promise<ChatAttachment[]>;
}

// ─── No-op passthrough — kept so old imports compile ─────────────────────────

interface ChatProviderProps {
    apiKey?: string;
    baseURL?: string;
    user?: ChatUser;
    tokenOrProvider?: any;
    children: React.ReactNode;
}

/** @deprecated ChatProvider is a no-op. Connection is handled by ChatAppProvider in _layout.tsx. */
export function ChatProvider({ children }: ChatProviderProps) {
    return <>{children}</>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChatClient(): ChatContextValue {
    const { client, connectionState } = useChatAppClient();

    if (!client) {
        throw new Error(
            "useChatClient: ChatAppProvider is not mounted. Make sure it wraps your app in _layout.tsx."
        );
    }

    // uploadFiles — uses the global client directly (same logic as before)
    const uploadFiles = useCallback(
        async (files: MobileFile[], type = "file"): Promise<ChatAttachment[]> => {
            if (!client.isConnected()) throw new Error("Chat client disconnected");

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

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const uploadData = uploadUrls[i];
                const contentType = uploadData.mime || file.mimeType || "application/octet-stream";

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

                attachments.push({
                    type: uploadData.type as any,
                    url: uploadData.fileUrl,
                    name: uploadData.name,
                    mime: uploadData.mime,
                    size: uploadData.size,
                });
            }

            return attachments;
        },
        [client]
    );

    return {
        client,
        connectionState,
        user: client.user ?? null,
        uploadFiles,
    };
}
