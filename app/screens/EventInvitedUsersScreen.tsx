import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
    getEventInvitations,
    sendEventInvitation,
    InvitedUser,
    InvitationStatus,
} from "@/client/endpoints/events/eventInvitations";
import { searchUsers } from "@/client/endpoints/users/searchUsers";
import { useUserDb } from "@/app/hooks/useUserDb";
import type { Event } from "@/client/endpoints/events/types";

// ── Status config — mirrors web-app colors ───────────────────────────────────

type StatusConfig = {
    label: string;
    color: string;
    bg: string;
    border: string;
};

const STATUS_MAP: Record<InvitationStatus, StatusConfig> = {
    Pending:     { label: "Pending",      color: "#FCD34D", bg: "rgba(252,211,77,0.12)",  border: "rgba(252,211,77,0.25)"  },
    Accepted:    { label: "Accepted",     color: "#2ecc71", bg: "rgba(46,204,113,0.12)",  border: "rgba(46,204,113,0.25)"  },
    Declined:    { label: "Declined",     color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" },
    Withdrew:    { label: "Withdrew",     color: "#9CA3AF", bg: "rgba(156,163,175,0.1)",  border: "rgba(156,163,175,0.15)" },
    Attended:    { label: "Attended",     color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)"  },
    NotAttended: { label: "Not Attended", color: "#fb923c", bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.25)"  },
};

const FILTER_TABS: { key: "all" | InvitationStatus; label: string }[] = [
    { key: "all",         label: "All"         },
    { key: "Pending",     label: "Pending"     },
    { key: "Accepted",    label: "Accepted"    },
    { key: "Declined",    label: "Declined"    },
    { key: "Attended",    label: "Attended"    },
    { key: "Withdrew",    label: "Withdrew"    },
    { key: "NotAttended", label: "Not Attended"},
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(inv: InvitedUser["invitee"]): string {
    const first = inv.firstName?.[0] ?? "";
    const last  = inv.lastName?.[0]  ?? "";
    return (first + last).toUpperCase() || inv.email[0].toUpperCase();
}

function getDisplayName(inv: InvitedUser["invitee"]): string {
    if (inv.firstName || inv.lastName) {
        return [inv.firstName, inv.lastName].filter(Boolean).join(" ");
    }
    return inv.email;
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InvitationStatus }) {
    const cfg = STATUS_MAP[status] ?? STATUS_MAP.Pending;
    return (
        <View style={[sb.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[sb.text, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
}
const sb = StyleSheet.create({
    badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1 },
    text:  { fontSize: 11, fontWeight: "700" },
});

// ── InviteeRow ────────────────────────────────────────────────────────────────

function InviteeRow({
    item,
    onResend,
    resending,
}: {
    item: InvitedUser;
    onResend: (inv: InvitedUser) => void;
    resending: boolean;
}) {
    const inv = item.invitee;
    const canResend = item.status === "Pending" || item.status === "Declined" || item.status === "Withdrew";

    return (
        <View style={row.card}>
            {/* Avatar */}
            <View style={row.avatar}>
                <Text style={row.avatarText}>{getInitials(inv)}</Text>
            </View>

            {/* Info */}
            <View style={row.info}>
                <Text style={row.name} numberOfLines={1}>{getDisplayName(inv)}</Text>
                <Text style={row.email} numberOfLines={1}>{inv.email}</Text>
            </View>

            {/* Right — badge + resend */}
            <View style={row.right}>
                <StatusBadge status={item.status} />
                {canResend && (
                    <TouchableOpacity
                        style={[row.resendBtn, resending && row.resendBtnDisabled]}
                        onPress={() => onResend(item)}
                        disabled={resending}
                        hitSlop={8}
                    >
                        {resending ? (
                            <ActivityIndicator size={12} color="#2ecc71" />
                        ) : (
                            <Ionicons name="send-outline" size={13} color="#2ecc71" />
                        )}
                        <Text style={row.resendText}>
                            {resending ? "Sending…" : "Resend"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const row = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#1a1a1a",
    },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "rgba(46,204,113,0.12)",
        borderWidth: 1, borderColor: "rgba(46,204,113,0.2)",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
    },
    avatarText: { color: "#2ecc71", fontWeight: "700", fontSize: 14 },
    info: { flex: 1, minWidth: 0 },
    name:  { color: "#fff",     fontSize: 14, fontWeight: "600" },
    email: { color: "#6B7280",  fontSize: 12, marginTop: 2 },
    right: { alignItems: "flex-end", gap: 6, flexShrink: 0 },
    resendBtn: {
        flexDirection: "row", alignItems: "center", gap: 4,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 8, borderWidth: 1,
        borderColor: "rgba(46,204,113,0.35)",
        backgroundColor: "rgba(46,204,113,0.08)",
    },
    resendBtnDisabled: { opacity: 0.5 },
    resendText: { color: "#2ecc71", fontSize: 11, fontWeight: "700" },
});

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <View style={[row.card, { opacity: 0.35 }]}>
            <View style={[row.avatar, { backgroundColor: "#1e1e1e", borderColor: "#1e1e1e" }]} />
            <View style={{ flex: 1, gap: 6 }}>
                <View style={{ height: 13, width: "55%", backgroundColor: "#1e1e1e", borderRadius: 4 }} />
                <View style={{ height: 11, width: "40%", backgroundColor: "#1e1e1e", borderRadius: 4 }} />
            </View>
            <View style={{ width: 60, height: 22, backgroundColor: "#1e1e1e", borderRadius: 20 }} />
        </View>
    );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function EventInvitedUsersScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const event: Event = route?.params?.event;
    const eventId: string = event?.id ?? route?.params?.eventId ?? "";
    const eventTitle: string = event?.title ?? route?.params?.eventTitle ?? "";

    const { userDb } = useUserDb();
    const userId: string = userDb?.data?.id ?? userDb?.id ?? "";

    const [invitations, setInvitations] = useState<InvitedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<"all" | InvitationStatus>("all");
    const [resendingId, setResendingId] = useState<string | null>(null);

    const fetchInvitations = useCallback(async (silent = false) => {
        if (!eventId || !userId) return;
        if (!silent) setLoading(true);
        setError(null);
        try {
            const data = await getEventInvitations(eventId, userId);
            setInvitations(data);
        } catch (err: any) {
            setError(err?.response?.data?.error ?? err?.message ?? "Failed to load invitations.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [eventId, userId]);

    // Refetch every time this screen comes back into focus (e.g. returning from InviteParticipants)
    useFocusEffect(
        useCallback(() => {
            fetchInvitations();
        }, [fetchInvitations])
    );

    const handleResend = useCallback(async (inv: InvitedUser) => {
        if (!userId) return;

        setResendingId(inv.id);
        try {
            // The backend POST /events/:id/invitations expects User.id as personId.
            // The GET response includes invitee.user.id when available — use it.
            // If it's missing (PersonalDetails not linked to a User account in the
            // response), search by email to resolve the User.id.
            let personId: string | undefined = inv.invitee.user?.id;

            if (!personId) {
                const results = await searchUsers(inv.invitee.email, 1);
                const match = results.find(
                    (u) => u.email?.toLowerCase() === inv.invitee.email.toLowerCase()
                );
                personId = match?.id;
            }

            if (!personId) {
                Alert.alert("Failed", "Cannot resend — user account not found for this invitee.");
                return;
            }

            await sendEventInvitation(eventId, {
                personId,
                requestingUserId: userId,
            });
            Alert.alert("Invite Sent", `Invitation resent to ${getDisplayName(inv.invitee)}.`);
            await fetchInvitations(true);
        } catch (err: any) {
            const errMsg = err?.response?.data?.error ?? err?.message ?? "Could not resend invitation.";
            Alert.alert("Failed", errMsg);
        } finally {
            setResendingId(null);
        }
    }, [eventId, userId, fetchInvitations]);

    // Derived counts per tab
    const counts = FILTER_TABS.reduce<Record<string, number>>((acc, tab) => {
        acc[tab.key] = tab.key === "all"
            ? invitations.length
            : invitations.filter((i) => i.status === tab.key).length;
        return acc;
    }, {});

    const filtered = activeFilter === "all"
        ? invitations
        : invitations.filter((i) => i.status === activeFilter);

    const pendingCount = counts["Pending"] ?? 0;

    return (
        <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
            {/* ── Header ── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>Invited Users</Text>
                    {!!eventTitle && (
                        <Text style={s.headerSub} numberOfLines={1}>{eventTitle}</Text>
                    )}
                </View>
                {/* Invite more button */}
                <TouchableOpacity
                    style={s.inviteMoreBtn}
                    hitSlop={8}
                    onPress={() => navigation.navigate("InviteParticipants", { event, eventId, eventTitle })}
                >
                    <Ionicons name="person-add-outline" size={16} color="#2ecc71" />
                    <Text style={s.inviteMoreText}>Invite</Text>
                </TouchableOpacity>
            </View>

            {/* ── Pending callout ── */}
            {!loading && pendingCount > 0 && (
                <View style={s.pendingBanner}>
                    <View style={s.pendingDot} />
                    <Text style={s.pendingText}>
                        <Text style={s.pendingBold}>{pendingCount} pending invitation{pendingCount > 1 ? "s" : ""}</Text>
                        {" "}awaiting response.
                    </Text>
                </View>
            )}

            {/* ── Filter pills ── */}
            {!loading && invitations.length > 0 && (
                <FlatList
                    horizontal
                    data={FILTER_TABS.filter((t) => counts[t.key] > 0 || t.key === "all")}
                    keyExtractor={(t) => t.key}
                    showsHorizontalScrollIndicator={false}
                    style={s.pillsRow}
                    contentContainerStyle={s.pillsContent}
                    renderItem={({ item: tab }) => {
                        const active = activeFilter === tab.key;
                        return (
                            <TouchableOpacity
                                style={[s.pill, active && s.pillActive]}
                                onPress={() => setActiveFilter(tab.key)}
                                activeOpacity={0.8}
                            >
                                <Text style={[s.pillText, active && s.pillTextActive]}>
                                    {tab.label}
                                </Text>
                                {(counts[tab.key] ?? 0) > 0 && (
                                    <View style={[s.pillBadge, active && s.pillBadgeActive]}>
                                        <Text style={[s.pillBadgeText, active && s.pillBadgeTextActive]}>
                                            {counts[tab.key]}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
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
                    <TouchableOpacity style={s.retryBtn} onPress={() => fetchInvitations()}>
                        <Text style={s.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : filtered.length === 0 ? (
                <View style={s.center}>
                    <Ionicons name="people-outline" size={48} color="#374151" />
                    <Text style={s.emptyTitle}>
                        {activeFilter === "all" ? "No invitations sent yet" : `No ${activeFilter.toLowerCase()} invitations`}
                    </Text>
                    <Text style={s.emptySubtitle}>
                        {activeFilter === "all"
                            ? 'Tap "Invite" to invite participants.'
                            : ""}
                    </Text>
                    {activeFilter !== "all" && (
                        <TouchableOpacity onPress={() => setActiveFilter("all")} hitSlop={8}>
                            <Text style={s.showAllLink}>View all invitations</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <InviteeRow
                            item={item}
                            onResend={handleResend}
                            resending={resendingId === item.id}
                        />
                    )}
                    style={s.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchInvitations(true); }}
                            tintColor="#2ecc71"
                        />
                    }
                    ListHeaderComponent={
                        <View style={s.countRow}>
                            <Text style={s.countText}>
                                {filtered.length} {activeFilter === "all" ? "total" : activeFilter.toLowerCase()}
                            </Text>
                        </View>
                    }
                />
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
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
    headerSub: { fontSize: 11, color: "#6B7280", marginTop: 2 },
    inviteMoreBtn: {
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: "rgba(46,204,113,0.1)",
        borderWidth: 1, borderColor: "rgba(46,204,113,0.3)",
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    },
    inviteMoreText: { color: "#2ecc71", fontSize: 13, fontWeight: "700" },

    pendingBanner: {
        flexDirection: "row", alignItems: "center", gap: 10,
        marginHorizontal: 16, marginTop: 12, marginBottom: 4,
        paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: "rgba(252,211,77,0.06)",
        borderWidth: 1, borderColor: "rgba(252,211,77,0.2)",
        borderRadius: 10,
    },
    pendingDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: "#FCD34D",
    },
    pendingText: { flex: 1, color: "#FCD34D", fontSize: 13 },
    pendingBold: { fontWeight: "700" },

    pillsRow: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
    pillsContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8, alignItems: "center" },
    pill: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
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
    emptySubtitle: { color: "#374151", fontSize: 13, textAlign: "center" },
    showAllLink: { color: "#2ecc71", fontSize: 13, fontWeight: "600", marginTop: 4 },
    retryBtn: {
        marginTop: 4, paddingHorizontal: 24, paddingVertical: 10,
        borderRadius: 10, backgroundColor: "#166534",
    },
    retryText: { color: "#fff", fontWeight: "600" },
});
