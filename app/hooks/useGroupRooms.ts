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

    // userDb is the axios response — unwrap to actual user object
    const user = userDb?.data?.data ?? userDb?.data ?? null;
    const userId = user?.id;
    const userInfo = user ? {
        userId: user.id,
        displayName: user.personalDetails?.firstName
            ? `${user.personalDetails.firstName} ${user.personalDetails.lastName ?? ""}`.trim()
            : user.firstName
                ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                : undefined,
        name: user.username ?? undefined,
        image: user.imageUrl ?? undefined,
        role: user.role === "Host" ? "moderator" : user.role === "Admin" ? "admin" : "user",
        banned: false, invisible: false, online: false, hideOnlineStatus: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    } : null;
    const [token, setToken] = useState<string | null>(null);
    const [allRooms, setAllRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const fetchingRef = useRef(false);

    const { on, off } = useChatSocket(token);

    useEffect(() => {
        getChatToken().then(setToken).catch(() => setError("Failed to authenticate chat"));
    }, []);

    useEffect(() => {
        if (!token || !userId || !userInfo) return;
        connectUser(token, userInfo).catch(() => { });
    }, [token, userId]); // userInfo object is rebuilt each render, only key on token+userId

    const fetchRooms = useCallback(async (p: number) => {
        if (!token || !userId || fetchingRef.current) return;
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
    }, [token, userId]);

    useEffect(() => {
        if (token && userId) fetchRooms(page);
    }, [token, userId, page, fetchRooms]);

    useEffect(() => {
        const onNewMsg = (msg: any) => {
            if (!msg?.roomId) return;
            setAllRooms((prev) => sortByActivity(prev.map((r) => r.roomId === msg.roomId ? { ...r, lastMessageAt: msg.createdAt } : r)));
        };
        // Use ref for page so this listener doesn't get re-registered on every page change
        const onRoomAdded = () => fetchRooms(1);
        on("message.new", onNewMsg);
        on("room.added", onRoomAdded);
        return () => { off("message.new", onNewMsg); off("room.added", onRoomAdded); };
    }, [on, off, fetchRooms]);

    const pastRooms = allRooms.filter((r) => isEventPast((r.metadata ?? {}) as EventRoomMetadata));
    const upcomingRooms = allRooms.filter((r) => isEventUpcoming((r.metadata ?? {}) as EventRoomMetadata));

    return { token, pastRooms, upcomingRooms, isLoading, error, total, page, totalPages: Math.ceil(total / PAGE_SIZE), setPage, refetch: () => fetchRooms(page) };
}
