/**
 * ChatContext
 *
 * Single source of truth for the chat client and group rooms.
 * Mounted once at the app root (inside UserProvider) so the socket
 * connects once and rooms are fetched once — shared across
 * GroupChatsScreen, JoinedGroups, and any future consumer.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useUser } from "@clerk/clerk-expo";
import { useAuth } from "@clerk/clerk-expo";
import { ChatUserRole, SocketEvent, RoomType, RoomSubType } from "@sparkstrand/chat-api-client/v2/types";
import type { ChatRoom, ConnectionState } from "@sparkstrand/chat-api-client/v2/types";
import { ChatClient } from "@sparkstrand/chat-api-client/v2/frontend";
import { useUserContext } from "@/contexts/UserContext";
import { getChatToken } from "@/client/endpoints/chat/getChatToken";
import { isEventPast, isEventUpcoming, type EventRoomMetadata } from "@/app/chat/group/eventMetadata";

const CHAT_API_KEY = process.env.EXPO_PUBLIC_CHAT_API_KEY ?? "";
const CHAT_SERVER_URL = process.env.EXPO_PUBLIC_CHAT_SERVER_URL ?? "";

// ─── Group rooms context ──────────────────────────────────────────────────────

interface GroupRoomsValue {
  pastRooms: ChatRoom[];
  upcomingRooms: ChatRoom[];
  allRooms: ChatRoom[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const GroupRoomsContext = createContext<GroupRoomsValue>({
  pastRooms: [],
  upcomingRooms: [],
  allRooms: [],
  isLoading: true,
  error: null,
  refetch: () => {},
});

export function useGroupRoomsContext(): GroupRoomsValue {
  return useContext(GroupRoomsContext);
}

// ─── Chat client context ──────────────────────────────────────────────────────

interface ChatClientValue {
  client: ChatClient | null;
  connectionState: ConnectionState;
  isReady: boolean; // true once connected at least once
}

const ChatClientContext = createContext<ChatClientValue>({
  client: null,
  connectionState: "disconnected",
  isReady: false,
});

export function useChatAppClient(): ChatClientValue {
  return useContext(ChatClientContext);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortByActivity(rooms: ChatRoom[]): ChatRoom[] {
  return [...rooms].sort((a, b) => {
    const aT = a.lastMessageAt
      ? new Date(a.lastMessageAt).getTime()
      : new Date(a.createdAt).getTime();
    const bT = b.lastMessageAt
      ? new Date(b.lastMessageAt).getTime()
      : new Date(b.createdAt).getTime();
    return bT - aT;
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatAppProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { userDb, loading: userDbLoading } = useUserContext();

  // Chat client
  const clientRef = useRef<ChatClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const connectedRef = useRef(false);

  // Group rooms
  const [allRooms, setAllRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  // Derive user details the same way GroupChatsScreen did
  const user = userDb?.data?.data ?? userDb?.data ?? userDb ?? {};
  const userId: string | undefined = user?.id;

  // ── Connect / disconnect when auth state or user changes ──────────────────
  useEffect(() => {
    if (!isSignedIn || userDbLoading || !userId || !CHAT_API_KEY || !CHAT_SERVER_URL) return;

    const firstName = user?.personalDetails?.firstName ?? user?.firstName;
    const lastName = user?.personalDetails?.lastName ?? user?.lastName;
    const email =
      user?.personalDetails?.email ??
      user?.email ??
      clerkUser?.primaryEmailAddress?.emailAddress;

    const chatUser = {
      userId,
      displayName: firstName ? `${firstName} ${lastName ?? ""}`.trim() : undefined,
      name: user?.username ?? undefined,
      email,
      image: user?.imageUrl ?? clerkUser?.imageUrl ?? undefined,
      role:
        user?.role === "Host"
          ? ChatUserRole.moderator
          : user?.role === "Admin"
          ? ChatUserRole.admin
          : ChatUserRole.user,
      banned: false,
      invisible: false,
      online: false,
      hideOnlineStatus: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const tokenProvider = () => getChatToken();

    const client = ChatClient.getInstance(CHAT_API_KEY, CHAT_SERVER_URL);
    clientRef.current = client;

    const handleChange = ({ status }: { status: ConnectionState }) => {
      setConnectionState(status);
    };

    client.on(SocketEvent.CONNECTION_CHANGED, handleChange);
    client.connectUser(chatUser, tokenProvider);
    connectedRef.current = true;

    return () => {
      client.off(SocketEvent.CONNECTION_CHANGED, handleChange);
      client.disconnectUser();
      connectedRef.current = false;
      clientRef.current = null;
      setConnectionState("disconnected");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, userDbLoading, userId]);

  // ── Fetch rooms once connected ─────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    const client = clientRef.current;
    if (!client || fetchingRef.current) return;
    fetchingRef.current = true;
    setRoomsLoading(true);
    setRoomsError(null);
    try {
      const result = await client.queryRooms({
        filter_conditions: {
          type: "messaging" as unknown as RoomType,
          subType: "group" as unknown as RoomSubType,
        },
        limit: 200,
        offset: 0,
        state: true,
      });
      setAllRooms(sortByActivity(result.rooms ?? []));
    } catch (err: any) {
      setRoomsError(err.message ?? "Failed to load rooms");
    } finally {
      setRoomsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (connectionState === "connected") fetchRooms();
  }, [connectionState, fetchRooms]);

  // Keep rooms up to date with real-time events
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    const onNewMessage = (msg: any) => {
      if (!msg?.roomId) return;
      setAllRooms((prev) =>
        sortByActivity(
          prev.map((r) =>
            r.roomId === msg.roomId
              ? { ...r, lastMessageAt: msg.createdAt, lastMessageId: msg.id }
              : r
          )
        )
      );
    };
    const onRoomAdded = () => fetchRooms();

    client.on(SocketEvent.MESSAGE_NEW, onNewMessage);
    client.on(SocketEvent.ROOM_ADDED, onRoomAdded);
    return () => {
      client.off(SocketEvent.MESSAGE_NEW, onNewMessage);
      client.off(SocketEvent.ROOM_ADDED, onRoomAdded);
    };
  }, [connectionState, fetchRooms]); // re-subscribe when client reconnects

  const isConnecting =
    connectionState === "connecting" || connectionState === "disconnected";

  const pastRooms = allRooms.filter((r) =>
    isEventPast((r.metadata ?? {}) as EventRoomMetadata)
  );
  const upcomingRooms = allRooms.filter((r) =>
    isEventUpcoming((r.metadata ?? {}) as EventRoomMetadata)
  );

  const clientValue: ChatClientValue = {
    client: clientRef.current,
    connectionState,
    isReady: connectionState === "connected",
  };

  const roomsValue: GroupRoomsValue = {
    pastRooms,
    upcomingRooms,
    allRooms,
    isLoading: roomsLoading || isConnecting,
    error: roomsError,
    refetch: fetchRooms,
  };

  return (
    <ChatClientContext.Provider value={clientValue}>
      <GroupRoomsContext.Provider value={roomsValue}>
        {children}
      </GroupRoomsContext.Provider>
    </ChatClientContext.Provider>
  );
}
