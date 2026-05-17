import { useEffect, useMemo, useState } from 'react';
import { ChatFrontendClient } from '../frontend';
import {
  SocketEvent,
  IRoom,
  IMessage,
  IUser,
  AuthenticatedData,
  ErrorData,
} from '../types';



export interface SocketState {
  isConnected: boolean;
  user: IUser | null;
  rooms: IRoom[];
  messages: IMessage[];
  typingUsers: { [roomId: string]: string[] };
  error: ErrorData | null;
  eventHistory: Array<{ event: string; data: any; timestamp: Date }>;
  currentRoomId: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
  lastDisconnectReason: string | null;
}

let socketInstance: ChatFrontendClient | null = null;

export function useSparkStrandChat(
  url: string,
  id: string,
  apiKey?: string,
  options?: { debug: boolean; autoConnect: boolean }
) {
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    user: null,
    rooms: [],
    messages: [],
    typingUsers: {},
    error: null,
    eventHistory: [],
    currentRoomId: null,
    connectionStatus: 'disconnected',
    lastDisconnectReason: null,
  });

  const socket = useMemo(() => {
    if (!socketInstance || socketInstance.getUrl() !== url || socketInstance.getUserId() !== id) {
      socketInstance = new ChatFrontendClient({
        url,
        id,
        debug: options?.debug || false,
        autoConnect: options?.autoConnect || false,
        apiKey: apiKey || process.env?.NEXT_PUBLIC_SPARKSTRAND_CHAT_API_KEY || process.env?.REACT_APP_STARKSTRAND_CHAT_API_KEY || process.env?.VITE_SPARKSTRAND_CHAT_API_KEY
      });
    }
    return socketInstance;
  }, [url, id]);

  useEffect(() => {
    if (!id) return;

    const initializeSocket = async () => {
      try {
        setState((prev) => ({ ...prev, connectionStatus: 'connecting' }));
        await socket.login(id);
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: {
            message: error.message || 'Authentication failed',
            success: false,
            statusCode: 401,
          },
          connectionStatus: 'disconnected',
        }));
        return;
      }
    };

    initializeSocket();

    const handleConnect = () => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        connectionStatus: 'connected',
        error: null,
      }));
    };

    const handleDisconnect = (reason: string) => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        connectionStatus: 'disconnected',
        lastDisconnectReason: reason,
        error: {
          message: `Disconnected: ${reason}`,
          success: false,
          statusCode: 503,
        },
      }));
    };

    const handleReconnectAttempt = (attempt: number) => {
      console.log(`Reconnection attempt ${attempt}`);
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        connectionStatus: 'reconnecting',
      }));
    };

    const handleReconnect = (attempt: number) => {
      console.log(`Reconnected after ${attempt} attempts`);
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        connectionStatus: 'connected',
        error: null,
      }));
    };

    const handleReconnectError = (error: any) => {
      console.log(`Reconnection error: ${error.message}`);
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        connectionStatus: 'disconnected',
        error: {
          message: `Reconnection failed: ${error.message}`,
          success: false,
          statusCode: 503,
        },
      }));
    };

    const handleReconnectFailed = () => {
      console.log('Failed to reconnect after all attempts');
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        connectionStatus: 'disconnected',
        error: {
          message: 'Failed to reconnect after multiple attempts',
          success: false,
          statusCode: 503,
        },
      }));
    };

    const handleAuthenticated = (data: AuthenticatedData) => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        user: data.user,
        rooms: data.guestRoomData,
      }));
    };

    const handleAuthError = (error: ErrorData) => {
      setState((prev) => ({ ...prev, error }));
    };

    const handleGuestRooms = (data: { data: IRoom[] }) => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        rooms: data.data,
      }));
    };

    const handleRoomSwitched = (data: any) => {
      const roomId = typeof data === 'object' ? data.roomId : data;
      if (roomId) {
        setState((prev) => ({
          ...prev,
          isConnected: socket.isConnected(),
          currentRoomId: roomId,
          user: prev.user ? { ...prev.user, currentRoomId: roomId } : null,
        }));
      }
    };

    const handleRoomJoined = ({ roomId, room }: { roomId: string; room: IRoom }) => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        rooms: [...prev.rooms.filter((r) => r.id !== room.id), room],
        user: prev.user ? { ...prev.user, currentRoomId: roomId } : null,
        currentRoomId: roomId,
      }));
    };

    const handleRoomLeft = ({ roomId }: { roomId: string }) => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        rooms: prev.rooms.filter((r) => r.id !== roomId),
        user: prev.user ? { ...prev.user, currentRoomId: null } : null,
        currentRoomId: null,
      }));
    };

    const handleRoomCreated = ({ room }: { room: IRoom }) => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        rooms: [...prev.rooms, room],
      }));
    };

    const handleNewMessage = ({ data }: { data: IMessage }) => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        messages: [...prev.messages, data],
      }));
    };

    const handleMessageRead = ({ messageId }: { messageId: string }) => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        messages: prev.messages.map((m) =>
          m.id === messageId ? { ...m, read: true } : m
        ),
      }));
    };

    const handleUserStatusChanged = (data: any) => {
      const userId = data.userId;
      const status = data.status;
      if (userId && status && userId === state.user?.id) {
        console.log(`Updating status for current user ${userId} to ${status}`);
        setState((prev) => ({
          ...prev,
          isConnected: socket.isConnected(),
          user: prev.user ? { ...prev.user, status } : null,
        }));
      }
    };

    const handleUserOnline = (data: any) => {
      const userId = data.userId;
      const status = data.status;
      if (userId && status && userId === state.user?.id) {
        console.log(`Updating online status for current user ${userId} to ${status}`);
        setState((prev) => ({
          ...prev,
          isConnected: socket.isConnected(),
          user: prev.user ? { ...prev.user, status } : null,
        }));
      }
    };

    const handleUserTyping = ({
      username,
      roomId,
    }: {
      _userId: string;
      username: string;
      roomId: string;
    }) => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        typingUsers: {
          ...prev.typingUsers,
          [roomId]: [...(prev.typingUsers[roomId] || []).filter((u) => u !== username), username],
        },
      }));
    };

    const handleUserStoppedTyping = ({
      username,
      roomId,
    }: {
      _userId: string;
      username: string;
      roomId: string;
    }) => {
      setState((prev) => ({
        ...prev,
        isConnected: socket.isConnected(),
        typingUsers: {
          ...prev.typingUsers,
          [roomId]: (prev.typingUsers[roomId] || []).filter((u) => u !== username),
        },
      }));
    };

    const handleError = (error: ErrorData) => {
      setState((prev) => ({ ...prev, error }));
    };

    socket.on(SocketEvent.CONNECT, handleConnect);
    socket.on(SocketEvent.DISCONNECT, handleDisconnect);
    socket.on(SocketEvent.RECONNECT_ATTEMPT, handleReconnectAttempt);
    socket.on(SocketEvent.RECONNECT, handleReconnect);
    socket.on(SocketEvent.RECONNECT_ERROR, handleReconnectError);
    socket.on(SocketEvent.RECONNECT_FAILED, handleReconnectFailed);
    socket.on(SocketEvent.AUTHENTICATED, handleAuthenticated);
    socket.on(SocketEvent.AUTH_ERROR, handleAuthError);
    socket.on(SocketEvent.LIST_OF_GUEST_ROOMS, handleGuestRooms);
    socket.on(SocketEvent.ROOM_SWITCHED, handleRoomSwitched);
    socket.on(SocketEvent.ROOM_JOINED, handleRoomJoined);
    socket.on(SocketEvent.ROOM_LEFT, handleRoomLeft);
    socket.on(SocketEvent.ROOM_CREATED, handleRoomCreated);
    socket.on(SocketEvent.NEW_MESSAGE, handleNewMessage);
    socket.on(SocketEvent.MESSAGE_READ, handleMessageRead);
    socket.on(SocketEvent.USER_STATUS_CHANGED, handleUserStatusChanged);
    socket.on(SocketEvent.USER_ONLINE, handleUserOnline);
    socket.on(SocketEvent.USER_TYPING, handleUserTyping);
    socket.on(SocketEvent.USER_STOPPED_TYPING, handleUserStoppedTyping);
    socket.on(SocketEvent.ERROR, handleError);

    const updateEventHistory = () => {
      setState((prev) => ({
        ...prev,
        eventHistory: socket.getEventHistory(),
      }));
    };
    socket.on('eventHistory', updateEventHistory);

    return () => {
      socket.off(SocketEvent.CONNECT);
      socket.off(SocketEvent.DISCONNECT);
      socket.off(SocketEvent.RECONNECT_ATTEMPT);
      socket.off(SocketEvent.RECONNECT);
      socket.off(SocketEvent.RECONNECT_ERROR);
      socket.off(SocketEvent.RECONNECT_FAILED);
      socket.off(SocketEvent.AUTHENTICATED);
      socket.off(SocketEvent.AUTH_ERROR);
      socket.off(SocketEvent.LIST_OF_GUEST_ROOMS);
      socket.off(SocketEvent.ROOM_SWITCHED);
      socket.off(SocketEvent.ROOM_JOINED);
      socket.off(SocketEvent.ROOM_LEFT);
      socket.off(SocketEvent.ROOM_CREATED);
      socket.off(SocketEvent.NEW_MESSAGE);
      socket.off(SocketEvent.MESSAGE_READ);
      socket.off(SocketEvent.USER_STATUS_CHANGED);
      socket.off(SocketEvent.USER_ONLINE);
      socket.off(SocketEvent.USER_TYPING);
      socket.off(SocketEvent.USER_STOPPED_TYPING);
      socket.off(SocketEvent.ERROR);
      socket.off('eventHistory');
      socket.disconnect();
      socketInstance = null;
    };
  }, [socket, id, options?.debug, options?.autoConnect]);

  return { socket, state };
}