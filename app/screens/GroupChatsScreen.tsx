import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { ChatUserRole } from "@sparkstrand/chat-api-client/v2/types";
import { ChatProvider } from "@/app/chat/core/chatProvider";
import { useUserDb } from "@/app/hooks/useUserDb";
import { getChatToken } from "@/client/endpoints/chat/getChatToken";
import GroupChatsContent from "./GroupChatsContent";
import GroupChatSkeleton from "@/components/groupchat/GroupChatSkeleton";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Stack } from "expo-router";

const CHAT_API_KEY = process.env.EXPO_PUBLIC_CHAT_API_KEY;
const CHAT_SERVER_URL = process.env.EXPO_PUBLIC_CHAT_SERVER_URL;

// Static shell shown while data loads — keeps the UI stable
function LoadingShell({ error }: { error?: string | null }) {
    const navigation = useNavigation();
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        hitSlop={8}
                    >
                        <Ionicons name="menu" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Group Chats</Text>
                        <Text style={styles.headerSub}>Your event group rooms</Text>
                    </View>
                    <View style={{ width: 38 }} />
                </View>

                {error ? (
                    <View style={styles.errorWrap}>
                        <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
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
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(true);

    // Pre-warm: verify token works before rendering ChatProvider
    useEffect(() => {
        getChatToken()
            .then(() => { setTokenError(null); })
            .catch((e) => setTokenError(e.message || "Failed to load chat"))
            .finally(() => setTokenLoading(false));
    }, []);

    const isLoading = tokenLoading || userDbLoading;

    if (isLoading) return <LoadingShell />;

    if (tokenError || !CHAT_API_KEY || !CHAT_SERVER_URL) {
        return <LoadingShell error={tokenError ?? "Chat configuration missing."} />;
    }

    const user = userDb?.data?.data ?? userDb?.data ?? userDb ?? {};
    const userId = user?.id;

    if (!userId) return <LoadingShell />;

    const firstName = user?.personalDetails?.firstName ?? user?.firstName;
    const lastName = user?.personalDetails?.lastName ?? user?.lastName;
    const email = user?.personalDetails?.email ?? user?.email ?? clerkUser?.primaryEmailAddress?.emailAddress;

    const chatUser = {
        userId,
        displayName: firstName ? `${firstName} ${lastName ?? ""}`.trim() : undefined,
        name: user?.username ?? undefined,
        email,
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

    // Use a token provider function (not a static string) so the client
    // can refresh the token automatically — same pattern as the web frontend
    const tokenProvider = async () => {
        const freshToken = await getChatToken();
        return freshToken;
    };

    return (
        <ChatProvider
            apiKey={CHAT_API_KEY}
            baseURL={CHAT_SERVER_URL}
            user={chatUser}
            tokenOrProvider={tokenProvider}
        >
            <GroupChatsContent />
        </ChatProvider>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0d0d0d" },
    header: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: "#1e1e1e", backgroundColor: "#111",
    },
    menuBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
    headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },
    errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
    errorText: { color: "#ff6b6b", textAlign: "center", fontSize: 14, lineHeight: 22 },
});
