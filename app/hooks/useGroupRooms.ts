import { useCallback, useEffect, useRef, useState } from "react";
import { getChatToken } from "@/client/endpoints/chat/getChatToken";
import { queryRooms, connectUser, type ChatRoom, type EventRoomMetadata } from "@/client/endpoints/chat/chatApiClient";
import { useChatSocket } from "./useChatSocket";
import { useUserDb } from "./useUserDb";

const PAGE_SIZE = 10;

function isEventPast(meta: EventRoomMetadata): boolean {
    if (!meta?.endDate) return false;
    return new Date(meta.endDate).getTime() < Date.now();
}

function isEventUpcoming(meta: EventRoomMetadata): boolean {
    if (!meta?.endDate) return true;
    return new Date(meta.endDate).getTime() >= Date.now();
}

function sortByActivity(rooms: ChatRoom[]): ChatRoom[] {
    return [...rooms].sort((a, b) => {
        const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
        const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
        return bT - aT;
    });
}

export function useGroupRooms() {
    const { userDb } = useUserDb();
    const [token, setToken] = useState<string | null>(null);
    const [allRooms, setAllRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const fetchingRef = useRef(false);

    const { on, off } = useChatSocket(token);

    useEffect(() => {
        getChatToken().then(setToken).catch(() => setError("Failed to authenticate chat"));
    }, []);

    useEffect(() => {
        if (!token || !userDb?.id) return;
        connectUser(token, {
            userId: userDb.id,
            displayName: userDb.firstName ? `${userDb.firstName} ${userDb.lastName ?? ""}`.trim() : undefined,
            name: userDb.username ?? undefined,
            image: userDb.imageUrl ?? undefined,
            role: userDb.role === "Host" ? "moderator" : userDb.role === "Admin" ? "admin" : "user",
            banned: false, invisible: false, online: false, hideOnlineStatus: false,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }).catch(() => { });
    }, [token, userDb]);

    const fetchRooms = useCallback(async (p: number) => {
        if (!token || fetchingRef.current) return;
        fetchingRef.current = true;
        setIsLoading(true);
        setError(null);
        try {
            const result = await queryRooms(token, p, PAGE_SIZE);
            setAllRooms(sortByActivity(result.rooms ?? []));
            setTotal(result.total ?? 0);
        } catch (err: any) {
            setError(err.message ?? "Failed to load rooms");
        } finally {
            setIsLoading(false);
            fetchingRef.current = false;
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchRooms(page);
    }, [token, page, fetchRooms]);

    useEffect(() => {
        const onNewMsg = (msg: any) => {
            if (!msg?.roomId) return;
            setAllRooms((prev) => sortByActivity(prev.map((r) => r.roomId === msg.roomId ? { ...r, lastMessageAt: msg.createdAt } : r)));
        };
        const onRoomAdded = () => fetchRooms(page);
        on("message.new", onNewMsg);
        on("room.added", onRoomAdded);
        return () => { off("message.new", onNewMsg); off("room.added", onRoomAdded); };
    }, [on, off, fetchRooms, page]);

    const pastRooms = allRooms.filter((r) => isEventPast((r.metadata ?? {}) as EventRoomMetadata));
    const upcomingRooms = allRooms.filter((r) => isEventUpcoming((r.metadata ?? {}) as EventRoomMetadata));

    return { token, pastRooms, upcomingRooms, isLoading, error, total, page, totalPages: Math.ceil(total / PAGE_SIZE), setPage, refetch: () => fetchRooms(page) };
}
