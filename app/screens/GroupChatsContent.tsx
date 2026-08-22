import i18n from "@/translations/i18n";
import React, { useMemo, useState, useEffect } from "react";
import {
    View, Text, FlatList, TouchableOpacity, TextInput,
    StyleSheet, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useGroupRoomsContext, useChatAppClient } from "@/contexts/ChatContext";
import { GroupRoomCard } from "@/components/groupchat/GroupRoomCard";
import { GroupRoomView } from "@/components/groupchat/GroupRoomView";
import GroupChatSkeleton from "@/components/groupchat/GroupChatSkeleton";
import type { ChatRoom } from "@sparkstrand/chat-api-client/v2/types";
import type { EventRoomMetadata } from "@/app/chat/group/hooks/eventMetadata";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import { useAuth } from "@clerk/clerk-expo";

const PAGE_SIZE = 10;

type Tab = "past" | "upcoming";

interface Props {
    initialRoomId?: string;
}

export default function GroupChatsContent({ initialRoomId }: Props) {
    const navigation = useNavigation();
    const { client } = useChatAppClient();
    const { unreadCount } = useNotificationsContext();
    const { pastRooms, upcomingRooms, isLoading, error, refetch } = useGroupRoomsContext();

    const [activeTab, setActiveTab] = useState<Tab>("past");
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);

    // Auto-open room when navigated from JoinedGroups
    useEffect(() => {
        if (!initialRoomId || isLoading) return;
        const match = [...pastRooms, ...upcomingRooms].find((r) => r.roomId === initialRoomId);
        if (match) {
            const isUpcoming = upcomingRooms.some((r) => r.roomId === initialRoomId);
            setActiveTab(isUpcoming ? "upcoming" : "past");
            setSelectedRoom(match);
        }
    }, [initialRoomId, isLoading, pastRooms, upcomingRooms]);

    const allRooms = activeTab === "past" ? pastRooms : upcomingRooms;
    const totalPages = Math.max(1, Math.ceil(allRooms.length / PAGE_SIZE));

    const filteredRooms = useMemo(() => {
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

    const rooms = useMemo(() => {
        if (searchQuery.trim()) return filteredRooms;
        const start = (page - 1) * PAGE_SIZE;
        return filteredRooms.slice(start, start + PAGE_SIZE);
    }, [filteredRooms, page, searchQuery]);

    // Get current user from the connected client
    const currentUser = client?.user ?? null;

    if (selectedRoom && currentUser?.userId) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
                    <GroupRoomView
                        room={selectedRoom}
                        currentUserId={currentUser.userId}
                        currentUserImage={currentUser.image ?? null}
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

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.menuBtn}
                        hitSlop={8}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    >
                        <Ionicons name="menu" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{i18n.t("NavBar.GroupChats")}</Text>
                    <TouchableOpacity
                        style={styles.bellBtn}
                        hitSlop={8}
                        onPress={() => (navigation as any).navigate("Notifications")}
                    >
                        <Ionicons name="notifications-outline" size={22} color="#fff" />
                        {unreadCount > 0 && (
                            <View style={styles.bellBadge}>
                                <Text style={styles.bellBadgeText}>
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchWrap}>
                    <View style={styles.searchRow}>
                        <Ionicons name="search-outline" size={16} color="#6B7280" />
                        <TextInput
                            value={searchQuery}
                            onChangeText={(t) => { setSearchQuery(t); setPage(1); }}
                            placeholder={i18n.t("Dashboard.searchGroups")}
                            placeholderTextColor="#4B5563"
                            style={styles.searchInput}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={6}>
                                <Ionicons name="close-circle" size={16} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Pill tab toggle */}
                <View style={styles.tabWrap}>
                    <View style={styles.tabPill}>
                        <TouchableOpacity
                            style={[styles.pillTab, activeTab === "upcoming" && styles.pillTabActive]}
                            onPress={() => { setActiveTab("upcoming"); setPage(1); }}
                        >
                            <Ionicons name="calendar-outline" size={13} color={activeTab === "upcoming" ? "#fff" : "#6B7280"} />
                            <Text style={[styles.pillTabText, activeTab === "upcoming" && styles.pillTabTextActive]}>{i18n.t("Dashboard.upcoming")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pillTab, activeTab === "past" && styles.pillTabActive]}
                            onPress={() => { setActiveTab("past"); setPage(1); }}
                        >
                            <Ionicons name="time-outline" size={13} color={activeTab === "past" ? "#fff" : "#6B7280"} />
                            <Text style={[styles.pillTabText, activeTab === "past" && styles.pillTabTextActive]}>{i18n.t("Dashboard.past")}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{filteredRooms.length}</Text>
                    </View>
                </View>

                {isLoading ? (
                    <View style={styles.flatList}>
                        <GroupChatSkeleton count={6} />
                    </View>
                ) : error ? (
                    <View style={styles.centered}>
                        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                        <Text style={styles.stateText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
                            <Text style={styles.retryText}>{i18n.t("Complaints.retry")}</Text>
                        </TouchableOpacity>
                    </View>
                ) : rooms.length === 0 ? (
                    <View style={styles.centered}>
                        <Text style={styles.emptyEmoji}>🏟️</Text>
                        <Text style={styles.stateText}>
                            {searchQuery.trim() ? i18n.t("Dashboard.noResults", { query: searchQuery }) : i18n.t("Dashboard.noEvents", { tab: activeTab === "past" ? i18n.t("Dashboard.past").toLowerCase() : i18n.t("Dashboard.upcoming").toLowerCase() })}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={rooms}
                        keyExtractor={(item) => item.roomId}
                        contentContainerStyle={[styles.list, { paddingHorizontal: 16, paddingTop: 12 }]}
                        showsVerticalScrollIndicator={false}
                        style={styles.flatList}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        initialNumToRender={8}
                        getItemLayout={(_, index) => ({ length: 132, offset: 132 * index, index })}
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
                                        onPress={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <Ionicons name="chevron-back" size={16} color={page === 1 ? "#374151" : "#fff"} />
                                        <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.pageIndicator}>{page} / {totalPages}</Text>
                                    <TouchableOpacity
                                        style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                                        onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        <Text style={[styles.pageBtnText, page === totalPages && styles.pageBtnTextDisabled]}>{i18n.t("DirectChat.next")}</Text>
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
    header: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
        backgroundColor: "#111", gap: 12,
    },
    menuBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#fff", textAlign: "center" },
    bellBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    bellBadge: {
        position: "absolute", top: -4, right: -4,
        backgroundColor: "#ef4444", borderRadius: 8,
        minWidth: 16, height: 16, paddingHorizontal: 3,
        alignItems: "center", justifyContent: "center",
        borderWidth: 1.5, borderColor: "#0d0d0d",
    },
    bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
    searchWrap: {
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
    },
    searchRow: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    },
    searchInput: { flex: 1, fontSize: 13, color: "#D1D5DB", minHeight: 18 },
    tabWrap: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 10, gap: 10,
        borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
    },
    tabPill: {
        flex: 1, flexDirection: "row",
        backgroundColor: "#161616", borderRadius: 12,
        borderWidth: 1, borderColor: "#2a2a2a", overflow: "hidden",
    },
    pillTab: {
        flex: 1, flexDirection: "row", alignItems: "center",
        justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 11,
    },
    pillTabActive: { backgroundColor: "#166534" },
    pillTabText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
    pillTabTextActive: { color: "#fff" },
    countBadge: {
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
        minWidth: 36, alignItems: "center",
    },
    countBadgeText: { fontSize: 12, fontWeight: "700", color: "#9CA3AF" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 20 },
    flatList: { flex: 1 },
    stateText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
    emptyEmoji: { fontSize: 40 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: "#166534" },
    retryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
    list: { paddingBottom: 32 },
    pagination: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", paddingTop: 8, gap: 12, marginTop: 12,
    },
    pageBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 4, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
        backgroundColor: "#166534", borderWidth: 1, borderColor: "#2ecc71",
    },
    pageBtnDisabled: { backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" },
    pageBtnText: { fontSize: 14, color: "#fff", fontWeight: "600" },
    pageBtnTextDisabled: { color: "#374151" },
    pageIndicator: { fontSize: 13, color: "#9CA3AF", fontWeight: "600" },
});
