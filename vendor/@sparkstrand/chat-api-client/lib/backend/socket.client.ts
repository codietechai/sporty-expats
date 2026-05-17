import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'eventemitter3';

import {
  SocketEvent,
  SocketClientOptions,
  IMessage,
  RoomType,
  UserStatus,
} from '../types';

export class SocketClient extends EventEmitter {
  private socket: Socket;
  private options: SocketClientOptions;
  private messageQueue: IMessage[] = [];
  private connected = false;
  private debug = false;
  private eventHistory: Array<{ event: string; data: any; timestamp: Date }> = [];

  constructor(options: SocketClientOptions) {
    super();
    this.options = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      debug: false,
      ...options,
    };

    this.debug = this.options.debug ?? false;

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
      auth: this.options.token ? { token: this.options.token } : undefined
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // /* CONNECTION MANAGEMENT SECTION */
    this.socket.on(SocketEvent.CONNECT, () => {
      this.connected = true;
      this.log('Connected to server');
      this.emit(SocketEvent.CONNECT);
      this.processMessageQueue();
    });

    this.socket.on(SocketEvent.DISCONNECT, (reason: any) => {
      this.connected = false;
      this.log(`Disconnected from server: ${reason}`);
      this.emit(SocketEvent.DISCONNECT, reason);
    });

    this.socket.on(SocketEvent.CONNECT_ERROR, (error: any) => {
      this.log(`Connection error: ${error.message}`);
      this.emit(SocketEvent.CONNECT_ERROR, error);
    });

    this.socket.on(SocketEvent.RECONNECT_ATTEMPT, (attempt: any) => {
      this.log(`Reconnection attempt ${attempt}`);
      this.emit(SocketEvent.RECONNECT_ATTEMPT, attempt);
    });

    this.socket.on(SocketEvent.RECONNECT, (attempt: any) => {
      this.connected = true;
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


    // /* AUTHENTICATION SECTION */
    this.socket.on(SocketEvent.AUTHENTICATED, (data: any) => {
      this.log('Authenticated', data);
      this.emit(SocketEvent.AUTHENTICATED, data);
    });

    this.socket.on(SocketEvent.AUTH_ERROR, (error: any) => {
      this.log(`Authentication error: ${error.message}`);
      this.emit(SocketEvent.AUTH_ERROR, error);
    });


    // /* ROOM MANAGEMENT SECTION */
    this.socket.on(SocketEvent.ROOM_JOINED, (data: any) => {
      this.log('Room joined', data);
      this.emit(SocketEvent.ROOM_JOINED, data);
    });

    this.socket.on(SocketEvent.LIST_OF_GUEST_ROOMS, (data: any) => {
      this.log('List of guest rooms', data);
      this.emit(SocketEvent.LIST_OF_GUEST_ROOMS, data);
    });

    this.socket.on(SocketEvent.ROOM_LEFT, (data: any) => {
      this.log('Room left', data);
      this.emit(SocketEvent.ROOM_LEFT, data);
    });

    this.socket.on(SocketEvent.ROOM_CREATED, (data: any) => {
      this.log('Room created', data);
      this.emit(SocketEvent.ROOM_CREATED, data);
    });


    // /* MESSAGE MANAGEMENT SECTION */
    this.socket.on(SocketEvent.NEW_MESSAGE, (data: any) => {
      this.log('New message received', data);
      this.emit(SocketEvent.NEW_MESSAGE, data);
    });

    this.socket.on(SocketEvent.MESSAGE_READ, (data: any) => {
      this.log('Message read', data);
      this.emit(SocketEvent.MESSAGE_READ, data);
    });


    // /* USER MANAGEMENT SECTION */
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

    // /* ERROR MANAGEMENT SECTION */
    this.socket.on(SocketEvent.ERROR, (error: any) => {
      this.log('Error', error);
      this.emit(SocketEvent.ERROR, error);
    });
  }

  /* PUBLIC METHODS SECTION */
  public connect(): void {
    this.socket.connect();
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  public isConnected(): boolean {
    return this.connected;
  }


  public setToken(token: string): void {
    this.options.token = token;
    this.socket.disconnect();
    this.socket = io(this.options.url, {
      path: this.options.path,
      auth: { token },
      autoConnect: this.options.autoConnect,
      reconnection: this.options.reconnection,
      reconnectionAttempts: this.options.reconnectionAttempts,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionDelayMax: this.options.reconnectionDelayMax,
      timeout: this.options.timeout
    });
    this.setupEventListeners();


    this.socket.connect();
  }

  public joinRoom(roomId: string): void {
    this.log(`Joining room ${roomId}`);
    this.socket.emit(SocketEvent.JOIN_ROOM, roomId);
  }

  public leaveRoom(roomId: string): void {
    this.log(`Leaving room ${roomId}`);
    this.socket.emit(SocketEvent.LEAVE_ROOM, roomId);
  }

  public createRoom(data: { name: string; type: RoomType; membersId: string[]; applicationId?: string }): void {
    this.log('Creating room', data);
    this.socket.emit(SocketEvent.CREATE_ROOM, data);
  }

  public sendMessage(message: IMessage): void {
    if (!this.connected) {
      this.log('Not connected, queueing message', message);
      this.messageQueue.push(message);
      return;
    }
    this.log('Sending message', message);
    this.socket.emit(SocketEvent.SEND_MESSAGE, message);
  }

  public markMessageRead(messageId: string): void {
    this.log(`Marking message ${messageId} as read`);
    this.socket.emit(SocketEvent.MARK_MESSAGE_READ, messageId);
  }

  public setUserStatus(status: UserStatus): void {
    this.log(`Setting user status to ${status}`);
    this.socket.emit(SocketEvent.SET_USER_STATUS, status);
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

  private log(message: string, data?: any): void {
    if (!this.debug) {
      return;
    }
    if (data) {
      console.log(`[SocketClient] ${message}:`, data);
    } else {
      console.log(`[SocketClient] ${message}`);
    }
  }

  public getEventHistory(): Array<{ event: string; data: any; timestamp: Date }> {
    return this.eventHistory;
  }
}
