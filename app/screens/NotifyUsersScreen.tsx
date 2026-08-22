import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { notifyParticipants, NotifyTarget } from "@/client/endpoints/events/notifyParticipants";
import { useUserDb } from "@/app/hooks/useUserDb";
import type { Event } from "@/client/endpoints/events/types";

// ── Presets ───────────────────────────────────────────────────────────────────

const PRESETS = [
    {
        label: "Join us!",
        text: "We're hosting an exciting event and would love for you to join! Spots are limited — sign up now before they're gone.",
    },
    {
        label: "Limited spots",
        text: "Only a few spots left for this event. Don't miss out — register today and secure your place!",
    },
    {
        label: "Early bird",
        text: "Early registrations are now open! Be one of the first to sign up and be part of something great.",
    },
    {
        label: "Why join",
        text: "Looking for a fun and active community? This event is a great way to meet new people and enjoy your favourite sport!",
    },
];

const MAX_MSG = 300;

// ── Target option card ────────────────────────────────────────────────────────

function TargetCard({
    id,
    title,
    description,
    selected,
    onSelect,
}: {
    id: NotifyTarget;
    title: string;
    description: string;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <TouchableOpacity
            style={[s.targetCard, selected && s.targetCardActive]}
            onPress={onSelect}
            activeOpacity={0.8}
        >
            <View style={[s.radio, selected && s.radioActive]}>
                {selected && <View style={s.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[s.targetTitle, selected && s.targetTitleActive]}>{title}</Text>
                <Text style={s.targetDesc}>{description}</Text>
            </View>
        </TouchableOpacity>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NotifyUsersScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const event: Event | undefined = route?.params?.event;
    const eventId: string = event?.id ?? route?.params?.eventId ?? "";
    const eventTitle: string = event?.title ?? route?.params?.eventTitle ?? "";

    const { userDb } = useUserDb();
    const userId: string = userDb?.data?.id ?? userDb?.id ?? "";

    const [target, setTarget]     = useState<NotifyTarget>("interested");
    const [message, setMessage]   = useState("");
    const [sending, setSending]   = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [sentCount, setSentCount] = useState<number | null>(null);

    const charsLeft = MAX_MSG - message.length;
    const isNearLimit = message.length > MAX_MSG * 0.8;
    const isAtLimit   = message.length >= MAX_MSG;

    const handlePreset = (text: string) => {
        setMessage(text);
        setError(null);
    };

    const handleSend = async () => {
        if (!message.trim()) { setError("Please write a message before sending."); return; }
        if (message.length > MAX_MSG) { setError(`Message must be ${MAX_MSG} characters or fewer.`); return; }
        if (!userId) { setError("You must be logged in."); return; }

        setError(null);
        setSending(true);
        try {
            const result = await notifyParticipants(eventId, {
                requestingUserId: userId,
                message: message.trim(),
                target,
            });
            setSentCount(result.sentCount ?? 0);
        } catch (err: any) {
            setError(err?.response?.data?.error ?? err?.message ?? "Failed to send. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleReset = () => {
        setMessage("");
        setTarget("interested");
        setError(null);
        setSentCount(null);
    };

    return (
        <SafeAreaView style={s.safe} edges={["top", "bottom"]}>

            {/* ── Header ── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>Notify Users</Text>
                    {!!eventTitle && (
                        <Text style={s.headerSub} numberOfLines={1}>{eventTitle}</Text>
                    )}
                </View>
                <View style={{ width: 38 }} />
            </View>

            {sentCount !== null ? (
                /* ── Success state ── */
                <View style={s.successBlock}>
                    <View style={s.successIcon}>
                        <Ionicons name="checkmark-circle" size={64} color="#2ecc71" />
                    </View>
                    <Text style={s.successTitle}>Invitations sent!</Text>
                    <Text style={s.successSub}>
                        Your invite was delivered to{" "}
                        <Text style={{ color: "#fff", fontWeight: "700" }}>{sentCount}</Text>
                        {" "}{sentCount === 1 ? "person" : "people"} who haven't signed up yet.
                    </Text>
                    {sentCount === 0 && (
                        <View style={s.infoBox}>
                            <Ionicons name="information-circle-outline" size={15} color="#6B7280" />
                            <Text style={s.infoBoxText}>
                                No eligible users with notifications enabled were found.
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity style={[s.sendBtn, s.successBtn]} onPress={handleReset}>
                        <Text style={s.sendBtnText}>Send Another</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.outlineBtn, s.successBtn]} onPress={() => navigation.goBack()}>
                        <Text style={s.outlineBtnText}>Back to Event</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <ScrollView
                        contentContainerStyle={s.content}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* ── Section: Who to notify ── */}
                        <Text style={s.sectionTitle}>Who to notify</Text>

                        <TargetCard
                            id="interested"
                            title="Interested users"
                            description="Users whose sport interests match this event's category — but haven't signed up yet."
                            selected={target === "interested"}
                            onSelect={() => setTarget("interested")}
                        />
                        <TargetCard
                            id="everyone"
                            title="Everyone"
                            description="All platform users who haven't signed up or joined the waitlist yet."
                            selected={target === "everyone"}
                            onSelect={() => setTarget("everyone")}
                        />

                        <View style={s.mutedNote}>
                            <Ionicons name="information-circle-outline" size={13} color="#4B5563" />
                            <Text style={s.mutedNoteText}>
                                People already registered or on the waitlist are always excluded.
                            </Text>
                        </View>

                        {/* ── Section: Quick templates ── */}
                        <Text style={[s.sectionTitle, { marginTop: 24 }]}>Quick templates</Text>
                        <FlatList
                            horizontal
                            data={PRESETS}
                            keyExtractor={(p) => p.label}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={s.presetsRow}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[s.presetChip, message === item.text && s.presetChipActive]}
                                    onPress={() => handlePreset(item.text)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[s.presetChipText, message === item.text && s.presetChipTextActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />

                        {/* ── Section: Message ── */}
                        <View style={s.messageHeadRow}>
                            <Text style={s.sectionTitle}>Message</Text>
                            <Text style={[
                                s.charCount,
                                isNearLimit && s.charCountWarn,
                                isAtLimit   && s.charCountDanger,
                            ]}>
                                {isNearLimit ? `${charsLeft} left` : `${message.length}/${MAX_MSG}`}
                            </Text>
                        </View>

                        <TextInput
                            style={[s.textarea, isAtLimit && s.textareaWarn]}
                            value={message}
                            onChangeText={(v) => {
                                if (v.length <= MAX_MSG) setMessage(v);
                                setError(null);
                            }}
                            placeholder="Tell people why they should come to this event…"
                            placeholderTextColor="#4B5563"
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />

                        {/* ── Info callout ── */}
                        <View style={s.infoBox}>
                            <Ionicons name="bulb-outline" size={15} color="#6B7280" />
                            <Text style={s.infoBoxText}>
                                Keep it short and compelling — people decide whether to sign up in seconds.
                            </Text>
                        </View>

                        {/* ── Error ── */}
                        {!!error && (
                            <View style={s.errorBox}>
                                <Ionicons name="alert-circle-outline" size={15} color="#ef4444" />
                                <Text style={s.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* ── Send button ── */}
                        <TouchableOpacity
                            style={[s.sendBtn, (!message.trim() || sending) && s.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={!message.trim() || sending}
                            activeOpacity={0.85}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <>
                                    <Ionicons name="send-outline" size={16} color="#000" />
                                    <Text style={s.sendBtnText}>Send invite notification</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0d0d0d" },

    header: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
        backgroundColor: "#111", gap: 10,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
    headerSub: { fontSize: 11, color: "#6B7280", marginTop: 2 },

    content: { padding: 20, paddingBottom: 48 },

    sectionTitle: { fontSize: 13, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 },

    // Target cards
    targetCard: {
        flexDirection: "row", alignItems: "flex-start", gap: 14,
        padding: 16, borderRadius: 14,
        borderWidth: 1, borderColor: "#2a2a2a",
        backgroundColor: "rgba(255,255,255,0.03)",
        marginBottom: 10,
    },
    targetCardActive: {
        borderColor: "rgba(46,204,113,0.45)",
        backgroundColor: "rgba(46,204,113,0.07)",
    },
    radio: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: "#4B5563",
        alignItems: "center", justifyContent: "center",
        marginTop: 1, flexShrink: 0,
    },
    radioActive: { borderColor: "#2ecc71", backgroundColor: "#2ecc71" },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
    targetTitle: { fontSize: 15, fontWeight: "600", color: "#9CA3AF", marginBottom: 4 },
    targetTitleActive: { color: "#2ecc71" },
    targetDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18 },

    mutedNote: {
        flexDirection: "row", alignItems: "flex-start", gap: 6,
        marginTop: 2, marginBottom: 4,
    },
    mutedNoteText: { flex: 1, fontSize: 12, color: "#4B5563", lineHeight: 17 },

    // Presets
    presetsRow: { gap: 8, paddingBottom: 4, marginBottom: 4 },
    presetChip: {
        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
        borderWidth: 1, borderColor: "#2a2a2a",
        backgroundColor: "#1a1a1a",
    },
    presetChipActive: {
        borderColor: "#2ecc71",
        backgroundColor: "rgba(46,204,113,0.1)",
    },
    presetChipText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
    presetChipTextActive: { color: "#2ecc71", fontWeight: "700" },

    // Message
    messageHeadRow: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", marginBottom: 10, marginTop: 20,
    },
    charCount: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
    charCountWarn: { color: "#fbbf24" },
    charCountDanger: { color: "#ef4444" },
    textarea: {
        backgroundColor: "#1a1a1a",
        borderWidth: 1, borderColor: "#2a2a2a",
        borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        color: "#fff", fontSize: 14, lineHeight: 22,
        minHeight: 140, marginBottom: 14,
    },
    textareaWarn: { borderColor: "rgba(239,68,68,0.4)" },

    infoBox: {
        flexDirection: "row", alignItems: "flex-start", gap: 9,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1, borderColor: "#1e1e1e",
        borderRadius: 12, padding: 14, marginBottom: 14,
    },
    infoBoxText: { flex: 1, color: "#6B7280", fontSize: 13, lineHeight: 18 },

    errorBox: {
        flexDirection: "row", alignItems: "flex-start", gap: 9,
        backgroundColor: "rgba(239,68,68,0.07)",
        borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
        borderRadius: 12, padding: 14, marginBottom: 14,
    },
    errorText: { flex: 1, color: "#ef4444", fontSize: 13, lineHeight: 18 },

    sendBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 15, borderRadius: 14,
        backgroundColor: "#2ecc71", marginBottom: 12,
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
    outlineBtn: {
        paddingVertical: 14, borderRadius: 14,
        borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center",
    },
    successBtn: {
        alignSelf: "stretch",
        marginHorizontal: 0,
    },
    outlineBtnText: { color: "#9CA3AF", fontWeight: "600", fontSize: 14 },

    // Success
    successBlock: {
        flex: 1, alignItems: "center", justifyContent: "center",
        gap: 14, paddingHorizontal: 32, paddingBottom: 40,
    },
    successIcon: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: "rgba(46,204,113,0.1)",
        borderWidth: 1, borderColor: "rgba(46,204,113,0.25)",
        alignItems: "center", justifyContent: "center", marginBottom: 6,
    },
    successTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
    successSub: {
        fontSize: 14, color: "#9CA3AF",
        textAlign: "center", lineHeight: 22,
    },
});
