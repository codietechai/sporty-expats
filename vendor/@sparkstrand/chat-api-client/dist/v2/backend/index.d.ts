import { ChatUser, QueryUsersRequest, ICreateChatRoom, ChatRoom, QueryRoomsRequest, QueryRoomsResponse, ChatRoomMember, RoomMemberRole, QueryMessagesRequest, ChatMessage, ChatMessageReaction } from '../types/index.js';
import 'eventemitter3';

declare class ChatServerClient {
    private apiKey;
    private apiSecret;
    private baseURL;
    private constructor();
    /**
     * Initializes a new instance of the ChatServerClient.
     * This should only be used on server environments (Node.js) to prevent leaking the apiSecret.
     */
    static getInstance(apiKey: string, apiSecret: string, baseURL?: string): ChatServerClient;
    /**
     * Generates an offline token for a given user.
     * This token implies the application's backend has verified the user.
     * @param userId The unique ID of the user.
     * @param role Optional role (e.g. 'user', 'admin', 'moderator'). Defaults to 'user'.
     * @param exp Optional expiration time (in seconds). Defaults to 30 days.
     * @returns A signed JWT string that the frontend SDK can use to connect.
     */
    createToken(userId: string, role?: string, exp?: number): string;
    apiFetch<T = any>(endpoint: string, options?: RequestInit): Promise<T>;
    upsertUsers(users: Partial<ChatUser>[]): Promise<ChatUser[]>;
    queryUsers(query: QueryUsersRequest): Promise<ChatUser[]>;
    partialUpdateUsers(updates: any[]): Promise<any>;
    deactivateUser(userId: string): Promise<void>;
    reactivateUser(userId: string): Promise<void>;
    createRoom(data: ICreateChatRoom): Promise<ChatRoom>;
    truncateRoom(roomId: string): Promise<void>;
    freezeRoom(roomId: string, freeze?: boolean): Promise<void>;
    deleteRoom(roomId: string, hardDelete?: boolean): Promise<void>;
    updateRoomMetadata(roomId: string, data: {
        set?: Record<string, any>;
        unset?: string[];
    }): Promise<ChatRoom>;
    queryRooms(query: QueryRoomsRequest): Promise<QueryRoomsResponse>;
    queryMembers(roomId: string, query?: Record<string, any>): Promise<{
        members: ChatRoomMember[];
        total: number;
    }>;
    addMembers(roomId: string, members: {
        userId: string;
        roomRole: RoomMemberRole;
    }[]): Promise<void>;
    removeMembers(roomId: string, members: string[]): Promise<void>;
    moderateMember(roomId: string, userId: string, action: 'ban' | 'unban' | 'shadow_ban'): Promise<ChatRoomMember>;
    updatePreferences(roomId: string, preferences: Record<string, any>): Promise<any>;
    queryMessages(roomId: string, query: QueryMessagesRequest): Promise<ChatMessage[]>;
    deleteMessage(messageId: string): Promise<ChatMessage>;
    updateMessage(messageId: string, text: string): Promise<ChatMessage>;
    deleteReaction(messageId: string, emoji: string): Promise<ChatMessageReaction>;
    getUploadUrls(files: Array<{
        name: string;
        type: string;
        mime: string;
        size: number;
    }>): Promise<any>;
}

export { ChatServerClient };
