import {
    ChatRoom, ChatMessage, SocketEvent,
    ICreateMessage, ChatMessageReaction,
    OptimisticMessage, AnyMessage, ChatRoomMember,
    ChatClientEmitter, IResponse,
    IUpdateMessage,
    ServerToClientEvents,
    IDeleteMessageReaction,
    RoomMemberRole,
    QueryMessagesRequest
} from '../types';
import type { ChatClient } from './client.js';

// ─────────────────────────────────────────────────────────────────────────────
// Optimistic message registry entry.
// Stores the tempId, the optimistic message itself, and the time the entry
// was created so stale entries can be evicted if the broadcast never arrives.
// ─────────────────────────────────────────────────────────────────────────────
interface PendingEntry {
    optimistic: OptimisticMessage;
    insertedAt: number; // Date.now() ms
}

export class Room extends ChatClientEmitter {
    private client: ChatClient;
    public readonly id: string;
    public initialized = false;

    // Internal state cache — NOT the primary reactive surface for UI.
    // Treat as read-only from outside the SDK; use getState() for a safe
    // snapshot and subscribe to events for all UI updates.
    private _state: ChatRoom | null = null;

    // tempId → PendingEntry.
    // Keyed by the client-generated tempId. The server echoes tempId back on
    // both the ACK and the broadcast, enabling direct O(1) lookup in both paths.
    // Value includes the original optimistic message for local reconciliation
    // when the broadcast never arrives (e.g. first message in an empty room).
    private _pendingMap = new Map<string, PendingEntry>();

    // TTL for stale pending entries — 60 s
    private static readonly PENDING_TTL_MS = 60_000;

    constructor(client: ChatClient, roomId: string, _config?: Record<string, any>) {
        super();
        this.client = client;
        this.id = roomId;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Returns a shallow read-only snapshot of the current room state.
     * Prefer subscribing to events for reactive UI updates; use this only
     * for one-time reads (e.g. initial render, debugging).
     *
     * The returned object is frozen — mutations will throw in strict mode
     * and are silently ignored otherwise, protecting the internal cache.
     */
    public getState(): Readonly<ChatRoom> | null {
        if (!this._state) return null;
        return Object.freeze({ ...this._state });
    }

    /**
     * Subscribes the client to events for this room and fetches initial state.
     * Emits STATE_SYNCED with the initial snapshot on success.
     *
     * After the server snapshot arrives, any still-pending optimistic messages
     * are re-appended on top so they remain visible while their ACKs are in
     * flight — preventing a reconnect or re-watch from clearing the UI before
     * the server has confirmed them.
     */
    public async watch(): Promise<Readonly<ChatRoom>> {
        if (!this.client.isConnected()) {
            throw new Error('Cannot watch room before ChatClient is connected');
        }

        return new Promise((resolve, reject) => {
            this.client.socket?.emit(SocketEvent.ROOM_WATCH, { roomId: this.id }, (response: IResponse<ChatRoom>) => {
                if (!response.success) {
                    return reject(new Error(response.message));
                }
                this._state = response.data!;
                this.initialized = true;

                // Re-append any in-flight optimistic messages that the server
                // snapshot does not yet contain. This prevents a re-watch
                // (triggered by reconnect) from wiping optimistic placeholders
                // out of the UI while their broadcasts are still pending.
                this._rehydratePendingMessages();

                this.emit(SocketEvent.STATE_SYNCED, this.getState()!);
                resolve(this.getState()!);
            });
        });
    }

    /**
     * Unsubscribes from room events on the server (UI state only — does not
     * leave the socket room).
     */
    public async stopWatch(): Promise<void> {
        if (!this.client.isConnected()) return;

        return new Promise((resolve, reject) => {
            this.client.socket?.emit(SocketEvent.ROOM_STOP_WATCH, { roomId: this.id }, (response: IResponse<null>) => {
                if (!response.success) {
                    return reject(new Error(response.message));
                }
                resolve();
            });
        });
    }

    /**
     * Clears internal state and marks the room as uninitialized.
     * Called by ChatClient.disconnectUser() so UI-held Room references
     * do not continue serving stale state after logout.
     * After dispose(), calling watch() again will re-hydrate the room cleanly.
     */
    public dispose(): void {
        this._state = null;
        this.initialized = false;
        this._pendingMap.clear();
        this.removeAllListeners();
    }

    public async sendMessage(message: ICreateMessage): Promise<ChatMessage> {
        const tempId = message.tempId ?? `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        const optimisticMsg: OptimisticMessage = {
            id: tempId,
            content: message.content ?? '',
            attachments: message.attachments ?? null,
            replyToId: message.replyToId ?? null,
            replyTo: null,
            replies: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            editedAt: null,
            deletedAt: null,
            isDeleted: false,
            isPinned: false,
            messageType: message.attachments?.length ? 'mixed' : 'text',
            metadata: null,
            reactions: null,
            userId: this.client.user?.userId ?? '',
            status: 'sending',
            roomId: this.id,
            tempId,
        };

        // ── Register in pending map BEFORE emitting the optimistic message ──
        // Critical: the pending map must be populated before the broadcast
        // can arrive (broadcast can race ahead of the ACK on fast networks).
        // We only track non-reply messages here; replies don't live in the
        // top-level messages array.
        if (!message.replyToId) {
            this._pendingMap.set(tempId, { optimistic: optimisticMsg, insertedAt: Date.now() });
        }

        if (this._state) {
            if (!message.replyToId) {
                if (!this._state.messages) this._state.messages = [];
                this._state.messages.push(optimisticMsg);
                this.emit(SocketEvent.MESSAGE_NEW, optimisticMsg);
            } else {
                this.emit(SocketEvent.THREAD_NEW, optimisticMsg);
            }
        }

        if (!this.client.isConnected()) {
            optimisticMsg.status = 'failed';
            this._pendingMap.delete(tempId);
            this.emit(SocketEvent.MESSAGE_UPDATED, optimisticMsg);
            throw new Error('Cannot send message. Client disconnected.');
        }

        const payload: ICreateMessage = {
            roomId: this.id,
            content: message.content,
            messageType: message.messageType,
            attachments: message.attachments,
            replyToId: message.replyToId,
            tempId,
        };

        return new Promise((resolve, reject) => {
            this.client.socket?.emit(SocketEvent.MESSAGE_SEND, payload, (response: IResponse<ChatMessage>) => {
                if (!response.success) {
                    optimisticMsg.status = 'failed';
                    this._pendingMap.delete(tempId);
                    this.emit(SocketEvent.MESSAGE_UPDATED, optimisticMsg);
                    return reject(new Error(response.message));
                }

                const confirmed = response.data!;

                // ── ACK fallback reconciliation ───────────────────────────
                // If the server broadcast arrived before the ACK, _handleEvent
                // already replaced the optimistic entry and deleted it from
                // _pendingMap — so the map will be empty for this tempId.
                // Only reconcile here if the broadcast hasn't arrived yet.
                if (!message.replyToId && this._pendingMap.has(tempId)) {
                    this._confirmPendingMessage(tempId, confirmed);
                }

                resolve(confirmed);
            });
        });
    }

    public async markRead(): Promise<void> {
        if (!this.client.isConnected()) return;

        return new Promise((resolve, reject) => {
            this.client.socket?.emit(
                SocketEvent.MESSAGE_MARK_READ,
                { roomId: this.id },
                (response: IResponse<{ messageId: string; roomId: string }>) => {
                    if (!response.success) {
                        return reject(new Error(response.message));
                    }
                    resolve();
                },
            );
        });
    }

    /**
     * Sends a typing indicator.
     * The server silently drops typing events if watch() has not been called first.
     */
    public sendEvent(eventType: SocketEvent.TYPING_START | SocketEvent.TYPING_STOP): void {
        if (!this.client.isConnected()) return;
        if (!this.initialized) {
            console.warn(`[Room ${this.id}] sendEvent(${eventType}) called before watch(). Server will silently drop this.`);
        }
        this.client.socket?.emit(eventType, { roomId: this.id });
    }

    public async sendReaction(messageId: string, emoji: string, tempId?: string): Promise<ChatMessageReaction> {
        const currentUserId = this.client.user?.userId ?? '';
        tempId = tempId ?? `temp-react-${Date.now()}`;
        const tempReaction: ChatMessageReaction = {
            id: tempId,
            messageId,
            emoji,
            userId: currentUserId,
            roomId: this.id,
        };

        if (this._state?.messages) {
            const mIdx = this._state.messages.findIndex(m => m.id === messageId);
            if (mIdx > -1) {
                const msg = this._state.messages[mIdx];
                if (!msg.reactions) msg.reactions = [];
                // Deduplicate by emoji + userId — temp ids won't match server ids
                if (!msg.reactions.some(r => r.emoji === emoji && r.userId === currentUserId)) {
                    msg.reactions.push(tempReaction);
                    this.emit(SocketEvent.MESSAGE_UPDATED, msg);
                }
            }
        }

        if (!this.client.isConnected()) {
            return Promise.reject(new Error('Client disconnected'));
        }

        return new Promise((resolve, reject) => {
            this.client.socket?.emit(
                SocketEvent.MESSAGE_REACTION,
                { messageId, roomId: this.id, emoji, tempId },
                (response: IResponse<ChatMessageReaction>) => {
                    if (!response.success) {
                        // Rollback: remove optimistic reaction and emit MESSAGE_UPDATED
                        if (this._state?.messages) {
                            const mIdx = this._state.messages.findIndex(m => m.id === messageId);
                            if (mIdx > -1 && this._state.messages[mIdx].reactions) {
                                this._state.messages[mIdx].reactions = this._state.messages[mIdx].reactions!.filter(
                                    r => r.id !== tempId,
                                );
                                this.emit(SocketEvent.MESSAGE_UPDATED, this._state.messages[mIdx]);
                            }
                        }
                        return reject(new Error(response.message));
                    }

                    const confirmed = response.data!;
                    // Server echoes tempId on ACK — find and replace by tempId directly
                    if (this._state?.messages) {
                        const mIdx = this._state.messages.findIndex(m => m.id === messageId);
                        if (mIdx > -1 && this._state.messages[mIdx].reactions) {
                            const rIdx = this._state.messages[mIdx].reactions!.findIndex(
                                r => r.id === (confirmed.tempId ?? tempId),
                            );
                            if (rIdx > -1) this._state.messages[mIdx].reactions![rIdx] = confirmed;
                        }
                    }

                    resolve(confirmed);
                },
            );
        });
    }

    public async deleteReaction(toBeDeletedReaction: IDeleteMessageReaction): Promise<void> {
        const currentUserId = this.client.user?.userId ?? '';

        let backedUpReaction: ChatMessageReaction | undefined;
        let backedUpMsgIdx = -1;
        let backedUpReactionIdx = -1;

        if (this._state?.messages) {
            const mIdx = this._state.messages.findIndex(m => m.id === toBeDeletedReaction.messageId);
            if (mIdx > -1 && this._state.messages[mIdx].reactions) {
                const rIdx = this._state.messages[mIdx].reactions!.findIndex(
                    r => r.emoji === toBeDeletedReaction.emoji && r.userId === currentUserId,
                );
                if (rIdx > -1) {
                    backedUpReaction = this._state.messages[mIdx].reactions![rIdx];
                    backedUpMsgIdx = mIdx;
                    backedUpReactionIdx = rIdx;
                    this._state.messages[mIdx].reactions!.splice(rIdx, 1);
                    this.emit(SocketEvent.MESSAGE_UPDATED, this._state.messages[mIdx]);
                }
            }
        }

        if (!this.client.isConnected()) {
            return Promise.reject(new Error('Client disconnected'));
        }

        return new Promise((resolve, reject) => {
            this.client.socket?.emit(
                SocketEvent.MESSAGE_REACTION_DELETE,
                toBeDeletedReaction,
                (response: IResponse<ChatMessageReaction>) => {
                    if (!response.success) {
                        // Rollback: re-insert at original position and emit MESSAGE_UPDATED
                        if (this._state?.messages && backedUpReaction && backedUpMsgIdx > -1) {
                            if (!this._state.messages[backedUpMsgIdx].reactions) {
                                this._state.messages[backedUpMsgIdx].reactions = [];
                            }
                            this._state.messages[backedUpMsgIdx].reactions!.splice(
                                backedUpReactionIdx, 0, backedUpReaction,
                            );
                            this.emit(SocketEvent.MESSAGE_UPDATED, this._state.messages[backedUpMsgIdx]);
                        }
                        return reject(new Error(response.message));
                    }
                    resolve();
                },
            );
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // REST API Wrappers
    // ─────────────────────────────────────────────────────────────────────

    public async queryMessages(query: QueryMessagesRequest): Promise<ChatMessage[]> {
        const queryParams = new URLSearchParams();
        Object.entries(query).forEach(([key, val]) => {
            queryParams.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
        });
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

        const messages = await this.client.apiFetch<ChatMessage[]>(
            `/api/v2/chat/rooms/${this.id}/messages${qs}`,
            { method: 'GET' },
        );

        if (this._state && Array.isArray(messages) && !query.parentId) {
            if (!this._state.messages) this._state.messages = [];
            const existingIds = new Set(this._state.messages.map(m => m.id));
            const newMessages = messages.filter(m => !existingIds.has(m.id));

            this._state.messages = [...newMessages, ...this._state.messages].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );

            // Re-append still-pending optimistic messages on top so they aren't
            // lost after a pagination/load-more call while a send is in flight.
            this._rehydratePendingMessages();

            this.emit(SocketEvent.STATE_SYNCED, this.getState()!);
        }

        return messages;
    }

    public async queryThread(parentId: string, query: Omit<QueryMessagesRequest, 'parentId'>): Promise<ChatMessage[]> {
        return this.queryMessages({ ...query, parentId });
    }

    public async updateMessage(data: IUpdateMessage): Promise<ChatMessage> {
        let originalContent: string | null | undefined;
        if (this._state?.messages) {
            const idx = this._state.messages.findIndex(m => m.id === data?.messageId);
            if (idx > -1) {
                originalContent = this._state.messages[idx].content;
                this._state.messages[idx] = {
                    ...this._state.messages[idx],
                    content: data?.content,
                    editedAt: new Date().toISOString(),
                } as ChatMessage;
                this.emit(SocketEvent.MESSAGE_UPDATED, this._state.messages[idx]);
            }
        }

        if (!this.client.isConnected()) return Promise.reject(new Error('Client disconnected'));

        return new Promise((resolve, reject) => {
            this.client.socket?.emit(
                SocketEvent.MESSAGE_UPDATE,
                { messageId: data?.messageId, roomId: this.id, content: data?.content },
                (response: IResponse<ChatMessage>) => {
                    if (!response?.success) {
                        if (this._state?.messages && originalContent !== undefined) {
                            const idx = this._state.messages.findIndex(m => m.id === data?.messageId);
                            if (idx > -1) {
                                this._state.messages[idx] = {
                                    ...this._state.messages[idx],
                                    content: originalContent,
                                } as ChatMessage;
                                this.emit(SocketEvent.MESSAGE_UPDATED, this._state.messages[idx]);
                            }
                        }
                        return reject(new Error(response?.message || 'Failed to update message'));
                    }
                    resolve(response.data as ChatMessage);
                },
            );
        });
    }

    public async deleteMessage(messageId: string): Promise<ChatMessage> {
        let removedMessage: AnyMessage | undefined;
        let removedIndex = -1;

        if (this._state?.messages) {
            removedIndex = this._state.messages.findIndex(m => m.id === messageId);
            if (removedIndex > -1) {
                removedMessage = this._state.messages[removedIndex];
                this._state.messages.splice(removedIndex, 1);
                this.emit(SocketEvent.MESSAGE_DELETED, removedMessage);
            }
        }

        if (!this.client.isConnected()) return Promise.reject(new Error('Client disconnected'));

        return new Promise((resolve, reject) => {
            this.client.socket?.emit(
                SocketEvent.MESSAGE_DELETE,
                { messageId },
                (response: IResponse<ChatMessage>) => {
                    if (!response?.success) {
                        if (this._state?.messages && removedMessage) {
                            this._state.messages.splice(removedIndex, 0, removedMessage as ChatMessage);
                            this.emit(SocketEvent.MESSAGE_NEW, removedMessage);
                        }
                        return reject(new Error(response.message || 'Failed to delete message'));
                    }
                    resolve(response.data!);
                },
            );
        });
    }

    public async queryMembers(query: Record<string, any> = {}): Promise<{ members: ChatRoomMember[]; total: number }> {
        const queryParams = new URLSearchParams();
        Object.entries(query).forEach(([key, val]) => {
            if (typeof val === 'object') queryParams.append(key, JSON.stringify(val));
            else queryParams.append(key, String(val));
        });
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const result = await this.client.apiFetch<{ members: ChatRoomMember[]; total: number }>(
            `/api/v2/chat/rooms/${this.id}/members${qs}`,
            { method: 'GET' },
        );

        if (this._state && result.members) {
            if (!this._state.members) this._state.members = [];
            const existingIds = new Set(this._state.members.map(m => m.userId));
            const newMembers = result.members.filter(m => !existingIds.has(m.userId));
            this._state.members = [...newMembers, ...this._state.members];
            this.emit(SocketEvent.STATE_SYNCED, this.getState()!);
        }

        return result;
    }

    public async addMembers(members: { userId: string, roomRole: RoomMemberRole }[]): Promise<void> {
        return this.client.apiFetch<void>(`/api/v2/chat/rooms/${this.id}/members`, {
            method: 'POST',
            body: JSON.stringify({ members }),
        });
    }

    public async removeMembers(members: string[]): Promise<void> {
        return this.client.apiFetch<void>(`/api/v2/chat/rooms/${this.id}/members`, {
            method: 'DELETE',
            body: JSON.stringify({ members }),
        });
    }

    public async moderateMember(userId: string, action: 'ban' | 'unban' | 'shadow_ban'): Promise<ChatRoomMember> {
        return this.client.apiFetch<ChatRoomMember>(`/api/v2/chat/rooms/${this.id}/moderate`, {
            method: 'POST',
            body: JSON.stringify({ userId, action }),
        });
    }

    public async updatePreferences(preferences: Record<string, any>): Promise<ChatRoomMember> {
        return this.client.apiFetch(`/api/v2/chat/rooms/${this.id}/preferences`, {
            method: 'POST',
            body: JSON.stringify(preferences),
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Evicts _pendingMap entries that are older than PENDING_TTL_MS.
     * Called at the start of every _handleEvent invocation to prevent
     * accumulation of stale entries when a broadcast is permanently lost.
     */
    private _evictStalePendingEntries(): void {
        const cutoff = Date.now() - Room.PENDING_TTL_MS;
        for (const [key, entry] of this._pendingMap) {
            if (entry.insertedAt < cutoff) {
                this._pendingMap.delete(key);
                if (this._state?.messages) {
                    this._state.messages = this._state.messages.filter(m => m.id !== key);
                }
            }
        }
    }

    /**
     * Replaces the optimistic placeholder for `tempId` with the confirmed
     * server message, then removes the entry from _pendingMap.
     * Emits MESSAGE_UPDATED so the UI sees the confirmed state.
     *
     * This is the single canonical reconciliation path — called from both
     * the ACK callback (when broadcast hasn't arrived yet) and _handleEvent
     * (when broadcast arrives first).
     */
    private _confirmPendingMessage(tempId: string, confirmed: ChatMessage): void {
        if (!this._state?.messages) return;

        const idx = this._state.messages.findIndex(m => m.id === tempId);
        if (idx > -1) {
            this._state.messages[idx] = confirmed;
        } else {
            // Optimistic entry not found in messages array (edge case: the
            // state was reset between send and confirm). Insert it and sort.
            this._state.messages.push(confirmed);
            this._state.messages.sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
            this._pendingMap.delete(tempId);
            this.emit(SocketEvent.MESSAGE_NEW, confirmed);
            return;
        }

        this._pendingMap.delete(tempId);
        this.emit(SocketEvent.MESSAGE_UPDATED, confirmed);
    }


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
    private _rehydratePendingMessages(): void {
        if (!this._state || this._pendingMap.size === 0) return;
        if (!this._state.messages) this._state.messages = [];

        const existingIds = new Set(this._state.messages.map(m => m.id));
        for (const [tempId, entry] of this._pendingMap) {
            if (!existingIds.has(tempId)) {
                this._state.messages.push(entry.optimistic);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal: socket event dispatcher (called by ChatClient.routeToRoom)
    //
    // CONTRACT: this is the ONLY place that mutates _state in response to
    // server events. All state mutations happen BEFORE the event is emitted
    // to UI — so that any listener calling getState() sees the updated data.
    // ─────────────────────────────────────────────────────────────────────

    public _handleEvent<EventName extends keyof ServerToClientEvents>(event: EventName, payload: any): void {
        if (!this._state) return;
        if (!this._state.messages) this._state.messages = [];

        // Evict stale pending entries before any reconciliation attempt
        this._evictStalePendingEntries();

        switch (event) {
            case SocketEvent.MESSAGE_NEW: {
                const newMessage = payload as ChatMessage;

                // ── Optimistic reconciliation (tempId path) ───────────────
                // Check tempId first, before the replyToId branch, so that
                // thread replies also get correct optimistic replacement.
                if (newMessage.tempId && this._pendingMap.has(newMessage.tempId)) {
                    // This broadcast is the server echo of our own message.
                    // Replace the optimistic placeholder and we're done.
                    // This path is for top-level messages only; thread replies
                    // are excluded from _pendingMap.
                    this._confirmPendingMessage(newMessage.tempId, newMessage);
                    break;
                }

                // ── Thread replies from other clients ─────────────────────
                if (newMessage.replyToId) {
                    this.emit(SocketEvent.THREAD_NEW, newMessage);
                    break;
                }

                // ── Top-level message from another client ─────────────────
                // Deduplicate by confirmed id, then insert sorted.
                const existingIdx = this._state.messages.findIndex(m => m.id === newMessage.id);
                if (existingIdx === -1) {
                    this._state.messages.push(newMessage);
                    this._state.messages.sort(
                        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                    );
                    this.emit(SocketEvent.MESSAGE_NEW, newMessage);
                } else {
                    this._state.messages[existingIdx] = newMessage;
                    this.emit(SocketEvent.MESSAGE_UPDATED, newMessage);
                }
                break;
            }

            case SocketEvent.MESSAGE_UPDATED: {
                const updatedMessage = payload as ChatMessage;
                const idx = this._state.messages.findIndex(m => m.id === updatedMessage.id);
                if (idx > -1) this._state.messages[idx] = updatedMessage;
                this.emit(SocketEvent.MESSAGE_UPDATED, updatedMessage);
                break;
            }

            case SocketEvent.MESSAGE_DELETED: {
                const deletedMessage = payload as ChatMessage;
                this._state.messages = this._state.messages.filter(m => m.id !== deletedMessage.id);
                this.emit(SocketEvent.MESSAGE_DELETED, deletedMessage);
                break;
            }

            case SocketEvent.MESSAGE_REACTION_NEW: {
                const newReaction = payload as ChatMessageReaction;
                const mIdx = this._state.messages.findIndex(m => m.id === newReaction.messageId);
                if (mIdx > -1) {
                    if (!this._state.messages[mIdx].reactions) this._state.messages[mIdx].reactions = [];
                    const reactions = this._state.messages[mIdx].reactions!;

                    if (newReaction.tempId) {
                        // Server echoed tempId — find and replace the optimistic entry
                        const rIdx = reactions.findIndex(r => r.id === newReaction.tempId);
                        if (rIdx > -1) {
                            reactions[rIdx] = newReaction;
                        } else {
                            // Temp entry already replaced or not found — deduplicate by id
                            if (!reactions.some(r => r.id === newReaction.id)) {
                                reactions.push(newReaction);
                            }
                        }
                    } else {
                        // No tempId (message from another user) — deduplicate by id
                        const rIdx = reactions.findIndex(r => r.id === newReaction.id);
                        if (rIdx === -1) {
                            reactions.push(newReaction);
                        } else {
                            reactions[rIdx] = newReaction;
                        }
                    }
                }
                this.emit(SocketEvent.MESSAGE_REACTION_NEW, newReaction);
                break;
            }

            case SocketEvent.MESSAGE_REACTION_DELETED: {
                const deletedReaction = payload as ChatMessageReaction;
                const mIdx = this._state.messages.findIndex(m => m.id === deletedReaction.messageId);
                if (mIdx > -1 && this._state.messages[mIdx].reactions) {
                    this._state.messages[mIdx].reactions = this._state.messages[mIdx].reactions!.filter(
                        r => !(r.emoji === deletedReaction.emoji && r.userId === deletedReaction.userId),
                    );
                }
                this.emit(SocketEvent.MESSAGE_REACTION_DELETED, deletedReaction);
                break;
            }

            case SocketEvent.NOTIFICATION_UNREAD: {
                const notificationUnread = payload as { roomId: string; unreadCount: number };
                this._state.unreadCount = notificationUnread.unreadCount;
                this.emit(SocketEvent.NOTIFICATION_UNREAD, notificationUnread);
                break;
            }

            case SocketEvent.ROOM_FROZEN: {
                this._state.frozen = true;
                this.emit(SocketEvent.ROOM_FROZEN, payload as ChatRoom);
                break;
            }

            case SocketEvent.MEMBER_MODERATED:
            case SocketEvent.MESSAGE_READ:
            case SocketEvent.TYPING_START:
            case SocketEvent.TYPING_STOP:
            case SocketEvent.USER_PRESENCE_CHANGED:
                this.emit(event, payload);
                break;

            default:
                this.emit(event, payload);
        }
    }
}