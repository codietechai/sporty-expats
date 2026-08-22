import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { searchUsers, UserSearchResult } from "@/client/endpoints/users/searchUsers";
import { sendEventInvitation } from "@/client/endpoints/events/eventInvitations";
import { useUserDb } from "@/app/hooks/useUserDb";
import type { Event } from "@/client/endpoints/events/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type InviteStatus = "pending" | "sending" | "sent" | "error";

interface InvitedEntry {
    user: UserSearchResult;
    status: InviteStatus;
    errorMsg?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function getDisplayName(user: UserSearchResult): string {
    if (user.firstName || user.lastName) {
        return [user.firstName, user.lastName].filter(Boolean).join(" ");
    }
    return user.username ?? user.email;
}

function getInitials(user: UserSearchResult): string {
    const first = user.firstName?.[0] ?? "";
    const last  = user.lastName?.[0]  ?? "";
    return (first + last).toUpperCase() || (user.username?.[0] ?? user.email[0]).toUpperCase();
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

const BADGE_STYLE: Record<InviteStatus, { label: string; color: string; bg: string; border: string }> = {
    pending: { label: "Pending",  color: "#FCD34D", bg: "rgba(252,211,77,0.12)",  border: "rgba(252,211,77,0.25)"  },
    sending: { label: "Sending…", color: "#9CA3AF", bg: "rgba(156,163,175,0.08)", border: "rgba(156,163,175,0.15)" },
    sent:    { label: "Invited",  color: "#2ecc71", bg: "rgba(46,204,113,0.12)",  border: "rgba(46,204,113,0.25)"  },
    error:   { label: "Failed",   color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" },
};

function StatusBadge({ status }: { status: InviteStatus }) {
    const cfg = BADGE_STYLE[status];
    return (
        <View style={[badge.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
}
const badge = StyleSheet.create({
    wrap: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1 },
    text: { fontSize: 11, fontWeight: "700" },
});

// ── UserAvatar ────────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 40 }: { user: UserSearchResult; size?: number }) {
    const hasRealImage = !!(user.imageUrl && !user.imageUrl.includes("avatar.svg"));
    if (hasRealImage) {
        return (
            <Image
                source={{ uri: user.imageUrl! }}
                style={{ width: size, height: size, borderRadius: size / 2 }}
            />
        );
    }
    return (
        <View style={[
            av.circle,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: "rgba(46,204,113,0.12)" },
        ]}>
            <Text style={[av.initials, { fontSize: size * 0.38, color: "#2ecc71" }]}>
                {getInitials(user)}
            </Text>
        </View>
    );
}
const av = StyleSheet.create({
    circle: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(46,204,113,0.2)" },
    initials: { fontWeight: "700" },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function InviteParticipantsScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const event: Event | undefined = route?.params?.event;
    const eventId: string  = event?.id  ?? route?.params?.eventId  ?? "";
    const eventTitle: string = event?.title ?? route?.params?.eventTitle ?? "";

    const { userDb } = useUserDb();
    const userId: string = userDb?.data?.id ?? userDb?.id ?? "";

    const [query, setQuery]         = useState("");
    const [results, setResults]     = useState<UserSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDrop, setShowDrop]   = useState(false);
    const [invited, setInvited]     = useState<InvitedEntry[]>([]);
    const [sending, setSending]     = useState(false);
    const [allSent, setAllSent]     = useState(false);

    const inputRef = useRef<TextInput>(null);
    const debouncedQuery = useDebounce(query, 300);

    // ── Search ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
            setResults([]);
            setShowDrop(false);
            return;
        }
        setSearching(true);
        const invitedIds = new Set(invited.map((e) => e.user.id));
        searchUsers(debouncedQuery)
            .then((data) => {
                const filtered = data.filter((u) => !invitedIds.has(u.id) && u.id !== userId);
                setResults(filtered);
                setShowDrop(filtered.length > 0);
            })
            .catch(() => setResults([]))
            .finally(() => setSearching(false));
    }, [debouncedQuery, invited, userId]);

    // Close dropdown when results clear
    useEffect(() => {
        if (results.length === 0 && !searching) setShowDrop(false);
    }, [results, searching]);

    // ── Add / Remove ────────────────────────────────────────────────────────
    const addUser = useCallback((user: UserSearchResult) => {
        if (invited.some((e) => e.user.id === user.id)) return;
        setInvited((prev) => [...prev, { user, status: "pending" }]);
        setResults((prev) => prev.filter((u) => u.id !== user.id));
        setQuery("");
        setShowDrop(false);
        inputRef.current?.focus();
    }, [invited]);

    const removeUser = (userId: string) => {
        setInvited((prev) => prev.filter((e) => e.user.id !== userId));
    };

    // ── Send invites ────────────────────────────────────────────────────────
    const sendInvites = async () => {
        const pending = invited.filter((e) => e.status === "pending");
        if (pending.length === 0 || !userId) return;
        setSending(true);

        // Mark all pending → sending
        setInvited((prev) =>
            prev.map((e) => e.status === "pending" ? { ...e, status: "sending" } : e),
        );

        await Promise.allSettled(
            pending.map(async (entry) => {
                try {
                    await sendEventInvitation(eventId, {
                        personId: entry.user.id,
                        requestingUserId: userId,
                    });
                    setInvited((prev) =>
                        prev.map((e) =>
                            e.user.id === entry.user.id ? { ...e, status: "sent" } : e,
                        ),
                    );
                } catch (err: any) {
                    const msg =
                        err?.response?.data?.error ??
                        err?.message ??
                        "Failed";
                    setInvited((prev) =>
                        prev.map((e) =>
                            e.user.id === entry.user.id
                                ? { ...e, status: "error", errorMsg: msg }
                                : e,
                        ),
                    );
                }
            }),
        );

        setSending(false);
        setAllSent(true);
    };

    const pendingCount = invited.filter((e) => e.status === "pending").length;
    const sentCount    = invited.filter((e) => e.status === "sent").length;
    const isAllSent    = invited.length > 0 && invited.every((e) => e.status === "sent");

    const resetAndInviteMore = () => {
        setInvited([]);
        setAllSent(false);
        setQuery("");
        setShowDrop(false);
        inputRef.current?.focus();
    };

    return (
        <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
            {/* ── Header ── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>Invite Participants</Text>
                    {!!eventTitle && (
                        <Text style={s.headerSub} numberOfLines={1}>{eventTitle}</Text>
                    )}
                </View>
                <View style={{ width: 36 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
            >
                {isAllSent ? (
                    /* ── All sent success state ── */
                    <View style={s.successBlock}>
                        <View style={s.successIcon}>
                            <Ionicons name="checkmark-circle" size={60} color="#2ecc71" />
                        </View>
                        <Text style={s.successTitle}>All invites sent!</Text>
                        <Text style={s.successSub}>
                            {sentCount} participant{sentCount !== 1 ? "s" : ""} will receive their invitation.
                        </Text>
                        <TouchableOpacity style={s.outlineBtn} onPress={resetAndInviteMore}>
                            <Text style={s.outlineBtnText}>Invite More</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.goBack()}>
                            <Text style={s.primaryBtnText}>Back to Event</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={invited}
                        keyExtractor={(e) => e.user.id}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={s.listContent}
                        ListHeaderComponent={
                            <View>
                                {/* ── Search box ── */}
                                <Text style={s.sectionLabel}>
                                    Search users
                                    {invited.length > 0 && (
                                        <Text style={s.selectedCount}>
                                            {"  "}({invited.length} selected)
                                        </Text>
                                    )}
                                </Text>

                                <View style={s.searchWrap}>
                                    <Ionicons name="search-outline" size={16} color="#6B7280" />
                                    <TextInput
                                        ref={inputRef}
                                        style={s.searchInput}
                                        value={query}
                                        onChangeText={(v) => { setQuery(v); if (v.length > 0) setShowDrop(true); }}
                                        placeholder="Search by name, username, or email…"
                                        placeholderTextColor="#6B7280"
                                        autoCorrect={false}
                                        autoCapitalize="none"
                                    />
                                    {searching && <ActivityIndicator size={14} color="#6B7280" />}
                                </View>

                                {/* ── Dropdown results ── */}
                                {showDrop && results.length > 0 && (
                                    <View style={s.dropdown}>
                                        {results.map((user) => (
                                            <TouchableOpacity
                                                key={user.id}
                                                style={s.dropdownRow}
                                                onPress={() => addUser(user)}
                                                activeOpacity={0.8}
                                            >
                                                <UserAvatar user={user} size={36} />
                                                <View style={s.dropdownInfo}>
                                                    <Text style={s.dropdownName} numberOfLines={1}>
                                                        {getDisplayName(user)}
                                                    </Text>
                                                    <Text style={s.dropdownSub} numberOfLines={1}>
                                                        {user.username ? `@${user.username} · ` : ""}{user.email}
                                                    </Text>
                                                </View>
                                                <Ionicons name="add-circle-outline" size={20} color="#2ecc71" />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* No results */}
                                {showDrop && !searching && results.length === 0 && query.length >= 2 && (
                                    <View style={s.noResults}>
                                        <Text style={s.noResultsText}>No users found for "{query}"</Text>
                                    </View>
                                )}

                                {/* ── Invite list header ── */}
                                {invited.length > 0 && (
                                    <View style={s.inviteListHeader}>
                                        <Text style={s.sectionLabel}>
                                            To invite{" "}
                                            <Text style={s.selectedCount}>({invited.length} selected)</Text>
                                        </Text>
                                        {sentCount > 0 && (
                                            <Text style={s.sentCount}>
                                                {sentCount} invite{sentCount > 1 ? "s" : ""} sent
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        }
                        renderItem={({ item: entry }) => (
                            <View style={s.inviteRow}>
                                <UserAvatar user={entry.user} size={38} />
                                <View style={s.inviteInfo}>
                                    <Text style={s.inviteName} numberOfLines={1}>
                                        {getDisplayName(entry.user)}
                                    </Text>
                                    <Text style={s.inviteSub} numberOfLines={1}>
                                        {entry.user.username ? `@${entry.user.username}` : ""}
                                        {entry.errorMsg ? (
                                            <Text style={{ color: "#f87171" }}>{" "}· {entry.errorMsg}</Text>
                                        ) : null}
                                    </Text>
                                </View>
                                <View style={s.inviteRight}>
                                    <StatusBadge status={entry.status} />
                                    {entry.status !== "sent" && (
                                        <TouchableOpacity
                                            style={[s.removeBtn, entry.status === "sending" && { opacity: 0.3 }]}
                                            onPress={() => removeUser(entry.user.id)}
                                            disabled={entry.status === "sending"}
                                            hitSlop={10}
                                        >
                                            <Ionicons name="close" size={14} color="#6B7280" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={s.emptyBlock}>
                                <Ionicons name="people-outline" size={44} color="#374151" />
                                <Text style={s.emptyText}>
                                    Search for users above to add them to your invite list
                                </Text>
                            </View>
                        }
                        ListFooterComponent={
                            invited.length > 0 && !isAllSent ? (
                                <View style={s.footer}>
                                    <TouchableOpacity
                                        style={s.cancelBtn}
                                        onPress={() => navigation.goBack()}
                                    >
                                        <Text style={s.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            s.sendBtn,
                                            (sending || pendingCount === 0) && s.sendBtnDisabled,
                                        ]}
                                        onPress={sendInvites}
                                        disabled={sending || pendingCount === 0}
                                        activeOpacity={0.85}
                                    >
                                        {sending ? (
                                            <ActivityIndicator size="small" color="#000" />
                                        ) : (
                                            <>
                                                <Ionicons name="send-outline" size={15} color="#000" />
                                                <Text style={s.sendBtnText}>
                                                    Send {pendingCount > 0 ? `${pendingCount} ` : ""}
                                                    Invite{pendingCount !== 1 ? "s" : ""}
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ) : null
                        }
                    />
                )}
            </KeyboardAvoidingView>
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

    listContent: { padding: 16, paddingBottom: 40 },

    sectionLabel: { color: "#D1D5DB", fontSize: 14, fontWeight: "700", marginBottom: 10, marginTop: 6 },
    selectedCount: { color: "#6B7280", fontWeight: "400" },

    // Search
    searchWrap: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        marginBottom: 4,
    },
    searchInput: { flex: 1, color: "#fff", fontSize: 14 },

    // Dropdown
    dropdown: {
        backgroundColor: "#161616", borderWidth: 1, borderColor: "#2a2a2a",
        borderRadius: 12, overflow: "hidden", marginBottom: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
    },
    dropdownRow: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
    },
    dropdownInfo: { flex: 1, minWidth: 0 },
    dropdownName: { color: "#fff", fontSize: 14, fontWeight: "600" },
    dropdownSub:  { color: "#6B7280", fontSize: 12, marginTop: 1 },
    noResults: {
        backgroundColor: "#161616", borderWidth: 1, borderColor: "#2a2a2a",
        borderRadius: 12, paddingVertical: 18, paddingHorizontal: 14,
        alignItems: "center", marginBottom: 16,
    },
    noResultsText: { color: "#6B7280", fontSize: 13 },

    // Invite list
    inviteListHeader: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", marginTop: 8, marginBottom: 4,
    },
    sentCount: { color: "#2ecc71", fontSize: 12, fontWeight: "600" },
    inviteRow: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingVertical: 12, paddingHorizontal: 2,
        borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
    },
    inviteInfo: { flex: 1, minWidth: 0 },
    inviteName: { color: "#fff",    fontSize: 14, fontWeight: "600" },
    inviteSub:  { color: "#6B7280", fontSize: 12, marginTop: 2 },
    inviteRight: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
    removeBtn: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },

    // Footer buttons
    footer: {
        flexDirection: "row", gap: 12, marginTop: 20,
    },
    cancelBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12,
        borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    cancelText: { color: "#9CA3AF", fontSize: 14, fontWeight: "600" },
    sendBtn: {
        flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 14, borderRadius: 12,
        backgroundColor: "#2ecc71",
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },

    // Empty state
    emptyBlock: {
        alignItems: "center", gap: 12, paddingVertical: 48,
        borderWidth: 1, borderColor: "#1e1e1e", borderStyle: "dashed",
        borderRadius: 14, marginTop: 8,
    },
    emptyText: { color: "#6B7280", fontSize: 14, textAlign: "center", paddingHorizontal: 16 },

    // Success state
    successBlock: {
        flex: 1, alignItems: "center", justifyContent: "center",
        gap: 14, paddingHorizontal: 32,
    },
    successIcon: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: "rgba(46,204,113,0.1)",
        borderWidth: 1, borderColor: "rgba(46,204,113,0.25)",
        alignItems: "center", justifyContent: "center",
        marginBottom: 8,
    },
    successTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
    successSub: {
        fontSize: 14, color: "#9CA3AF",
        textAlign: "center", lineHeight: 22,
    },
    outlineBtn: {
        width: "100%", paddingVertical: 14, borderRadius: 12,
        borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
        marginTop: 8,
    },
    outlineBtnText: { color: "#9CA3AF", fontSize: 14, fontWeight: "600" },
    primaryBtn: {
        width: "100%", paddingVertical: 14, borderRadius: 12,
        backgroundColor: "#2ecc71",
        alignItems: "center", justifyContent: "center",
    },
    primaryBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },
});
