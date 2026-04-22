import { useCallback, useEffect, useRef, useState } from "react";
import { useChatSocket } from "./useChatSocket";
import { queryMessages, type ChatMessage, type ChatRoomMember } from "@/client/endpoints/chat/chatApiClient";

function isReply(msg: ChatMessage) { return !!msg.replyToId; }
function isTopLevel(msg: ChatMessage) { return !msg.replyToId; }

function sortByTime(msgs: ChatMessage[]) {
    return [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function useRoom(roomId: string, token: string | null, currentUserId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);
    const [members, setMembers] = useState<ChatRoomMember[]>([]);
    const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isLoadingMoreRef = useRef(false);
    const isOldMessageFinishRef = useRef(false);
    const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const watchedRef = useRef(false);

    const { connectionState, socketEmit, on, off } = useChatSocket(token);

    useEffect(() => {
        if (!token || !roomId || connectionState !== "connected" || watchedRef.current) return;
        watchedRef.current = true;
        setIsLoading(true);
        setError(null);
        isOldMessageFinishRef.current = false;

        socketEmit("room.watch", { roomId }, (response: any) => {
            if (!response?.success) {
                setError(response?.message ?? "Failed to join room");
                setIsLoading(false);
                watchedRef.current = false;
                return;
            }
            const state = response.data ?? {};
            const all: ChatMessage[] = state.messages ?? [];
            setMessages(sortByTime(all.filter(isTopLevel)));
            setThreadMessages(all.filter(isReply));
            setMembers(state.members ?? []);
            setIsLoading(false);
        });

        return () => {
            watchedRef.current = false;
            socketEmit("room.stop_watch", { roomId });
            typingTimers.current.forEach(clearTimeout);
            typingTimers.current.clear();
            setTypingUserIds([]);
            isOldMessageFinishRef.current = false;
            isLoadingMoreRef.current = false;
        };
    }, [token, roomId, connectionState, socketEmit]);

    useEffect(() => {
        const forRoom = (msg: any) => msg?.roomId === roomId;

        const onNew = (msg: ChatMessage) => {
            if (!forRoom(msg)) return;
            const isOwn = msg.userId === currentUserId;
            const setter = isReply(msg) ? setThreadMessages : setMessages;
            setter((prev) => {
                if (isOwn && msg.tempId) {
                    const idx = prev.findIndex((m) => m.id === msg.tempId);
                    if (idx > -1) { const next = [...prev]; next[idx] = msg; return next; }
                }
                if (prev.some((m) => m.id === msg.id)) return prev;
                return sortByTime([...prev, msg]);
            });
        };

        const onUpdated = (msg: ChatMessage) => {
            if (!forRoom(msg)) return;
            const setter = isReply(msg) ? setThreadMessages : setMessages;
            setter((prev) => {
                const idx = prev.findIndex((m) => m.id === msg.id);
                if (idx > -1) { const next = [...prev]; next[idx] = msg; return next; }
                if (msg.tempId) {
                    const tidx = prev.findIndex((m) => m.id === msg.tempId);
                    if (tidx > -1) { const next = [...prev]; next[tidx] = msg; return next; }
                }
                return prev;
            });
        };

        const onDeleted = (msg: ChatMessage) => {
            if (!forRoom(msg)) return;
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            setThreadMessages((prev) => prev.filter((m) => m.id !== msg.id));
        };

        const onThreadNew = (msg: ChatMessage) => {
            if (!forRoom(msg)) return;
            const isOwn = msg.userId === currentUserId;
            setThreadMessages((prev) => {
                if (isOwn && msg.tempId) {
                    const idx = prev.findIndex((m) => m.id === msg.tempId);
                    if (idx > -1) { const next = [...prev]; next[idx] = msg; return next; }
                }
                return prev.some((m) => m.id === msg.id) ? prev : [...prev, msg];
            });
        };

        const onReactionNew = (reaction: any) => {
            if (reaction?.roomId && reaction.roomId !== roomId) return;
            const patch = (prev: ChatMessage[]) => prev.map((m) => {
                if (m.id !== reaction.messageId) return m;
                const reactions = [...(m.reactions ?? [])];
                if (reaction.tempId) {
                    const idx = reactions.findIndex((r) => r.id === reaction.tempId);
                    if (idx > -1) { reactions[idx] = reaction; return { ...m, reactions }; }
                }
                if (!reactions.some((r) => r.id === reaction.id)) reactions.push(reaction);
                return { ...m, reactions };
            });
            setMessages(patch);
            setThreadMessages(patch);
        };

        const onReactionDeleted = (reaction: any) => {
            if (reaction?.roomId && reaction.roomId !== roomId) return;
            const patch = (prev: ChatMessage[]) => prev.map((m) => {
                if (m.id !== reaction.messageId) return m;
                return { ...m, reactions: (m.reactions ?? []).filter((r) => !(r.emoji === reaction.emoji && r.userId === reaction.userId)) };
            });
            setMessages(patch);
            setThreadMessages(patch);
        };

        const onStateSynced = (state: any) => {
            if (state?.roomId && state.roomId !== roomId) return;
            const all: ChatMessage[] = state?.messages ?? [];
            setMessages(sortByTime(all.filter(isTopLevel)));
            setThreadMessages(all.filter(isReply));
            if (state?.members) setMembers([...state.members]);
        };

        const onMessageRead = (data: any) => {
            if (data?.roomId && data.roomId !== roomId) return;
            if (data?.userId && data?.messageId) {
                setMembers((prev) => prev.map((m) => m.userId === data.userId ? { ...m, lastReadMessageId: data.messageId } : m));
            }
        };

        const onTypingStart = ({ userId, roomId: rid }: any) => {
            if (rid !== roomId || userId === currentUserId) return;
            setTypingUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
            const t = typingTimers.current.get(userId);
            if (t) clearTimeout(t);
            typingTimers.current.set(userId, setTimeout(() => {
                setTypingUserIds((prev) => prev.filter((id) => id !== userId));
                typingTimers.current.delete(userId);
            }, 10_000));
        };

        const onTypingStop = ({ userId, roomId: rid }: any) => {
            if (rid !== roomId) return;
            setTypingUserIds((prev) => prev.filter((id) => id !== userId));
            const t = typingTimers.current.get(userId);
            if (t) { clearTimeout(t); typingTimers.current.delete(userId); }
        };

        on("message.new", onNew);
        on("message.updated", onUpdated);
        on("message.deleted", onDeleted);
        on("message.new.thread", onThreadNew);
        on("message.reaction.new", onReactionNew);
        on("message.reaction.deleted", onReactionDeleted);
        on("state.synced", onStateSynced);
        on("message.read", onMessageRead);
        on("notification.unread", () => { });
        on("typing.start", onTypingStart);
        on("typing.stop", onTypingStop);

        return () => {
            off("message.new", onNew);
            off("message.updated", onUpdated);
            off("message.deleted", onDeleted);
            off("message.new.thread", onThreadNew);
            off("message.reaction.new", onReactionNew);
            off("message.reaction.deleted", onReactionDeleted);
            off("state.synced", onStateSynced);
            off("message.read", onMessageRead);
            off("notification.unread", () => { });
            off("typing.start", onTypingStart);
            off("typing.stop", onTypingStop);
        };
    }, [on, off, roomId, currentUserId]);

    const sendMessage = useCallback((content: string, replyToId?: string | null) => {
        const tempId = `temp-${Date.now()}`;
        const optimistic: ChatMessage = {
            id: tempId, tempId, roomId,
            userId: currentUserId ?? "__me__",
            content, replyToId: replyToId ?? null,
            createdAt: new Date().toISOString(),
            status: "sending",
        };
        const setter = replyToId ? setThreadMessages : setMessages;
        setter((prev) => [...prev, optimistic]);
        socketEmit("message.send", { roomId, content, replyToId: replyToId ?? null, tempId }, (res: any) => {
            if (!res?.success) {
                setter((prev) => prev.map((m) => m.id === tempId ? { ...m, status: "failed" as const } : m));
            }
        });
    }, [roomId, currentUserId, socketEmit]);

    const editMessage = useCallback((messageId: string, content: string) => {
        setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, content, editedAt: new Date().toISOString() } : m));
        socketEmit("message.update", { messageId, roomId, content });
    }, [roomId, socketEmit]);

    const deleteMessage = useCallback((messageId: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        socketEmit("message.delete", { messageId });
    }, [socketEmit]);

    const sendReaction = useCallback((messageId: string, emoji: string) => {
        socketEmit("message.reaction", { messageId, roomId, emoji, tempId: `temp-react-${Date.now()}` });
    }, [roomId, socketEmit]);

    const deleteReaction = useCallback((messageId: string, emoji: string) => {
        socketEmit("message.reaction.delete", { messageId, roomId, emoji });
    }, [roomId, socketEmit]);

    const markRead = useCallback(() => {
        socketEmit("message.mark_read", { roomId });
    }, [roomId, socketEmit]);

    const loadMoreMessages = useCallback(async () => {
        if (!token || isLoadingMoreRef.current || isOldMessageFinishRef.current) return;
        const oldest = messages[0];
        if (!oldest) return;
        isLoadingMoreRef.current = true;
        try {
            const older = await queryMessages(token, roomId, oldest.id, 30);
            if (older.length === 0) { isOldMessageFinishRef.current = true; return; }
            setMessages((prev) => sortByTime([...older.filter(isTopLevel), ...prev]));
            setThreadMessages((prev) => [...older.filter(isReply), ...prev]);
        } finally {
            isLoadingMoreRef.current = false;
        }
    }, [token, roomId, messages]);

    const sendTypingStart = useCallback(() => socketEmit("typing.start", { roomId }), [roomId, socketEmit]);
    const sendTypingStop = useCallback(() => socketEmit("typing.stop", { roomId }), [roomId, socketEmit]);

    return { messages, threadMessages, members, typingUserIds, isLoading, error, sendMessage, editMessage, deleteMessage, sendReaction, deleteReaction, markRead, loadMoreMessages, sendTypingStart, sendTypingStop };
}
