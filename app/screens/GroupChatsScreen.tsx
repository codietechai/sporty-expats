import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { ChatUserRole } from "@sparkstrand/chat-api-client/v2/types";
import { ChatProvider } from "@/app/chat/core/chatProvider";
import { useUserDb } from "@/app/hooks/useUserDb";
import { getChatToken } from "@/client/endpoints/chat/getChatToken";
import GroupChatsContent from "./GroupChatsContent";

const CHAT_API_KEY = process.env.EXPO_PUBLIC_CHAT_API_KEY!;
const CHAT_SERVER_URL = process.env.EXPO_PUBLIC_CHAT_SERVER_URL!;

export default function GroupChatsScreen() {
    const { user: clerkUser } = useUser();
    const { userDb } = useUserDb();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        getChatToken().then(setToken).catch(console.error);
    }, []);

    if (!token || !userDb?.id) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#4ade80" />
            </View>
        );
    }

    const chatUser = {
        userId: userDb.id,
        displayName: userDb.firstName
            ? `${userDb.firstName} ${userDb.lastName ?? ""}`.trim()
            : undefined,
        name: userDb.username ?? undefined,
        image: userDb.imageUrl ?? clerkUser?.imageUrl ?? undefined,
        role:
            userDb.role === "Host"
                ? ChatUserRole.moderator
                : userDb.role === "Admin"
                    ? ChatUserRole.admin
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
    loading: { flex: 1, backgroundColor: "#0d0d0d", alignItems: "center", justifyContent: "center" },
});
