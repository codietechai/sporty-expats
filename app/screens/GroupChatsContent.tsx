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
        flexDirection: "column", 
        paddingHorizontal: isSmallScreen ? 16 : 20, 
        paddingTop: 16, 
        paddingBottom: 10, 
        gap: 10 
    },
    headerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    title: { 
        fontSize: isSmallScreen ? 20 : 24, 
        fontWeight: "700", 
        color: "#fff", 
        letterSpacing: 0.3 
    },
    searchContainer: {
        flexDirection: "row", 
        alignItems: "center", 
        backgroundColor: "#1a1a1a",
        borderWidth: 1, 
        borderColor: "#2a2a2a", 
        borderRadius: 10,
        paddingHorizontal: 10, 
        paddingVertical: isSmallScreen ? 8 : 10, 
        gap: 6,
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
