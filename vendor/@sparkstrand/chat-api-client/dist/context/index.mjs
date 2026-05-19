// lib/context/index.tsx
import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from "react";

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

// lib/context/index.tsx
import { jsx } from "react/jsx-runtime";
var ChatContext = createContext(void 0);
var MessageContext = createContext(void 0);
var RoomContext = createContext(void 0);
var UserStatusContext = createContext(void 0);
var TypingContext = createContext(void 0);
var FileUploadContext = createContext(void 0);
var ChatProvider = ({ options, children }) => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [rooms, setRooms] = useState([]);
  const [currentRoomData, setCurrentRoomData] = useState(null);
  const [currentRoomMedia, setCurrentRoomMedia] = useState([]);
  const [currentRoomMessages, setCurrentRoomMessages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [fileUploadConfig, setFileUploadConfig] = useState({
    maxFiles: 5,
    maxFileSize: 25,
    acceptedTypes: [
      "image/*",
      "video/*",
      "audio/*",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/*"
    ],
    uploadEndpoint: "/api/v1/files/guests"
  });
  const currentRoomIdRef = useRef(null);
  useEffect(() => {
    const chatClient = new ChatFrontendClient(options);
    setClient(chatClient);
    chatClient.on("connect" /* CONNECT */, () => {
      setIsConnected(chatClient.isConnected());
      setError(null);
    });
    chatClient.on("disconnect" /* DISCONNECT */, (reason) => {
      setIsConnected(chatClient.isConnected());
      setError(new Error(`Disconnected: ${reason}`));
    });
    chatClient.on("connect_error" /* CONNECT_ERROR */, (err) => {
      setError(err);
    });
    chatClient.on("auth_error" /* AUTH_ERROR */, (err) => {
      setError(new Error(err.message));
    });
    chatClient.on("error" /* ERROR */, (err) => {
      setError(new Error(err.message));
    });
    chatClient.on("roomSwitched" /* ROOM_SWITCHED */, (data) => {
      const roomId = typeof data === "object" ? data.roomId : data;
      console.log("[ChatContext] ROOM_SWITCHED event received:", roomId);
      if (roomId) {
        setCurrentRoomMessages([]);
        setCurrentRoomData(null);
        setCurrentRoomMedia([]);
        currentRoomIdRef.current = roomId;
        console.log("[ChatContext] Fetching room data for:", roomId);
        chatClient.getRoomDataById(roomId);
        chatClient.getRoomMedia(roomId);
        setTimeout(() => {
          console.log("[ChatContext] Backup room data fetch for:", roomId);
          chatClient.getRoomDataById(roomId);
        }, 2e3);
      }
    });
    chatClient.on("newMessage" /* NEW_MESSAGE */, (message) => {
      console.log("[ChatContext] NEW_MESSAGE event received:", message.id, "for room:", message.to, "current room:", currentRoomIdRef.current);
      setMessages((prev) => [...prev, message]);
      setCurrentRoomMessages((prev) => {
        if (message.to === currentRoomIdRef.current) {
          console.log("[ChatContext] Adding message to current room messages");
          const existingOptimisticIndex = prev.findIndex(
            (msg) => msg.id.startsWith("temp-") && msg.text === message.text && msg.sender.id === message.sender.id && Math.abs(new Date(msg.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5e3
            // Within 5 seconds
          );
          if (existingOptimisticIndex !== -1) {
            console.log("[ChatContext] Replacing optimistic message with real message");
            const newMessages = [...prev];
            newMessages[existingOptimisticIndex] = message;
            return newMessages;
          } else {
            return [...prev, message];
          }
        }
        console.log("[ChatContext] Message not for current room, skipping");
        return prev;
      });
    });
    chatClient.on("messageRead" /* MESSAGE_READ */, (messageId) => {
      setMessages(
        (prev) => prev.map(
          (msg) => msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      setCurrentRoomMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, read: true } : msg));
    });
    chatClient.on("messageDeleted" /* MESSAGE_DELETED */, (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setCurrentRoomMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });
    chatClient.on("messageEdited" /* MESSAGE_EDITED */, (message) => {
      setMessages(
        (prev) => prev.map(
          (msg) => msg.id === message.id ? message : msg
        )
      );
      setCurrentRoomMessages((prev) => prev.map((msg) => msg.id === message.id ? message : msg));
    });
    chatClient.on("messageDeleted" /* MESSAGE_DELETED */, (message) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
      setCurrentRoomMessages((prev) => prev.filter((msg) => msg.id !== message.id));
    });
    chatClient.on("listOfGuestRooms" /* LIST_OF_GUEST_ROOMS */, (rooms2) => {
      setRooms(rooms2);
    });
    chatClient.on("roomData" /* ROOM_DATA */, (room) => {
      console.log("[ChatContext] ROOM_DATA event received:", room?.id, room?.name, "Messages:", room?.messages?.length);
      setCurrentRoomData(room);
      setCurrentRoomMessages(room.messages || []);
      currentRoomIdRef.current = room?.id || null;
    });
    chatClient.on("roomMedia" /* ROOM_MEDIA */, (media) => {
      setCurrentRoomMedia(media);
    });
    chatClient.on("roomCreated" /* ROOM_CREATED */, (room) => {
      setRooms((prev) => [...prev, room]);
    });
    chatClient.on("roomMessages" /* ROOM_MESSAGES */, (messages2) => {
      setCurrentRoomMessages(messages2);
    });
    chatClient.on("userOnline" /* USER_ONLINE */, (userId) => {
      setOnlineUsers((prev) => [.../* @__PURE__ */ new Set([...prev, userId])]);
    });
    chatClient.on("userLeft" /* USER_LEFT */, (userId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });
    chatClient.on("userStatusChanged" /* USER_STATUS_CHANGED */, ({ userId, status }) => {
      setUserStatuses((prev) => ({ ...prev, [userId]: status }));
    });
    chatClient.on("userTyping" /* USER_TYPING */, ({ roomId, userId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [roomId]: [...prev[roomId] || [], userId]
      }));
    });
    chatClient.on("userStoppedTyping" /* USER_STOPPED_TYPING */, ({ roomId, userId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter((id) => id !== userId)
      }));
    });
    return () => {
      chatClient.removeAllListeners();
      chatClient.disconnect();
      setClient(null);
    };
  }, [options]);
  const login = async (id) => {
    if (!client) throw new Error("Chat client not initialized");
    try {
      await client.login(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Login failed"));
      throw err;
    }
  };
  const disconnect = () => {
    if (client) {
      client.disconnect();
      setIsConnected(client.isConnected());
    }
  };
  const reconnect = async () => {
    if (!client) throw new Error("Chat client not initialized");
    try {
      await client.reconnect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Reconnection failed"));
      throw err;
    }
  };
  const chatContextValue = useMemo(
    () => ({
      client,
      isConnected,
      login,
      disconnect,
      reconnect,
      error,
      userId: client?.getUserId() || null
    }),
    [client, isConnected, error]
  );
  const messageContextValue = useMemo(
    () => ({
      sendMessage: (message) => {
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          // Temporary ID
          text: message.text,
          to: message.to,
          sender: {
            id: message.senderId || client?.getUserId() || "",
            name: client?.getUserId() || "You",
            username: client?.getUserId() || "You",
            avatar: {
              filename: "default-avatar.png",
              fileUrl: "/default-avatar.png"
            }
          },
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          status: "Sent",
          read: false,
          edited: false,
          files: message.files ? message.files.map((file, index) => ({
            id: `temp-file-${index}`,
            filename: file.name,
            fileUrl: URL.createObjectURL(file),
            fileType: file.type,
            size: file.size,
            createdAt: /* @__PURE__ */ new Date(),
            uploader: {
              id: message.senderId || client?.getUserId() || "",
              name: client?.getUserId() || "You",
              username: client?.getUserId() || "You"
            }
          })) : []
        };
        if (message.to === currentRoomIdRef.current) {
          console.log("[ChatContext] Adding optimistic message to current room");
          setCurrentRoomMessages((prev) => [...prev, optimisticMessage]);
        }
        return client?.sendMessage(message);
      },
      markMessageRead: (messageId) => client?.markMessageRead(messageId),
      editMessage: (message) => client?.editMessage(message),
      deleteMessage: (message) => client?.deleteMessage(message),
      messages
    }),
    [client, messages]
  );
  const roomContextValue = useMemo(
    () => ({
      joinRoom: (roomId) => client?.joinRoom(roomId),
      switchRoom: (roomId) => client?.switchRoom(roomId),
      leaveRoom: (roomId) => client?.leaveRoom(roomId),
      createRoom: (data) => client?.createRoom(data),
      emitGetListOfGuestRooms: () => client?.getListOfGuestRooms(),
      setRooms,
      rooms,
      currentRoomData,
      currentRoomMedia,
      currentRoomMessages,
      getRoomDataById: (roomId) => client?.getRoomDataById(roomId),
      getRoomMedia: (roomId) => client?.getRoomMedia(roomId),
      getRoomMessages: (roomId, limit, cursor) => client?.getRoomMessages(roomId, limit, cursor)
    }),
    [client, rooms, currentRoomData, currentRoomMedia, currentRoomMessages]
  );
  const userStatusContextValue = useMemo(
    () => ({
      setUserStatus: (status) => client?.setUserStatus(status),
      onlineUsers,
      userStatuses
    }),
    [client, onlineUsers, userStatuses]
  );
  const typingContextValue = useMemo(
    () => ({
      sendTypingIndicator: (roomId) => client?.sendTypingIndicator(roomId),
      sendStopTypingIndicator: (roomId) => client?.sendStopTypingIndicator(roomId),
      typingUsers
    }),
    [client, typingUsers]
  );
  const validateFile = useCallback((file) => {
    if (file.size > (fileUploadConfig.maxFileSize || 25) * 1024 * 1024) {
      return `File size must be less than ${fileUploadConfig.maxFileSize || 25}MB`;
    }
    const isAccepted = fileUploadConfig.acceptedTypes?.some((type) => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });
    if (!isAccepted) {
      return "File type not supported";
    }
    return null;
  }, [fileUploadConfig.maxFileSize, fileUploadConfig.acceptedTypes]);
  const addFiles = useCallback(async (files) => {
    const newFiles = [];
    const errors = [];
    Array.from(files).forEach((file) => {
      if (selectedFiles.length + newFiles.length >= (fileUploadConfig.maxFiles || 5)) {
        errors.push(`Maximum ${fileUploadConfig.maxFiles || 5} files allowed`);
        return;
      }
      const error2 = validateFile(file);
      if (error2) {
        errors.push(`${file.name}: ${error2}`);
        return;
      }
      const filePreview = {
        file,
        id: `${Date.now()}-${Math.random()}`,
        uploadStatus: "pending"
      };
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          filePreview.preview = e.target?.result;
          setSelectedFiles(
            (prev) => prev.map((f) => f.id === filePreview.id ? filePreview : f)
          );
        };
        reader.readAsDataURL(file);
      }
      newFiles.push(filePreview);
    });
    if (errors.length > 0) {
      console.error("File upload errors:", errors);
    }
    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  }, [selectedFiles.length, fileUploadConfig.maxFiles, validateFile]);
  const removeFile = useCallback((id) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview && fileToRemove.preview.startsWith("blob:")) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[id];
      return newProgress;
    });
  }, []);
  const clearFiles = useCallback(() => {
    selectedFiles.forEach((file) => {
      if (file.preview && file.preview.startsWith("blob:")) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
    setUploadProgress({});
  }, [selectedFiles]);
  const uploadFiles = useCallback(async (roomId) => {
    if (selectedFiles.length === 0) return [];
    setIsUploading(true);
    const uploadedFileIds = [];
    try {
      setSelectedFiles(
        (prev) => prev.map((file) => ({ ...file, uploadStatus: "uploading" }))
      );
      const formData = new FormData();
      selectedFiles.forEach((filePreview) => {
        formData.append("files", filePreview.file);
      });
      if (roomId) {
        formData.append("roomId", roomId);
      }
      const apiKey = fileUploadConfig.apiKey;
      const uploadEndpoint = fileUploadConfig.uploadEndpoint || "/api/v1/files/guests";
      const response = await fetch(uploadEndpoint, {
        method: "POST",
        headers: apiKey ? { "X-API-KEY": apiKey } : {},
        body: formData,
        credentials: "include"
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Upload failed");
      }
      const fileIds = data.data.map((file) => file.id);
      uploadedFileIds.push(...fileIds);
      setSelectedFiles(
        (prev) => prev.map((file) => ({ ...file, uploadStatus: "completed" }))
      );
      return fileIds;
    } catch (error2) {
      console.error("File upload error:", error2);
      setSelectedFiles(
        (prev) => prev.map((file) => ({
          ...file,
          uploadStatus: "error",
          error: error2 instanceof Error ? error2.message : "Upload failed"
        }))
      );
      throw error2;
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, fileUploadConfig.apiKey, fileUploadConfig.uploadEndpoint]);
  const getFileIcon = useCallback((fileType) => {
    if (fileType.startsWith("image/")) return "\u{1F5BC}\uFE0F";
    if (fileType.startsWith("video/")) return "\u{1F3A5}";
    if (fileType.startsWith("audio/")) return "\u{1F3B5}";
    if (fileType.includes("pdf")) return "\u{1F4C4}";
    if (fileType.includes("word")) return "\u{1F4DD}";
    return "\u{1F4C1}";
  }, []);
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);
  const getSignedUrl = useCallback(async (fileId, options2 = {}) => {
    const apiBaseUrl = options2.baseUrl || client?.getUrl() || "";
    const url = `${apiBaseUrl}/api/v1/files/view/${fileId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": fileUploadConfig.apiKey || client?.getPublicApiKey() || ""
      },
      credentials: "include"
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to get signed URL");
    }
    return data.data;
  }, [client, fileUploadConfig.apiKey]);
  const previewFile = useCallback((fileIdOrUrl, options2 = {}) => {
    const { download = false, inline = false, baseUrl } = options2;
    if (fileIdOrUrl.includes("/api/v1/files/view/")) {
      const url = new URL(fileIdOrUrl, window.location.origin);
      if (download) {
        url.searchParams.set("download", "true");
      }
      if (inline) {
        url.searchParams.set("inline", "true");
      }
      return url.toString();
    } else {
      const apiBaseUrl = baseUrl || client?.getUrl() || "";
      let previewUrl = `${apiBaseUrl}/api/v1/files/view/${fileIdOrUrl}`;
      const params = new URLSearchParams();
      if (download) {
        params.append("download", "true");
      }
      if (inline) {
        params.append("inline", "true");
      }
      if (params.toString()) {
        previewUrl += `?${params.toString()}`;
      }
      return previewUrl;
    }
  }, [client]);
  const updateConfig = useCallback((newConfig) => {
    setFileUploadConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);
  const fileUploadContextValue = useMemo(
    () => ({
      selectedFiles,
      addFiles,
      removeFile,
      clearFiles,
      uploadFiles,
      uploadProgress,
      isUploading,
      validateFile,
      getFileIcon,
      formatFileSize,
      previewFile,
      getSignedUrl,
      config: fileUploadConfig,
      updateConfig
    }),
    [
      selectedFiles,
      addFiles,
      removeFile,
      clearFiles,
      uploadFiles,
      uploadProgress,
      isUploading,
      validateFile,
      getFileIcon,
      formatFileSize,
      previewFile,
      getSignedUrl,
      fileUploadConfig,
      updateConfig
    ]
  );
  return /* @__PURE__ */ jsx(ChatContext.Provider, { value: chatContextValue, children: /* @__PURE__ */ jsx(MessageContext.Provider, { value: messageContextValue, children: /* @__PURE__ */ jsx(RoomContext.Provider, { value: roomContextValue, children: /* @__PURE__ */ jsx(UserStatusContext.Provider, { value: userStatusContextValue, children: /* @__PURE__ */ jsx(TypingContext.Provider, { value: typingContextValue, children: /* @__PURE__ */ jsx(FileUploadContext.Provider, { value: fileUploadContextValue, children }) }) }) }) }) });
};
var useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
};
var useChatMessage = () => {
  const context = useContext(MessageContext);
  if (!context) throw new Error("useChatMessage must be used within a ChatProvider");
  return context;
};
var useChatRoom = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error("useChatRoom must be used within a ChatProvider");
  return context;
};
var useUserOnline = () => {
  const context = useContext(UserStatusContext);
  if (!context) throw new Error("useUserOnline must be used within a ChatProvider");
  return context;
};
var useUserTyping = () => {
  const context = useContext(TypingContext);
  if (!context) throw new Error("useUserTyping must be used within a ChatProvider");
  return context;
};
var useFileUpload = () => {
  const context = useContext(FileUploadContext);
  if (!context) {
    throw new Error("useFileUpload must be used within a ChatProvider");
  }
  return context;
};
export {
  ChatProvider,
  useChat,
  useChatMessage,
  useChatRoom,
  useFileUpload,
  useUserOnline,
  useUserTyping
};
//# sourceMappingURL=index.mjs.map