// lib/v2/frontend/client.ts
import { io } from "socket.io-client";

// lib/v2/types/index.ts
import { EventEmitter } from "eventemitter3";
var ChatClientEmitter = class extends EventEmitter {
};

// lib/v2/frontend/room.ts
var _Room = class _Room extends ChatClientEmitter {
  constructor(client, roomId, _config) {
    super();
    this.initialized = false;
    // Internal state cache — NOT the primary reactive surface for UI.
    // Treat as read-only from outside the SDK; use getState() for a safe
    // snapshot and subscribe to events for all UI updates.
    this._state = null;
    // tempId → PendingEntry.
    // Keyed by the client-generated tempId. The server echoes tempId back on
    // both the ACK and the broadcast, enabling direct O(1) lookup in both paths.
    // Value includes the original optimistic message for local reconciliation
    // when the broadcast never arrives (e.g. first message in an empty room).
    this._pendingMap = /* @__PURE__ */ new Map();
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
  getState() {
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
  async watch() {
    if (!this.client.isConnected()) {
      throw new Error("Cannot watch room before ChatClient is connected");
    }
    return new Promise((resolve, reject) => {
      this.client.socket?.emit("room.watch" /* ROOM_WATCH */, { roomId: this.id }, (response) => {
        if (!response.success) {
          return reject(new Error(response.message));
        }
        this._state = response.data;
        this.initialized = true;
        this._rehydratePendingMessages();
        this.emit("state.synced" /* STATE_SYNCED */, this.getState());
        resolve(this.getState());
      });
    });
  }
  /**
   * Unsubscribes from room events on the server (UI state only — does not
   * leave the socket room).
   */
  async stopWatch() {
    if (!this.client.isConnected()) return;
    return new Promise((resolve, reject) => {
      this.client.socket?.emit("room.stop_watch" /* ROOM_STOP_WATCH */, { roomId: this.id }, (response) => {
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
  dispose() {
    this._state = null;
    this.initialized = false;
    this._pendingMap.clear();
    this.removeAllListeners();
  }
  async sendMessage(message) {
    const tempId = message.tempId ?? `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMsg = {
      id: tempId,
      content: message.content ?? "",
      attachments: message.attachments ?? null,
      replyToId: message.replyToId ?? null,
      replyTo: null,
      replies: null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      editedAt: null,
      deletedAt: null,
      isDeleted: false,
      isPinned: false,
      messageType: message.attachments?.length ? "mixed" : "text",
      metadata: null,
      reactions: null,
      userId: this.client.user?.userId ?? "",
      status: "sending",
      roomId: this.id,
      tempId
    };
    if (!message.replyToId) {
      this._pendingMap.set(tempId, { optimistic: optimisticMsg, insertedAt: Date.now() });
    }
    if (this._state) {
      if (!message.replyToId) {
        if (!this._state.messages) this._state.messages = [];
        this._state.messages.push(optimisticMsg);
        this.emit("message.new" /* MESSAGE_NEW */, optimisticMsg);
      } else {
        this.emit("message.new.thread" /* THREAD_NEW */, optimisticMsg);
      }
    }
    if (!this.client.isConnected()) {
      optimisticMsg.status = "failed";
      this._pendingMap.delete(tempId);
      this.emit("message.updated" /* MESSAGE_UPDATED */, optimisticMsg);
      throw new Error("Cannot send message. Client disconnected.");
    }
    const payload = {
      roomId: this.id,
      content: message.content,
      messageType: message.messageType,
      attachments: message.attachments,
      replyToId: message.replyToId,
      tempId
    };
    return new Promise((resolve, reject) => {
      this.client.socket?.emit("message.send" /* MESSAGE_SEND */, payload, (response) => {
        if (!response.success) {
          optimisticMsg.status = "failed";
          this._pendingMap.delete(tempId);
          this.emit("message.updated" /* MESSAGE_UPDATED */, optimisticMsg);
          return reject(new Error(response.message));
        }
        const confirmed = response.data;
        if (!message.replyToId && this._pendingMap.has(tempId)) {
          this._confirmPendingMessage(tempId, confirmed);
        }
        resolve(confirmed);
      });
    });
  }
  async markRead() {
    if (!this.client.isConnected()) return;
    return new Promise((resolve, reject) => {
      this.client.socket?.emit(
        "message.mark_read" /* MESSAGE_MARK_READ */,
        { roomId: this.id },
        (response) => {
          if (!response.success) {
            return reject(new Error(response.message));
          }
          resolve();
        }
      );
    });
  }
  /**
   * Sends a typing indicator.
   * The server silently drops typing events if watch() has not been called first.
   */
  sendEvent(eventType) {
    if (!this.client.isConnected()) return;
    if (!this.initialized) {
      console.warn(`[Room ${this.id}] sendEvent(${eventType}) called before watch(). Server will silently drop this.`);
    }
    this.client.socket?.emit(eventType, { roomId: this.id });
  }
  async sendReaction(messageId, emoji, tempId) {
    const currentUserId = this.client.user?.userId ?? "";
    tempId = tempId ?? `temp-react-${Date.now()}`;
    const tempReaction = {
      id: tempId,
      messageId,
      emoji,
      userId: currentUserId,
      roomId: this.id
    };
    if (this._state?.messages) {
      const mIdx = this._state.messages.findIndex((m) => m.id === messageId);
      if (mIdx > -1) {
        const msg = this._state.messages[mIdx];
        if (!msg.reactions) msg.reactions = [];
        if (!msg.reactions.some((r) => r.emoji === emoji && r.userId === currentUserId)) {
          msg.reactions.push(tempReaction);
          this.emit("message.updated" /* MESSAGE_UPDATED */, msg);
        }
      }
    }
    if (!this.client.isConnected()) {
      return Promise.reject(new Error("Client disconnected"));
    }
    return new Promise((resolve, reject) => {
      this.client.socket?.emit(
        "message.reaction" /* MESSAGE_REACTION */,
        { messageId, roomId: this.id, emoji, tempId },
        (response) => {
          if (!response.success) {
            if (this._state?.messages) {
              const mIdx = this._state.messages.findIndex((m) => m.id === messageId);
              if (mIdx > -1 && this._state.messages[mIdx].reactions) {
                this._state.messages[mIdx].reactions = this._state.messages[mIdx].reactions.filter(
                  (r) => r.id !== tempId
                );
                this.emit("message.updated" /* MESSAGE_UPDATED */, this._state.messages[mIdx]);
              }
            }
            return reject(new Error(response.message));
          }
          const confirmed = response.data;
          if (this._state?.messages) {
            const mIdx = this._state.messages.findIndex((m) => m.id === messageId);
            if (mIdx > -1 && this._state.messages[mIdx].reactions) {
              const rIdx = this._state.messages[mIdx].reactions.findIndex(
                (r) => r.id === (confirmed.tempId ?? tempId)
              );
              if (rIdx > -1) this._state.messages[mIdx].reactions[rIdx] = confirmed;
            }
          }
          resolve(confirmed);
        }
      );
    });
  }
  async deleteReaction(toBeDeletedReaction) {
    const currentUserId = this.client.user?.userId ?? "";
    let backedUpReaction;
    let backedUpMsgIdx = -1;
    let backedUpReactionIdx = -1;
    if (this._state?.messages) {
      const mIdx = this._state.messages.findIndex((m) => m.id === toBeDeletedReaction.messageId);
      if (mIdx > -1 && this._state.messages[mIdx].reactions) {
        const rIdx = this._state.messages[mIdx].reactions.findIndex(
          (r) => r.emoji === toBeDeletedReaction.emoji && r.userId === currentUserId
        );
        if (rIdx > -1) {
          backedUpReaction = this._state.messages[mIdx].reactions[rIdx];
          backedUpMsgIdx = mIdx;
          backedUpReactionIdx = rIdx;
          this._state.messages[mIdx].reactions.splice(rIdx, 1);
          this.emit("message.updated" /* MESSAGE_UPDATED */, this._state.messages[mIdx]);
        }
      }
    }
    if (!this.client.isConnected()) {
      return Promise.reject(new Error("Client disconnected"));
    }
    return new Promise((resolve, reject) => {
      this.client.socket?.emit(
        "message.reaction.delete" /* MESSAGE_REACTION_DELETE */,
        toBeDeletedReaction,
        (response) => {
          if (!response.success) {
            if (this._state?.messages && backedUpReaction && backedUpMsgIdx > -1) {
              if (!this._state.messages[backedUpMsgIdx].reactions) {
                this._state.messages[backedUpMsgIdx].reactions = [];
              }
              this._state.messages[backedUpMsgIdx].reactions.splice(
                backedUpReactionIdx,
                0,
                backedUpReaction
              );
              this.emit("message.updated" /* MESSAGE_UPDATED */, this._state.messages[backedUpMsgIdx]);
            }
            return reject(new Error(response.message));
          }
          resolve();
        }
      );
    });
  }
  // ─────────────────────────────────────────────────────────────────────
  // REST API Wrappers
  // ─────────────────────────────────────────────────────────────────────
  async queryMessages(query) {
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => {
      queryParams.append(key, typeof val === "object" ? JSON.stringify(val) : String(val));
    });
    const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const messages = await this.client.apiFetch(
      `/api/v2/chat/rooms/${this.id}/messages${qs}`,
      { method: "GET" }
    );
    if (this._state && Array.isArray(messages) && !query.parentId) {
      if (!this._state.messages) this._state.messages = [];
      const existingIds = new Set(this._state.messages.map((m) => m.id));
      const newMessages = messages.filter((m) => !existingIds.has(m.id));
      this._state.messages = [...newMessages, ...this._state.messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      this._rehydratePendingMessages();
      this.emit("state.synced" /* STATE_SYNCED */, this.getState());
    }
    return messages;
  }
  async queryThread(parentId, query) {
    return this.queryMessages({ ...query, parentId });
  }
  async updateMessage(data) {
    let originalContent;
    if (this._state?.messages) {
      const idx = this._state.messages.findIndex((m) => m.id === data?.messageId);
      if (idx > -1) {
        originalContent = this._state.messages[idx].content;
        this._state.messages[idx] = {
          ...this._state.messages[idx],
          content: data?.content,
          editedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.emit("message.updated" /* MESSAGE_UPDATED */, this._state.messages[idx]);
      }
    }
    if (!this.client.isConnected()) return Promise.reject(new Error("Client disconnected"));
    return new Promise((resolve, reject) => {
      this.client.socket?.emit(
        "message.update" /* MESSAGE_UPDATE */,
        { messageId: data?.messageId, roomId: this.id, content: data?.content },
        (response) => {
          if (!response?.success) {
            if (this._state?.messages && originalContent !== void 0) {
              const idx = this._state.messages.findIndex((m) => m.id === data?.messageId);
              if (idx > -1) {
                this._state.messages[idx] = {
                  ...this._state.messages[idx],
                  content: originalContent
                };
                this.emit("message.updated" /* MESSAGE_UPDATED */, this._state.messages[idx]);
              }
            }
            return reject(new Error(response?.message || "Failed to update message"));
          }
          resolve(response.data);
        }
      );
    });
  }
  async deleteMessage(messageId) {
    let removedMessage;
    let removedIndex = -1;
    if (this._state?.messages) {
      removedIndex = this._state.messages.findIndex((m) => m.id === messageId);
      if (removedIndex > -1) {
        removedMessage = this._state.messages[removedIndex];
        this._state.messages.splice(removedIndex, 1);
        this.emit("message.deleted" /* MESSAGE_DELETED */, removedMessage);
      }
    }
    if (!this.client.isConnected()) return Promise.reject(new Error("Client disconnected"));
    return new Promise((resolve, reject) => {
      this.client.socket?.emit(
        "message.delete" /* MESSAGE_DELETE */,
        { messageId },
        (response) => {
          if (!response?.success) {
            if (this._state?.messages && removedMessage) {
              this._state.messages.splice(removedIndex, 0, removedMessage);
              this.emit("message.new" /* MESSAGE_NEW */, removedMessage);
            }
            return reject(new Error(response.message || "Failed to delete message"));
          }
          resolve(response.data);
        }
      );
    });
  }
  async queryMembers(query = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => {
      if (typeof val === "object") queryParams.append(key, JSON.stringify(val));
      else queryParams.append(key, String(val));
    });
    const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const result = await this.client.apiFetch(
      `/api/v2/chat/rooms/${this.id}/members${qs}`,
      { method: "GET" }
    );
    if (this._state && result.members) {
      if (!this._state.members) this._state.members = [];
      const existingIds = new Set(this._state.members.map((m) => m.userId));
      const newMembers = result.members.filter((m) => !existingIds.has(m.userId));
      this._state.members = [...newMembers, ...this._state.members];
      this.emit("state.synced" /* STATE_SYNCED */, this.getState());
    }
    return result;
  }
  async addMembers(members) {
    return this.client.apiFetch(`/api/v2/chat/rooms/${this.id}/members`, {
      method: "POST",
      body: JSON.stringify({ members })
    });
  }
  async removeMembers(members) {
    return this.client.apiFetch(`/api/v2/chat/rooms/${this.id}/members`, {
      method: "DELETE",
      body: JSON.stringify({ members })
    });
  }
  async moderateMember(userId, action) {
    return this.client.apiFetch(`/api/v2/chat/rooms/${this.id}/moderate`, {
      method: "POST",
      body: JSON.stringify({ userId, action })
    });
  }
  async updatePreferences(preferences) {
    return this.client.apiFetch(`/api/v2/chat/rooms/${this.id}/preferences`, {
      method: "POST",
      body: JSON.stringify(preferences)
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
  _evictStalePendingEntries() {
    const cutoff = Date.now() - _Room.PENDING_TTL_MS;
    for (const [key, entry] of this._pendingMap) {
      if (entry.insertedAt < cutoff) {
        this._pendingMap.delete(key);
        if (this._state?.messages) {
          this._state.messages = this._state.messages.filter((m) => m.id !== key);
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
  _confirmPendingMessage(tempId, confirmed) {
    if (!this._state?.messages) return;
    const idx = this._state.messages.findIndex((m) => m.id === tempId);
    if (idx > -1) {
      this._state.messages[idx] = confirmed;
    } else {
      this._state.messages.push(confirmed);
      this._state.messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      this._pendingMap.delete(tempId);
      this.emit("message.new" /* MESSAGE_NEW */, confirmed);
      return;
    }
    this._pendingMap.delete(tempId);
    this.emit("message.updated" /* MESSAGE_UPDATED */, confirmed);
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
  _rehydratePendingMessages() {
    if (!this._state || this._pendingMap.size === 0) return;
    if (!this._state.messages) this._state.messages = [];
    const existingIds = new Set(this._state.messages.map((m) => m.id));
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
  _handleEvent(event, payload) {
    if (!this._state) return;
    if (!this._state.messages) this._state.messages = [];
    this._evictStalePendingEntries();
    switch (event) {
      case "message.new" /* MESSAGE_NEW */: {
        const newMessage = payload;
        if (newMessage.tempId && this._pendingMap.has(newMessage.tempId)) {
          this._confirmPendingMessage(newMessage.tempId, newMessage);
          break;
        }
        if (newMessage.replyToId) {
          this.emit("message.new.thread" /* THREAD_NEW */, newMessage);
          break;
        }
        const existingIdx = this._state.messages.findIndex((m) => m.id === newMessage.id);
        if (existingIdx === -1) {
          this._state.messages.push(newMessage);
          this._state.messages.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          this.emit("message.new" /* MESSAGE_NEW */, newMessage);
        } else {
          this._state.messages[existingIdx] = newMessage;
          this.emit("message.updated" /* MESSAGE_UPDATED */, newMessage);
        }
        break;
      }
      case "message.updated" /* MESSAGE_UPDATED */: {
        const updatedMessage = payload;
        const idx = this._state.messages.findIndex((m) => m.id === updatedMessage.id);
        if (idx > -1) this._state.messages[idx] = updatedMessage;
        this.emit("message.updated" /* MESSAGE_UPDATED */, updatedMessage);
        break;
      }
      case "message.deleted" /* MESSAGE_DELETED */: {
        const deletedMessage = payload;
        this._state.messages = this._state.messages.filter((m) => m.id !== deletedMessage.id);
        this.emit("message.deleted" /* MESSAGE_DELETED */, deletedMessage);
        break;
      }
      case "message.reaction.new" /* MESSAGE_REACTION_NEW */: {
        const newReaction = payload;
        const mIdx = this._state.messages.findIndex((m) => m.id === newReaction.messageId);
        if (mIdx > -1) {
          if (!this._state.messages[mIdx].reactions) this._state.messages[mIdx].reactions = [];
          const reactions = this._state.messages[mIdx].reactions;
          if (newReaction.tempId) {
            const rIdx = reactions.findIndex((r) => r.id === newReaction.tempId);
            if (rIdx > -1) {
              reactions[rIdx] = newReaction;
            } else {
              if (!reactions.some((r) => r.id === newReaction.id)) {
                reactions.push(newReaction);
              }
            }
          } else {
            const rIdx = reactions.findIndex((r) => r.id === newReaction.id);
            if (rIdx === -1) {
              reactions.push(newReaction);
            } else {
              reactions[rIdx] = newReaction;
            }
          }
        }
        this.emit("message.reaction.new" /* MESSAGE_REACTION_NEW */, newReaction);
        break;
      }
      case "message.reaction.deleted" /* MESSAGE_REACTION_DELETED */: {
        const deletedReaction = payload;
        const mIdx = this._state.messages.findIndex((m) => m.id === deletedReaction.messageId);
        if (mIdx > -1 && this._state.messages[mIdx].reactions) {
          this._state.messages[mIdx].reactions = this._state.messages[mIdx].reactions.filter(
            (r) => !(r.emoji === deletedReaction.emoji && r.userId === deletedReaction.userId)
          );
        }
        this.emit("message.reaction.deleted" /* MESSAGE_REACTION_DELETED */, deletedReaction);
        break;
      }
      case "notification.unread" /* NOTIFICATION_UNREAD */: {
        const notificationUnread = payload;
        this._state.unreadCount = notificationUnread.unreadCount;
        this.emit("notification.unread" /* NOTIFICATION_UNREAD */, notificationUnread);
        break;
      }
      case "room.frozen" /* ROOM_FROZEN */: {
        this._state.frozen = true;
        this.emit("room.frozen" /* ROOM_FROZEN */, payload);
        break;
      }
      case "member.moderated" /* MEMBER_MODERATED */:
      case "message.read" /* MESSAGE_READ */:
      case "typing.start" /* TYPING_START */:
      case "typing.stop" /* TYPING_STOP */:
      case "user.presence.changed" /* USER_PRESENCE_CHANGED */:
        this.emit(event, payload);
        break;
      default:
        this.emit(event, payload);
    }
  }
};
// TTL for stale pending entries — 60 s
_Room.PENDING_TTL_MS = 6e4;
var Room = _Room;

// lib/v2/frontend/client.ts
var ChatClient = class _ChatClient extends ChatClientEmitter {
  constructor(apiKey, baseURL = "https://chat-application-h0xp.onrender.com") {
    super();
    this.socket = null;
    this.user = null;
    this.connectionState = "disconnected";
    this.activeRooms = /* @__PURE__ */ new Map();
    this.tokenProvider = null;
    this._token = null;
    // Deduplication lock for concurrent token refresh requests.
    // Multiple reconnect_attempt bursts share the same in-flight promise.
    this._tokenRefreshPromise = null;
    // Reconnect attempt counter — reset to 0 on successful connect.
    this._reconnectCount = 0;
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }
  static getInstance(apiKey, baseURL) {
    if (!_ChatClient.instance) {
      _ChatClient.instance = new _ChatClient(apiKey, baseURL);
    }
    return _ChatClient.instance;
  }
  /**
   * Connects a user to the Chat Service using a JWT or a TokenProvider.
   * Performs an HTTP handshake first, then opens the WebSocket.
   */
  async connectUser(user, tokenOrProvider) {
    if (this.connectionState === "connected") {
      console.warn("User is already connected.");
      return;
    }
    this.user = user;
    this._setConnectionState("connecting");
    let token;
    if (typeof tokenOrProvider === "function") {
      this.tokenProvider = tokenOrProvider;
      token = await this.tokenProvider();
    } else {
      token = tokenOrProvider;
    }
    this._token = token;
    const response = await fetch(`${this.baseURL}/api/v2/chat/users/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-api-key": this.apiKey
      },
      body: JSON.stringify(user)
    });
    const result = await response.json();
    if (!result.success) {
      this.emit("connection.error" /* CONNECTION_ERROR */, result);
      this._setConnectionState("disconnected", { error: result.message, statusCode: result.statusCode });
      return;
    }
    this.user = result.data;
    const wsUrl = new URL(this.baseURL);
    this.socket = io(`${wsUrl.origin}/v2/chat`, {
      path: "/socket.io",
      auth: { token, apiKey: this.apiKey },
      transports: ["websocket", "polling"]
    });
    this._setupSocketListeners();
  }
  /**
   * Standardized fetch wrapper for V2 authenticated endpoints.
   */
  async apiFetch(endpoint, options = {}) {
    if (!this.isConnected()) throw new Error("Client disconnected, cannot perform API requests.");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this._token}`,
      "x-api-key": this.apiKey,
      ...options.headers ?? {}
    };
    const response = await fetch(`${this.baseURL}${endpoint}`, { ...options, headers });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  }
  /**
   * Upload files via the V2 Pre-Signed URL flow.
   */
  async uploadFiles(files, type = "file") {
    if (!this.isConnected()) throw new Error("Client disconnected, cannot upload files.");
    const uploadRequestPayload = files.map((f) => ({
      name: f.name || `file-${Date.now()}`,
      type,
      mime: f.type || "application/octet-stream",
      size: f.size || 0
    }));
    const uploadUrls = await this.apiFetch("/api/v2/chat/storage/upload-url", {
      method: "POST",
      body: JSON.stringify({ files: uploadRequestPayload })
    });
    const attachments = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadData = uploadUrls[i];
      const putResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": uploadData.mime },
        body: file
      });
      if (!putResponse.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }
      attachments.push({
        type: uploadData.type,
        url: uploadData.fileUrl,
        name: uploadData.name,
        mime: uploadData.mime,
        size: uploadData.size
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
  async queryRooms(query) {
    const queryParams = new URLSearchParams();
    if (query.limit) queryParams.append("limit", String(query.limit));
    if (query.offset) queryParams.append("offset", String(query.offset));
    if (query.sort) queryParams.append("sort", JSON.stringify(query.sort));
    if (query.state) queryParams.append("state", String(query.state));
    if (query.filter_conditions) {
      queryParams.append("filter_conditions", JSON.stringify(query.filter_conditions));
    }
    const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const response = await this.apiFetch(`/api/v2/chat/rooms${qs}`, { method: "GET" });
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
  hydrateRooms(rooms) {
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
  disconnectUser() {
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
    this._setConnectionState("disconnected");
  }
  isConnected() {
    return this.connectionState === "connected" && this.socket?.connected === true;
  }
  /**
   * Initialises or retrieves a Room instance.
   * Does NOT watch/subscribe — call `await room.watch()` to activate.
   */
  room(roomId, config) {
    if (this.activeRooms.has(roomId)) {
      return this.activeRooms.get(roomId);
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
  rooms() {
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
  initializeRooms(data) {
    return data.map((rts) => this.room(rts.roomId, rts.config));
  }
  // ─────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────
  _setConnectionState(state, extra) {
    this.connectionState = state;
    this.emit("connection.changed" /* CONNECTION_CHANGED */, { status: state, userId: this.user?.userId, ...extra });
  }
  _willTokenExpireSoon(bufferSeconds = 60) {
    const token = this._token;
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1e3);
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
  async _refreshToken() {
    if (this._tokenRefreshPromise) {
      return this._tokenRefreshPromise;
    }
    this._tokenRefreshPromise = (async () => {
      try {
        const newToken = await this.tokenProvider();
        this._token = newToken;
        if (this.socket) {
          this.socket.auth = { token: newToken, apiKey: this.apiKey };
        }
        return newToken;
      } finally {
        this._tokenRefreshPromise = null;
      }
    })();
    return this._tokenRefreshPromise;
  }
  _setupSocketListeners() {
    if (!this.socket) return;
    this.socket.on("connect", async () => {
      this._reconnectCount = 0;
      this._setConnectionState("connected");
      this.emit("connect" /* CONNECT */, { status: this.connectionState });
      const rewatchPromises = [];
      for (const room of this.activeRooms.values()) {
        if (room.initialized) {
          rewatchPromises.push(
            room.watch().then(() => {
            }).catch((err) => {
              console.error(`[ChatClient] Failed to re-watch room ${room.id} after reconnect:`, err);
            })
          );
        }
      }
      await Promise.allSettled(rewatchPromises);
    });
    this.socket.io.on("reconnect_attempt", async () => {
      this._reconnectCount += 1;
      this._setConnectionState("reconnecting", {
        error: `Attempted reconnection count is ${this._reconnectCount}.`
      });
      if (!this._token || this._willTokenExpireSoon(60)) {
        try {
          await this._refreshToken();
        } catch (err) {
          console.error("[ChatClient] Token refresh failed during reconnect:", err);
        }
      }
    });
    this.socket.on("connection.success" /* CONNECTION_SUCCESS */, (payload) => {
      this.emit("connection.success" /* CONNECTION_SUCCESS */, payload);
    });
    this.socket.on("connection.error" /* CONNECTION_ERROR */, (payload) => {
      this._setConnectionState("disconnected", { error: payload?.message });
      this.emit("connection.error" /* CONNECTION_ERROR */, payload);
      const msg = payload?.message ?? "";
      if (msg.includes("Authentication") || msg.includes("Unauthorized")) {
        this._handleReconnectAuthError();
      }
    });
    this.socket.on("disconnect", (reason) => {
      this._setConnectionState("disconnected", { reason });
      this.emit("disconnect" /* DISCONNECT */, reason);
      if (reason === "io server disconnect") {
        this._handleReconnectAuthError();
      }
    });
    const routeToRoom = (event, payload) => {
      const roomId = payload?.roomId;
      if (roomId) {
        const room = this.activeRooms.get(roomId);
        if (room) room._handleEvent(event, payload);
      }
      this.emit(event, payload);
    };
    this.socket.on("message.new" /* MESSAGE_NEW */, (p) => routeToRoom("message.new" /* MESSAGE_NEW */, p));
    this.socket.on("message.updated" /* MESSAGE_UPDATED */, (p) => routeToRoom("message.updated" /* MESSAGE_UPDATED */, p));
    this.socket.on("message.deleted" /* MESSAGE_DELETED */, (p) => routeToRoom("message.deleted" /* MESSAGE_DELETED */, p));
    this.socket.on("message.read" /* MESSAGE_READ */, (p) => routeToRoom("message.read" /* MESSAGE_READ */, p));
    this.socket.on("message.reaction.new" /* MESSAGE_REACTION_NEW */, (p) => routeToRoom("message.reaction.new" /* MESSAGE_REACTION_NEW */, p));
    this.socket.on("message.reaction.deleted" /* MESSAGE_REACTION_DELETED */, (p) => routeToRoom("message.reaction.deleted" /* MESSAGE_REACTION_DELETED */, p));
    this.socket.on("typing.start" /* TYPING_START */, (p) => routeToRoom("typing.start" /* TYPING_START */, p));
    this.socket.on("typing.stop" /* TYPING_STOP */, (p) => routeToRoom("typing.stop" /* TYPING_STOP */, p));
    this.socket.on("user.presence.changed" /* USER_PRESENCE_CHANGED */, (p) => routeToRoom("user.presence.changed" /* USER_PRESENCE_CHANGED */, p));
    this.socket.on("notification.unread" /* NOTIFICATION_UNREAD */, (p) => routeToRoom("notification.unread" /* NOTIFICATION_UNREAD */, p));
    this.socket.on("member.moderated" /* MEMBER_MODERATED */, (p) => routeToRoom("member.moderated" /* MEMBER_MODERATED */, p));
    this.socket.on("room.frozen" /* ROOM_FROZEN */, (p) => routeToRoom("room.frozen" /* ROOM_FROZEN */, p));
    this.socket.on("room.truncated" /* ROOM_TRUNCATED */, (p) => routeToRoom("room.truncated" /* ROOM_TRUNCATED */, p));
    this.socket.on("room.added" /* ROOM_ADDED */, (payload) => {
      this.hydrateRooms([payload]);
      this.emit("room.added" /* ROOM_ADDED */, payload);
    });
    this.socket.on("room.removed" /* ROOM_REMOVED */, (payload) => {
      const roomId = payload?.roomId;
      if (roomId) {
        const room = this.activeRooms.get(roomId);
        if (room) {
          room.dispose();
          room.emit("room.removed" /* ROOM_REMOVED */, payload);
          this.activeRooms.delete(roomId);
        }
      }
      this.emit("room.removed" /* ROOM_REMOVED */, payload);
    });
    this.socket.on("room.deleted" /* ROOM_DELETED */, (payload) => {
      const roomId = payload?.roomId;
      if (roomId) {
        const room = this.activeRooms.get(roomId);
        if (room) {
          room.dispose();
          room.emit("room.deleted" /* ROOM_DELETED */, payload);
          this.activeRooms.delete(roomId);
        }
      }
      this.emit("room.deleted" /* ROOM_DELETED */, payload);
    });
  }
  /**
   * Centralized auth recovery — refreshes the token and reconnects.
   * Called from the CONNECTION_ERROR handler and the disconnect handler.
   */
  async _handleReconnectAuthError() {
    if (!this.tokenProvider || !this.user) return;
    try {
      await this._refreshToken();
      this.socket?.connect();
    } catch (err) {
      console.error("[ChatClient] Failed to refresh token on auth error:", err);
    }
  }
};
export {
  ChatClient,
  Room
};
//# sourceMappingURL=index.mjs.map