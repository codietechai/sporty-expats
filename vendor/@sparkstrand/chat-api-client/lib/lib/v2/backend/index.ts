import jwt from 'jsonwebtoken';
import { ChatMessage, ChatMessageReaction, ChatRoom, ChatRoomMember, ChatUser, ICreateChatRoom, QueryMessagesRequest, QueryRoomsRequest, QueryRoomsResponse, QueryUsersRequest, RoomMemberRole } from '../types';

export class ChatServerClient {
    private apiKey: string;
    private apiSecret: string;
    private baseURL: string;

    private constructor(apiKey: string, apiSecret: string, baseURL: string = 'http://localhost:3000') {
        if (!apiKey || !apiSecret) {
            throw new Error('ChatServerClient requires both an API Key and an API Secret.');
        }
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.baseURL = baseURL;
    }

    /**
     * Initializes a new instance of the ChatServerClient.
     * This should only be used on server environments (Node.js) to prevent leaking the apiSecret.
     */
    public static getInstance(apiKey: string, apiSecret: string, baseURL?: string): ChatServerClient {
        return new ChatServerClient(apiKey, apiSecret, baseURL);
    }

    /**
     * Generates an offline token for a given user.
     * This token implies the application's backend has verified the user.
     * @param userId The unique ID of the user.
     * @param role Optional role (e.g. 'user', 'admin', 'moderator'). Defaults to 'user'.
     * @param exp Optional expiration time (in seconds). Defaults to 30 days.
     * @returns A signed JWT string that the frontend SDK can use to connect.
     */
    public createToken(userId: string, role: string = 'user', exp?: number): string {
        if (!userId) {
            throw new Error('userId is required to create a token');
        }

        const payload = {
            userId,
            role
        };

        const options: jwt.SignOptions = {
            algorithm: "HS256",
            expiresIn: exp || 60 * 60 * 24 * 30 // 30 days default
        };

        return jwt.sign(payload, this.apiSecret, options);
    }

    // #region REST API Wrappers

    public async apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'x-api-key-secret': this.apiSecret,
            ...(options.headers as Record<string, string> || {})
        };

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.message || result.error || 'Server API Request failed');

        return result.data as T;
    }

    // --- Users ---

    public async upsertUsers(users: Partial<ChatUser>[]): Promise<ChatUser[]> {
        return this.apiFetch<ChatUser[]>(`/api/v2/chat/users/upsert`, {
            method: 'POST',
            body: JSON.stringify({ users })
        });
    }

    public async queryUsers(query: QueryUsersRequest): Promise<ChatUser[]> {
        const queryParams = new URLSearchParams();
        Object.entries(query).forEach(([key, val]) => queryParams.append(key, String(val)));
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return this.apiFetch<ChatUser[]>(`/api/v2/chat/users${queryString}`, { method: 'GET' });
    }

    public async partialUpdateUsers(updates: any[]): Promise<any> {
        return this.apiFetch(`/api/v2/chat/users`, {
            method: 'PATCH',
            body: JSON.stringify({ updates })
        });
    }

    public async deactivateUser(userId: string): Promise<void> {
        return this.apiFetch<void>(`/api/v2/chat/users/${userId}/deactivate`, { method: 'POST' });
    }

    public async reactivateUser(userId: string): Promise<void> {
        return this.apiFetch<void>(`/api/v2/chat/users/${userId}/reactivate`, { method: 'POST' });
    }

    // --- Rooms ---

    public async createRoom(data: ICreateChatRoom): Promise<ChatRoom> {
        return this.apiFetch<ChatRoom>(`/api/v2/chat/rooms`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    public async truncateRoom(roomId: string): Promise<void> {
        return this.apiFetch<void>(`/api/v2/chat/rooms/${roomId}/truncate`, { method: 'POST' });
    }

    public async freezeRoom(roomId: string, freeze: boolean = true): Promise<void> {
        return this.apiFetch<void>(`/api/v2/chat/rooms/${roomId}/freeze`, {
            method: 'POST',
            body: JSON.stringify({ freeze })
        });
    }

    public async deleteRoom(roomId: string, hardDelete: boolean = false): Promise<void> {
        return this.apiFetch<void>(`/api/v2/chat/rooms/${roomId}?hard_delete=${hardDelete}`, { method: 'DELETE' });
    }

    public async updateRoomMetadata(roomId: string, data: {set?: Record<string, any>, unset?: string[]}): Promise<ChatRoom> {
        return this.apiFetch<ChatRoom>(`/api/v2/chat/rooms/${roomId}/metadata`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    public async queryRooms(query: QueryRoomsRequest): Promise<QueryRoomsResponse> {
        const queryParams = new URLSearchParams();
        Object.entries(query).forEach(([key, val]) => {
            if (typeof val === 'object') queryParams.append(key, JSON.stringify(val));
            else queryParams.append(key, String(val));
        });
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return this.apiFetch<QueryRoomsResponse>(`/api/v2/chat/rooms${queryString}`, { method: 'GET' });
    }

    public async queryMembers(roomId: string, query: Record<string, any> = {}): Promise<{members: ChatRoomMember[], total: number}> {
        const queryParams = new URLSearchParams();
        Object.entries(query).forEach(([key, val]) => {
            if (typeof val === 'object') queryParams.append(key, JSON.stringify(val));
            else queryParams.append(key, String(val));
        });
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return this.apiFetch<{members: ChatRoomMember[], total: number}>(`/api/v2/chat/rooms/${roomId}/members${queryString}`, { method: 'GET' });
    }

    public async addMembers(roomId: string, members: {userId: string, roomRole: RoomMemberRole}[]): Promise<void> {
        return this.apiFetch<void>(`/api/v2/chat/rooms/${roomId}/members`, {
            method: 'POST',
            body: JSON.stringify({ members })
        });
    }

    public async removeMembers(roomId: string, members: string[]): Promise<void> {
        return this.apiFetch<void>(`/api/v2/chat/rooms/${roomId}/members`, {
            method: 'DELETE',
            body: JSON.stringify({ members })
        });
    }

    public async moderateMember(roomId: string, userId: string, action: 'ban' | 'unban' | 'shadow_ban'): Promise<ChatRoomMember> {
        return this.apiFetch<ChatRoomMember>(`/api/v2/chat/rooms/${roomId}/moderate`, {
            method: 'POST',
            body: JSON.stringify({ userId, action })
        });
    }

    public async updatePreferences(roomId: string, preferences: Record<string, any>): Promise<any> {
        return this.apiFetch(`/api/v2/chat/rooms/${roomId}/preferences`, {
            method: 'POST',
            body: JSON.stringify(preferences)
        });
    }

    // --- Messages ---

    public async queryMessages(roomId: string, query: QueryMessagesRequest): Promise<ChatMessage[]> {
        const queryParams = new URLSearchParams();
        Object.entries(query).forEach(([key, val]) => queryParams.append(key, String(val)));
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return this.apiFetch<ChatMessage[]>(`/api/v2/chat/rooms/${roomId}/messages${queryString}`, { method: 'GET' });
    }

    public async deleteMessage(messageId: string): Promise<ChatMessage> {
        return this.apiFetch<ChatMessage>(`/api/v2/chat/messages/${messageId}`, { method: 'DELETE' });
    }

    public async updateMessage(messageId: string, text: string): Promise<ChatMessage> {
        return this.apiFetch<ChatMessage>(`/api/v2/chat/messages/${messageId}`, {
            method: 'PATCH',
            body: JSON.stringify({ text })
        });
    }

    public async deleteReaction(messageId: string, emoji: string): Promise<ChatMessageReaction> {
        return this.apiFetch<ChatMessageReaction>(`/api/v2/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, { method: 'DELETE' });
    }

    // --- Storage ---

    public async getUploadUrls(files: Array<{ name: string; type: string; mime: string; size: number }>): Promise<any> {
        return this.apiFetch(`/api/v2/chat/storage/upload-url`, {
            method: 'POST',
            body: JSON.stringify({ files })
        });
    }

    // #endregion
}
