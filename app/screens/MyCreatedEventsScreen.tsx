import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
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

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function MyCreatedEventsScreen() {
    const navigation = useNavigation<any>();
    const { userDb } = useUserDb();
    const currentUser = userDb?.data?.data ?? userDb?.data ?? userDb ?? null;
    const userId = currentUser?.id ?? "";
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

    const { data, isLoading, isError, refetch } = useQuery(
        [GET_USER_CREATED_EVENTS_KEY, userId],
        () => getUserCreatedEvents(userId),
        { enabled: !!userId, retry: 1 },
    );

    const events = useMemo(() => {
        const rows = data?.data ?? [];
        if (statusFilter === "All") return rows;
        return rows.filter((event) => event.status === statusFilter);
    }, [data?.data, statusFilter]);

    return (
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
            <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

            <View style={styles.titleRow}>
                <View>
                    <Text style={styles.pageTitle}>My Events</Text>
                    <Text style={styles.pageSub}>Events created by you</Text>
                </View>
                <TouchableOpacity style={styles.iconBtn} onPress={() => refetch()}>
                    <Ionicons name="refresh-outline" size={20} color="#2ecc71" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
                {STATUS_FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterPill, statusFilter === filter && styles.filterPillActive]}
                        onPress={() => setStatusFilter(filter)}
                    >
                        <Text style={[styles.filterText, statusFilter === filter && styles.filterTextActive]}>
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {!userId || isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2ecc71" />
                    <Text style={styles.stateText}>Loading your events...</Text>
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
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    pageTitle: { fontSize: 26, fontWeight: "700", color: "#fff" },
    pageSub: { color: "#6B7280", fontSize: 13, marginTop: 3 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#1f2937",
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
    },
    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 14,
    },
    filterPill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: "#1a1a1a",
        borderWidth: 1,
        borderColor: "#2a2a2a",
    },
    filterPillActive: { backgroundColor: "#166534", borderColor: "#2ecc71" },
    filterText: { color: "#9CA3AF", fontSize: 13, fontWeight: "600" },
    filterTextActive: { color: "#fff" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60 },
    stateText: { fontSize: 16, color: "#6B7280", fontWeight: "500" },
    stateSubText: { fontSize: 13, color: "#374151" },
    retryBtn: { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: "#166534" },
    retryBtnText: { color: "#fff", fontWeight: "600" },
    list: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
    card: {
        backgroundColor: "#111827",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#1f2937",
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
