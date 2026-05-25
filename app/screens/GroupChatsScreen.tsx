import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { ChatUserRole } from "@sparkstrand/chat-api-client/v2/types";
import { ChatProvider } from "@/app/chat/core/chatProvider";
import { useUserDb } from "@/app/hooks/useUserDb";
import { getChatToken } from "@/client/endpoints/chat/getChatToken";
import GroupChatsContent from "./GroupChatsContent";
import GroupChatSkeleton from "@/components/groupchat/GroupChatSkeleton";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Stack } from "expo-router";

const CHAT_API_KEY = process.env.EXPO_PUBLIC_CHAT_API_KEY;
const CHAT_SERVER_URL = process.env.EXPO_PUBLIC_CHAT_SERVER_URL;
const { width: screenWidth } = Dimensions.get("window");
const isSmallScreen = screenWidth < 375;

// Static shell shown while data loads — keeps the UI stable
function LoadingShell({ error }: { error?: string | null }) {
    const navigation = useNavigation();
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
                            placeholder="Search groups"
                            placeholderTextColor="#4B5563"
                            style={styles.searchInput}
                            editable={false}
                        />
                    </View>
                </View>

                <View style={styles.tabRow}>
                    <View style={[styles.tab, styles.tabActive]}>
                        <Text style={[styles.tabText, styles.tabTextActive]}>Past Events</Text>
                    </View>
                    <View style={styles.tab}>
                        <Text style={styles.tabText}>Upcoming Events</Text>
                    </View>
                </View>

                <View style={styles.countRow}>
                    <Text style={styles.countText}>Past Events</Text>
                </View>

                {error ? (
                    <View style={styles.errorWrap}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : (
                    <GroupChatSkeleton count={6} />
                )}
            </SafeAreaView>
        </>
    );
}

export default function GroupChatsScreen() {
    const { user: clerkUser } = useUser();
    const { userDb, loading: userDbLoading } = useUserDb();
    const [token, setToken] = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getChatToken()
            .then((t) => { setToken(t); setError(null); })
            .catch((e) => setError(e.message || "Failed to load chat"))
            .finally(() => setTokenLoading(false));
    }, []);

    const isLoading = tokenLoading || userDbLoading;

    if (isLoading) return <LoadingShell />;

    if (error || !CHAT_API_KEY || !CHAT_SERVER_URL) {
        return <LoadingShell error={error ?? "Chat configuration missing."} />;
    }

    const user = userDb?.data?.data ?? userDb?.data ?? userDb ?? {};
    const userId = user?.id;

    if (!userId || !token) return <LoadingShell />;

    const firstName = user?.personalDetails?.firstName ?? user?.firstName;
    const lastName = user?.personalDetails?.lastName ?? user?.lastName;

    const chatUser = {
        userId,
        displayName: firstName ? `${firstName} ${lastName ?? ""}`.trim() : undefined,
        name: user?.username ?? undefined,
        image: user?.imageUrl ?? clerkUser?.imageUrl ?? undefined,
        role:
            user?.role === "Host" ? ChatUserRole.moderator
            : user?.role === "Admin" ? ChatUserRole.admin
            : ChatUserRole.user,
        banned: false,
        invisible: false,
        online: false,
        hideOnlineStatus: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return (
        <ChatProvider
            apiKey={CHAT_API_KEY}
            baseURL={CHAT_SERVER_URL}
            user={chatUser}
            tokenOrProvider={token}
        >
            <GroupChatsContent />
        </ChatProvider>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0d0d0d" },
    header: {
        flexDirection: "column",
        paddingHorizontal: isSmallScreen ? 16 : 20,
        paddingTop: 16,
        paddingBottom: 10,
        gap: 10,
    },
    headerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    title: { fontSize: isSmallScreen ? 20 : 24, fontWeight: "700", color: "#fff", letterSpacing: 0.3 },
    searchContainer: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a",
        borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: isSmallScreen ? 8 : 10, gap: 6,
    },
    searchInput: { flex: 1, fontSize: isSmallScreen ? 12 : 13, color: "#D1D5DB" },
    tabRow: {
        flexDirection: "row", marginHorizontal: isSmallScreen ? 12 : 16,
        borderRadius: 12, overflow: "hidden",
        borderWidth: 1, borderColor: "#2a2a2a", backgroundColor: "#161616", marginBottom: 12,
    },
    tab: { flex: 1, paddingVertical: isSmallScreen ? 10 : 12, alignItems: "center" },
    tabActive: { backgroundColor: "#2d5a2d" },
    tabText: { fontSize: isSmallScreen ? 12 : 13, fontWeight: "600", color: "#9CA3AF" },
    tabTextActive: { color: "#fff" },
    countRow: {
        paddingHorizontal: isSmallScreen ? 16 : 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#2a2a2a",
    },
    countText: { fontSize: isSmallScreen ? 12 : 13, fontWeight: "600", color: "#9CA3AF" },
    errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    errorText: { color: "#ff6b6b", textAlign: "center", fontSize: 14, lineHeight: 22 },
});
