import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { ChatAvatar, AvatarStack } from "./ChatAvatar";
import { ThreadPanel } from "./ThreadPanel";
import { useRoom } from "@/app/chat/core/useRoom";
import { normalizeMediaUrl } from "@/helpers/normalizeMediaUrl";
import { useChatClient } from "@/app/chat/core/chatProvider";
import type { ChatRoom, AnyMessage, ChatRoomMember, ChatAttachment } from "@sparkstrand/chat-api-client/v2/types";
import type { EventRoomMetadata } from "@/app/chat/group/eventMetadata";
import { formatEventDate, isEventPast } from "@/app/chat/group/eventMetadata";

interface Props {
    room: ChatRoom;
    currentUserId: string;
    currentUserImage?: string | null;
    onClose: () => void;
}

export function GroupRoomView({ room, currentUserId, currentUserImage, onClose }: Props) {
    const meta = room.metadata as EventRoomMetadata | undefined;
    const rawCoverUrl = meta?.coverImage?.fileUrl ?? (room as any).image ?? "";
    const coverImage = rawCoverUrl ? normalizeMediaUrl(rawCoverUrl) : "";
    const { uploadFiles } = useChatClient();

    const {
        messages,
        threadMessages,
        members,
        typingUserIds,
        isLoading,
        error,
        sendMessage,
        updateMessage,
        deleteMessage,
        sendReaction,
        deleteReaction,
        markRead,
        loadMoreMessages,
        sendTypingStart,
        sendTypingStop,
    } = useRoom(room.roomId);

    useEffect(() => {
        if (!isLoading && messages.length > 0) markRead();
    }, [isLoading]);

    const [replyTo, setReplyTo] = useState<AnyMessage | null>(null);
    const [editingMsg, setEditingMsg] = useState<AnyMessage | null>(null);
    const [showMembers, setShowMembers] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [activeThread, setActiveThread] = useState<AnyMessage | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const memberMap = useMemo(() => {
        const m: Record<string, ChatRoomMember> = {};
        for (const mem of members) m[mem.userId] = mem;
        // Enrich current user's entry with their image if the server didn't return it
        if (currentUserId && m[currentUserId] && !m[currentUserId].image && currentUserImage) {
            m[currentUserId] = { ...m[currentUserId], image: currentUserImage };
        }
        return m;
    }, [members, currentUserId, currentUserImage]);

    const replyCountMap = useMemo(() => {
        const c: Record<string, number> = {};
        for (const msg of threadMessages) {
            if (msg.replyToId) c[msg.replyToId] = (c[msg.replyToId] ?? 0) + 1;
        }
        return c;
    }, [threadMessages]);

    const handleSend = useCallback(
        (content: string, attachments?: ChatAttachment[], replyToId?: string | null) => {
            if (editingMsg) {
                updateMessage(editingMsg.id, content);
                setEditingMsg(null);
            } else {
                sendMessage({ content: content || undefined, attachments, replyToId: replyToId ?? null });
                setReplyTo(null);
            }
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        },
        [editingMsg, updateMessage, sendMessage]
    );

    const shouldShowHeader = (index: number, data: AnyMessage[]): boolean => {
        if (index === 0) return true;
        if (data[index].userId !== data[index - 1].userId) return true;
        return (
            new Date(data[index].createdAt).getTime() -
            new Date(data[index - 1].createdAt).getTime() >
            5 * 60 * 1000
        );
    };

    const typingLabel = useMemo(() => {
        if (typingUserIds.length === 0) return "";
        const names = typingUserIds.map(
            (id) => memberMap[id]?.displayName ?? memberMap[id]?.name ?? "Someone"
        );
        if (names.length === 1) return `${names[0]} is typing…`;
        return `${names[0]} and ${names.length - 1} other${names.length > 2 ? "s" : ""} are typing…`;
    }, [typingUserIds, memberMap]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    {meta?.category && <Text style={styles.headerCategory}>{meta.category}</Text>}
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {meta?.title ?? room.roomId}
                    </Text>
                    {meta?.startDate && (
                        <Text style={styles.headerDate}>{formatEventDate(meta.startDate)}</Text>
                    )}
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => setShowMembers((p) => !p)}
                        style={styles.headerBtn}
                    >
                        {members.length > 0 ? (
                            <AvatarStack users={members} max={2} size={20} total={members.length} />
                        ) : (
                            <Ionicons name="people-outline" size={16} color="#9CA3AF" />
                        )}
                        <Text style={styles.memberCountText}>{members.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setShowInfo((p) => !p)}
                        style={[styles.headerBtn, showInfo && styles.headerBtnActive]}
                    >
                        <Ionicons name="information-circle-outline" size={20} color={showInfo ? "#4ade80" : "#9CA3AF"} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* {coverImage && (
                <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
            )} */}

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4ade80" />
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : messages.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyEmoji}>💬</Text>
                    <Text style={styles.emptyText}>No messages yet. Be the first!</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageList}
                    onEndReached={loadMoreMessages}
                    onEndReachedThreshold={0.2}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    renderItem={({ item, index }) => (
                        <MessageBubble
                            message={item}
                            sender={memberMap[item.userId]}
                            currentUserId={currentUserId}
                            isOwn={item.userId === currentUserId}
                            showHeader={shouldShowHeader(index, messages)}
                            replyCount={replyCountMap[item.id] ?? 0}
                            isThreadOpen={activeThread?.id === item.id}
                            onReact={sendReaction}
                            onDeleteReaction={deleteReaction}
                            onReply={(msg) => { setReplyTo(msg); setEditingMsg(null); }}
                            onEdit={(msg) => { setEditingMsg(msg); setReplyTo(null); }}
                            onDelete={deleteMessage}
                            onOpenThread={(msg) => { setActiveThread(msg); }} />
                    )}
                    ListFooterComponent={
                        typingLabel ? (
                            <View style={styles.typingRow}>
                                <View style={styles.typingDots}>
                                    {[0, 1, 2].map((i) => (
                                        <View key={i} style={styles.typingDot} />
                                    ))}
                                </View>
                                <Text style={styles.typingText}>{typingLabel}</Text>
                            </View>
                        ) : null
                    }
                />
            )}

            <MessageInput
                onSend={handleSend}
                onTypingStart={sendTypingStart}
                onTypingStop={sendTypingStop}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                editingContent={editingMsg?.content ?? null}
                onCancelEdit={() => setEditingMsg(null)}
                disabled={isLoading || !!error}
                placeholder={editingMsg ? "Edit message…" : `Message ${meta?.title ?? ""}…`}
                uploadFiles={uploadFiles}
            />

            {showMembers && (
                <View style={styles.sidePanel}>
                    <View style={styles.sidePanelHeader}>
                        <Text style={styles.sidePanelTitle}>Attendees ({members.length})</Text>
                        <TouchableOpacity onPress={() => setShowMembers(false)}>
                            <Ionicons name="close" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={members}
                        keyExtractor={(m) => m.userId}
                        renderItem={({ item }) => (
                            <View style={styles.memberItem}>
                                <ChatAvatar
                                    userId={item.userId}
                                    displayName={item.displayName}
                                    name={item.name}
                                    email={item.email}
                                    image={item.image ?? null}
                                    size={36}
                                />
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>
                                        {item.displayName ?? item.name ?? item.userId}
                                    </Text>
                                    <Text style={styles.memberRole}>{item.roomRole ?? "member"}</Text>
                                </View>
                            </View>
                        )}
                    />
                </View>
            )}

            {showInfo && meta && (
                <View style={styles.sidePanel}>
                    <View style={styles.sidePanelHeader}>
                        <Text style={styles.sidePanelTitle}>Event Info</Text>
                        <TouchableOpacity onPress={() => setShowInfo(false)}>
                            <Ionicons name="close" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.infoContent}>
                        {coverImage && (
                            <Image source={{ uri: coverImage }} style={styles.infoImage} resizeMode="cover" />
                        )}
                        <Text style={styles.infoTitle}>{meta.title}</Text>
                        {meta.category && <Text style={styles.infoCategory}>{meta.category}</Text>}
                        {meta.description && <Text style={styles.infoDesc}>{meta.description}</Text>}
                        {meta.startDate && <InfoRow label="Start" value={formatEventDate(meta.startDate)} />}
                        {meta.endDate && <InfoRow label="End" value={formatEventDate(meta.endDate)} />}
                        {meta.location?.name && <InfoRow label="Location" value={meta.location.name} />}
                        {meta.isPaidEvent && meta.ticketPrice != null && (
                            <InfoRow label="Ticket" value={`€${meta.ticketPrice}`} />
                        )}
                        {meta.availableTickets != null && (
                            <InfoRow label="Available" value={`${meta.availableTickets} tickets`} />
                        )}
                    </View>
                </View>
            )}

            {activeThread && (
                <ThreadPanel
                    parentMessage={activeThread}
                    threadMessages={threadMessages}
                    members={members}
                    currentUserId={currentUserId}
                    onSendReply={(content, attachments) => sendMessage({ content: content || undefined, attachments, replyToId: activeThread.id })}
                    onTypingStart={sendTypingStart}
                    onTypingStop={sendTypingStop}
                    onClose={() => setActiveThread(null)}
                    onReact={sendReaction}
                    onDeleteReaction={deleteReaction}
                    onEdit={(msg) => { setEditingMsg(msg); setActiveThread(null); }}
                    onDelete={deleteMessage}
                    uploadFiles={uploadFiles}
                />
            )}
        </View>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={infoStyles.row}>
            <Text style={infoStyles.label}>{label}</Text>
            <Text style={infoStyles.value}>{value}</Text>
        </View>
    );
}

const infoStyles = StyleSheet.create({
    row: { flexDirection: "row", gap: 8, marginBottom: 8 },
    label: { fontSize: 11, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", width: 70 },
    value: { fontSize: 12, color: "#D1D5DB", flex: 1 },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0f0f0f" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#1e1e1e",
        backgroundColor: "#111",
        gap: 8,
    },
    backBtn: { padding: 4 },
    headerInfo: { flex: 1 },
    headerCategory: { fontSize: 10, fontWeight: "700", color: "#4ade80", textTransform: "uppercase", letterSpacing: 1 },
    headerTitle: { fontSize: 15, fontWeight: "700", color: "#fff", textTransform: "uppercase" },
    headerDate: { fontSize: 10, color: "#6B7280", marginTop: 1 },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
    headerBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: "#1a1a1a",
        borderWidth: 1,
        borderColor: "#2a2a2a",
    },
    headerBtnActive: { borderColor: "rgba(74,222,128,0.4)", backgroundColor: "#1e2e1e" },
    memberCountText: { fontSize: 12, color: "#D1D5DB", fontWeight: "600" },
    coverImage: { width: "100%", height: 100 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    errorText: { fontSize: 14, color: "#EF4444" },
    emptyEmoji: { fontSize: 36 },
    emptyText: { fontSize: 14, color: "#6B7280" },
    messageList: { paddingVertical: 8 },
    typingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
    typingDots: { flexDirection: "row", gap: 3 },
    typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ade80" },
    typingText: { fontSize: 12, color: "#6B7280" },
    sidePanel: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: "85%",
        backgroundColor: "#111",
        borderLeftWidth: 1,
        borderLeftColor: "#1e1e1e",
        zIndex: 20,
    },
    sidePanelHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#1e1e1e",
    },
    sidePanelTitle: { fontSize: 13, fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    memberItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 13, fontWeight: "600", color: "#E5E7EB" },
    memberRole: { fontSize: 11, color: "#6B7280", textTransform: "capitalize" },
    infoContent: { padding: 16 },
    infoImage: { width: "100%", height: 160, borderRadius: 12, marginBottom: 12 },
    infoTitle: { fontSize: 16, fontWeight: "700", color: "#fff", textTransform: "uppercase", marginBottom: 4 },
    infoCategory: { fontSize: 11, color: "#4ade80", fontWeight: "600", marginBottom: 8 },
    infoDesc: { fontSize: 12, color: "#9CA3AF", lineHeight: 18, marginBottom: 12 },
});
