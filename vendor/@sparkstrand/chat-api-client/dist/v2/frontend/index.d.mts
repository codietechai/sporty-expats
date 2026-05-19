import { Socket } from 'socket.io-client';
import { ChatClientEmitter, ChatRoom, ICreateMessage, ChatMessage, SocketEvent, ChatMessageReaction, IDeleteMessageReaction, QueryMessagesRequest, IUpdateMessage, ChatRoomMember, RoomMemberRole, ServerToClientEvents, ClientToServerEvents, ChatUser, ConnectionState, TokenProvider, ChatAttachment, QueryRoomsRequest, QueryRoomsResponse } from '../types/index.mjs';
import 'eventemitter3';

declare class Room extends ChatClientEmitter {
    private client;
    readonly id: string;
    initialized: boolean;
    private _state;
    private _pendingMap;
    private static readonly PENDING_TTL_MS;
    constructor(client: ChatClient, roomId: string, _config?: Record<string, any>);
    /**
     * Returns a shallow read-only snapshot of the current room state.
     * Prefer subscribing to events for reactive UI updates; use this only
     * for one-time reads (e.g. initial render, debugging).
     *
     * The returned object is frozen — mutations will throw in strict mode
     * and are silently ignored otherwise, protecting the internal cache.
     */
    getState(): Readonly<ChatRoom> | null;
    /**
     * Subscribes the client to events for this room and fetches initial state.
     * Emits STATE_SYNCED with the initial snapshot on success.
     *
     * After the server snapshot arrives, any still-pending optimistic messages
     * are re-appended on top so they remain visible while their ACKs are in
     * flight — preventing a reconnect or re-watch from clearing the UI before
     * the server has confirmed them.
     */
    watch(): Promise<Readonly<ChatRoom>>;
    /**
     * Unsubscribes from room events on the server (UI state only — does not
     * leave the socket room).
     */
    stopWatch(): Promise<void>;
    /**
     * Clears internal state and marks the room as uninitialized.
     * Called by ChatClient.disconnectUser() so UI-held Room references
     * do not continue serving stale state after logout.
     * After dispose(), calling watch() again will re-hydrate the room cleanly.
     */
    dispose(): void;
    sendMessage(message: ICreateMessage): Promise<ChatMessage>;
    markRead(): Promise<void>;
    /**
     * Sends a typing indicator.
     * The server silently drops typing events if watch() has not been called first.
     */
    sendEvent(eventType: SocketEvent.TYPING_START | SocketEvent.TYPING_STOP): void;
    sendReaction(messageId: string, emoji: string, tempId?: string): Promise<ChatMessageReaction>;
    deleteReaction(toBeDeletedReaction: IDeleteMessageReaction): Promise<void>;
    queryMessages(query: QueryMessagesRequest): Promise<ChatMessage[]>;
    queryThread(parentId: string, query: Omit<QueryMessagesRequest, 'parentId'>): Promise<ChatMessage[]>;
    updateMessage(data: IUpdateMessage): Promise<ChatMessage>;
    deleteMessage(messageId: string): Promise<ChatMessage>;
    queryMembers(query?: Record<string, any>): Promise<{
        members: ChatRoomMember[];
        total: number;
    }>;
    addMembers(members: {
        userId: string;
        roomRole: RoomMemberRole;
    }[]): Promise<void>;
    removeMembers(members: string[]): Promise<void>;
    moderateMember(userId: string, action: 'ban' | 'unban' | 'shadow_ban'): Promise<ChatRoomMember>;
    updatePreferences(preferences: Record<string, any>): Promise<ChatRoomMember>;
    /**
     * Evicts _pendingMap entries that are older than PENDING_TTL_MS.
     * Called at the start of every _handleEvent invocation to prevent
     * accumulation of stale entries when a broadcast is permanently lost.
     */
    private _evictStalePendingEntries;
    /**
     * Replaces the optimistic placeholder for `tempId` with the confirmed
     * server message, then removes the entry from _pendingMap.
     * Emits MESSAGE_UPDATED so the UI sees the confirmed state.
     *
     * This is the single canonical reconciliation path — called from both
     * the ACK callback (when broadcast hasn't arrived yet) and _handleEvent
     * (when broadcast arrives first).
     */
    private _confirmPendingMessage;
    /**
     * Re-appends still-pending optimistic messages into _state.messages after
     * a watch() / queryMessages() call resets or overwrites the message list.
     *
     * Without this, a reconnect or paginated load-more can wipe optimistic
     * placeholders from the UI while their server broadcasts are still in
     * flight, producing a flash where the user's message temporarily disappears.
     *
     * Only re-appends entries not already present (deduplicates by tempId/id).
     */
    private _rehydratePendingMessages;
    _handleEvent<EventName extends keyof ServerToClientEvents>(event: EventName, payload: any): void;
}

declare class ChatClient extends ChatClientEmitter {
    private static instance;
    apiKey: string;
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    user: ChatUser | null;
    connectionState: ConnectionState;
    activeRooms: Map<string, Room>;
    private baseURL;
    private tokenProvider;
    private _token;
    private _tokenRefreshPromise;
    private _reconnectCount;
    private constructor();
    static getInstance(apiKey: string, baseURL?: string): ChatClient;
    /**
     * Connects a user to the Chat Service using a JWT or a TokenProvider.
     * Performs an HTTP handshake first, then opens the WebSocket.
     */
    connectUser(user: ChatUser, tokenOrProvider: string | TokenProvider): Promise<void>;
    /**
     * Standardized fetch wrapper for V2 authenticated endpoints.
     */
    apiFetch<T = any>(endpoint: string, options?: RequestInit): Promise<T>;
    /**
     * Upload files via the V2 Pre-Signed URL flow.
     */
    uploadFiles(files: File[], type?: string): Promise<ChatAttachment[]>;
    /**
     * Queries rooms the user is a member of.
     * Automatically registers a Room instance for each returned room via
     * hydrateRooms() so that socket events start routing immediately — even
     * before the UI calls room.watch().
     */
    queryRooms(query: QueryRoomsRequest): Promise<QueryRoomsResponse>;
    /**
     * Creates Room instances for every room in the array and registers them
     * in activeRooms. Idempotent — rooms already registered are left unchanged.
     *
     * Use this when you have room data from any source (queryRooms, server-side
     * props, push notification payload) and want events to start routing before
     * the UI has opened a specific room view and called watch().
     *
     * Example:
     *   const { rooms } = await client.queryRooms({ state: true, limit: 50 });
     *   // hydrateRooms is called automatically above, but you can also call it manually:
     *   client.hydrateRooms(rooms);
     */
    hydrateRooms(rooms: ChatRoom[]): void;
    /**
     * Tears down the socket and clears all state.
     * Calls room.dispose() on every active room so UI-held Room references
     * stop serving stale state after logout.
     * Removes all socket listeners before disconnecting to prevent memory
     * leaks in long-running SPA sessions.
     */
    disconnectUser(): void;
    isConnected(): boolean;
    /**
     * Initialises or retrieves a Room instance.
     * Does NOT watch/subscribe — call `await room.watch()` to activate.
     */
    room(roomId: string, config?: Record<string, any>): Room;
    /**
     * Returns all currently registered Room instances as an array.
     * Useful for iterating rooms in UI state (e.g. rendering a room list
     * ordered by lastMessageAt without re-querying the server).
     */
    rooms(): Room[];
    /**
     * Creates Room instances for each entry without watching them.
     * Renamed from the previous subscribeToRoom — which was misleading since
     * no actual server subscription was established.
     *
     * @deprecated use hydrateRooms(rooms) instead if you have ChatRoom objects,
     * or call client.room(roomId) directly for individual rooms.
     */
    initializeRooms(data: Array<{
        roomId: string;
        config?: Record<string, any>;
    }>): Room[];
    private _setConnectionState;
    private _willTokenExpireSoon;
    /**
     * Refreshes the token with a deduplication lock so concurrent
     * reconnect_attempt bursts only call tokenProvider() once.
     * All concurrent callers await the same in-flight promise.
     */
    private _refreshToken;
    private _setupSocketListeners;
    /**
     * Centralized auth recovery — refreshes the token and reconnects.
     * Called from the CONNECTION_ERROR handler and the disconnect handler.
     */
    private _handleReconnectAuthError;
}

export { ChatClient, Room };
