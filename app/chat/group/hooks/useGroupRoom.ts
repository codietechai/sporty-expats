import { useCallback, useEffect, useRef, useState } from "react";
import { SocketEvent, RoomType, RoomSubType } from "@sparkstrand/chat-api-client/v2/types";
import type { ChatRoom } from "@sparkstrand/chat-api-client/v2/types";
import { useChatClient } from "../../core/chatProvider";
import { isEventPast, isEventUpcoming, type EventRoomMetadata } from "../eventMetadata";

const PAGE_SIZE = 10;

export function sortByActivity(rooms: ChatRoom[]): ChatRoom[] {
    return [...rooms].sort((a, b) => {
        const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
        const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
        return bT - aT;
    });
}

export function useGroupRooms() {
    const { client, connectionState, user: currentUser } = useChatClient();
    const [allRooms, setAllRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const fetchingRef = useRef(false);

    const fetchRooms = useCallback(async () => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setIsLoading(true);
        setError(null);
        try {
            // Fetch all rooms in one go with a high limit so client-side
            // past/upcoming filtering works correctly across all rooms.
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
            setError(err.message ?? "Failed to load rooms");
        } finally {
            setIsLoading(false);
            fetchingRef.current = false;
        }
    }, [client, currentUser?.userId]);

    // Show loading while connecting so the UI doesn't flash empty state
    const isConnecting = connectionState === "connecting" || connectionState === "disconnected";

    useEffect(() => {
        if (connectionState === "connected") fetchRooms();
    }, [fetchRooms, connectionState]);

    useEffect(() => {
        const onNewMessage = (msg: any) => {
            if (!msg?.roomId) return;
            setAllRooms(prev => sortByActivity(prev.map(r =>
                r.roomId === msg.roomId ? { ...r, lastMessageAt: msg.createdAt, lastMessageId: msg.id } : r
            )));
        };
        const onRoomAdded = () => fetchRooms();
        client.on(SocketEvent.MESSAGE_NEW, onNewMessage);
        client.on(SocketEvent.ROOM_ADDED, onRoomAdded);
        return () => {
            client.off(SocketEvent.MESSAGE_NEW, onNewMessage);
            client.off(SocketEvent.ROOM_ADDED, onRoomAdded);
        };
    }, [client, fetchRooms]);

    const pastRooms = allRooms.filter(r => isEventPast((r.metadata ?? {}) as EventRoomMetadata));
    const upcomingRooms = allRooms.filter(r => isEventUpcoming((r.metadata ?? {}) as EventRoomMetadata));

    return {
        pastRooms,
        upcomingRooms,
        isLoading: isLoading || isConnecting,
        error,
        page,
        pastTotalPages: Math.max(1, Math.ceil(pastRooms.length / PAGE_SIZE)),
        upcomingTotalPages: Math.max(1, Math.ceil(upcomingRooms.length / PAGE_SIZE)),
        setPage,
        refetch: fetchRooms,
    };
}
