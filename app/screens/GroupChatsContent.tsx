import React, { useMemo, useState } from "react";
import {
    View, Text, FlatList, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useGroupRooms } from "@/app/chat/group/hooks/useGroupRoom";
import { useChatClient } from "@/app/chat/core/chatProvider";
import { GroupRoomCard } from "@/components/groupchat/GroupRoomCard";
import { GroupRoomView } from "@/components/groupchat/GroupRoomView";
import type { ChatRoom } from "@sparkstrand/chat-api-client/v2/types";
import type { EventRoomMetadata } from "@/app/chat/group/hooks/eventMetadata";

type Tab = "past" | "upcoming";

export default function GroupChatsContent() {
    const navigation = useNavigation();
    const { user } = useChatClient();
    const { pastRooms, upcomingRooms, isLoading, error, page, totalPages, setPage, refetch } = useGroupRooms();

    const [activeTab, setActiveTab] = useState<Tab>("past");
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const allRooms = activeTab === "past" ? pastRooms : upcomingRooms;

    const rooms = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return allRooms;
        return allRooms.filter((room) => {
            const meta = room.metadata as EventRoomMetadata | undefined;
            const title = (meta?.title ?? room.roomId).toLowerCase();
            const category = (meta?.category ?? "").toLowerCase();
            const location = (meta?.location?.name ?? "").toLowerCase();
            return title.includes(q) || category.includes(q) || location.includes(q);
        });
    }, [allRooms, searchQuery]);

    if (selectedRoom && user?.userId) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
                    <GroupRoomView
                        room={selectedRoom}
                        currentUserId={user.userId}
                        onClose={() => setSelectedRoom(null)}
                    />
                </SafeAreaView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Groups</Text>
                    </View>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={14} color="#6B7280" />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search groups"
                            placeholderTextColor="#4B5563"
                            style={styles.searchInput}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={16} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "past" && styles.tabActive]}
                        onPress={() => { setActiveTab("past"); setPage(1); }}
                    >
                        <Text style={[styles.tabText, activeTab === "past" && styles.tabTextActive]}>Past Events</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "upcoming" && styles.tabActive]}
                        onPress={() => { setActiveTab("upcoming"); setPage(1); }}
                    >
                        <Text style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}>Upcoming Events</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.countRow}>
                    <Text style={styles.countText}>
                        {activeTab === "past" ? "Past" : "Upcoming"} Events ({rooms.length})
                    </Text>
                </View>

                {isLoading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#4ade80" />
                        <Text style={styles.stateText}>Loading rooms…</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centered}>
                        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                        <Text style={styles.stateText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : rooms.length === 0 ? (
                    <View style={styles.centered}>
                        <Text style={styles.emptyEmoji}>🏟️</Text>
                        <Text style={styles.stateText}>
                            {searchQuery.trim() ? `No results for "${searchQuery}"` : `No ${activeTab} events found`}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={rooms}
                        keyExtractor={(item) => item.roomId}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        style={styles.flatList}
                        renderItem={({ item }) => (
                            <GroupRoomCard
                                room={item}
                                isSelected={selectedRoom?.roomId === item.roomId}
                                onPress={setSelectedRoom}
                            />
                        )}
                        ListFooterComponent={
                            !searchQuery.trim() && totalPages > 1 ? (
                                <View style={styles.pagination}>
                                    <TouchableOpacity
                                        style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                                        onPress={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                    >
                                        <Ionicons name="chevron-back" size={16} color={page === 1 ? "#374151" : "#fff"} />
                                        <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.pageIndicator}>{page} / {totalPages}</Text>
                                    <TouchableOpacity
                                        style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                                        onPress={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                    >
                                        <Text style={[styles.pageBtnText, page === totalPages && styles.pageBtnTextDisabled]}>Next</Text>
                                        <Ionicons name="chevron-forward" size={16} color={page === totalPages ? "#374151" : "#fff"} />
                                    </TouchableOpacity>
                                </View>
                            ) : null
                        }
                    />
                )}
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0d0d0d" },
    header: { flexDirection: "column", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, gap: 10 },
    headerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    title: { fontSize: 24, fontWeight: "700", color: "#fff", letterSpacing: 0.3 },
    searchContainer: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a",
        borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 2, gap: 6,
    },
    searchInput: { flex: 1, fontSize: 13, color: "#D1D5DB" },
    tabRow: {
        flexDirection: "row", marginHorizontal: 16, borderRadius: 12, overflow: "hidden",
        borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#161616", marginBottom: 12,
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
    tabActive: { backgroundColor: "#2d5a2d" },
    tabText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
    tabTextActive: { color: "#fff" },
    countRow: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
    countText: { fontSize: 13, fontWeight: "600", color: "#9CA3AF" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    flatList: { flex: 1 },
    stateText: { fontSize: 14, color: "#6B7280" },
    emptyEmoji: { fontSize: 40 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: "#166534" },
    retryText: { color: "#fff", fontWeight: "600" },
    list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
    pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, gap: 12 },
    pageBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 4, paddingVertical: 12, borderRadius: 12, backgroundColor: "#166534",
        borderWidth: 1, borderColor: "#2ecc71",
    },
    pageBtnDisabled: { backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" },
    pageBtnText: { fontSize: 14, color: "#fff", fontWeight: "600" },
    pageBtnTextDisabled: { color: "#374151" },
    pageIndicator: { fontSize: 13, color: "#9CA3AF", fontWeight: "600" },
});
