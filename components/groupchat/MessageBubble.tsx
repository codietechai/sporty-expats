import React, { useState } from "react";
import {
    View,
    Text,
    Pressable,
    TouchableOpacity,
    Image,
    Modal,
    StyleSheet,
    Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChatAvatar } from "./ChatAvatar";
import type { AnyMessage, ChatRoomMember } from "@sparkstrand/chat-api-client/v2/types";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "👏", "😮"];

function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

interface Props {
    message: AnyMessage;
    sender?: ChatRoomMember;
    currentUserId?: string | null;
    isOwn: boolean;
    showHeader?: boolean;
    replyCount?: number;
    isThreadOpen?: boolean;
    showReplyButton?: boolean;
    onReact: (messageId: string, emoji: string) => void;
    onDeleteReaction: (messageId: string, emoji: string) => void;
    onReply: (message: AnyMessage) => void;
    onEdit: (message: AnyMessage) => void;
    onDelete: (messageId: string) => void;
    onOpenThread: (message: AnyMessage) => void;
}

export function MessageBubble({
    message,
    sender,
    currentUserId,
    isOwn,
    showHeader = true,
    replyCount = 0,
    isThreadOpen = false,
    showReplyButton = true,
    onReact,
    onDeleteReaction,
    onReply,
    onEdit,
    onDelete,
    onOpenThread,
}: Props) {
    const [showActionModal, setShowActionModal] = useState(false);
    const [showEmojiModal, setShowEmojiModal] = useState(false);

    const senderName = sender?.displayName ?? sender?.name ?? message.userId ?? "Member";

    const reactionGroups = (message.reactions ?? []).reduce<
        Record<string, { count: number; hasReacted: boolean }>
    >((acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasReacted: false };
        acc[r.emoji].count++;
        if (r.userId === currentUserId) acc[r.emoji].hasReacted = true;
        return acc;
    }, {});

    const isFailed = message.status === "failed";
    const isSending = message.status === "sending";

    return (
        <>
            {/* ── Message row ── */}
            <Pressable
                onLongPress={() => setShowActionModal(true)}
                style={[styles.row, isOwn && styles.rowReverse]}
            >
                {/* Avatar */}
                <View style={styles.avatarCol}>
                    {showHeader && !isOwn && (
                        <ChatAvatar
                            userId={message.userId}
                            displayName={sender?.displayName}
                            name={sender?.name}
                            image={sender?.image}
                            size={34}
                        />
                    )}
                </View>

                {/* Content */}
                <View style={[styles.contentCol, isOwn && styles.contentColOwn]}>
                    {showHeader && !isOwn && (
                        <View style={styles.msgHeader}>
                            <Text style={styles.senderName}>{senderName}</Text>
                            <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
                        </View>
                    )}

                    <View style={[
                        styles.bubble,
                        isOwn ? styles.bubbleOwn : styles.bubbleOther,
                        isFailed && styles.bubbleFailed,
                        isSending && styles.bubbleSending,
                    ]}>
                        {message.content != null && (
                            <Text style={styles.messageText}>{message.content}</Text>
                        )}

                        {(message.attachments ?? []).map((att, i) =>
                            att.mime?.startsWith("image/") ? (
                                <Image
                                    key={i}
                                    source={{ uri: att.url }}
                                    style={styles.attachmentImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => Linking.openURL(att.url)}
                                    style={styles.fileAttachment}
                                >
                                    <Ionicons name="document-outline" size={16} color="#9CA3AF" />
                                    <Text style={styles.fileName} numberOfLines={1}>{att.name}</Text>
                                </TouchableOpacity>
                            )
                        )}

                        {message.editedAt && (
                            <Text style={styles.editedLabel}>(edited)</Text>
                        )}
                        {isOwn && (
                            <Text style={styles.ownTime}>
                                {isFailed ? "⚠ Failed" : isSending ? "···" : formatTime(message.createdAt)}
                            </Text>
                        )}
                    </View>

                    {/* Reactions */}
                    {Object.keys(reactionGroups).length > 0 && (
                        <View style={[styles.reactions, isOwn && styles.reactionsOwn]}>
                            {Object.entries(reactionGroups).map(([emoji, { count, hasReacted }]) => (
                                <TouchableOpacity
                                    key={emoji}
                                    onPress={() =>
                                        hasReacted
                                            ? onDeleteReaction(message.id, emoji)
                                            : onReact(message.id, emoji)
                                    }
                                    style={[styles.reactionBtn, hasReacted && styles.reactionBtnActive]}
                                >
                                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                                    <Text style={styles.reactionCount}>{count}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Thread strip */}
                    {replyCount > 0 && (
                        <TouchableOpacity
                            onPress={() => onOpenThread(message)}
                            style={[styles.threadStrip, isThreadOpen && styles.threadStripOpen]}
                        >
                            <View style={[styles.threadBar, isThreadOpen && styles.threadBarOpen]} />
                            <Ionicons name="chatbubble-outline" size={13} color={isThreadOpen ? "#4ade80" : "#9CA3AF"} />
                            <Text style={[styles.threadText, isThreadOpen && styles.threadTextOpen]}>
                                {replyCount} {replyCount === 1 ? "reply" : "replies"}
                            </Text>
                            <Text style={styles.threadAction}>{isThreadOpen ? "Open" : "View thread"}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Pressable>

            {/* ── Action modal (long-press) ── */}
            <Modal
                visible={showActionModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowActionModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowActionModal(false)}
                >
                    <View style={styles.actionSheet}>
                        {/* Emoji row */}
                        <View style={styles.emojiRow}>
                            {QUICK_EMOJIS.map((e) => (
                                <TouchableOpacity
                                    key={e}
                                    onPress={() => {
                                        onReact(message.id, e);
                                        setShowActionModal(false);
                                    }}
                                    style={styles.emojiBtn}
                                >
                                    <Text style={styles.emojiOption}>{e}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.divider} />

                        {/* Reply / Thread */}
                        {showReplyButton && (
                            <>
                                <TouchableOpacity
                                    style={styles.actionRow}
                                    onPress={() => { onOpenThread(message); setShowActionModal(false); }}
                                >
                                    <Ionicons name="arrow-undo-outline" size={18} color="#9CA3AF" />
                                    <Text style={styles.actionLabel}>Reply</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionRow}
                                    onPress={() => { onOpenThread(message); setShowActionModal(false); }}
                                >
                                    <Ionicons name="chatbubbles-outline" size={18} color="#9CA3AF" />
                                    <Text style={styles.actionLabel}>View Thread</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Edit / Delete — own messages only */}
                        {isOwn && !message.isDeleted && (
                            <>
                                <TouchableOpacity
                                    style={styles.actionRow}
                                    onPress={() => {
                                        onEdit(message);
                                        setShowActionModal(false);
                                    }}
                                >
                                    <Ionicons name="pencil-outline" size={18} color="#9CA3AF" />
                                    <Text style={styles.actionLabel}>Edit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionRow}
                                    onPress={() => {
                                        onDelete(message.id);
                                        setShowActionModal(false);
                                    }}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    <Text style={[styles.actionLabel, { color: "#EF4444" }]}>Delete</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.actionRow, styles.cancelRow]}
                            onPress={() => setShowActionModal(false)}
                        >
                            <Text style={styles.cancelLabel}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", paddingHorizontal: 6, paddingVertical: 3 },
    rowReverse: { flexDirection: "row-reverse" },
    avatarCol: { width: 32, alignSelf: "flex-end", marginBottom: 4 },
    contentCol: { flex: 1, maxWidth: "85%", alignItems: "flex-start" },
    contentColOwn: { alignItems: "flex-end" },
    msgHeader: { flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 3, paddingHorizontal: 4 },
    senderName: { fontSize: 12, fontWeight: "600", color: "#4ade80" },
    time: { fontSize: 10, color: "#6B7280" },
    bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, maxWidth: "100%" },
    bubbleOwn: { backgroundColor: "#2d5a2d", borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: "#1e1e1e", borderWidth: 1, borderColor: "#2a2a2a", borderBottomLeftRadius: 4 },
    bubbleFailed: { borderWidth: 1, borderColor: "#EF4444" },
    bubbleSending: { opacity: 0.6 },
    messageText: { fontSize: 14, color: "#F9FAFB", lineHeight: 20 },
    attachmentImage: { width: 200, height: 150, borderRadius: 10, marginTop: 6 },
    fileAttachment: {
        flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6,
        padding: 8, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 8,
        borderWidth: 1, borderColor: "#2a2a2a",
    },
    fileName: { fontSize: 12, color: "#9CA3AF", flex: 1 },
    editedLabel: { fontSize: 10, color: "rgba(156,163,175,0.7)", marginTop: 2 },
    ownTime: { fontSize: 10, color: "rgba(156,163,175,0.7)", marginTop: 2, textAlign: "right" },
    reactions: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
    reactionsOwn: { justifyContent: "flex-end" },
    reactionBtn: {
        flexDirection: "row", alignItems: "center", gap: 3,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
        backgroundColor: "#1e1e1e", borderWidth: 1, borderColor: "#2a2a2a",
    },
    reactionBtnActive: { backgroundColor: "rgba(74,222,128,0.2)", borderColor: "rgba(74,222,128,0.4)" },
    reactionEmoji: { fontSize: 13 },
    reactionCount: { fontSize: 11, color: "#fff", fontWeight: "600" },
    threadStrip: {
        flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
        borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#161616",
    },
    threadStripOpen: { borderColor: "rgba(74,222,128,0.4)", backgroundColor: "rgba(30,46,30,0.6)" },
    threadBar: { width: 2, height: 20, borderRadius: 2, backgroundColor: "#3a3a3a" },
    threadBarOpen: { backgroundColor: "#4ade80" },
    threadText: { fontSize: 12, color: "#9CA3AF", flex: 1 },
    threadTextOpen: { color: "#86efac" },
    threadAction: { fontSize: 11, color: "#6B7280" },

    // ── Modal action sheet ──
    modalOverlay: {
        flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    actionSheet: {
        backgroundColor: "#1a1a1a",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 32,
        paddingTop: 8,
    },
    emojiRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    emojiBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    emojiOption: { fontSize: 22 },
    divider: { height: 1, backgroundColor: "#2a2a2a", marginHorizontal: 16, marginBottom: 4 },
    actionRow: {
        flexDirection: "row", alignItems: "center", gap: 14,
        paddingHorizontal: 20, paddingVertical: 14,
    },
    actionLabel: { fontSize: 15, color: "#E5E7EB" },
    cancelRow: { marginTop: 4, borderTopWidth: 1, borderTopColor: "#2a2a2a", justifyContent: "center" },
    cancelLabel: { fontSize: 15, color: "#6B7280", fontWeight: "600", textAlign: "center", flex: 1 },
});
