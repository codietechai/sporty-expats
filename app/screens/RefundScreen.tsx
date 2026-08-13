import i18n from "@/translations/i18n";
import React, { useState } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    TextInput, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useUserDb } from "@/app/hooks/useUserDb";
import {
    requestRefund,
    RefundReason,
} from "@/client/endpoints/events/eventRegistration";
import InlineAlert from "@/components/Create-Events/InlineAlert";
import type { Event } from "@/client/endpoints/events/types";

const REFUND_REASONS: { label: string; value: RefundReason }[] = [
    { label: "I withdrew from the event", value: "Withdrew" },
    { label: "I did not attend", value: "Not Attended" },
    { label: "I am still going", value: "Going" },
];

export default function RefundScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const event: Event = route?.params?.event;
    const ticketsAssigned: number = route?.params?.ticketsAssigned ?? 1;

    const { userDb } = useUserDb();
    const userId: string | undefined = userDb?.data?.id ?? userDb?.id;

    const [reason, setReason] = useState<RefundReason>("Withdrew");
    const [description, setDescription] = useState("");
    const [numberOfTickets, setNumberOfTickets] = useState(ticketsAssigned);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const ticketOptions = Array.from({ length: ticketsAssigned }, (_, i) => i + 1);

    const handleSubmit = async () => {
        if (!userId || !event?.id) return;
        if (!description.trim()) {
            setError("Please describe the reason for your refund request.");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await requestRefund({
                userId,
                eventId: event.id,
                refundReason: reason,
                description: description.trim(),
                numberOfTickets,
            });
            setSubmitted(true);
        } catch (err: any) {
            setError(err?.message ?? "Failed to submit refund request. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safe} edges={["top"]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Request Refund</Text>
                    <View style={{ width: 38 }} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {submitted ? (
                        /* ── Success state ── */
                        <View style={styles.successBlock}>
                            <Ionicons name="checkmark-circle" size={56} color="#2ecc71" />
                            <Text style={styles.successTitle}>Request Submitted</Text>
                            <Text style={styles.successSubtitle}>
                                Your refund request has been received. An admin will review it shortly.
                            </Text>
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.primaryBtnText}>Back to Event</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* Event title */}
                            <View style={styles.eventCard}>
                                <Ionicons name="calendar-outline" size={16} color="#2ecc71" />
                                <Text style={styles.eventTitle} numberOfLines={2}>{event?.title}</Text>
                            </View>

                            {/* Reason picker */}
                            <Text style={styles.label}>
                                Reason for Refund <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.reasonGroup}>
                                {REFUND_REASONS.map((r) => (
                                    <TouchableOpacity
                                        key={r.value}
                                        style={[styles.reasonOption, reason === r.value && styles.reasonOptionSelected]}
                                        onPress={() => setReason(r.value)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.radio, reason === r.value && styles.radioSelected]}>
                                            {reason === r.value && <View style={styles.radioDot} />}
                                        </View>
                                        <Text style={styles.reasonLabel}>{r.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Number of tickets */}
                            <Text style={styles.label}>
                                Number of Tickets to Refund <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.ticketGroup}>
                                {ticketOptions.map((n) => (
                                    <TouchableOpacity
                                        key={n}
                                        style={[styles.ticketOption, numberOfTickets === n && styles.ticketOptionSelected]}
                                        onPress={() => setNumberOfTickets(n)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.ticketOptionText, numberOfTickets === n && styles.ticketOptionTextSelected]}>
                                            {n}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Description */}
                            <Text style={styles.label}>
                                {i18n.t("Complaints.descriptionLabel")} <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.textarea}
                                value={description}
                                onChangeText={(v) => { setDescription(v); setError(null); }}
                                placeholder="Please describe why you're requesting a refund..."
                                placeholderTextColor="#6b7280"
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />

                            <InlineAlert message={error} />

                            <TouchableOpacity
                                style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.primaryBtnText}>Submit Refund Request</Text>
                                }
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0d0d0d" },
    header: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
        backgroundColor: "#111",
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: "#fff" },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },

    eventCard: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: "#1a1a1a", borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: "#2a2a2a", marginBottom: 24,
    },
    eventTitle: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "600" },

    label: { color: "#D1D5DB", fontSize: 14, fontWeight: "600", marginBottom: 10 },
    required: { color: "#ef4444" },

    reasonGroup: { gap: 8, marginBottom: 24 },
    reasonOption: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: "#1a1a1a", borderRadius: 10, padding: 14,
        borderWidth: 1, borderColor: "#2a2a2a",
    },
    reasonOptionSelected: { borderColor: "#2ecc71", backgroundColor: "rgba(46,204,113,0.08)" },
    radio: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: "#4b5563",
        alignItems: "center", justifyContent: "center",
    },
    radioSelected: { borderColor: "#2ecc71" },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2ecc71" },
    reasonLabel: { color: "#D1D5DB", fontSize: 14 },

    ticketGroup: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
    ticketOption: {
        width: 48, height: 48, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    ticketOptionSelected: { borderColor: "#2ecc71", backgroundColor: "rgba(46,204,113,0.12)" },
    ticketOptionText: { color: "#9CA3AF", fontWeight: "700", fontSize: 16 },
    ticketOptionTextSelected: { color: "#2ecc71" },

    textarea: {
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        borderRadius: 12, padding: 14, color: "#fff", fontSize: 14,
        minHeight: 120, marginBottom: 20,
    },

    primaryBtn: {
        backgroundColor: "#166534", borderRadius: 12,
        paddingVertical: 15, paddingHorizontal: 24, alignItems: "center",
        borderWidth: 1, borderColor: "#2ecc71", marginTop: 4,
    },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

    successBlock: { flex: 1, alignItems: "center", paddingTop: 60, gap: 16 },
    successTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
    successSubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 22, paddingHorizontal: 20 },
});
