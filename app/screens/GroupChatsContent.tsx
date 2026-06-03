import React, { useMemo, useState } from "react";
import {
    View, Text, FlatList, TouchableOpacity, TextInput,
    StyleSheet, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useGroupRooms } from "@/app/chat/group/hooks/useGroupRoom";
import { useChatClient } from "@/app/chat/core/chatProvider";
import { GroupRoomCard } from "@/components/groupchat/GroupRoomCard";
import { GroupRoomView } from "@/components/groupchat/GroupRoomView";
import GroupChatSkeleton from "@/components/groupchat/GroupChatSkeleton";
import type { ChatRoom } from "@sparkstrand/chat-api-client/v2/types";
import type { EventRoomMetadata } from "@/app/chat/group/hooks/eventMetadata";

const { width: screenWidth } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;

type Tab = "past" | "upcoming";

export default function GroupChatsContent() {
    const navigation = useNavigation();
    const { user } = useChatClient();
    const { pastRooms, upcomingRooms, isLoading, error, page, pastTotalPages, upcomingTotalPages, setPage, refetch } = useGroupRooms();

    const [activeTab, setActiveTab] = useState<Tab>("past");
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const allRooms = activeTab === "past" ? pastRooms : upcomingRooms;
    const totalPages = activeTab === "past" ? pastTotalPages : upcomingTotalPages;

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

    // Client-side pagination over the filtered subset
    const PAGE_SIZE = 10;
    const rooms = useMemo(() => {
        if (searchQuery.trim()) return filteredRooms; // no pagination while searching
        const start = (page - 1) * PAGE_SIZE;
        return filteredRooms.slice(start, start + PAGE_SIZE);
    }, [filteredRooms, page, searchQuery]);

    if (selectedRoom && user?.userId) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
                    <GroupRoomView
                        room={selectedRoom}
                        currentUserId={user.userId}
                        currentUserImage={user.image ?? null}
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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Group Chats</Text>
                        <Text style={styles.headerSub}>Your event group rooms</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.backBtn}
                        hitSlop={8}
                        onPress={() => {
                            const drawer = (navigation as any).getParent?.("MainDrawer");
                            drawer?.openDrawer?.();
                        }}
                    >
                        <Ionicons name="menu" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.searchRow}>
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
                        {activeTab === "past" ? "Past" : "Upcoming"} Events ({filteredRooms.length})
                    </Text>
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
                        contentContainerStyle={[
                            styles.list,
                            {
                                paddingHorizontal: isSmallScreen ? 12 : 16,
                                paddingTop: isSmallScreen ? 8 : 12
                            }
                        ]}
                        showsVerticalScrollIndicator={false}
                        style={styles.flatList}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        initialNumToRender={8}
                        getItemLayout={(data, index) => ({
                            length: isSmallScreen ? 112 : isMediumScreen ? 122 : 132, // card height + margin
                            offset: (isSmallScreen ? 112 : isMediumScreen ? 122 : 132) * index,
                            index,
                        })}
                        renderItem={({ item }) => (
                            <GroupRoomCard
                                room={item}
                                isSelected={selectedRoom?.roomId === item.roomId}
                                onPress={setSelectedRoom}
                            />
                        )}
                        ListFooterComponent={
                            !searchQuery.trim() && totalPages > 1 ? (
                                <View style={[
                                    styles.pagination,
                                    { marginTop: isSmallScreen ? 8 : 12 }
                                ]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.pageBtn,
                                            page === 1 && styles.pageBtnDisabled,
                                            {
                                                paddingVertical: isSmallScreen ? 10 : 12,
                                                paddingHorizontal: isSmallScreen ? 12 : 16
                                            }
                                        ]}
                                        onPress={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                    >
                                        <Ionicons name="chevron-back" size={16} color={page === 1 ? "#374151" : "#fff"} />
                                        <Text style={[
                                            styles.pageBtnText,
                                            page === 1 && styles.pageBtnTextDisabled,
                                            { fontSize: isSmallScreen ? 12 : 14 }
                                        ]}>Prev</Text>
                                    </TouchableOpacity>
                                    <Text style={[
                                        styles.pageIndicator,
                                        { fontSize: isSmallScreen ? 12 : 13 }
                                    ]}>{page} / {totalPages}</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.pageBtn,
                                            page === totalPages && styles.pageBtnDisabled,
                                            {
                                                paddingVertical: isSmallScreen ? 10 : 12,
                                                paddingHorizontal: isSmallScreen ? 12 : 16
                                            }
                                        ]}
                                        onPress={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                    >
                                        <Text style={[
                                            styles.pageBtnText,
                                            page === totalPages && styles.pageBtnTextDisabled,
                                            { fontSize: isSmallScreen ? 12 : 14 }
                                        ]}>Next</Text>
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
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#1e1e1e",
        backgroundColor: "#111",
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
    headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1a1a1a",
        borderBottomWidth: 1,
        borderBottomColor: "#1e1e1e",
        paddingHorizontal: 16,
        paddingVertical: isSmallScreen ? 8 : 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: isSmallScreen ? 12 : 13,
        color: "#D1D5DB",
        minHeight: isSmallScreen ? 16 : 18,
    },
    tabRow: {
        flexDirection: "row",
        marginHorizontal: isSmallScreen ? 12 : 16,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#2a2a2a",
        backgroundColor: "#161616",
        marginBottom: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: isSmallScreen ? 10 : 12,
        alignItems: "center"
    },
    tabActive: { backgroundColor: "#2d5a2d" },
    tabText: {
        fontSize: isSmallScreen ? 12 : 13,
        fontWeight: "600",
        color: "#9CA3AF"
    },
    tabTextActive: { color: "#fff" },
    countRow: {
        paddingHorizontal: isSmallScreen ? 16 : 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#2a2a2a"
    },
    countText: {
        fontSize: isSmallScreen ? 12 : 13,
        fontWeight: "600",
        color: "#9CA3AF"
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingHorizontal: 20,
    },
    flatList: { flex: 1 },
    stateText: {
        fontSize: isSmallScreen ? 13 : 14,
        color: "#6B7280",
        textAlign: "center",
    },
    emptyEmoji: { fontSize: isSmallScreen ? 36 : 40 },
    retryBtn: {
        paddingHorizontal: isSmallScreen ? 20 : 24,
        paddingVertical: isSmallScreen ? 8 : 10,
        borderRadius: 10,
        backgroundColor: "#166534"
    },
    retryText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: isSmallScreen ? 13 : 14,
    },
    list: {
        // paddingHorizontal and paddingTop are now dynamic
        paddingBottom: 32
    },
    pagination: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 8,
        gap: 12
    },
    pageBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        // paddingVertical and paddingHorizontal are now dynamic
        borderRadius: 12,
        backgroundColor: "#166534",
        borderWidth: 1,
        borderColor: "#2ecc71",
    },
    pageBtnDisabled: { backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" },
    pageBtnText: {
        // fontSize is now dynamic
        color: "#fff",
        fontWeight: "600"
    },
    pageBtnTextDisabled: { color: "#374151" },
    pageIndicator: {
        // fontSize is now dynamic
        color: "#9CA3AF",
        fontWeight: "600"
    },
});
