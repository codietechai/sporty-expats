import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
    getEventParticipants,
    removeEventParticipant,
    IParticipant,
} from "@/client/endpoints/events/getEventParticipants";
import { useUserDb } from "@/app/hooks/useUserDb";
import type { Event } from "@/client/endpoints/events/types";
import dayjs from "dayjs";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDisplayName(p: IParticipant): string {
    const f = p.firstName?.trim();
    const l = p.lastName?.trim();
    if (f && l) return `${f} ${l}`;
    if (f) return f;
    if (l) return l;
    return p.email;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    if (!dateStr || d.getTime() === 0 || isNaN(d.getTime())) return "—";
    return dayjs(d).format("MMM D, YYYY HH:mm");
}

// ── Status badge ──────────────────────────────────────────────────────────────

type StatusConfig = { color: string; bg: string; border: string };

const STATUS_CONFIG: Record<string, StatusConfig> = {
    Going:      { color: "#2ecc71", bg: "rgba(46,204,113,0.12)",  border: "rgba(46,204,113,0.3)"  },
    Invited:    { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)"  },
    Withdrew:   { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
    Removed:    { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
    NotAttended:{ color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.3)"  },
    Attended:   { color: "#2ecc71", bg: "rgba(46,204,113,0.12)",  border: "rgba(46,204,113,0.3)"  },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.2)" };
    return (
        <View style={[badge.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[badge.text, { color: cfg.color }]}>{status}</Text>
        </View>
    );
}

function RoleBadge({ role }: { role?: string }) {
    const isOrg = role === "Organizer";
    return (
        <View style={[badge.wrap, isOrg ? badge.orgBg : badge.partBg]}>
            <Text style={[badge.text, isOrg ? badge.orgText : badge.partText]}>{role ?? "Participant"}</Text>
        </View>
    );
}

const badge = StyleSheet.create({
    wrap:     { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
    text:     { fontSize: 11, fontWeight: "700" },
    orgBg:    { backgroundColor: "rgba(96,165,250,0.12)", borderColor: "rgba(96,165,250,0.3)" },
    orgText:  { color: "#60a5fa" },
    partBg:   { backgroundColor: "rgba(156,163,175,0.08)", borderColor: "rgba(156,163,175,0.2)" },
    partText: { color: "#9CA3AF" },
});

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <View style={[row.card, { opacity: 0.3 }]}>
            <View style={row.avatarWrap}>
                <View style={[row.avatar, { backgroundColor: "#1e1e1e", borderColor: "#1e1e1e" }]} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
                <View style={{ height: 13, width: "55%", backgroundColor: "#1e1e1e", borderRadius: 4 }} />
                <View style={{ height: 11, width: "40%", backgroundColor: "#1e1e1e", borderRadius: 4 }} />
            </View>
            <View style={{ width: 56, height: 22, backgroundColor: "#1e1e1e", borderRadius: 20 }} />
        </View>
    );
}

// ── Participant card ──────────────────────────────────────────────────────────

function ParticipantCard({
    item,
    onRemove,
    removing,
}: {
    item: IParticipant;
    onRemove: (p: IParticipant) => void;
    removing: boolean;
}) {
    const canRemove = item.attendantStatus !== "Withdrew" && item.attendantStatus !== "Removed";
    const initials = getDisplayName(item).slice(0, 2).toUpperCase();

    return (
        <View style={row.card}>
            {/* Avatar */}
            <View style={row.avatarWrap}>
                <View style={row.avatar}>
                    <Text style={row.avatarText}>{initials}</Text>
                </View>
            </View>

            {/* Main info */}
            <View style={row.info}>
                <View style={row.topRow}>
                    <Text style={row.name} numberOfLines={1}>{getDisplayName(item)}</Text>
                    <RoleBadge role={item.role} />
                </View>
                <Text style={row.email} numberOfLines={1}>{item.email}</Text>

                {/* Metrics row */}
                <View style={row.metricsRow}>
                    <MetricChip icon="ticket-outline" label={`${item.ticketsAssigned} ticket${item.ticketsAssigned !== 1 ? "s" : ""}`} />
                    <MetricChip icon="cash-outline" label={formatCurrency(item.amountPaid)} />
                </View>

                {/* Paid at / paid by */}
                {item.paidAt && new Date(item.paidAt).getTime() > 0 && (
                    <View style={row.metricsRow}>
                        <MetricChip icon="calendar-outline" label={formatDate(item.paidAt)} />
                        {item.paidByName && (
                            <MetricChip icon="person-outline" label={`Paid by ${item.paidByName}`} />
                        )}
                        {!item.paidByName && (
                            <MetricChip icon="person-outline" label="Self" muted />
                        )}
                    </View>
                )}

                {/* Status + remove button */}
                <View style={row.bottomRow}>
                    <StatusBadge status={item.attendantStatus} />
                    {canRemove && (
                        <TouchableOpacity
                            style={[row.removeBtn, removing && row.removeBtnDisabled]}
                            onPress={() => onRemove(item)}
                            disabled={removing}
                            hitSlop={8}
                        >
                            {removing ? (
                                <ActivityIndicator size={12} color="#f87171" />
                            ) : (
                                <Ionicons name="person-remove-outline" size={13} color="#f87171" />
                            )}
                            <Text style={row.removeBtnText}>{removing ? "Removing…" : "Remove"}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

function MetricChip({ icon, label, muted }: { icon: keyof typeof Ionicons.glyphMap; label: string; muted?: boolean }) {
    return (
        <View style={row.chip}>
            <Ionicons name={icon} size={11} color={muted ? "#4B5563" : "#6B7280"} />
            <Text style={[row.chipText, muted && { color: "#4B5563", fontStyle: "italic" }]}>{label}</Text>
        </View>
    );
}

const row = StyleSheet.create({
    card: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#1a1a1a",
        gap: 12,
    },
    avatarWrap: { paddingTop: 2 },
    avatar: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: "rgba(46,204,113,0.1)",
        borderWidth: 1, borderColor: "rgba(46,204,113,0.2)",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
    },
    avatarText: { color: "#2ecc71", fontWeight: "700", fontSize: 14 },
    info: { flex: 1, gap: 5 },
    topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    name: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "700" },
    email: { color: "#6B7280", fontSize: 12 },
    metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1, borderColor: "#1e1e1e",
        borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    },
    chipText: { color: "#6B7280", fontSize: 11 },
    bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
    removeBtn: {
        flexDirection: "row", alignItems: "center", gap: 4,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 8, borderWidth: 1,
        borderColor: "rgba(248,113,113,0.35)",
        backgroundColor: "rgba(248,113,113,0.07)",
    },
    removeBtnDisabled: { opacity: 0.5 },
    removeBtnText: { color: "#f87171", fontSize: 11, fontWeight: "700" },
});

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTERS = ["All", "Going", "Invited", "Withdrew", "Removed"] as const;
type Filter = typeof FILTERS[number];

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function EventParticipantsScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const event: Event = route?.params?.event;
    const eventId: string = event?.id ?? route?.params?.eventId ?? "";
    const eventTitle: string = event?.title ?? route?.params?.eventTitle ?? "";

    const { userDb } = useUserDb();
    const userId: string = userDb?.data?.id ?? userDb?.id ?? "";

    const [participants, setParticipants] = useState<IParticipant[]>([]);
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<Filter>("All");
    const [removingId, setRemovingId]     = useState<string | null>(null);

    // Remove confirmation modal
    const [confirmTarget, setConfirmTarget] = useState<IParticipant | null>(null);

    const fetchParticipants = useCallback(async (silent = false) => {
        if (!eventId || !userId) return;
        if (!silent) setLoading(true);
        setError(null);
        try {
            const data = await getEventParticipants(eventId, userId);
            setParticipants(data);
        } catch (err: any) {
            setError(err?.response?.data?.error ?? err?.message ?? "Failed to load participants.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [eventId, userId]);

    useFocusEffect(useCallback(() => { fetchParticipants(); }, [fetchParticipants]));

    const handleRemoveConfirm = useCallback(async () => {
        if (!confirmTarget || !userId) return;
        const target = confirmTarget;
        setConfirmTarget(null);
        setRemovingId(target.attendeeId);
        try {
            await removeEventParticipant(eventId, target.personId, userId);
            // Optimistic update
            setParticipants((prev) =>
                prev.map((p) =>
                    p.attendeeId === target.attendeeId
                        ? { ...p, attendantStatus: "Removed" }
                        : p,
                ),
            );
        } catch (err: any) {
            Alert.alert(
                "Failed",
                err?.response?.data?.error ?? err?.message ?? "Could not remove participant.",
            );
            // Re-fetch to sync
            fetchParticipants(true);
        } finally {
            setRemovingId(null);
        }
    }, [confirmTarget, userId, eventId, fetchParticipants]);

    // Counts per tab
    const counts: Record<Filter, number> = {
        All:      participants.length,
        Going:    participants.filter((p) => p.attendantStatus === "Going").length,
        Invited:  participants.filter((p) => p.attendantStatus === "Invited").length,
        Withdrew: participants.filter((p) => p.attendantStatus === "Withdrew").length,
        Removed:  participants.filter((p) => p.attendantStatus === "Removed").length,
    };

    const filtered = activeFilter === "All"
        ? participants
        : participants.filter((p) => p.attendantStatus === activeFilter);

    return (
        <SafeAreaView style={s.safe} edges={["top", "bottom"]}>

            {/* ── Header ── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>Participants</Text>
                    {!!eventTitle && (
                        <Text style={s.headerSub} numberOfLines={1}>{eventTitle}</Text>
                    )}
                </View>
                {/* Invite button */}
                <TouchableOpacity
                    style={s.inviteBtn}
                    hitSlop={8}
                    onPress={() => navigation.navigate("InviteParticipants", { event, eventId, eventTitle })}
                >
                    <Ionicons name="person-add-outline" size={16} color="#2ecc71" />
                    <Text style={s.inviteBtnText}>Invite</Text>
                </TouchableOpacity>
            </View>

            {/* ── Summary bar ── */}
            {!loading && participants.length > 0 && (
                <View style={s.summaryBar}>
                    <SumChip icon="people-outline"  label={`${counts.Going} Going`}   color="#2ecc71" />
                    <SumChip icon="mail-outline"    label={`${counts.Invited} Invited`} color="#60a5fa" />
                    <SumChip icon="close-circle-outline" label={`${counts.Withdrew} Withdrew`} color="#f87171" />
                </View>
            )}

            {/* ── Filter pills ── */}
            {!loading && participants.length > 0 && (
                <View style={s.pillsRow}>
                    {FILTERS.filter((f) => counts[f] > 0 || f === "All").map((f) => {
                        const active = activeFilter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[s.pill, active && s.pillActive]}
                                onPress={() => setActiveFilter(f)}
                                activeOpacity={0.8}
                            >
                                <Text style={[s.pillText, active && s.pillTextActive]}>{f}</Text>
                                {counts[f] > 0 && (
                                    <View style={[s.pillBadge, active && s.pillBadgeActive]}>
                                        <Text style={[s.pillBadgeText, active && s.pillBadgeTextActive]}>
                                            {counts[f]}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* ── Content ── */}
            {loading ? (
                <View style={s.listContainer}>
                    {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                </View>
            ) : error ? (
                <View style={s.center}>
                    <Ionicons name="alert-circle-outline" size={48} color="#374151" />
                    <Text style={s.errorText}>{error}</Text>
                    <TouchableOpacity style={s.retryBtn} onPress={() => fetchParticipants()}>
                        <Text style={s.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : filtered.length === 0 ? (
                <View style={s.center}>
                    <Ionicons name="people-outline" size={48} color="#374151" />
                    <Text style={s.emptyTitle}>
                        {activeFilter === "All" ? "No participants yet" : `No ${activeFilter.toLowerCase()} participants`}
                    </Text>
                    {activeFilter !== "All" && (
                        <TouchableOpacity onPress={() => setActiveFilter("All")} hitSlop={8}>
                            <Text style={s.showAllLink}>View all participants</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.attendeeId}
                    style={s.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchParticipants(true); }}
                            tintColor="#2ecc71"
                        />
                    }
                    ListHeaderComponent={
                        <View style={s.countRow}>
                            <Text style={s.countText}>
                                {filtered.length} {activeFilter === "All" ? "total" : activeFilter.toLowerCase()}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <ParticipantCard
                            item={item}
                            onRemove={setConfirmTarget}
                            removing={removingId === item.attendeeId}
                        />
                    )}
                />
            )}

            {/* ── Remove confirmation modal ── */}
            <Modal
                visible={!!confirmTarget}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmTarget(null)}
            >
                <View style={modal.overlay}>
                    <View style={modal.sheet}>
                        <View style={modal.iconWrap}>
                            <Ionicons name="person-remove-outline" size={32} color="#f87171" />
                        </View>
                        <Text style={modal.title}>Remove Participant</Text>
                        <Text style={modal.body}>
                            Are you sure you want to remove{" "}
                            <Text style={{ color: "#fff", fontWeight: "700" }}>
                                {confirmTarget ? getDisplayName(confirmTarget) : ""}
                            </Text>
                            {" "}from this event? Their ticket will be expired and their spot restored.
                        </Text>
                        <View style={modal.btnRow}>
                            <TouchableOpacity
                                style={modal.cancelBtn}
                                onPress={() => setConfirmTarget(null)}
                            >
                                <Text style={modal.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={modal.confirmBtn}
                                onPress={handleRemoveConfirm}
                            >
                                <Text style={modal.confirmText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

function SumChip({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) {
    return (
        <View style={[s.sumChip, { borderColor: `${color}33` }]}>
            <Ionicons name={icon} size={13} color={color} />
            <Text style={[s.sumChipText, { color }]}>{label}</Text>
        </View>
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
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
    headerSub: { fontSize: 11, color: "#6B7280", marginTop: 2 },
    inviteBtn: {
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: "rgba(46,204,113,0.1)",
        borderWidth: 1, borderColor: "rgba(46,204,113,0.3)",
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    },
    inviteBtnText: { color: "#2ecc71", fontSize: 13, fontWeight: "700" },

    summaryBar: {
        flexDirection: "row", gap: 8,
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
    },
    sumChip: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 8, borderWidth: 1,
        backgroundColor: "rgba(255,255,255,0.03)",
    },
    sumChipText: { fontSize: 12, fontWeight: "600" },

    pillsRow: {
        flexDirection: "row", flexWrap: "wrap", gap: 8,
        paddingHorizontal: 14, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
    },
    pill: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
        borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#1a1a1a",
    },
    pillActive: { backgroundColor: "rgba(22,101,52,0.18)", borderColor: "#2ecc71" },
    pillText: { color: "#9ca3af", fontSize: 13, fontWeight: "500" },
    pillTextActive: { color: "#2ecc71", fontWeight: "700" },
    pillBadge: { backgroundColor: "#2a2a2a", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
    pillBadgeActive: { backgroundColor: "rgba(46,204,113,0.2)" },
    pillBadgeText: { color: "#6b7280", fontSize: 10, fontWeight: "700" },
    pillBadgeTextActive: { color: "#2ecc71" },

    listContainer: { flex: 1 },
    countRow: { paddingHorizontal: 16, paddingVertical: 10 },
    countText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },

    center: {
        flex: 1, alignItems: "center", justifyContent: "center",
        gap: 10, paddingBottom: 60, paddingHorizontal: 24,
    },
    errorText: { color: "#6B7280", fontSize: 15, textAlign: "center" },
    emptyTitle: { color: "#6B7280", fontSize: 16, fontWeight: "600", textAlign: "center" },
    showAllLink: { color: "#2ecc71", fontSize: 13, fontWeight: "600", marginTop: 4 },
    retryBtn: {
        marginTop: 4, paddingHorizontal: 24, paddingVertical: 10,
        borderRadius: 10, backgroundColor: "#166534",
    },
    retryText: { color: "#fff", fontWeight: "600" },
});

const modal = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: "rgba(0,0,0,0.75)",
        justifyContent: "center", paddingHorizontal: 28,
    },
    sheet: {
        backgroundColor: "#1a1a1a", borderRadius: 18,
        borderWidth: 1, borderColor: "#2a2a2a",
        padding: 24, alignItems: "center", gap: 12,
    },
    iconWrap: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: "rgba(248,113,113,0.1)",
        borderWidth: 1, borderColor: "rgba(248,113,113,0.25)",
        alignItems: "center", justifyContent: "center",
        marginBottom: 4,
    },
    title: { fontSize: 18, fontWeight: "700", color: "#fff" },
    body: {
        fontSize: 14, color: "#9CA3AF",
        textAlign: "center", lineHeight: 22,
    },
    btnRow: { flexDirection: "row", gap: 12, marginTop: 8, width: "100%" },
    cancelBtn: {
        flex: 1, paddingVertical: 13, borderRadius: 12,
        borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center",
    },
    cancelText: { color: "#9CA3AF", fontWeight: "600", fontSize: 14 },
    confirmBtn: {
        flex: 1, paddingVertical: 13, borderRadius: 12,
        backgroundColor: "rgba(248,113,113,0.15)",
        borderWidth: 1, borderColor: "rgba(248,113,113,0.4)",
        alignItems: "center",
    },
    confirmText: { color: "#f87171", fontWeight: "700", fontSize: 14 },
});
