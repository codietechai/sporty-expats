import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AnyMessage } from "@sparkstrand/chat-api-client/v2/types";

interface Props {
    onSend: (content: string, replyToId?: string | null) => void;
    onTypingStart: () => void;
    onTypingStop: () => void;
    replyTo?: AnyMessage | null;
    onCancelReply?: () => void;
    editingContent?: string | null;
    onCancelEdit?: () => void;
    disabled?: boolean;
    placeholder?: string;
}

export function MessageInput({
    onSend,
    onTypingStart,
    onTypingStop,
    replyTo,
    onCancelReply,
    editingContent,
    onCancelEdit,
    disabled = false,
    placeholder = "Send a message…",
}: Props) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTyping = useRef(false);
    const inputRef = useRef<TextInput>(null);

    // Sync text when editingContent changes (entering/leaving edit mode)
    useEffect(() => {
        if (editingContent != null) {
            setText(editingContent);
            // Focus and move cursor to end
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setText("");
        }
    }, [editingContent]);

    const stopTyping = useCallback(() => {
        if (isTyping.current) { isTyping.current = false; onTypingStop(); }
        if (typingTimer.current) clearTimeout(typingTimer.current);
    }, [onTypingStop]);

    const handleChange = (val: string) => {
        setText(val);
        if (!isTyping.current) { isTyping.current = true; onTypingStart(); }
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => stopTyping(), 2000);
    };

    const handleSend = useCallback(() => {
        const trimmed = text.trim();
        if (!trimmed || sending || disabled) return;
        setSending(true);
        stopTyping();
        try {
            onSend(trimmed, replyTo?.id ?? null);
            setText("");
            onCancelReply?.();
            onCancelEdit?.();
        } finally {
            setSending(false);
        }
    }, [text, sending, disabled, onSend, replyTo, onCancelReply, onCancelEdit, stopTyping]);

    const isEditing = editingContent != null;

    return (
        <View style={styles.wrapper}>
            {/* Edit mode banner */}
            {isEditing && (
                <View style={styles.editBar}>
                    <View style={styles.editContent}>
                        <Ionicons name="pencil-outline" size={13} color="#4ade80" />
                        <Text style={styles.editLabel}>Editing message</Text>
                    </View>
                    <TouchableOpacity onPress={onCancelEdit} hitSlop={8}>
                        <Ionicons name="close" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Reply banner */}
            {replyTo && !isEditing && (
                <View style={styles.replyBar}>
                    <View style={styles.replyContent}>
                        <Text style={styles.replyLabel}>Replying to {replyTo.userId}</Text>
                        <Text style={styles.replyPreview} numberOfLines={1}>
                            {replyTo.content ?? "[attachment]"}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onCancelReply} hitSlop={8}>
                        <Ionicons name="close" size={16} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            )}

            <View style={[
                styles.inputRow,
                disabled && styles.inputRowDisabled,
                isEditing && styles.inputRowEditing,
            ]}>
                <TextInput
                    ref={inputRef}
                    value={text}
                    onChangeText={handleChange}
                    placeholder={disabled ? "Connecting…" : placeholder}
                    placeholderTextColor="#4B5563"
                    multiline
                    style={styles.input}
                    editable={!disabled}
                    returnKeyType="default"
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!text.trim() || sending || disabled}
                    style={[styles.sendBtn, text.trim() ? styles.sendBtnActive : styles.sendBtnInactive]}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons
                            name={isEditing ? "checkmark" : "send"}
                            size={16}
                            color={text.trim() ? "#fff" : "#4B5563"}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { paddingHorizontal: 12, paddingBottom: 12, paddingTop: 6 },
    editBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "rgba(74,222,128,0.08)",
        borderWidth: 1,
        borderColor: "rgba(74,222,128,0.25)",
    },
    editContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
    editLabel: { fontSize: 11, color: "#4ade80", fontWeight: "600" },
    replyBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "rgba(45,90,45,0.3)",
        borderWidth: 1,
        borderColor: "rgba(74,222,128,0.2)",
    },
    replyContent: { flex: 1 },
    replyLabel: { fontSize: 11, color: "#4ade80", fontWeight: "600", marginBottom: 2 },
    replyPreview: { fontSize: 12, color: "#9CA3AF" },
    inputRow: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#2a2a2a",
        backgroundColor: "#1a1a1a",
    },
    inputRowDisabled: { backgroundColor: "#131313", borderColor: "#1e1e1e" },
    inputRowEditing: { borderColor: "rgba(74,222,128,0.35)" },
    input: {
        flex: 1,
        fontSize: 14,
        color: "#F9FAFB",
        maxHeight: 100,
        paddingTop: 0,
        paddingBottom: 0,
    },
    sendBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    sendBtnActive: { backgroundColor: "#2d5a2d" },
    sendBtnInactive: { backgroundColor: "#222" },
});
