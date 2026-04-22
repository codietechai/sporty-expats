import { useCallback, useEffect, useRef, useState } from "react";
import { SocketEvent } from "@sparkstrand/chat-api-client/v2/types";
import type { AnyMessage, ChatRoom, ChatRoomMember, ICreateMessage } from "@sparkstrand/chat-api-client/v2/types";
import type { Room } from "@sparkstrand/chat-api-client/v2/frontend";
import { useChatClient } from "./chatProvider";

function isTopLevel(msg: AnyMessage) { return !msg.replyToId; }
function isReply(msg: AnyMessage) { return !!msg.replyToId; }

export function useRoom(roomId: string) {
    const { client, connectionState } = useChatClient();
    const roomRef = useRef<Room | null>(null);

    const [messages, setMessages] = useState<AnyMessage[]>([]);
    const [threadMessages, setThreadMessages] = useState<AnyMessage[]>([]);
    const [members, setMembers] = useState<ChatRoomMember[]>([]);
    const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const isLoadingMoreRef = useRef(false);
    const isOldMessageFinishRef = useRef(false);

    useEffect(() => {
        if (connectionState !== "connected" || !roomId) return;

        const room = client.room(roomId);
        roomRef.current = room;
        setIsLoading(true);
        setError(null);

        const onMessageNew = (msg: AnyMessage) => {
            const setter = isReply(msg) ? setThreadMessages : setMessages;
            setter(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };

        const onMessageUpdated = (msg: AnyMessage) => {
            const setter = isReply(msg) ? setThreadMessages : setMessages;
            setter(prev => {
                let idx = prev.findIndex(m => m.id === msg.id);
                if (idx === -1 && "tempId" in msg && msg.tempId) {
                    idx = prev.findIndex(m => m.id === msg.tempId || ("tempId" in m && m.tempId === msg.tempId));
                }
                if (idx === -1) return prev;
                const next = [...prev];
                next[idx] = msg;
                return next;
            });
        };

        const onMessageDeleted = (msg: AnyMessage) => {
            setMessages(prev => prev.filter(m => m.id !== msg.id));
            setThreadMessages(prev => prev.filter(m => m.id !== msg.id));
        };

        const onThreadNew = (msg: AnyMessage) => {
            setThreadMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                if ("tempId" in msg && msg.tempId) {
                    const optimisticIdx = prev.findIndex(m => m.id === msg.tempId || ("tempId" in m && m.tempId === msg.tempId));
                    if (optimisticIdx !== -1) {
                        const next = [...prev];
                        next[optimisticIdx] = msg;
                        return next;
                    }
                }
                return [...prev, msg];
            });
        };

        const onReactionNew = (reaction: any) => {
            const state = room.getState();
            if (!state?.messages) return;
            const updated = state.messages.find(m => m.id === reaction.messageId);
            if (!updated) return;
            const setter = isReply(updated) ? setThreadMessages : setMessages;
            setter(prev => {
                const idx = prev.findIndex(m => m.id === reaction.messageId);
                if (idx === -1) return prev;
                const next = [...prev];
                next[idx] = { ...next[idx], reactions: updated.reactions };
                return next;
            });
        };

        const onReactionDeleted = (reaction: any) => {
            const state = room.getState();
            if (!state?.messages) return;
            const updated = state.messages.find(m => m.id === reaction.messageId);
            if (!updated) return;
            const setter = isReply(updated) ? setThreadMessages : setMessages;
            setter(prev => {
                const idx = prev.findIndex(m => m.id === reaction.messageId);
                if (idx === -1) return prev;
                const next = [...prev];
                next[idx] = { ...next[idx], reactions: updated.reactions };
                return next;
            });
        };

        const onStateSynced = (state: ChatRoom) => {
            const all = state.messages ?? [];
            setMessages(all.filter(isTopLevel));
            setThreadMessages(all.filter(isReply));
            setMembers([...(state.members ?? [])]);
        };

        const onTypingStart = ({ userId }: { userId: string }) => {
            if (userId === client.user?.userId) return;
            setTypingUserIds(prev => prev.includes(userId) ? prev : [...prev, userId]);
            const t = typingTimers.current.get(userId);
            if (t) clearTimeout(t);
            typingTimers.current.set(userId, setTimeout(() => {
                setTypingUserIds(prev => prev.filter(id => id !== userId));
                typingTimers.current.delete(userId);
            }, 10_000));
        };

        const onTypingStop = ({ userId }: { userId: string }) => {
            setTypingUserIds(prev => prev.filter(id => id !== userId));
            const t = typingTimers.current.get(userId);
            if (t) { clearTimeout(t); typingTimers.current.delete(userId); }
        };

        room.on(SocketEvent.MESSAGE_NEW, onMessageNew);
        room.on(SocketEvent.MESSAGE_UPDATED, onMessageUpdated);
        room.on(SocketEvent.MESSAGE_DELETED, onMessageDeleted);
        room.on(SocketEvent.THREAD_NEW, onThreadNew);
        room.on(SocketEvent.MESSAGE_REACTION_NEW, onReactionNew);
        room.on(SocketEvent.MESSAGE_REACTION_DELETED, onReactionDeleted);
        room.on(SocketEvent.STATE_SYNCED, onStateSynced);
        room.on(SocketEvent.TYPING_START, onTypingStart);
        room.on(SocketEvent.TYPING_STOP, onTypingStop);

        room.watch()
            .then(state => {
                const all = state.messages ?? [];
                setMessages(all.filter(isTopLevel));
                setThreadMessages(all.filter(isReply));
                setMembers([...(state.members ?? [])]);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setIsLoading(false);
            });

        return () => {
            room.off(SocketEvent.MESSAGE_NEW, onMessageNew);
            room.off(SocketEvent.MESSAGE_UPDATED, onMessageUpdated);
            room.off(SocketEvent.MESSAGE_DELETED, onMessageDeleted);
            room.off(SocketEvent.THREAD_NEW, onThreadNew);
            room.off(SocketEvent.MESSAGE_REACTION_NEW, onReactionNew);
            room.off(SocketEvent.MESSAGE_REACTION_DELETED, onReactionDeleted);
            room.off(SocketEvent.STATE_SYNCED, onStateSynced);
            room.off(SocketEvent.TYPING_START, onTypingStart);
            room.off(SocketEvent.TYPING_STOP, onTypingStop);
            room.stopWatch().catch(() => { });
            typingTimers.current.forEach(clearTimeout);
            typingTimers.current.clear();
            setTypingUserIds([]);
            isOldMessageFinishRef.current = false;
            isLoadingMoreRef.current = false;
        };
    }, [connectionState, roomId, client]);

    const sendMessage = useCallback(async (data: Omit<ICreateMessage, "roomId">) => {
        if (!roomRef.current) return;
        const tempId = `temp-${Date.now()}`;
        await roomRef.current.sendMessage({ ...data, roomId, tempId });
    }, [roomId]);

    const sendReaction = useCallback(async (messageId: string, emoji: string) => {
        await roomRef.current?.sendReaction(messageId, emoji);
    }, []);

    const deleteReaction = useCallback(async (messageId: string, emoji: string) => {
        await roomRef.current?.deleteReaction({ messageId, emoji, roomId });
    }, [roomId]);

    const deleteMessage = useCallback(async (messageId: string) => {
        await roomRef.current?.deleteMessage(messageId);
    }, []);

    const updateMessage = useCallback(async (messageId: string, content: string) => {
        await roomRef.current?.updateMessage({ messageId, content, roomId });
    }, [roomId]);

    const loadMoreMessages = useCallback(async () => {
        if (!roomRef.current || isLoadingMoreRef.current || isOldMessageFinishRef.current) return;
        const oldest = messages[0];
        if (!oldest || oldest.id.includes("temp-")) return;
        isLoadingMoreRef.current = true;
        try {
            const older = await roomRef.current.queryMessages({ limit: 30, id_lt: oldest.id });
            if (older.length === 0) { isOldMessageFinishRef.current = true; }
        } finally {
            isLoadingMoreRef.current = false;
        }
    }, [messages]);

    const markRead = useCallback(async () => {
        await roomRef.current?.markRead();
    }, []);

    const sendTypingStart = useCallback(() => {
        roomRef.current?.sendEvent(SocketEvent.TYPING_START);
    }, []);

    const sendTypingStop = useCallback(() => {
        roomRef.current?.sendEvent(SocketEvent.TYPING_STOP);
    }, []);

    return {
        room: roomRef.current,
        messages,
        threadMessages,
        members,
        isLoading,
        error,
        typingUserIds,
        sendMessage,
        sendReaction,
        deleteReaction,
        deleteMessage,
        updateMessage,
        loadMoreMessages,
        markRead,
        sendTypingStart,
        sendTypingStop,
    };
}
