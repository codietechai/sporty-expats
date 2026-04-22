import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChatClient } from "@sparkstrand/chat-api-client/v2/frontend";
import { SocketEvent } from "@sparkstrand/chat-api-client/v2/types";
import type { ChatUser, ConnectionState, TokenProvider } from "@sparkstrand/chat-api-client/v2/types";

interface ChatContextValue {
    client: ChatClient;
    connectionState: ConnectionState;
    user: ChatUser | null;
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

    return (
        <ChatContext.Provider value={{ client, connectionState, user: client.user }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatClient(): ChatContextValue {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChatClient must be used inside <ChatProvider>");
    return ctx;
}
