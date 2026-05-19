// lib/frontend/index.ts
import { io } from "socket.io-client";
import { EventEmitter } from "eventemitter3";
var ChatFrontendClient = class extends EventEmitter {
  constructor(options) {
    super();
    this.messageQueue = [];
    this.isConnectedToChatSocket = false;
    this.typingTimeouts = /* @__PURE__ */ new Map();
    this.debug = false;
    this.eventHistory = [];
    this.options = {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 1e3,
      reconnectionDelay: 1e3,
      reconnectionDelayMax: 6e3,
      timeout: 4e4,
      debug: false,
      ...options
    };
    this.debug = this.options.debug ?? false;
    this.apiKey = this.options.apiKey || "";
    this.guestId = this.options.id || "";
    const url = this.options.namespace ? `${this.options.url}/${this.options.namespace}` : this.options.url;
    this.socket = io(url, {
      path: this.options.path,
      autoConnect: this.options.autoConnect,
      reconnection: this.options.reconnection,
      reconnectionAttempts: this.options.reconnectionAttempts,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionDelayMax: this.options.reconnectionDelayMax,
      timeout: this.options.timeout,
      withCredentials: true,
      transports: ["websocket", "polling"]
      // Allow polling as fallback
    });
    this.setupEventListeners();
  }
  setupEventListeners() {
    this.socket.on("connect" /* CONNECT */, () => {
      this.isConnectedToChatSocket = this.socket.connected;
      this.log("Connected to server");
      this.emit("connect" /* CONNECT */);
      if (this.messageQueue.length > 0) {
        this.log(`Processing ${this.messageQueue.length} queued messages`);
        this.processMessageQueue();
      }
    });
    this.socket.on("disconnect" /* DISCONNECT */, (reason) => {
      this.isConnectedToChatSocket = this.socket.connected;
      this.log(`Disconnected from server: ${reason}, disconnected: ${this.isConnectedToChatSocket}`);
      this.emit("disconnect" /* DISCONNECT */, reason);
      if (reason === "io server disconnect" || reason === "transport close" || reason === "ping timeout") {
        this.log("Disconnect reason indicates network issue, will attempt to reconnect");
        setTimeout(() => {
          this.reconnect().catch(
            (err) => this.log("Reconnection failed after disconnect", err)
          );
        }, 1e3);
      }
    });
    this.socket.on("connect_error" /* CONNECT_ERROR */, (error) => {
      this.log(`Connection error: ${error.message}`);
      this.emit("connect_error" /* CONNECT_ERROR */, error);
    });
    this.socket.on("reconnect_attempt" /* RECONNECT_ATTEMPT */, (attempt) => {
      this.log(`Reconnection attempt ${attempt}`);
      this.emit("reconnect_attempt" /* RECONNECT_ATTEMPT */, attempt);
    });
    this.socket.on("reconnect" /* RECONNECT */, (attempt) => {
      this.isConnectedToChatSocket = this.socket.connected;
      this.log(`Reconnected after ${attempt} attempts`);
      this.emit("reconnect" /* RECONNECT */, attempt);
      this.processMessageQueue();
    });
    this.socket.on("reconnect_error" /* RECONNECT_ERROR */, (error) => {
      this.log(`Reconnection error: ${error.message}`);
      this.emit("reconnect_error" /* RECONNECT_ERROR */, error);
    });
    this.socket.on("reconnect_failed" /* RECONNECT_FAILED */, () => {
      this.log("Failed to reconnect");
      this.emit("reconnect_failed" /* RECONNECT_FAILED */);
    });
    this.socket.on("authenticated" /* AUTHENTICATED */, (data) => {
      this.log("Authenticated", data);
      this.emit("authenticated" /* AUTHENTICATED */, data);
    });
    this.socket.on("auth_error" /* AUTH_ERROR */, (error) => {
      this.log(`Authentication error: ${error.message}`);
      this.emit("auth_error" /* AUTH_ERROR */, error);
    });
    this.socket.on("roomJoined" /* ROOM_JOINED */, (data) => {
      this.log("Room joined", data);
      this.emit("roomJoined" /* ROOM_JOINED */, data);
    });
    this.socket.on("listOfGuestRooms" /* LIST_OF_GUEST_ROOMS */, (data) => {
      this.log("List of guest rooms", data);
      this.emit("listOfGuestRooms" /* LIST_OF_GUEST_ROOMS */, data);
    });
    this.socket.on("roomData" /* ROOM_DATA */, (data) => {
      this.log("Room data", data);
      this.emit("roomData" /* ROOM_DATA */, data);
    });
    this.socket.on("roomMedia" /* ROOM_MEDIA */, (data) => {
      this.log("Room media", data);
      this.emit("roomMedia" /* ROOM_MEDIA */, data);
    });
    this.socket.on("roomLeft" /* ROOM_LEFT */, (data) => {
      this.log("Room left", data);
      this.emit("roomLeft" /* ROOM_LEFT */, data);
    });
    this.socket.on("roomCreated" /* ROOM_CREATED */, (data) => {
      this.log("Room created", data);
      this.emit("roomCreated" /* ROOM_CREATED */, data);
    });
    this.socket.on("roomMessages" /* ROOM_MESSAGES */, (data) => {
      this.log("Room messages", data);
      this.emit("roomMessages" /* ROOM_MESSAGES */, data);
    });
    this.socket.on("newMessage" /* NEW_MESSAGE */, (data) => {
      this.log("New message received", data);
      this.emit("newMessage" /* NEW_MESSAGE */, data);
    });
    this.socket.on("messageEdited" /* MESSAGE_EDITED */, (data) => {
      this.log("Message edited", data);
      this.emit("messageEdited" /* MESSAGE_EDITED */, data);
    });
    this.socket.on("messageDeleted" /* MESSAGE_DELETED */, (data) => {
      this.log("Message deleted", data);
      this.emit("messageDeleted" /* MESSAGE_DELETED */, data);
    });
    this.socket.on("editMessage" /* EDIT_MESSAGE */, (data) => {
      this.log("Message edited", data);
      this.emit("editMessage" /* EDIT_MESSAGE */, data);
    });
    this.socket.on("deleteMessage" /* DELETE_MESSAGE */, (data) => {
      this.log("Message deleted", data);
      this.emit("deleteMessage" /* DELETE_MESSAGE */, data);
    });
    this.socket.on("messageRead" /* MESSAGE_READ */, (data) => {
      this.log("Message read", data);
      this.emit("messageRead" /* MESSAGE_READ */, data);
    });
    this.socket.on("userJoined" /* USER_JOINED */, (data) => {
      this.log("User joined", data);
      this.emit("userJoined" /* USER_JOINED */, data);
    });
    this.socket.on("userOnline" /* USER_ONLINE */, (data) => {
      this.log("User online", data);
      this.emit("userOnline" /* USER_ONLINE */, data);
    });
    this.socket.on("userLeft" /* USER_LEFT */, (data) => {
      this.log("User left", data);
      this.emit("userLeft" /* USER_LEFT */, data);
    });
    this.socket.on("userStatusChanged" /* USER_STATUS_CHANGED */, (data) => {
      this.log("User status changed", data);
      this.emit("userStatusChanged" /* USER_STATUS_CHANGED */, data);
    });
    this.socket.on("userTyping" /* USER_TYPING */, (data) => {
      this.log("User typing", data);
      this.emit("userTyping" /* USER_TYPING */, data);
    });
    this.socket.on("userStoppedTyping" /* USER_STOPPED_TYPING */, (data) => {
      this.log("User stopped typing", data);
      this.emit("userStoppedTyping" /* USER_STOPPED_TYPING */, data);
    });
    this.socket.on("error" /* ERROR */, (error) => {
      this.log("Error", error);
      this.emit("error" /* ERROR */, error);
    });
  }
  setItemWithExpiry(key, value, ttl) {
    const now = Date.now();
    const item = {
      value,
      expiry: now + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  }
  getItemWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return false;
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry || !item.value) {
      localStorage.removeItem(key);
      return false;
    }
    return item.value;
  }
  async login(id) {
    try {
      const isLoggedIn = this.getItemWithExpiry("sparkstrand_chat");
      if (!isLoggedIn) {
        const response = await fetch(`${this.options.url}/api/v1/guests/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-KEY": this.apiKey },
          body: JSON.stringify({ id }),
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error(`Failed to login guest: ${response.statusText}`);
        }
        const ttl = (6 * 24 + 22) * 60 * 60 * 1e3;
        this.setItemWithExpiry("sparkstrand_chat", true, ttl);
        const result = await response.json();
        this.guestId = result.data?.id;
        this.log("Login API call successful, connecting socket");
      } else {
        this.log("Already logged in, skipping API call");
      }
      this.socket.disconnect();
      this.socket.connect();
    } catch (error) {
      this.log(`Error connecting guest: ${error.message}`, error);
      this.emit("auth_error" /* AUTH_ERROR */, {
        message: error.message,
        success: false,
        statusCode: 401
      });
      throw error;
    }
  }
  /**
   * Attempt to reconnect using the existing cookie
   * This can be called when the connection is lost or manually by the user
   */
  async reconnect() {
    try {
      this.log("Attempting to reconnect using existing cookie");
      if (this.socket.connected) {
        this.log("Already connected, no need to reconnect");
        return;
      }
      this.log("Connecting socket directly using existing sparkstrand_token cookie");
      this.socket.connect();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.socket.off("connect" /* CONNECT */);
          this.socket.off("connect_error" /* CONNECT_ERROR */);
          reject(new Error("Reconnection timeout"));
        }, 2e4);
        const handleConnect = () => {
          clearTimeout(timeout);
          this.socket.off("connect_error" /* CONNECT_ERROR */);
          this.log("Reconnection successful");
          resolve();
        };
        const handleError = (error) => {
          clearTimeout(timeout);
          this.socket.off("connect" /* CONNECT */);
          this.log(`Reconnection error: ${error.message}`);
          const id = this.getUserId();
          if (id) {
            this.log("Reconnection failed, trying login");
            this.login(id).then(resolve).catch(reject);
          } else {
            reject(error);
          }
        };
        this.socket.once("connect" /* CONNECT */, handleConnect);
        this.socket.once("connect_error" /* CONNECT_ERROR */, handleError);
      });
    } catch (error) {
      this.log(`Reconnection failed: ${error.message}`);
      this.emit("reconnect_error" /* RECONNECT_ERROR */, error);
      throw error;
    }
  }
  disconnect() {
    this.socket.disconnect();
    this.isConnectedToChatSocket = this.socket.connected;
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }
  isConnected() {
    return this.socket.connected;
  }
  joinRoom(roomId) {
    this.log(`Joining room ${roomId}`);
    this.socket.emit("joinRoom" /* JOIN_ROOM */, { roomId });
  }
  switchRoom(roomId) {
    this.log(`Switching to room ${roomId}`);
    this.socket.emit("switchRoom" /* SWITCH_ROOM */, { roomId });
    setTimeout(() => {
      this.log(`Auto-fetching room data for ${roomId} after switch`);
      this.getRoomDataById(roomId);
    }, 1e3);
  }
  leaveRoom(roomId) {
    this.log(`Leaving room ${roomId}`);
    this.socket.emit("leaveRoom" /* LEAVE_ROOM */, { roomId });
  }
  getListOfGuestRooms() {
    this.log("Getting list of guest rooms");
    this.socket.emit("getListOfGuestRooms" /* GET_LIST_OF_GUEST_ROOMS */);
  }
  getRoomDataById(roomId) {
    this.log(`Getting room data for ${roomId}`);
    this.socket.emit("getRoomDataById" /* GET_ROOM_DATA_BY_ID */, { roomId });
  }
  getRoomMedia(roomId) {
    this.log(`Getting room media for ${roomId}`);
    this.socket.emit("getRoomMedia" /* GET_ROOM_Media */, { roomId });
  }
  getRoomMessages(roomId, limit, cursor) {
    this.log(`Getting room messages for ${roomId}`);
    this.socket.emit("getRoomMessages" /* GET_ROOM_MESSAGES */, { roomId, limit, cursor });
  }
  editMessage(message) {
    this.log(`Editing message ${message.messageId}`);
    this.socket.emit("editMessage" /* EDIT_MESSAGE */, message);
  }
  deleteMessage(message) {
    this.log(`Deleting message ${message.messageId}`);
    this.socket.emit("deleteMessage" /* DELETE_MESSAGE */, message);
  }
  createRoom(data) {
    this.log("Creating room", data);
    this.socket.emit("createRoom" /* CREATE_ROOM */, { ...data, guestIds: data.memberIds });
  }
  async sendMessage(message) {
    if (!this.isConnected()) {
      this.log("Not connected, queueing message", message);
      this.messageQueue.push(message);
      return;
    }
    const files = message?.files;
    if (files && files.length > 0) {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("roomId", message.to);
      const response = await fetch(`${this.options.url}/api/v1/files/guests`, {
        method: "POST",
        headers: { "X-API-KEY": this.apiKey },
        body: formData,
        credentials: "include"
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      const fileIds = data.data.map((file) => file.id);
      message = { ...message, files: fileIds };
    }
    this.log("Sending message", message);
    this.socket.emit("sendMessage" /* SEND_MESSAGE */, message);
  }
  markMessageRead(messageId) {
    this.log(`Marking message ${messageId} as read`);
    this.socket.emit("markMessageRead" /* MARK_MESSAGE_READ */, { messageId });
  }
  setUserStatus(status) {
    this.log(`Setting user status to ${status}`);
    this.socket.emit("setUserStatus" /* SET_USER_STATUS */, { status });
  }
  sendTypingIndicator(roomId) {
    this.log(`Sending typing indicator for room ${roomId}`);
    this.socket.emit("typing" /* TYPING */, { roomId });
    if (this.typingTimeouts.has(roomId)) {
      clearTimeout(this.typingTimeouts.get(roomId));
    }
    const timeout = setTimeout(() => {
      this.sendStopTypingIndicator(roomId);
    }, 3e3);
    this.typingTimeouts.set(roomId, timeout);
  }
  sendStopTypingIndicator(roomId) {
    this.log(`Sending stop typing indicator for room ${roomId}`);
    this.socket.emit("stopTyping" /* STOP_TYPING */, { roomId });
    if (this.typingTimeouts.has(roomId)) {
      clearTimeout(this.typingTimeouts.get(roomId));
      this.typingTimeouts.delete(roomId);
    }
  }
  processMessageQueue() {
    if (this.messageQueue.length === 0) {
      return;
    }
    this.log(`Processing ${this.messageQueue.length} queued messages`);
    const batchSize = 10;
    const batches = Math.ceil(this.messageQueue.length / batchSize);
    for (let i = 0; i < batches; i++) {
      const batch = this.messageQueue.splice(0, batchSize);
      batch.forEach((message) => {
        this.sendMessage(message);
      });
    }
  }
  setUrl(url) {
    this.options.url = url;
  }
  getUrl() {
    return this.options.url;
  }
  getPublicApiKey() {
    return this.apiKey;
  }
  getUserId() {
    return this.guestId;
  }
  log(message, data) {
    if (!this.debug) {
      return;
    }
    const eventData = { event: message, data, timestamp: /* @__PURE__ */ new Date() };
    this.eventHistory.push(eventData);
    if (data) {
      console.log(`[SocketClient] ${message}:`, data);
    } else {
      console.log(`[SocketClient] ${message}`);
    }
    this.emit("eventHistory", this.eventHistory);
  }
  getEventHistory() {
    return this.eventHistory;
  }
};
export {
  ChatFrontendClient
};
//# sourceMappingURL=index.mjs.map