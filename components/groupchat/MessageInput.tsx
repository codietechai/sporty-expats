import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Image,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import type { AnyMessage, ChatAttachment } from "@sparkstrand/chat-api-client/v2/types";
import type { MobileFile } from "@/app/chat/core/chatProvider";

interface Props {
    onSend: (content: string, attachments?: ChatAttachment[], replyToId?: string | null) => void;
    onTypingStart: () => void;
    onTypingStop: () => void;
    replyTo?: AnyMessage | null;
    onCancelReply?: () => void;
    editingContent?: string | null;
    onCancelEdit?: () => void;
    disabled?: boolean;
    placeholder?: string;
    uploadFiles?: (files: MobileFile[], type?: string) => Promise<ChatAttachment[]>;
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
    uploadFiles,
}: Props) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<MobileFile[]>([]);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTyping = useRef(false);
    const inputRef = useRef<TextInput>(null);

    // Sync text when editingContent changes
    useEffect(() => {
        if (editingContent != null) {
            setText(editingContent);
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

    // ── File picking ──────────────────────────────────────────────────────────

    const pickImages = async () => {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            Alert.alert("Permission required", "Please allow media access to attach images.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            allowsMultipleSelection: true,
            quality: 0.85,
        });
        if (!result.canceled && result.assets?.length) {
            const picked: MobileFile[] = result.assets.map((a) => ({
                uri: a.uri,
                name: a.fileName ?? a.uri.split("/").pop() ?? `media-${Date.now()}`,
                mimeType: a.mimeType ?? (a.type === "video" ? "video/mp4" : "image/jpeg"),
                size: a.fileSize,
            }));
            setPendingFiles((prev) => [...prev, ...picked]);
        }
    };

    const pickDocuments = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            multiple: true,
            copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets?.length) {
            const picked: MobileFile[] = result.assets.map((a) => ({
                uri: a.uri,
                name: a.name,
                mimeType: a.mimeType ?? "application/octet-stream",
                size: a.size,
            }));
            setPendingFiles((prev) => [...prev, ...picked]);
        }
    };

    const removeFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // ── Send ──────────────────────────────────────────────────────────────────

    const handleSend = useCallback(async () => {
        const trimmed = text.trim();
        if ((!trimmed && pendingFiles.length === 0) || sending || disabled) return;

        setSending(true);
        stopTyping();

        try {
            let attachments: ChatAttachment[] | undefined;

            if (pendingFiles.length > 0 && uploadFiles) {
                setUploading(true);
                attachments = await uploadFiles(pendingFiles, "file");
                setUploading(false);
            }

            onSend(trimmed || "", attachments, replyTo?.id ?? null);
            setText("");
            setPendingFiles([]);
            onCancelReply?.();
            onCancelEdit?.();
        } catch (err: any) {
            setUploading(false);
            Alert.alert("Upload failed", err?.message ?? "Could not upload files. Please try again.");
        } finally {
            setSending(false);
        }
    }, [text, pendingFiles, sending, disabled, uploadFiles, onSend, replyTo, onCancelReply, onCancelEdit, stopTyping]);

    const isEditing = editingContent != null;
    const isBusy = sending || uploading;
    const canSend = (text.trim().length > 0 || pendingFiles.length > 0) && !isBusy && !disabled;

    const isImage = (mime: string) => mime.startsWith("image/");

    return (
        <View style={styles.wrapper}>
            {/* Edit banner */}
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

            {/* Pending file previews */}
            {pendingFiles.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filePreviewScroll}
                    contentContainerStyle={styles.filePreviewContent}
                >
                    {pendingFiles.map((f, i) => (
                        <View key={i} style={styles.fileChip}>
                            {isImage(f.mimeType) ? (
                                <Image source={{ uri: f.uri }} style={styles.fileThumb} />
                            ) : (
                                <View style={styles.fileIconWrap}>
                                    <Ionicons name="document-outline" size={18} color="#9CA3AF" />
                                </View>
                            )}
                            <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                            <TouchableOpacity onPress={() => removeFile(i)} hitSlop={6} style={styles.fileRemove}>
                                <Ionicons name="close-circle" size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Input row */}
            <View style={[
                styles.inputRow,
                disabled && styles.inputRowDisabled,
                isEditing && styles.inputRowEditing,
            ]}>
                {/* Attach buttons — only shown when uploadFiles is available */}
                {uploadFiles && !isEditing && (
                    <View style={styles.attachBtns}>
                        <TouchableOpacity onPress={pickImages} disabled={disabled} hitSlop={6}>
                            <Ionicons name="image-outline" size={22} color={disabled ? "#374151" : "#6B7280"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={pickDocuments} disabled={disabled} hitSlop={6}>
                            <Ionicons name="attach-outline" size={22} color={disabled ? "#374151" : "#6B7280"} />
                        </TouchableOpacity>
                    </View>
                )}

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
                    disabled={!canSend}
                    style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnInactive]}
                >
                    {isBusy ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons
                            name={isEditing ? "checkmark" : "send"}
                            size={16}
                            color={canSend ? "#fff" : "#4B5563"}
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
        flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6,
        paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
        backgroundColor: "rgba(74,222,128,0.08)", borderWidth: 1, borderColor: "rgba(74,222,128,0.25)",
    },
    editContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
    editLabel: { fontSize: 11, color: "#4ade80", fontWeight: "600" },

    replyBar: {
        flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6,
        paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
        backgroundColor: "rgba(45,90,45,0.3)", borderWidth: 1, borderColor: "rgba(74,222,128,0.2)",
    },
    replyContent: { flex: 1 },
    replyLabel: { fontSize: 11, color: "#4ade80", fontWeight: "600", marginBottom: 2 },
    replyPreview: { fontSize: 12, color: "#9CA3AF" },

    filePreviewScroll: { marginBottom: 8 },
    filePreviewContent: { gap: 8, paddingHorizontal: 2 },
    fileChip: {
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: "#1e1e1e", borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a",
        paddingHorizontal: 8, paddingVertical: 6, maxWidth: 180,
    },
    fileThumb: { width: 32, height: 32, borderRadius: 6 },
    fileIconWrap: {
        width: 32, height: 32, borderRadius: 6,
        backgroundColor: "#2a2a2a", alignItems: "center", justifyContent: "center",
    },
    fileName: { flex: 1, fontSize: 11, color: "#D1D5DB" },
    fileRemove: { marginLeft: 2 },

    inputRow: {
        flexDirection: "row", alignItems: "flex-end", gap: 8,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 14, borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#1a1a1a",
    },
    inputRowDisabled: { backgroundColor: "#131313", borderColor: "#1e1e1e" },
    inputRowEditing: { borderColor: "rgba(74,222,128,0.35)" },

    attachBtns: { flexDirection: "row", gap: 10, alignItems: "center", paddingBottom: 2 },

    input: {
        flex: 1, fontSize: 14, color: "#F9FAFB",
        maxHeight: 100, paddingTop: 0, paddingBottom: 0,
    },
    sendBtn: {
        width: 34, height: 34, borderRadius: 10,
        alignItems: "center", justifyContent: "center",
    },
    sendBtnActive: { backgroundColor: "#2d5a2d" },
    sendBtnInactive: { backgroundColor: "#222" },
});
