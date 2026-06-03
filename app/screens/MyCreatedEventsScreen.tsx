import React, { useMemo, useState } from "react";
import {
    Animated,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "react-query";
import dayjs from "dayjs";
import { useUserDb } from "@/app/hooks/useUserDb";
import {
    GET_USER_CREATED_EVENTS_KEY,
    getUserCreatedEvents,
} from "@/client/endpoints/events/getUserCreatedEvents";
import type { Event } from "@/client/endpoints/events/types";
import { categoriesList } from "@/components/Create-Events/categories";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];
const CATEGORIES = ["All", ...categoriesList];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
    const opacity = React.useRef(new Animated.Value(0.4)).current;
    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={[sk.card, { opacity }]}>
            <View style={sk.image} />
            <View style={sk.body}>
                <View style={sk.lineLong} />
                <View style={sk.lineMid} />
                <View style={sk.lineShort} />
            </View>
        </Animated.View>
    );
}
const sk = StyleSheet.create({
    card: { backgroundColor: "#1a1a1a", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 14 },
    image: { width: "100%", height: 160, backgroundColor: "#1e1e1e" },
    body: { padding: 14, gap: 10 },
    lineLong: { height: 16, width: "80%", backgroundColor: "#1e1e1e", borderRadius: 4 },
    lineMid: { height: 12, width: "55%", backgroundColor: "#1e1e1e", borderRadius: 4 },
    lineShort: { height: 11, width: "40%", backgroundColor: "#1e1e1e", borderRadius: 4 },
});

export default function MyCreatedEventsScreen() {
    const navigation = useNavigation<any>();
    const { userDb } = useUserDb();
    const currentUser = userDb?.data?.data ?? userDb?.data ?? userDb ?? null;
    const userId = currentUser?.id ?? "";
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusOpen, setStatusOpen] = useState(false);
    const [categoryOpen, setCategoryOpen] = useState(false);

    const { data, isLoading, isError, refetch } = useQuery(
        [GET_USER_CREATED_EVENTS_KEY, userId],
        () => getUserCreatedEvents(userId),
        { enabled: !!userId, retry: 1 },
    );

    const events = useMemo(() => {
        let rows = data?.data ?? [];
        if (statusFilter !== "All") rows = rows.filter((e) => e.status === statusFilter);
        if (categoryFilter !== "All") rows = rows.filter((e) => e.category === categoryFilter);
        return rows;
    }, [data?.data, statusFilter, categoryFilter]);

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => navigation.getParent?.("MainDrawer" as any)?.openDrawer?.()}
                    hitSlop={8}
                >
                    <Ionicons name="menu" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>My Events</Text>
                    <Text style={styles.headerSub}>Events created by you</Text>
                </View>
                <TouchableOpacity style={styles.headerBtn} onPress={() => refetch()} hitSlop={8}>
                    <Ionicons name="refresh-outline" size={20} color="#2ecc71" />
                </TouchableOpacity>
            </View>

            {/* Filter row — two dropdowns */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.filterDropdown, statusFilter !== "All" && styles.filterDropdownActive]}
                    onPress={() => { setStatusOpen(true); setCategoryOpen(false); }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="funnel-outline" size={15} color={statusFilter !== "All" ? "#2ecc71" : "#9CA3AF"} />
                    <Text style={[styles.filterDropdownText, statusFilter !== "All" && styles.filterDropdownTextActive]} numberOfLines={1}>
                        {statusFilter}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterDropdown, categoryFilter !== "All" && styles.filterDropdownActive]}
                    onPress={() => { setCategoryOpen(true); setStatusOpen(false); }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="grid-outline" size={15} color={categoryFilter !== "All" ? "#2ecc71" : "#9CA3AF"} />
                    <Text style={[styles.filterDropdownText, categoryFilter !== "All" && styles.filterDropdownTextActive]} numberOfLines={1}>
                        {categoryFilter}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Status modal */}
            <Modal visible={statusOpen} transparent animationType="fade" onRequestClose={() => setStatusOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStatusOpen(false)}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Filter by status</Text>
                        {STATUS_FILTERS.map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.optionRow, statusFilter === f && styles.optionRowActive]}
                                onPress={() => { setStatusFilter(f); setStatusOpen(false); }}
                            >
                                <Text style={[styles.optionText, statusFilter === f && styles.optionTextActive]}>{f}</Text>
                                {statusFilter === f && <Ionicons name="checkmark" size={18} color="#2ecc71" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Category modal */}
            <Modal visible={categoryOpen} transparent animationType="fade" onRequestClose={() => setCategoryOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryOpen(false)}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Filter by category</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.optionRow, categoryFilter === cat && styles.optionRowActive]}
                                    onPress={() => { setCategoryFilter(cat); setCategoryOpen(false); }}
                                >
                                    <Text style={[styles.optionText, categoryFilter === cat && styles.optionTextActive]}>{cat}</Text>
                                    {categoryFilter === cat && <Ionicons name="checkmark" size={18} color="#2ecc71" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {!userId || isLoading ? (
                <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12, gap: 14 }}>
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </View>
            ) : isError ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
                    <Text style={styles.stateText}>Failed to load your events</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : events.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="calendar-outline" size={52} color="#374151" />
                    <Text style={styles.stateText}>No events found</Text>
                    <Text style={styles.stateSubText}>Created events will appear here.</Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate("EventInfo", { event: item })}
                        >
                            {item.coverImage?.fileUrl ? (
                                <Image source={{ uri: item.coverImage.fileUrl }} style={styles.cardImage} />
                            ) : (
                                <View style={styles.cardImagePlaceholder}>
                                    <Ionicons name="image-outline" size={34} color="#374151" />
                                </View>
                            )}
                            <View style={styles.cardBody}>
                                <View style={styles.cardTop}>
                                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                                    <StatusBadge status={item.status} />
                                </View>
                                <InfoRow icon="calendar-outline" text={dayjs(item.startDate).format("MMM D, YYYY HH:mm")} />
                                <InfoRow icon="location-outline" text={item.location?.name ?? "-"} />
                                <InfoRow icon="ticket-outline" text={`${item.availableTickets} tickets available`} />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

function InfoRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={14} color="#2ecc71" />
            <Text style={styles.infoText} numberOfLines={1}>{text}</Text>
        </View>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusStyle =
        status === "Approved"
            ? styles.statusApproved
            : status === "Rejected"
                ? styles.statusRejected
                : styles.statusPending;

    return (
        <View style={[styles.statusBadge, statusStyle]}>
            <Text style={styles.statusText}>{status || "Pending"}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0d0d0d" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#1e1e1e",
        backgroundColor: "#111",
    },
    headerBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
    headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },
    filterRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#1e1e1e",
    },
    filterDropdown: {
        flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    },
    filterDropdownActive: { borderColor: "#2ecc71", backgroundColor: "#0f2a1a" },
    filterDropdownText: { flex: 1, fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
    filterDropdownTextActive: { color: "#2ecc71", fontWeight: "600" },
    modalOverlay: {
        flex: 1, backgroundColor: "rgba(0,0,0,0.72)",
        justifyContent: "center", paddingHorizontal: 22,
    },
    modalSheet: {
        maxHeight: "70%", backgroundColor: "#1f1f1f",
        borderRadius: 16, borderWidth: 1, borderColor: "#2a2a2a", padding: 16,
    },
    modalTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12 },
    optionRow: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 12, paddingVertical: 13, borderRadius: 10,
    },
    optionRowActive: { backgroundColor: "#0f2a1a" },
    optionText: { color: "#D1D5DB", fontSize: 14 },
    optionTextActive: { color: "#2ecc71", fontWeight: "700" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60 },
    stateText: { fontSize: 16, color: "#6B7280", fontWeight: "500" },
    stateSubText: { fontSize: 13, color: "#374151" },
    retryBtn: { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: "#166534" },
    retryBtnText: { color: "#fff", fontWeight: "600" },
    list: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
    card: {
        backgroundColor: "#1a1a1a",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#1e1e1e",
    },
    cardImage: { width: "100%", height: 160 },
    cardImagePlaceholder: {
        width: "100%",
        height: 160,
        backgroundColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "center",
    },
    cardBody: { padding: 14, gap: 8 },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    cardTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#F9FAFB", lineHeight: 23 },
    infoRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    infoText: { flex: 1, color: "#9CA3AF", fontSize: 12 },
    statusBadge: { borderRadius: 14, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
    statusPending: { backgroundColor: "#f59e0b20", borderColor: "#f59e0b66" },
    statusApproved: { backgroundColor: "#22c55e20", borderColor: "#22c55e66" },
    statusRejected: { backgroundColor: "#ef444420", borderColor: "#ef444466" },
    statusText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
