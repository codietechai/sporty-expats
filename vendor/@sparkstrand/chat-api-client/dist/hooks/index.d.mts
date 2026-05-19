import { ChatFrontendClient } from '../frontend/index.mjs';
import { IUser, IRoom, IMessage, ErrorData } from '../types/index.mjs';
import 'eventemitter3';

interface SocketState {
    isConnected: boolean;
    user: IUser | null;
    rooms: IRoom[];
    messages: IMessage[];
    typingUsers: {
        [roomId: string]: string[];
    };
    error: ErrorData | null;
    eventHistory: Array<{
        event: string;
        data: any;
        timestamp: Date;
    }>;
    currentRoomId: string | null;
    connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
    lastDisconnectReason: string | null;
}
declare function useSparkStrandChat(url: string, id: string, apiKey?: string, options?: {
    debug: boolean;
    autoConnect: boolean;
}): {
    socket: ChatFrontendClient;
    state: SocketState;
};

export { type SocketState, useSparkStrandChat };
