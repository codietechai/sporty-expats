import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'eventemitter3';
import {
  SocketEvent,
  SocketClientOptions,
  IMessage,
  UserStatus,
  ISendMessage,
  IRoom,
  ICreateRoom,
  IRoomMedia,
  IEditMessage,
  IDeleteMessage,
} from '../types';

export class ChatFrontendClient extends EventEmitter {
  private socket: Socket;
  private options: SocketClientOptions;
  private messageQueue: ISendMessage[] = [];
  private isConnectedToChatSocket = false;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private debug = false;
  private eventHistory: Array<{ event: string; data: any; timestamp: Date }> = [];
  private guestId: string;
  private apiKey: string;

  constructor(options: SocketClientOptions) {
    super();
    this.options = {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 1000,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 6000,
      timeout: 40000,
      debug: false,
      ...options,
    };

    this.debug = this.options.debug ?? false;
    this.apiKey = this.options.apiKey || '';
    this.guestId = this.options.id || '';
    const url = this.options.namespace
      ? `${this.options.url}/${this.options.namespace}`
      : this.options.url;

    this.socket = io(url, {
      path: this.options.path,
      autoConnect: this.options.autoConnect,
      reconnection: this.options.reconnection,
      reconnectionAttempts: this.options.reconnectionAttempts,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionDelayMax: this.options.reconnectionDelayMax,
      timeout: this.options.timeout,

      withCredentials: true,
      transports: ['websocket', 'polling'], // Allow polling as fallback
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.socket.on(SocketEvent.CONNECT, () => {
      this.isConnectedToChatSocket = this.socket.connected;
      this.log('Connected to server');
      this.emit(SocketEvent.CONNECT);

      // When we connect, check if we need to process any queued messages
      if (this.messageQueue.length > 0) {
        this.log(`Processing ${this.messageQueue.length} queued messages`);
        this.processMessageQueue();
      }
    });

    this.socket.on(SocketEvent.DISCONNECT, (reason: any) => {
      this.isConnectedToChatSocket = this.socket.connected;
      this.log(`Disconnected from server: ${reason}, disconnected: ${this.isConnectedToChatSocket}`);
      this.emit(SocketEvent.DISCONNECT, reason);

      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
        this.log('Disconnect reason indicates network issue, will attempt to reconnect');
        setTimeout(() => {
          this.reconnect().catch((err) =>
            this.log('Reconnection failed after disconnect', err)
          );
        }, 1000);
      }
    });

    this.socket.on(SocketEvent.CONNECT_ERROR, (error: any) => {
      this.log(`Connection error: ${error.message}`);
      this.emit(SocketEvent.CONNECT_ERROR, error);
    });

    this.socket.on(SocketEvent.RECONNECT_ATTEMPT, (attempt: number) => {
      this.log(`Reconnection attempt ${attempt}`);
      this.emit(SocketEvent.RECONNECT_ATTEMPT, attempt);
    });

    this.socket.on(SocketEvent.RECONNECT, (attempt: number) => {
      this.isConnectedToChatSocket = this.socket.connected;
      this.log(`Reconnected after ${attempt} attempts`);
      this.emit(SocketEvent.RECONNECT, attempt);
      this.processMessageQueue();
    });

    this.socket.on(SocketEvent.RECONNECT_ERROR, (error: any) => {
      this.log(`Reconnection error: ${error.message}`);
      this.emit(SocketEvent.RECONNECT_ERROR, error);
    });

    this.socket.on(SocketEvent.RECONNECT_FAILED, () => {
      this.log('Failed to reconnect');
      this.emit(SocketEvent.RECONNECT_FAILED);
    });

    this.socket.on(SocketEvent.AUTHENTICATED, (data: any) => {
      this.log('Authenticated', data);
      this.emit(SocketEvent.AUTHENTICATED, data);
    });

    this.socket.on(SocketEvent.AUTH_ERROR, (error: any) => {
      this.log(`Authentication error: ${error.message}`);
      this.emit(SocketEvent.AUTH_ERROR, error);
    });

    this.socket.on(SocketEvent.ROOM_JOINED, (data: any) => {
      this.log('Room joined', data);
      this.emit(SocketEvent.ROOM_JOINED, data);
    });

    this.socket.on(SocketEvent.LIST_OF_GUEST_ROOMS, (data: IRoom[]) => {
      this.log('List of guest rooms', data);
      this.emit(SocketEvent.LIST_OF_GUEST_ROOMS, data);
    });

    this.socket.on(SocketEvent.ROOM_DATA, (data: IRoom) => {
      this.log('Room data', data);
      this.emit(SocketEvent.ROOM_DATA, data);
    });

    this.socket.on(SocketEvent.ROOM_MEDIA, (data: IRoomMedia[]) => {
      this.log('Room media', data);
      this.emit(SocketEvent.ROOM_MEDIA, data);
    });

    this.socket.on(SocketEvent.ROOM_LEFT, (data: any) => {
      this.log('Room left', data);
      this.emit(SocketEvent.ROOM_LEFT, data);
    });

    this.socket.on(SocketEvent.ROOM_CREATED, (data: any) => {
      this.log('Room created', data);
      this.emit(SocketEvent.ROOM_CREATED, data);
    });

    this.socket.on(SocketEvent.ROOM_MESSAGES, (data: IMessage[]) => {
      this.log('Room messages', data);
      this.emit(SocketEvent.ROOM_MESSAGES, data);
    });

    this.socket.on(SocketEvent.NEW_MESSAGE, (data: IMessage) => {
      this.log('New message received', data);
      this.emit(SocketEvent.NEW_MESSAGE, data);
    });

    this.socket.on(SocketEvent.MESSAGE_EDITED, (data: IMessage) => {
      this.log('Message edited', data);
      this.emit(SocketEvent.MESSAGE_EDITED, data);
    });

    this.socket.on(SocketEvent.MESSAGE_DELETED, (data: IMessage) => {
      this.log('Message deleted', data);
      this.emit(SocketEvent.MESSAGE_DELETED, data);
    });

    this.socket.on(SocketEvent.EDIT_MESSAGE, (data: IEditMessage) => {
      this.log('Message edited', data);
      this.emit(SocketEvent.EDIT_MESSAGE, data);
    });

    this.socket.on(SocketEvent.DELETE_MESSAGE, (data: IDeleteMessage) => {
      this.log('Message deleted', data);
      this.emit(SocketEvent.DELETE_MESSAGE, data);
    });

    this.socket.on(SocketEvent.MESSAGE_READ, (data: any) => {
      this.log('Message read', data);
      this.emit(SocketEvent.MESSAGE_READ, data);
    });

    this.socket.on(SocketEvent.USER_JOINED, (data: any) => {
      this.log('User joined', data);
      this.emit(SocketEvent.USER_JOINED, data);
    });

    this.socket.on(SocketEvent.USER_ONLINE, (data: any) => {
      this.log('User online', data);
      this.emit(SocketEvent.USER_ONLINE, data);
    });

    this.socket.on(SocketEvent.USER_LEFT, (data: any) => {
      this.log('User left', data);
      this.emit(SocketEvent.USER_LEFT, data);
    });

    this.socket.on(SocketEvent.USER_STATUS_CHANGED, (data: any) => {
      this.log('User status changed', data);
      this.emit(SocketEvent.USER_STATUS_CHANGED, data);
    });

    this.socket.on(SocketEvent.USER_TYPING, (data: any) => {
      this.log('User typing', data);
      this.emit(SocketEvent.USER_TYPING, data);
    });

    this.socket.on(SocketEvent.USER_STOPPED_TYPING, (data: any) => {
      this.log('User stopped typing', data);
      this.emit(SocketEvent.USER_STOPPED_TYPING, data);
    });

    this.socket.on(SocketEvent.ERROR, (error: any) => {
      this.log('Error', error);
      this.emit(SocketEvent.ERROR, error);
    });
  }

  private setItemWithExpiry(key: string, value: boolean, ttl: number) {
    const now = Date.now();
    const item = {
      value,
      expiry: now + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  private getItemWithExpiry(key: string): boolean {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return false;

    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry || !item.value) {
      localStorage.removeItem(key);
      return false;
    }

    return item.value;
  }

  public async login(id: string): Promise<void> {
    try {
      const isLoggedIn = this.getItemWithExpiry('sparkstrand_chat');
      if (!isLoggedIn) {
        const response = await fetch(`${this.options.url}/api/v1/guests/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-KEY': this.apiKey  },
          body: JSON.stringify({ id }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to login guest: ${response.statusText}`);
        }

        const ttl = (6 * 24 + 22) * 60 * 60 * 1000;
        this.setItemWithExpiry('sparkstrand_chat', true, ttl);

        const result = await response.json();
        this.guestId = result.data?.id;
        this.log('Login API call successful, connecting socket');
      } else {
        this.log('Already logged in, skipping API call');
      }

      this.socket.disconnect(); // Fresh connection
      this.socket.connect();
    } catch (error: any) {
      this.log(`Error connecting guest: ${error.message}`, error);
      this.emit(SocketEvent.AUTH_ERROR, {
        message: error.message,
        success: false,
        statusCode: 401,
      });
      throw error;
    }
  }

  /**
   * Attempt to reconnect using the existing cookie
   * This can be called when the connection is lost or manually by the user
   */
  public async reconnect(): Promise<void> {
    try {
      this.log('Attempting to reconnect using existing cookie');

      // If we're already connected, do nothing
      if (this.socket.connected) {
        this.log('Already connected, no need to reconnect');
        return;
      }

      // Simply connect the socket - it will automatically use the sparkstrand_token cookie
      // that's already stored in the browser from the previous successful connection
      this.log('Connecting socket directly using existing sparkstrand_token cookie');
      this.socket.connect();

      // Return a promise that resolves when connected or rejects after timeout
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.socket.off(SocketEvent.CONNECT);
          this.socket.off(SocketEvent.CONNECT_ERROR);
          reject(new Error('Reconnection timeout'));
        }, 20000);

        const handleConnect = () => {
          clearTimeout(timeout);
          this.socket.off(SocketEvent.CONNECT_ERROR);
          this.log('Reconnection successful');
          resolve();
        };

        const handleError = (error: any) => {
          clearTimeout(timeout);
          this.socket.off(SocketEvent.CONNECT);
          this.log(`Reconnection error: ${error.message}`);

          // If reconnection fails with the cookie, due to cookie expiry,
          // try to reconnect the guest as a fallback
          const id = this.getUserId();
          if (id) {
            this.log('Reconnection failed, trying login');
            this.login(id)
              .then(resolve)
              .catch(reject);
          } else {
            reject(error);
          }
        };

        this.socket.once(SocketEvent.CONNECT, handleConnect);
        this.socket.once(SocketEvent.CONNECT_ERROR, handleError);
      });
    } catch (error: any) {
      this.log(`Reconnection failed: ${error.message}`);
      this.emit(SocketEvent.RECONNECT_ERROR, error);
      throw error;
    }
  }

  public disconnect(): void {
    this.socket.disconnect();
    this.isConnectedToChatSocket = this.socket.connected;
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  public isConnected(): boolean {
    return this.socket.connected;
  }

  public joinRoom(roomId: string): void {
    this.log(`Joining room ${roomId}`);
    this.socket.emit(SocketEvent.JOIN_ROOM, { roomId });
  }

  public switchRoom(roomId: string): void {
    this.log(`Switching to room ${roomId}`);
    this.socket.emit(SocketEvent.SWITCH_ROOM, { roomId });

    // Set a timeout to automatically fetch room data if not received
    setTimeout(() => {
      this.log(`Auto-fetching room data for ${roomId} after switch`);
      this.getRoomDataById(roomId);
    }, 1000);
  }

  public leaveRoom(roomId: string): void {
    this.log(`Leaving room ${roomId}`);
    this.socket.emit(SocketEvent.LEAVE_ROOM, { roomId });
  }

  public getListOfGuestRooms(): void {
    this.log('Getting list of guest rooms');
    this.socket.emit(SocketEvent.GET_LIST_OF_GUEST_ROOMS);
  }

  public getRoomDataById(roomId: string): void {
    this.log(`Getting room data for ${roomId}`);
    this.socket.emit(SocketEvent.GET_ROOM_DATA_BY_ID, { roomId });
  }

  public getRoomMedia(roomId: string): void {
    this.log(`Getting room media for ${roomId}`);
    this.socket.emit(SocketEvent.GET_ROOM_Media, { roomId });
  }

  public getRoomMessages(roomId: string, limit: number, cursor?: string): void {
    this.log(`Getting room messages for ${roomId}`);
    this.socket.emit(SocketEvent.GET_ROOM_MESSAGES, { roomId, limit, cursor });
  }

  public editMessage(message: IEditMessage): void {
    this.log(`Editing message ${message.messageId}`);
    this.socket.emit(SocketEvent.EDIT_MESSAGE, message);
  }

  public deleteMessage(message: IDeleteMessage): void {
    this.log(`Deleting message ${message.messageId}`);
    this.socket.emit(SocketEvent.DELETE_MESSAGE, message);
  }

  public createRoom(data: ICreateRoom): void {
    this.log('Creating room', data);
    this.socket.emit(SocketEvent.CREATE_ROOM, { ...data, guestIds: data.memberIds });
  }

  public async sendMessage(message: ISendMessage): Promise<void> {
    if (!this.isConnected()) {
      this.log('Not connected, queueing message', message);
      this.messageQueue.push(message);
      return;
    }
    const files = message?.files;
    if(files && files.length > 0) {
      const formData = new FormData();
      files.forEach((file: File) => {
        formData.append('files', file);
      });
      // Add roomId only once, outside the loop
      formData.append('roomId', message.to);
      const response = await fetch(`${this.options.url}/api/v1/files/guests`, {
        method: 'POST',
        headers: { 'X-API-KEY': this.apiKey  },
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();
      if(!data.success) {
        throw new Error(data.message);
      }
      const fileIds = data.data.map((file: any) => file.id);
      message = { ...message, files: fileIds}
    }

    this.log('Sending message', message);
    this.socket.emit(SocketEvent.SEND_MESSAGE, message);
  }

  public markMessageRead(messageId: string): void {
    this.log(`Marking message ${messageId} as read`);
    this.socket.emit(SocketEvent.MARK_MESSAGE_READ, { messageId });
  }

  public setUserStatus(status: UserStatus): void {
    this.log(`Setting user status to ${status}`);
    this.socket.emit(SocketEvent.SET_USER_STATUS, { status });
  }

  public sendTypingIndicator(roomId: string): void {
    this.log(`Sending typing indicator for room ${roomId}`);
    this.socket.emit(SocketEvent.TYPING, { roomId });
    if (this.typingTimeouts.has(roomId)) {
      clearTimeout(this.typingTimeouts.get(roomId));
    }
    const timeout = setTimeout(() => {
      this.sendStopTypingIndicator(roomId);
    }, 3000);
    this.typingTimeouts.set(roomId, timeout);
  }

  public sendStopTypingIndicator(roomId: string): void {
    this.log(`Sending stop typing indicator for room ${roomId}`);
    this.socket.emit(SocketEvent.STOP_TYPING, { roomId });
    if (this.typingTimeouts.has(roomId)) {
      clearTimeout(this.typingTimeouts.get(roomId));
      this.typingTimeouts.delete(roomId);
    }
  }

  private processMessageQueue(): void {
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

  public setUrl(url: string): void {
    this.options.url = url;
  }

  public getUrl(): string {
    return this.options.url;
  }

  public getPublicApiKey(): string {
    return this.apiKey;
  }

  public getUserId(): string | null {
    return this.guestId;
  }

  private log(message: string, data?: any): void {
    if (!this.debug) {
      return;
    }
    const eventData = { event: message, data, timestamp: new Date() };
    this.eventHistory.push(eventData);
    if (data) {
      console.log(`[SocketClient] ${message}:`, data);
    } else {
      console.log(`[SocketClient] ${message}`);
    }
    this.emit('eventHistory', this.eventHistory);
  }

  public getEventHistory(): Array<{ event: string; data: any; timestamp: Date }> {
    return this.eventHistory;
  }
}
