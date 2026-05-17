import React, { useState } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, TextInput, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useUserDb } from "@/app/hooks/useUserDb";
import { registerFreeEvent, TicketInfo } from "@/client/endpoints/events/eventRegistration";
import InlineAlert from "@/components/Create-Events/InlineAlert";
import type { Event } from "@/client/endpoints/events/types";

type Step = "Select Ticket" | "Assign Participants" | "Review & Confirm";

type LocalTicket = {
    name: string;
    email: string;
    phone: string;
    note: string;
};

const STEPS: Step[] = ["Select Ticket", "Assign Participants", "Review & Confirm"];

export default function EventRegistrationScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const event: Event = route?.params?.event;

    const { userDb } = useUserDb();
    const userId: string | undefined = userDb?.data?.id ?? userDb?.id;
    // /users/me returns a flat object: { id, email, firstName, lastName, username, ... }
    const userEmail: string | undefined = userDb?.data?.email ?? userDb?.email;
    const firstName: string | undefined = userDb?.data?.firstName ?? userDb?.firstName;
    const lastName: string | undefined = userDb?.data?.lastName ?? userDb?.lastName;
    const username: string | undefined = userDb?.data?.username ?? userDb?.username;

    const [activeStep, setActiveStep] = useState<Step>("Select Ticket");
    const [participants, setParticipants] = useState(1);
    const [attending, setAttending] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [stepError, setStepError] = useState<string | null>(null);
    const [tickets, setTickets] = useState<LocalTicket[]>([
        { name: "", email: "", phone: "", note: "" },
    ]);

    const totalPrice = (event?.ticketPrice ?? 0) * participants;
    const isFree = !event?.isPaidEvent || event?.ticketPrice === 0;

    // ── Participant counter ──────────────────────────────────────────────────

    const incrementParticipants = () => {
        if (participants < (event?.availableTickets ?? 1)) {
            setParticipants((p) => p + 1);
            setTickets((prev) => [...prev, { name: "", email: "", phone: "", note: "" }]);
        } else {
            setStepError("No more tickets available for this event.");
        }
    };

    const decrementParticipants = () => {
        if (participants > 1) {
            setParticipants((p) => p - 1);
            setTickets((prev) => prev.slice(0, -1));
            setStepError(null);
        }
    };

    // ── Ticket field helpers ─────────────────────────────────────────────────

    const updateTicket = (index: number, field: keyof LocalTicket, value: string) => {
        setStepError(null);
        setTickets((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const fillSelf = () => {
        const name = firstName ? `${firstName} ${lastName ?? ""}`.trim() : (username ?? "");
        setTickets((prev) => {
            const updated = [...prev];
            updated[0] = { ...updated[0], name, email: userEmail ?? "" };
            return updated;
        });
        setAttending(true);
        setStepError(null);
    };

    const clearSelf = () => {
        setTickets((prev) => {
            const updated = [...prev];
            updated[0] = { ...updated[0], name: "", email: "" };
            return updated;
        });
        setAttending(false);
    };

    // ── Step navigation ──────────────────────────────────────────────────────

    const validateStep = (): boolean => {
        if (activeStep === "Assign Participants") {
            const first = tickets[0];
            if (!first.name.trim()) {
                setStepError("Full name is required for Participant 1.");
                return false;
            }
            if (!first.email.trim()) {
                setStepError("Email is required for Participant 1.");
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(first.email.trim())) {
                setStepError("Please enter a valid email address for Participant 1.");
                return false;
            }
        }
        return true;
    };

    const goNext = () => {
        setStepError(null);
        if (!validateStep()) return;
        const idx = STEPS.indexOf(activeStep);
        if (idx < STEPS.length - 1) setActiveStep(STEPS[idx + 1]);
    };

    const goBack = () => {
        setStepError(null);
        const idx = STEPS.indexOf(activeStep);
        if (idx > 0) setActiveStep(STEPS[idx - 1]);
        else navigation.goBack();
    };

    // ── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!userId || !event?.id) return;

        // Paid events: redirect to web app
        if (!isFree) {
            Alert.alert(
                "Payment Required",
                `This event costs €${totalPrice.toFixed(2)}. Complete payment on the web app via PayPal.`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Open Web App",
                        onPress: () =>
                            Linking.openURL(
                                `https://www.sportyexpats.fr/event-registration/${event.id}`
                            ),
                    },
                ]
            );
            return;
        }

        setSubmitting(true);
        setStepError(null);
        try {
            const firstTicket = tickets[0];
            const payerName = firstTicket.name.trim() || username || "Guest";
            const payerEmail = firstTicket.email.trim() || userEmail || `${userId}@sportyexpats.app`;

            const ticketsInfo: TicketInfo[] = tickets.map((t) => ({
                name: t.name.trim() || payerName,
                email: t.email.trim() || payerEmail,
                phone: t.phone ?? "",
                numTickets: 1,
                note: t.note ?? "",
            }));

            await registerFreeEvent({
                userId,
                eventId: event.id,
                participants,
                tickets: ticketsInfo,
                payerName,
                payerEmail,
            });

            Alert.alert(
                "Registered!",
                "You have been registered for this event.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (err: any) {
            const msg =
                err?.response?.data?.error ??
                err?.message ??
                "Registration failed. Please try again.";
            setStepError(Array.isArray(msg) ? msg.join("\n") : msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Guard ────────────────────────────────────────────────────────────────

    if (!event) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Event not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safe} edges={["top"]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={8}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Register for Event</Text>
                    <View style={{ width: 38 }} />
                </View>

                {/* Step tabs */}
                <View style={styles.stepRow}>
                    {STEPS.map((step, i) => {
                        const activeIdx = STEPS.indexOf(activeStep);
                        const isDone = activeIdx > i;
                        const isActive = activeStep === step;
                        return (
                            <TouchableOpacity
                                key={step}
                                style={styles.stepItem}
                                onPress={() => { setStepError(null); setActiveStep(step); }}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.stepDot,
                                    isActive && styles.stepDotActive,
                                    isDone && styles.stepDotDone,
                                ]}>
                                    {isDone
                                        ? <Ionicons name="checkmark" size={12} color="#fff" />
                                        : <Text style={styles.stepDotText}>{i + 1}</Text>
                                    }
                                </View>
                                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                                    {step}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* keyboardShouldPersistTaps="handled" ensures taps on inputs
                    inside a ScrollView correctly focus the input and open the keyboard */}
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* ── Step 1: Select Ticket ── */}
                    {activeStep === "Select Ticket" && (
                        <View style={styles.stepContent}>
                            <View style={styles.priceRow}>
                                <Text style={styles.sectionTitle}>Select Ticket</Text>
                                <View style={styles.priceBadge}>
                                    <Text style={styles.priceText}>
                                        {isFree ? "Free" : `€${totalPrice.toFixed(2)}`}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.card}>
                                <View style={styles.counterRow}>
                                    <Ionicons name="people-outline" size={28} color="#fff" />
                                    <View style={styles.counter}>
                                        <TouchableOpacity style={styles.counterBtn} onPress={decrementParticipants}>
                                            <Ionicons name="remove" size={18} color="#fff" />
                                        </TouchableOpacity>
                                        <Text style={styles.counterValue}>{participants}</Text>
                                        <TouchableOpacity style={styles.counterBtn} onPress={incrementParticipants}>
                                            <Ionicons name="add" size={18} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.availRow}>
                                    <Ionicons name="ticket-outline" size={15} color="#2ecc71" />
                                    <Text style={styles.availText}>{event.availableTickets} tickets available</Text>
                                </View>
                                <Text style={styles.participantLabel}>{participants} Participant(s)</Text>
                            </View>

                            <InlineAlert message={stepError} />

                            <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
                                <Text style={styles.primaryBtnText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── Step 2: Assign Participants ── */}
                    {activeStep === "Assign Participants" && (
                        <View style={styles.stepContent}>
                            <View style={styles.priceRow}>
                                <Text style={styles.sectionTitle}>Assign Participants</Text>
                                <View style={styles.priceBadge}>
                                    <Text style={styles.priceText}>
                                        {isFree ? "Free" : `€${totalPrice.toFixed(2)}`}
                                    </Text>
                                </View>
                            </View>

                            {/* Self-attendance toggle */}
                            <TouchableOpacity
                                style={styles.selfRow}
                                onPress={attending ? clearSelf : fillSelf}
                            >
                                <View style={[styles.checkbox, attending && styles.checkboxChecked]}>
                                    {attending && <Ionicons name="checkmark" size={12} color="#fff" />}
                                </View>
                                <Text style={styles.selfLabel}>I am attending this event</Text>
                            </TouchableOpacity>

                            {tickets.map((ticket, index) => {
                                // Only lock a field if "I am attending" is checked AND
                                // the field actually has a value — if the profile is
                                // incomplete the user must still be able to type.
                                const isSelf = attending && index === 0;
                                const nameEditable = !(isSelf && !!ticket.name);
                                const emailEditable = !(isSelf && !!ticket.email);
                                return (
                                    <View key={index} style={styles.ticketForm}>
                                        <Text style={styles.ticketFormTitle}>
                                            Participant {index + 1}
                                            {ticket.name
                                                ? <Text style={styles.ticketName}> — {ticket.name}</Text>
                                                : null}
                                        </Text>

                                        <Text style={styles.fieldLabel}>
                                            Full Name <Text style={styles.required}>*</Text>
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                !nameEditable && styles.inputLocked,
                                            ]}
                                            value={ticket.name}
                                            onChangeText={(v) => updateTicket(index, "name", v)}
                                            placeholder="Full name"
                                            placeholderTextColor="#6b7280"
                                            editable={nameEditable}
                                            returnKeyType="next"
                                        />

                                        <Text style={styles.fieldLabel}>
                                            Email <Text style={styles.required}>*</Text>
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                !emailEditable && styles.inputLocked,
                                            ]}
                                            value={ticket.email}
                                            onChangeText={(v) => updateTicket(index, "email", v)}
                                            placeholder="Email address"
                                            placeholderTextColor="#6b7280"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={emailEditable}
                                            returnKeyType="next"
                                        />

                                        <Text style={styles.fieldLabel}>Phone (optional)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={ticket.phone}
                                            onChangeText={(v) => updateTicket(index, "phone", v)}
                                            placeholder="Phone number"
                                            placeholderTextColor="#6b7280"
                                            keyboardType="phone-pad"
                                            returnKeyType="next"
                                        />

                                        <Text style={styles.fieldLabel}>Note (optional)</Text>
                                        <TextInput
                                            style={[styles.input, styles.inputMultiline]}
                                            value={ticket.note}
                                            onChangeText={(v) => updateTicket(index, "note", v)}
                                            placeholder="Any notes..."
                                            placeholderTextColor="#6b7280"
                                            multiline
                                            numberOfLines={2}
                                            returnKeyType="done"
                                        />
                                    </View>
                                );
                            })}

                            <InlineAlert message={stepError} />

                            <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
                                <Text style={styles.primaryBtnText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── Step 3: Review & Confirm ── */}
                    {activeStep === "Review & Confirm" && (
                        <View style={styles.stepContent}>
                            <Text style={styles.sectionTitle}>Review & Confirm</Text>

                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>{event.title}</Text>
                                <View style={styles.summaryRow}>
                                    <Ionicons name="people-outline" size={15} color="#9ca3af" />
                                    <Text style={styles.summaryText}>{participants} participant(s)</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Ionicons name="cash-outline" size={15} color="#9ca3af" />
                                    <Text style={styles.summaryText}>
                                        Total: {isFree ? "Free" : `€${totalPrice.toFixed(2)}`}
                                    </Text>
                                </View>
                                {!isFree && (
                                    <View style={styles.paymentNotice}>
                                        <Ionicons name="information-circle-outline" size={16} color="#fbbf24" />
                                        <Text style={styles.paymentNoticeText}>
                                            Payment is completed via PayPal on the web app. Tapping "Proceed" will open it in your browser.
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {tickets.map((t, i) => (
                                <View key={i} style={styles.reviewTicket}>
                                    <Text style={styles.reviewTicketTitle}>Participant {i + 1}</Text>
                                    <Text style={styles.reviewTicketDetail}>{t.name}</Text>
                                    <Text style={styles.reviewTicketDetail}>{t.email}</Text>
                                    {t.phone ? <Text style={styles.reviewTicketDetail}>{t.phone}</Text> : null}
                                    {t.note ? <Text style={[styles.reviewTicketDetail, { color: "#6b7280" }]}>{t.note}</Text> : null}
                                </View>
                            ))}

                            <InlineAlert message={stepError} />

                            <TouchableOpacity
                                style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.primaryBtnText}>
                                        {isFree ? "Confirm Registration" : "Proceed to Payment"}
                                    </Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0d0d0d" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    errorText: { color: "#ef4444", fontSize: 15 },
    scroll: { flex: 1 },

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

    stepRow: {
        flexDirection: "row", justifyContent: "space-around",
        paddingVertical: 14, paddingHorizontal: 8,
        backgroundColor: "#111", borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
    },
    stepItem: { alignItems: "center", gap: 4, flex: 1 },
    stepDot: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: "#374151", alignItems: "center", justifyContent: "center",
    },
    stepDotActive: { backgroundColor: "#166534", borderWidth: 2, borderColor: "#2ecc71" },
    stepDotDone: { backgroundColor: "#2ecc71" },
    stepDotText: { color: "#9ca3af", fontSize: 11, fontWeight: "700" },
    stepLabel: { color: "#6b7280", fontSize: 10, textAlign: "center" },
    stepLabelActive: { color: "#2ecc71", fontWeight: "700" },

    stepContent: { gap: 16 },

    priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    priceBadge: { backgroundColor: "rgba(47,165,102,0.2)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    priceText: { color: "#2ecc71", fontWeight: "700", fontSize: 15 },

    card: { backgroundColor: "#1f1f1f", borderRadius: 12, padding: 16, gap: 12 },
    counterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    counter: { flexDirection: "row", alignItems: "center", gap: 16 },
    counterBtn: {
        width: 36, height: 36, borderRadius: 18,
        borderWidth: 1, borderColor: "#fff",
        alignItems: "center", justifyContent: "center",
    },
    counterValue: { color: "#fff", fontSize: 18, fontWeight: "700", minWidth: 24, textAlign: "center" },
    divider: { height: 1, backgroundColor: "#374151" },
    availRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    availText: { color: "#9ca3af", fontSize: 13 },
    participantLabel: { color: "#fff", fontSize: 14, fontWeight: "600" },

    selfRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
    checkbox: {
        width: 20, height: 20, borderRadius: 4,
        borderWidth: 2, borderColor: "#4b5563",
        alignItems: "center", justifyContent: "center",
    },
    checkboxChecked: { backgroundColor: "#166534", borderColor: "#2ecc71" },
    selfLabel: { color: "#d1d5db", fontSize: 14 },

    ticketForm: { backgroundColor: "#1f1f1f", borderRadius: 12, padding: 14, gap: 4 },
    ticketFormTitle: { color: "#9ca3af", fontSize: 13, fontWeight: "600", marginBottom: 8 },
    ticketName: { color: "#2ecc71" },
    fieldLabel: { color: "#9ca3af", fontSize: 12, marginTop: 6 },
    required: { color: "#ef4444" },
    input: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#2a2a2a",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: "#fff",
        fontSize: 14,
        marginBottom: 2,
    },
    inputLocked: {
        opacity: 0.5,
    },
    inputMultiline: { height: 64, textAlignVertical: "top" },

    summaryCard: { backgroundColor: "#1f1f1f", borderRadius: 12, padding: 16, gap: 10 },
    summaryTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 },
    summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    summaryText: { color: "#d1d5db", fontSize: 14 },
    paymentNotice: {
        flexDirection: "row", alignItems: "flex-start", gap: 8,
        backgroundColor: "rgba(251,191,36,0.1)", borderRadius: 8,
        padding: 10, marginTop: 4,
    },
    paymentNoticeText: { color: "#fbbf24", fontSize: 12, flex: 1, lineHeight: 18 },

    reviewTicket: { backgroundColor: "#1f1f1f", borderRadius: 10, padding: 12, gap: 2 },
    reviewTicketTitle: { color: "#9ca3af", fontSize: 12, fontWeight: "600", marginBottom: 4 },
    reviewTicketDetail: { color: "#d1d5db", fontSize: 13 },

    primaryBtn: {
        backgroundColor: "#166534", borderRadius: 12,
        paddingVertical: 15, alignItems: "center",
        borderWidth: 1, borderColor: "#2ecc71", marginTop: 4,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
