import React, { useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    Modal,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEvents } from "@/app/hooks/useEvents";
import type { Event } from "@/client/endpoints/events/types";
import { categoriesList } from "@/components/Create-Events/categories";
import dayjs from "dayjs";

const CATEGORIES = ["All", ...categoriesList];

type TimeFilter = "upcoming" | "ongoing" | "past";
const TIME_FILTERS: { label: string; value: TimeFilter }[] = [
    { label: "Upcoming", value: "upcoming" },
    { label: "Ongoing", value: "ongoing" },
    { label: "Past", value: "past" },
];

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
                <View style={sk.lineShort} />
                <View style={sk.footer}>
                    <View style={sk.dot} />
                    <View style={sk.lineXShort} />
                </View>
            </View>
        </Animated.View>
    );
}

function EventListSkeleton() {
    return (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 4, gap: 14 }}>
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </View>
    );
}

const sk = StyleSheet.create({
    card: {
        backgroundColor: "#111827",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#1f2937",
        marginBottom: 14,
    },
    image: { width: "100%", height: 160, backgroundColor: "#1f2937" },
    body: { padding: 14, gap: 10 },
    lineLong: { height: 16, width: "80%", backgroundColor: "#1f2937", borderRadius: 4 },
    lineMid: { height: 12, width: "55%", backgroundColor: "#1f2937", borderRadius: 4 },
    lineShort: { height: 11, width: "45%", backgroundColor: "#1f2937", borderRadius: 4 },
    lineXShort: { height: 11, width: "25%", backgroundColor: "#1f2937", borderRadius: 4 },
    footer: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#1f2937" },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#1f2937" },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function EventsListScreen() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);
    const navigation = useNavigation<any>();

    const {
        events, isLoading, isError,
        updateFilters, resetFilters,
        hasNextPage, hasPrevPage, goToNextPage, goToPrevPage,
        currentPage, pageSize,
    } = useEvents({ timeFilter: "upcoming" });

    const handleTimeFilterChange = (f: TimeFilter) => {
        setTimeFilter(f);
        updateFilters({ timeFilter: f });
    };

    const handleCategorySelect = (cat: string) => {
        setSelectedCategory(cat);
        updateFilters({ category: cat === "All" ? undefined : cat });
    };

    const handleReset = () => {
        setSelectedCategory("All");
        setTimeFilter("upcoming");
        resetFilters();
        updateFilters({ timeFilter: "upcoming" });
    };

    // Counts for the info bar
    const countFrom = events.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const countTo = (currentPage - 1) * pageSize + events.length;

    const PaginationFooter = () => {
        if (!hasNextPage && !hasPrevPage) return null;
        return (
            <View style={styles.paginationWrap}>
                {/* Range info */}
                <Text style={styles.rangeText}>
                    Showing {countFrom}–{countTo} events
                    {!hasNextPage ? " · End of list" : ""}
                </Text>

                <View style={styles.pagination}>
                    <TouchableOpacity
                        style={[styles.pageBtn, !hasPrevPage && styles.pageBtnDisabled]}
                        onPress={goToPrevPage}
                        disabled={!hasPrevPage}
                    >
                        <Ionicons name="chevron-back" size={16} color={hasPrevPage ? "#fff" : "#374151"} />
                        <Text style={[styles.pageBtnText, !hasPrevPage && styles.pageBtnTextDisabled]}>Prev</Text>
                    </TouchableOpacity>

                    <View style={styles.pageIndicator}>
                        <Text style={styles.pageIndicatorText}>Page {currentPage}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.pageBtn, !hasNextPage && styles.pageBtnDisabled]}
                        onPress={goToNextPage}
                        disabled={!hasNextPage}
                    >
                        <Text style={[styles.pageBtnText, !hasNextPage && styles.pageBtnTextDisabled]}>Next</Text>
                        <Ionicons name="chevron-forward" size={16} color={hasNextPage ? "#fff" : "#374151"} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
            <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

            {/* Header — same pattern as profile screen */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => navigation.getParent?.("MainDrawer" as any)?.openDrawer?.()}
                    hitSlop={8}
                >
                    <Ionicons name="menu" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Events</Text>
                    <Text style={styles.headerSub}>Browse and filter events</Text>
                </View>
                <TouchableOpacity style={styles.headerBtn} onPress={handleReset} hitSlop={8}>
                    <Ionicons name="options-outline" size={20} color="#2ecc71" />
                </TouchableOpacity>
            </View>

            {/* Filter row — two dropdowns side by side */}
            <View style={styles.filterRow}>
                {/* Time filter dropdown */}
                <TouchableOpacity
                    style={styles.filterDropdown}
                    onPress={() => { setTimeOpen(true); setCategoryOpen(false); }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="time-outline" size={15} color="#2ecc71" />
                    <Text style={styles.filterDropdownText}>
                        {TIME_FILTERS.find(f => f.value === timeFilter)?.label ?? "Upcoming"}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Category dropdown */}
                <TouchableOpacity
                    style={[styles.filterDropdown, selectedCategory !== "All" && styles.filterDropdownActive]}
                    onPress={() => { setCategoryOpen(true); setTimeOpen(false); }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="grid-outline" size={15} color={selectedCategory !== "All" ? "#2ecc71" : "#9CA3AF"} />
                    <Text style={[styles.filterDropdownText, selectedCategory !== "All" && styles.filterDropdownTextActive]} numberOfLines={1}>
                        {selectedCategory}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Time filter modal */}
            <Modal visible={timeOpen} transparent animationType="fade" onRequestClose={() => setTimeOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTimeOpen(false)}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Filter by time</Text>
                        {TIME_FILTERS.map((f) => (
                            <TouchableOpacity
                                key={f.value}
                                style={[styles.optionRow, timeFilter === f.value && styles.optionRowActive]}
                                onPress={() => { handleTimeFilterChange(f.value); setTimeOpen(false); }}
                            >
                                <Text style={[styles.optionText, timeFilter === f.value && styles.optionTextActive]}>{f.label}</Text>
                                {timeFilter === f.value && <Ionicons name="checkmark" size={18} color="#2ecc71" />}
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
                                    style={[styles.optionRow, selectedCategory === cat && styles.optionRowActive]}
                                    onPress={() => { handleCategorySelect(cat); setCategoryOpen(false); }}
                                >
                                    <Text style={[styles.optionText, selectedCategory === cat && styles.optionTextActive]}>{cat}</Text>
                                    {selectedCategory === cat && <Ionicons name="checkmark" size={18} color="#2ecc71" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Content */}
            {isLoading ? (
                <EventListSkeleton />
            ) : isError ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
                    <Text style={styles.stateText}>Failed to load events</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={handleReset}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : events.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="calendar-outline" size={52} color="#374151" />
                    <Text style={styles.stateText}>No events found</Text>
                    <Text style={styles.stateSubText}>Try adjusting your filters</Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => <EventCard event={item} />}
                    ListFooterComponent={<PaginationFooter />}
                />
            )}
        </SafeAreaView>
    );
}

// ── Event Card ────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
    const navigation = useNavigation<any>();
    const formattedDate = dayjs(event.startDate).format("MMM D, YYYY · HH:mm");
    const endDate = dayjs(event.endDate).format("MMM D");

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("EventInfo", { event })}
        >
            {event.coverImage?.fileUrl ? (
                <Image source={{ uri: event.coverImage.fileUrl }} style={styles.cardImage} />
            ) : (
                <View style={styles.cardImagePlaceholder}>
                    <Ionicons name="image-outline" size={36} color="#374151" />
                </View>
            )}

            <View style={styles.badgeRow}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{event.category}</Text>
                </View>
                <View style={[styles.priceBadge, !event.isPaidEvent && styles.freeBadge]}>
                    <Text style={styles.priceBadgeText}>
                        {event.isPaidEvent ? `€${event.ticketPrice}` : "Free"}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
                <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={13} color="#2ecc71" />
                        <Text style={styles.metaText} numberOfLines={1}>{event.location?.name ?? "—"}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color="#2ecc71" />
                        <Text style={styles.metaText}>{formattedDate}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color="#2ecc71" />
                        <Text style={styles.metaText}>Ends {endDate}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="ticket-outline" size={13} color="#2ecc71" />
                        <Text style={styles.metaText}>{event.availableTickets} left</Text>
                    </View>
                </View>
                <View style={styles.cardFooter}>
                    <View style={[styles.statusDot, event.status === "Active" && styles.statusDotActive]} />
                    <Text style={styles.statusText}>{event.status ?? "Upcoming"}</Text>
                    <View style={styles.visibilityBadge}>
                        <Ionicons
                            name={event.visibility === "Public" ? "globe-outline" : "lock-closed-outline"}
                            size={11} color="#9CA3AF"
                        />
                        <Text style={styles.visibilityText}>{event.visibility}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
        backgroundColor: "#111827", borderRadius: 16,
        overflow: "hidden", borderWidth: 1, borderColor: "#1f2937",
    },
    cardImage: { width: "100%", height: 180 },
    cardImagePlaceholder: {
        width: "100%", height: 180, backgroundColor: "#1a1a1a",
        alignItems: "center", justifyContent: "center",
    },
    badgeRow: {
        position: "absolute", top: 12, left: 12, right: 12,
        flexDirection: "row", justifyContent: "space-between",
    },
    categoryBadge: {
        backgroundColor: "rgba(0,0,0,0.65)",
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1, borderColor: "#2ecc71",
    },
    categoryBadgeText: { color: "#2ecc71", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
    priceBadge: {
        backgroundColor: "rgba(0,0,0,0.65)",
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1, borderColor: "#374151",
    },
    freeBadge: { borderColor: "#22C55E" },
    priceBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

    cardBody: { padding: 14, gap: 10 },
    cardTitle: { fontSize: 17, fontWeight: "700", color: "#F9FAFB", lineHeight: 23 },
    metaGrid: { gap: 6 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaText: { fontSize: 12, color: "#9CA3AF", flex: 1 },
    cardFooter: {
        flexDirection: "row", alignItems: "center", gap: 6,
        paddingTop: 6, borderTopWidth: 1, borderTopColor: "#1f2937",
    },
    statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#374151" },
    statusDotActive: { backgroundColor: "#2ecc71" },
    statusText: { fontSize: 12, color: "#6B7280", flex: 1 },
    visibilityBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
    visibilityText: { fontSize: 11, color: "#6B7280" },

    // Pagination
    paginationWrap: {
        paddingTop: 4,
        paddingBottom: 8,
        gap: 8,
    },
    rangeText: {
        textAlign: "center",
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
    },
    pagination: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pageBtn: {
        flex: 1,
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 6, paddingVertical: 12, borderRadius: 12,
        backgroundColor: "#166534", borderWidth: 1, borderColor: "#2ecc71",
    },
    pageBtnDisabled: { backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" },
    pageBtnText: { fontSize: 14, color: "#fff", fontWeight: "600" },
    pageBtnTextDisabled: { color: "#374151" },
    pageIndicator: {
        paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 12, backgroundColor: "#1a1a1a",
        borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    pageIndicatorText: { fontSize: 13, color: "#9CA3AF", fontWeight: "600" },
});
