import { io, Socket } from 'socket.io-client';
import {
    ChatUser, SocketEvent, ChatAttachment,
    ConnectionState, IResponse,
    UploadRequest, UploadResponse, QueryRoomsRequest,
    QueryRoomsResponse, TokenProvider,
    ServerToClientEvents,
    ClientToServerEvents,
    ChatClientEmitter,
    ChatRoom,
} from '../types';
import { Room } from './room.js';

export class ChatClient extends ChatClientEmitter {
    private static instance: ChatClient;

    public apiKey: string;
    public socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
    public user: ChatUser | null = null;
    public connectionState: ConnectionState = 'disconnected';
    public activeRooms: Map<string, Room> = new Map();

    private baseURL: string;
    private tokenProvider: TokenProvider | null = null;
    private _token: string | null = null;

    // Deduplication lock for concurrent token refresh requests.
    // Multiple reconnect_attempt bursts share the same in-flight promise.
    private _tokenRefreshPromise: Promise<string> | null = null;

    // Reconnect attempt counter — reset to 0 on successful connect.
    private _reconnectCount = 0;

    private constructor(apiKey: string, baseURL: string = 'https://chat-application-h0xp.onrender.com') {
        super();
        this.apiKey = apiKey;
        this.baseURL = baseURL;
    }

    public static getInstance(apiKey: string, baseURL?: string): ChatClient {
        if (!ChatClient.instance) {
            ChatClient.instance = new ChatClient(apiKey, baseURL);
        }
        return ChatClient.instance;
    }

    /**
     * Connects a user to the Chat Service using a JWT or a TokenProvider.
     * Performs an HTTP handshake first, then opens the WebSocket.
     */
    public async connectUser(user: ChatUser, tokenOrProvider: string | TokenProvider): Promise<void> {
        if (this.connectionState === 'connected') {
            console.warn('User is already connected.');
            return;
        }

        this.user = user;
        this._setConnectionState('connecting');

        let token: string;
        if (typeof tokenOrProvider === 'function') {
            this.tokenProvider = tokenOrProvider;
            token = await this.tokenProvider();
        } else {
            token = tokenOrProvider;
        }

        this._token = token;

        // HTTP handshake — verifies credentials before opening the socket
        const response = await fetch(`${this.baseURL}/api/v2/chat/users/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'x-api-key': this.apiKey,
            },
            body: JSON.stringify(user),
        });

        const result = await response.json() as IResponse<ChatUser>;
        if (!result.success) {
            this.emit(SocketEvent.CONNECTION_ERROR, result);
            this._setConnectionState('disconnected', { error: result.message, statusCode: result.statusCode });
            return;
        }
        this.user = result.data!;

        // Open WebSocket
        const wsUrl = new URL(this.baseURL);
        this.socket = io(`${wsUrl.origin}/v2/chat`, {
            path: '/socket.io',
            auth: { token, apiKey: this.apiKey },
            transports: ['websocket', 'polling'],
        });

        this._setupSocketListeners();
    }

    /**
     * Standardized fetch wrapper for V2 authenticated endpoints.
     */
    public async apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
        if (!this.isConnected()) throw new Error('Client disconnected, cannot perform API requests.');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this._token}`,
            'x-api-key': this.apiKey,
            ...((options.headers as Record<string, string>) ?? {}),
        };

        const response = await fetch(`${this.baseURL}${endpoint}`, { ...options, headers });
        const result = await response.json() as IResponse<T>;

        if (!result.success) throw new Error(result.message);

        return result.data as T;
    }

    /**
     * Upload files via the V2 Pre-Signed URL flow.
     */
    public async uploadFiles(files: File[], type: string = 'file'): Promise<ChatAttachment[]> {
        if (!this.isConnected()) throw new Error('Client disconnected, cannot upload files.');

        const uploadRequestPayload: UploadRequest[] = files.map(f => ({
            name: f.name || `file-${Date.now()}`,
            type,
            mime: f.type || 'application/octet-stream',
            size: f.size || 0,
        }));

        const uploadUrls = await this.apiFetch<UploadResponse[]>('/api/v2/chat/storage/upload-url', {
            method: 'POST',
            body: JSON.stringify({ files: uploadRequestPayload }),
        });

        const attachments: ChatAttachment[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const uploadData = uploadUrls[i];

            const putResponse = await fetch(uploadData.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': uploadData.mime },
                body: file,
            });

            if (!putResponse.ok) {
                throw new Error(`Failed to upload ${file.name}`);
            }

            attachments.push({
                type: uploadData.type,
                url: uploadData.fileUrl,
                name: uploadData.name,
                mime: uploadData.mime,
                size: uploadData.size,
            });
        }

        return attachments;
    }

    /**
     * Queries rooms the user is a member of.
     * Automatically registers a Room instance for each returned room via
     * hydrateRooms() so that socket events start routing immediately — even
     * before the UI calls room.watch().
     */
    public async queryRooms(query: QueryRoomsRequest): Promise<QueryRoomsResponse> {
        const queryParams = new URLSearchParams();
        if (query.limit) queryParams.append('limit', String(query.limit));
        if (query.offset) queryParams.append('offset', String(query.offset));
        if (query.sort) queryParams.append('sort', JSON.stringify(query.sort));
        if (query.state) queryParams.append('state', String(query.state));
        if (query.filter_conditions) {
            queryParams.append('filter_conditions', JSON.stringify(query.filter_conditions));
        }
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const response = await this.apiFetch<QueryRoomsResponse>(`/api/v2/chat/rooms${qs}`, { method: 'GET' });

        // Auto-register Room instances so events route correctly before watch() is called
        this.hydrateRooms(response.rooms);

        return response;
    }

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
    public hydrateRooms(rooms: ChatRoom[]): void {
        for (const chatRoom of rooms) {
            this.room(chatRoom.roomId);
        }
    }

    /**
     * Tears down the socket and clears all state.
     * Calls room.dispose() on every active room so UI-held Room references
     * stop serving stale state after logout.
     * Removes all socket listeners before disconnecting to prevent memory
     * leaks in long-running SPA sessions.
     */
    public disconnectUser(): void {
        // Dispose all rooms before clearing the registry so any UI-held
        // references stop serving stale state
        for (const room of this.activeRooms.values()) {
            room.dispose();
        }

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.user = null;
        this._token = null;
        this._tokenRefreshPromise = null;
        this._reconnectCount = 0;
        this.activeRooms.clear();
        this._setConnectionState('disconnected');
    }

    public isConnected(): boolean {
        return this.connectionState === 'connected' && this.socket?.connected === true;
    }

    /**
     * Initialises or retrieves a Room instance.
     * Does NOT watch/subscribe — call `await room.watch()` to activate.
     */
    public room(roomId: string, config?: Record<string, any>): Room {
        if (this.activeRooms.has(roomId)) {
            return this.activeRooms.get(roomId)!;
        }
        const newRoom = new Room(this, roomId, config);
        this.activeRooms.set(roomId, newRoom);
        return newRoom;
    }

    /**
     * Returns all currently registered Room instances as an array.
     * Useful for iterating rooms in UI state (e.g. rendering a room list
     * ordered by lastMessageAt without re-querying the server).
     */
    public rooms(): Room[] {
        return Array.from(this.activeRooms.values());
    }

    /**
     * Creates Room instances for each entry without watching them.
     * Renamed from the previous subscribeToRoom — which was misleading since
     * no actual server subscription was established.
     *
     * @deprecated use hydrateRooms(rooms) instead if you have ChatRoom objects,
     * or call client.room(roomId) directly for individual rooms.
     */
    public initializeRooms(data: Array<{ roomId: string; config?: Record<string, any> }>): Room[] {
        return data.map(rts => this.room(rts.roomId, rts.config));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────

    private _setConnectionState(state: ConnectionState, extra?: Record<string, any>): void {
        this.connectionState = state;
        this.emit(SocketEvent.CONNECTION_CHANGED, { status: state, userId: this.user?.userId, ...extra });
    }

    private _willTokenExpireSoon(bufferSeconds = 60): boolean {
        const token = this._token;
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            return payload.exp - now < bufferSeconds;
        } catch {
            return true;
        }
    }

    /**
     * Refreshes the token with a deduplication lock so concurrent
     * reconnect_attempt bursts only call tokenProvider() once.
     * All concurrent callers await the same in-flight promise.
     */
    private async _refreshToken(): Promise<string> {
        if (this._tokenRefreshPromise) {
            return this._tokenRefreshPromise;
        }

        this._tokenRefreshPromise = (async () => {
            try {
                const newToken = await this.tokenProvider!();
                this._token = newToken;
                if (this.socket) {
                    this.socket.auth = { token: newToken, apiKey: this.apiKey };
                }
                return newToken;
            } finally {
                // Always clear the lock so the next refresh can proceed
                this._tokenRefreshPromise = null;
            }
        })();

        return this._tokenRefreshPromise;
    }

    private _setupSocketListeners(): void {
        if (!this.socket) return;

        // ── Connection lifecycle ──────────────────────────────────────────

        this.socket.on('connect', async () => {
            // Reset reconnect counter on every successful (re)connect
            this._reconnectCount = 0;
            this._setConnectionState('connected');
            this.emit(SocketEvent.CONNECT, { status: this.connectionState });

            // Re-watch all rooms that were active before the disconnect.
            // Server-side room subscriptions are not preserved across socket
            // reconnections, so we must re-establish them.
            // Only re-watches rooms that had been initialized (watched at least once).
            const rewatchPromises: Promise<void>[] = [];
            for (const room of this.activeRooms.values()) {
                if (room.initialized) {
                    rewatchPromises.push(
                        room.watch().then(() => {
                            // watch() already emits STATE_SYNCED — no extra work needed
                        }).catch(err => {
                            console.error(`[ChatClient] Failed to re-watch room ${room.id} after reconnect:`, err);
                        }),
                    );
                }
            }
            // Fire all re-watches concurrently — don't await sequentially
            await Promise.allSettled(rewatchPromises);
        });

        // Fires at the socket.io manager level, not the socket itself
        this.socket.io.on('reconnect_attempt', async () => {
            this._reconnectCount += 1;
            this._setConnectionState('reconnecting', {
                error: `Attempted reconnection count is ${this._reconnectCount}.`,
            });

            // Only refresh if the token is close to expiry; the lock ensures
            // only one refresh call is in flight at a time
            if (!this._token || this._willTokenExpireSoon(60)) {
                try {
                    await this._refreshToken();
                } catch (err) {
                    console.error('[ChatClient] Token refresh failed during reconnect:', err);
                }
            }
        });

        this.socket.on(SocketEvent.CONNECTION_SUCCESS, payload => {
            this.emit(SocketEvent.CONNECTION_SUCCESS, payload);
        });

        // Single CONNECTION_ERROR handler — prevents duplicate state updates
        // and double auth recovery
        this.socket.on(SocketEvent.CONNECTION_ERROR, payload => {
            this._setConnectionState('disconnected', { error: payload?.message });
            this.emit(SocketEvent.CONNECTION_ERROR, payload);

            const msg: string = payload?.message ?? '';
            if (msg.includes('Authentication') || msg.includes('Unauthorized')) {
                this._handleReconnectAuthError();
            }
        });

        this.socket.on('disconnect', reason => {
            this._setConnectionState('disconnected', { reason });
            this.emit(SocketEvent.DISCONNECT, reason);

            // 'io server disconnect' = server actively kicked the client → re-auth.
            // Transport-level drops are handled by socket.io's built-in reconnect
            // manager via reconnect_attempt and don't need manual intervention.
            if (reason === 'io server disconnect') {
                this._handleReconnectAuthError();
            }
        });

        // ── Room event routing ────────────────────────────────────────────

        // IMPORTANT: room._handleEvent is called BEFORE this.emit so that any
        // UI listener that calls room.getState() already sees the updated data.
        // activeRooms is keyed by roomId — O(1) lookup.
        const routeToRoom = <EventName extends keyof ServerToClientEvents>(
            event: EventName,
            payload: any,
        ) => {
            const roomId: string | undefined = payload?.roomId;
            if (roomId) {
                const room = this.activeRooms.get(roomId);
                // Mutate room state first, then broadcast globally
                if (room) room._handleEvent(event, payload);
            }
            // Global emit after room state is up to date
            this.emit(event, payload);
        };

        // Message events
        this.socket.on(SocketEvent.MESSAGE_NEW, p => routeToRoom(SocketEvent.MESSAGE_NEW, p));
        this.socket.on(SocketEvent.MESSAGE_UPDATED, p => routeToRoom(SocketEvent.MESSAGE_UPDATED, p));
        this.socket.on(SocketEvent.MESSAGE_DELETED, p => routeToRoom(SocketEvent.MESSAGE_DELETED, p));
        this.socket.on(SocketEvent.MESSAGE_READ, p => routeToRoom(SocketEvent.MESSAGE_READ, p));
        this.socket.on(SocketEvent.MESSAGE_REACTION_NEW, p => routeToRoom(SocketEvent.MESSAGE_REACTION_NEW, p));
        this.socket.on(SocketEvent.MESSAGE_REACTION_DELETED, p => routeToRoom(SocketEvent.MESSAGE_REACTION_DELETED, p));

        // Typing & presence
        this.socket.on(SocketEvent.TYPING_START, p => routeToRoom(SocketEvent.TYPING_START, p));
        this.socket.on(SocketEvent.TYPING_STOP, p => routeToRoom(SocketEvent.TYPING_STOP, p));
        this.socket.on(SocketEvent.USER_PRESENCE_CHANGED, p => routeToRoom(SocketEvent.USER_PRESENCE_CHANGED, p));
        this.socket.on(SocketEvent.NOTIFICATION_UNREAD, p => routeToRoom(SocketEvent.NOTIFICATION_UNREAD, p));
        this.socket.on(SocketEvent.MEMBER_MODERATED, p => routeToRoom(SocketEvent.MEMBER_MODERATED, p));

        // Room lifecycle
        this.socket.on(SocketEvent.ROOM_FROZEN, p => routeToRoom(SocketEvent.ROOM_FROZEN, p));
        this.socket.on(SocketEvent.ROOM_TRUNCATED, p => routeToRoom(SocketEvent.ROOM_TRUNCATED, p));

        // Room membership changes — these affect the registry itself, so handled
        // separately from routeToRoom
        this.socket.on(SocketEvent.ROOM_ADDED, payload => {
            // Auto-register the new room so events route immediately
            this.hydrateRooms([payload]);
            this.emit(SocketEvent.ROOM_ADDED, payload);
        });

        this.socket.on(SocketEvent.ROOM_REMOVED, payload => {
            const roomId: string | undefined = payload?.roomId;
            if (roomId) {
                const room = this.activeRooms.get(roomId);
                if (room) {
                    room.dispose();
                    room.emit(SocketEvent.ROOM_REMOVED, payload);
                    this.activeRooms.delete(roomId);
                }
            }
            this.emit(SocketEvent.ROOM_REMOVED, payload);
        });

        this.socket.on(SocketEvent.ROOM_DELETED, payload => {
            const roomId: string | undefined = payload?.roomId;
            if (roomId) {
                const room = this.activeRooms.get(roomId);
                if (room) {
                    room.dispose();
                    room.emit(SocketEvent.ROOM_DELETED, payload);
                    this.activeRooms.delete(roomId);
                }
            }
            this.emit(SocketEvent.ROOM_DELETED, payload);
        });
    }

    /**
     * Centralized auth recovery — refreshes the token and reconnects.
     * Called from the CONNECTION_ERROR handler and the disconnect handler.
     */
    private async _handleReconnectAuthError(): Promise<void> {
        if (!this.tokenProvider || !this.user) return;
        try {
            await this._refreshToken();
            this.socket?.connect();
        } catch (err) {
            console.error('[ChatClient] Failed to refresh token on auth error:', err);
        }
    }
}