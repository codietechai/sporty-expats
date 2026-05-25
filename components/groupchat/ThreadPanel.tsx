import React, { useEffect, useRef } from "react";
import {
    Animated, Dimensions, FlatList, Pressable,
    StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChatAvatar } from "./ChatAvatar";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import type { AnyMessage, ChatRoomMember, ChatAttachment } from "@sparkstrand/chat-api-client/v2/types";
import type { MobileFile } from "@/app/chat/core/chatProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PANEL_WIDTH = Math.min(SCREEN_WIDTH, 360);

function formatTime(date: string | Date) {
    return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
    parentMessage: AnyMessage;
    threadMessages: AnyMessage[];
    members: ChatRoomMember[];
    currentUserId: string;
    onSendReply: (content: string, attachments?: ChatAttachment[], replyToId?: string | null) => void;
    onTypingStart: () => void;
    onTypingStop: () => void;
    onClose: () => void;
    onReact: (messageId: string, emoji: string) => void;
    onDeleteReaction: (messageId: string, emoji: string) => void;
    onEdit: (message: AnyMessage) => void;
    onDelete: (messageId: string) => void;
    uploadFiles?: (files: MobileFile[], type?: string) => Promise<ChatAttachment[]>;
}

export function ThreadPanel({
    parentMessage,
    threadMessages,
    members,
    currentUserId,
    onSendReply,
    onTypingStart,
    onTypingStop,
    onClose,
    onReact,
    onDeleteReaction,
    onEdit,
    onDelete,
    uploadFiles,
}: Props) {
    const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;

    useEffect(() => {
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
    }, []);

    const handleClose = () => {
        Animated.timing(slideAnim, { toValue: PANEL_WIDTH, duration: 220, useNativeDriver: true }).start(onClose);
    };

    const replies = threadMessages.filter((m) => m.replyToId === parentMessage.id);

    const memberMap = members.reduce<Record<string, ChatRoomMember>>((acc, m) => {
        acc[m.userId] = m;
        return acc;
    }, {});

    const parentSender = memberMap[parentMessage.userId];

    return (
        <>
            <Pressable style={styles.overlay} onPress={handleClose} />
            <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Thread</Text>
                    <TouchableOpacity onPress={handleClose} hitSlop={8}>
                        <Ionicons name="close" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <View style={styles.parentPreview}>
                    <View style={styles.parentRow}>
                        <ChatAvatar
                            userId={parentMessage.userId}
                            displayName={parentSender?.displayName}
                            name={parentSender?.name}
                            image={parentSender?.image}
                            size={32}
                        />
                        <View style={styles.parentContent}>
                            <View style={styles.parentMeta}>
                                <Text style={styles.parentSender}>
                                    {parentSender?.displayName ?? parentSender?.name ?? parentMessage.userId}
                                </Text>
                                <Text style={styles.parentTime}>{formatTime(parentMessage.createdAt)}</Text>
                            </View>
                            {parentMessage.content != null && (
                                <Text style={styles.parentText} numberOfLines={4}>{parentMessage.content}</Text>
                            )}
                        </View>
                    </View>
                    <Text style={styles.replyCount}>
                        {replies.length} {replies.length === 1 ? "reply" : "replies"}
                    </Text>
                </View>

                <FlatList
                    data={replies}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.replyList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No replies yet. Start the conversation.</Text>
                    }
                    renderItem={({ item, index }) => {
                        const sender = memberMap[item.userId];
                        const isOwn = item.userId === currentUserId;
                        const showHeader = index === 0
                            || replies[index].userId !== replies[index - 1].userId
                            || (new Date(replies[index].createdAt).getTime() - new Date(replies[index - 1].createdAt).getTime() > 5 * 60 * 1000);
                        return (
                            <MessageBubble
                                message={item}
                                sender={sender}
                                currentUserId={currentUserId}
                                isOwn={isOwn}
                                showHeader={showHeader}
                                replyCount={0}
                                isThreadOpen={false}
                                showReplyButton={false}
                                onReact={onReact}
                                onDeleteReaction={onDeleteReaction}
                                onReply={() => { }}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onOpenThread={() => { }}
                            />
                        );
                    }}
                />

                <View style={styles.inputWrapper}>
                    <MessageInput
                        onSend={(content, attachments) => onSendReply(content, attachments, parentMessage.id)}
                        onTypingStart={onTypingStart}
                        onTypingStop={onTypingStop}
                        placeholder="Reply in thread…"
                        uploadFiles={uploadFiles}
                    />
                </View>
            </Animated.View>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 30 },
    panel: { position: "absolute", top: 0, right: 0, bottom: 0, width: PANEL_WIDTH, backgroundColor: "#111", borderLeftWidth: 1, borderLeftColor: "#1e1e1e", zIndex: 31, flexDirection: "column" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
    headerTitle: { fontSize: 13, fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: 1 },
    parentPreview: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1e1e1e", backgroundColor: "#0d0d0d" },
    parentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    parentContent: { flex: 1 },
    parentMeta: { flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 4 },
    parentSender: { fontSize: 12, fontWeight: "600", color: "#4ade80" },
    parentTime: { fontSize: 10, color: "#6B7280" },
    parentText: { fontSize: 13, color: "#E5E7EB", lineHeight: 18 },
    replyCount: { fontSize: 11, color: "#6B7280", marginTop: 8, paddingLeft: 42 },
    replyList: { paddingVertical: 8, paddingHorizontal: 4, gap: 4 },
    emptyText: { textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 32, paddingHorizontal: 16 },
    inputWrapper: { borderTopWidth: 1, borderTopColor: "#1e1e1e" },
});
