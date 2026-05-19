import { EventEmitter } from 'eventemitter3';
import { SocketClientOptions, IEditMessage, IDeleteMessage, ICreateRoom, ISendMessage, UserStatus } from '../types/index.js';

declare class ChatFrontendClient extends EventEmitter {
    private socket;
    private options;
    private messageQueue;
    private isConnectedToChatSocket;
    private typingTimeouts;
    private debug;
    private eventHistory;
    private guestId;
    private apiKey;
    constructor(options: SocketClientOptions);
    private setupEventListeners;
    private setItemWithExpiry;
    private getItemWithExpiry;
    login(id: string): Promise<void>;
    /**
     * Attempt to reconnect using the existing cookie
     * This can be called when the connection is lost or manually by the user
     */
    reconnect(): Promise<void>;
    disconnect(): void;
    isConnected(): boolean;
    joinRoom(roomId: string): void;
    switchRoom(roomId: string): void;
    leaveRoom(roomId: string): void;
    getListOfGuestRooms(): void;
    getRoomDataById(roomId: string): void;
    getRoomMedia(roomId: string): void;
    getRoomMessages(roomId: string, limit: number, cursor?: string): void;
    editMessage(message: IEditMessage): void;
    deleteMessage(message: IDeleteMessage): void;
    createRoom(data: ICreateRoom): void;
    sendMessage(message: ISendMessage): Promise<void>;
    markMessageRead(messageId: string): void;
    setUserStatus(status: UserStatus): void;
    sendTypingIndicator(roomId: string): void;
    sendStopTypingIndicator(roomId: string): void;
    private processMessageQueue;
    setUrl(url: string): void;
    getUrl(): string;
    getPublicApiKey(): string;
    getUserId(): string | null;
    private log;
    getEventHistory(): Array<{
        event: string;
        data: any;
        timestamp: Date;
    }>;
}

export { ChatFrontendClient };
