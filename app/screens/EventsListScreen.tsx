import React, { useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    TextInput,
    ScrollView,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEvents } from "@/app/hooks/useEvents";
import type { Event } from "@/client/endpoints/events/types";
import dayjs from "dayjs";

const CATEGORIES = [
    "All", "Football", "Basketball", "Tennis",
    "Yoga", "Running", "Volleyball",
];

type TimeFilter = "upcoming" | "ongoing" | "past";

const TIME_FILTERS: { label: string; value: TimeFilter }[] = [
    { label: "Upcoming", value: "upcoming" },
    { label: "Ongoing", value: "ongoing" },
    { label: "Past", value: "past" },
];

export default function EventsListScreen() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const {
        events, isLoading, isError,
        updateFilters, resetFilters,
        hasNextPage, hasPrevPage, goToNextPage, goToPrevPage,
    } = useEvents({ timeFilter: "upcoming" });

    const handleTimeFilterChange = (f: TimeFilter) => {
        setTimeFilter(f);
        updateFilters({ timeFilter: f });
    };

    const handleCategorySelect = (cat: string) => {
        setSelectedCategory(cat);
        updateFilters({ category: cat === "All" ? undefined : cat });
    };

    const handlePriceFilter = () => {
        updateFilters({
            minimumPrice: minPrice ? parseFloat(minPrice) : undefined,
            maximumPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        });
    };

    const handleReset = () => {
        setSelectedCategory("All");
        setMinPrice("");
        setMaxPrice("");
        setTimeFilter("upcoming");
        resetFilters();
        updateFilters({ timeFilter: "upcoming" });
    };

    return (
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
            <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

            {/* Page title */}
            <View style={styles.titleRow}>
                <Text style={styles.pageTitle}>Events</Text>
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                    <Ionicons name="options-outline" size={20} color="#2ecc71" />
                </TouchableOpacity>
            </View>

            <View style={styles.timeFilterRow}>
                {TIME_FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        onPress={() => handleTimeFilterChange(f.value)}
                        style={[styles.timePill, timeFilter === f.value && styles.timePillActive]}
                    >
                        <Text style={[styles.timePillText, timeFilter === f.value && styles.timePillTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Category chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryRow}
            >
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                        onPress={() => handleCategorySelect(cat)}
                    >
                        <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Price filter */}
            {/*} <View style={styles.priceRow}>
                <Ionicons name="pricetag-outline" size={16} color="#6B7280" style={{ marginRight: 4 }} />
                <TextInput
                    style={styles.priceInput}
                    placeholder="Min €"
                    placeholderTextColor="#4B5563"
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    onEndEditing={handlePriceFilter}
                />
                <Text style={styles.priceSep}>–</Text>
                <TextInput
                    style={styles.priceInput}
                    placeholder="Max €"
                    placeholderTextColor="#4B5563"
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    onEndEditing={handlePriceFilter}
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handlePriceFilter}>
                    <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
        </View>*/}

            {/* Content */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2ecc71" />
                    <Text style={styles.stateText}>Loading events...</Text>
                </View>
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
                    ListFooterComponent={
                        (hasNextPage || hasPrevPage) ? (
                            <View style={styles.pagination}>
                                <TouchableOpacity
                                    style={[styles.pageBtn, !hasPrevPage && styles.pageBtnDisabled]}
                                    onPress={goToPrevPage}
                                    disabled={!hasPrevPage}
                                >
                                    <Ionicons name="chevron-back" size={16} color={hasPrevPage ? "#fff" : "#374151"} />
                                    <Text style={[styles.pageBtnText, !hasPrevPage && styles.pageBtnTextDisabled]}>Prev</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.pageBtn, !hasNextPage && styles.pageBtnDisabled]}
                                    onPress={goToNextPage}
                                    disabled={!hasNextPage}
                                >
                                    <Text style={[styles.pageBtnText, !hasNextPage && styles.pageBtnTextDisabled]}>Next</Text>
                                    <Ionicons name="chevron-forward" size={16} color={hasNextPage ? "#fff" : "#374151"} />
                                </TouchableOpacity>
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
}

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
                            size={11}
                            color="#9CA3AF"
                        />
                        <Text style={styles.visibilityText}>{event.visibility}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0d0d0d" },

    timeFilterRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    timePill: {
        paddingHorizontal: 24,
        paddingVertical: 9,
        borderRadius: 50,
        backgroundColor: "#1a1a1a",
        borderWidth: 1,
        borderColor: "#2a2a2a",
    },
    timePillActive: {
        backgroundColor: "#166534",
        borderColor: "#2ecc71",
    },
    timePillText: { fontSize: 14, fontWeight: "600", color: "#9CA3AF" },
    timePillTextActive: { color: "#fff" },

    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.3,
    },
    resetBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#1f2937",
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
    },

    categoryScroll: { flexGrow: 0, flexShrink: 0 },
    categoryRow: {

        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingBottom: 20,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#1a1a1a",
        borderWidth: 1,
        borderColor: "#2a2a2a",
    },
    chipActive: {
        backgroundColor: "#166534",
        borderColor: "#2ecc71",
    },
    chipText: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
    chipTextActive: { color: "#fff", fontWeight: "600" },

    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    priceInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: "#2a2a2a",
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 13,
        color: "#fff",
        backgroundColor: "#1a1a1a",
    },
    priceSep: { color: "#4B5563", fontSize: 16 },
    applyBtn: {
        height: 40,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: "#166534",
        alignItems: "center",
        justifyContent: "center",
    },
    applyBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingBottom: 60,
    },
    stateText: { fontSize: 16, color: "#6B7280", fontWeight: "500" },
    stateSubText: { fontSize: 13, color: "#374151" },
    retryBtn: {
        marginTop: 4,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#166534",
    },
    retryBtnText: { color: "#fff", fontWeight: "600" },

    list: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },

    card: {
        backgroundColor: "#111827",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    cardImage: { width: "100%", height: 180 },
    cardImagePlaceholder: {
        width: "100%",
        height: 180,
        backgroundColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "center",
    },

    badgeRow: {
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    categoryBadge: {
        backgroundColor: "rgba(0,0,0,0.65)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#2ecc71",
    },
    categoryBadgeText: {
        color: "#2ecc71",
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    priceBadge: {
        backgroundColor: "rgba(0,0,0,0.65)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#374151",
    },
    freeBadge: { borderColor: "#22C55E" },
    priceBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

    cardBody: { padding: 14, gap: 10 },
    cardTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#F9FAFB",
        lineHeight: 23,
    },

    metaGrid: { gap: 6 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaText: { fontSize: 12, color: "#9CA3AF", flex: 1 },

    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: "#1f2937",
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#374151",
    },
    statusDotActive: { backgroundColor: "#2ecc71" },
    statusText: { fontSize: 12, color: "#6B7280", flex: 1 },
    visibilityBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    visibilityText: { fontSize: 11, color: "#6B7280" },

    pagination: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 8,
        paddingBottom: 8,
        gap: 12,
    },
    pageBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#166534",
        borderWidth: 1,
        borderColor: "#2ecc71",
    },
    pageBtnDisabled: {
        backgroundColor: "#1a1a1a",
        borderColor: "#2a2a2a",
    },
    pageBtnText: { fontSize: 14, color: "#fff", fontWeight: "600" },
    pageBtnTextDisabled: { color: "#374151" },
});
