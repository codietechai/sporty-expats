import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { ChatUserRole } from "@sparkstrand/chat-api-client/v2/types";
import { ChatProvider } from "@/app/chat/core/chatProvider";
import { useUserDb } from "@/app/hooks/useUserDb";
import { getChatToken } from "@/client/endpoints/chat/getChatToken";
import GroupChatsContent from "./GroupChatsContent";

const CHAT_API_KEY = process.env.EXPO_PUBLIC_CHAT_API_KEY;
const CHAT_SERVER_URL = process.env.EXPO_PUBLIC_CHAT_SERVER_URL;

export default function GroupChatsScreen() {
    const { user: clerkUser } = useUser();
    const { userDb, loading: userDbLoading, error: userDbError } = useUserDb();
    const [token, setToken] = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(true);
    const [tokenError, setTokenError] = useState<string | null>(null);

    // Check for missing environment variables
    if (!CHAT_API_KEY || !CHAT_SERVER_URL) {
        return (
            <View style={styles.loading}>
                <Text style={styles.errorText}>
                    Chat configuration missing. Please check environment variables.
                </Text>
            </View>
        );
    }

    useEffect(() => {
        console.log('GroupChatsScreen: Starting to fetch chat token');
        setTokenLoading(true);
        getChatToken()
            .then((fetchedToken) => {
                console.log('GroupChatsScreen: Chat token fetched successfully');
                setToken(fetchedToken);
                setTokenError(null);
            })
            .catch((error) => {
                console.error('GroupChatsScreen: Error fetching chat token:', error);
                setTokenError(error.message || 'Failed to fetch chat token');
            })
            .finally(() => {
                setTokenLoading(false);
            });
    }, []);

    // Debug logging
    console.log('GroupChatsScreen: State check:', {
        tokenLoading,
        tokenError,
        hasToken: !!token,
        userDbLoading,
        userDbError,
        hasUserDb: !!userDb,
        clerkUser: !!clerkUser
    });

    // Show loading if still fetching token or user data
    if (tokenLoading || userDbLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#4ade80" />
                <Text style={styles.loadingText}>
                    {tokenLoading && userDbLoading ? 'Loading chat and user data...' :
                     tokenLoading ? 'Loading chat token...' : 'Loading user data...'}
                </Text>
            </View>
        );
    }

    // Show error if token fetch failed
    if (tokenError) {
        return (
            <View style={styles.loading}>
                <Text style={styles.errorText}>Error loading chat: {tokenError}</Text>
            </View>
        );
    }

    // Show error if user data fetch failed
    if (userDbError) {
        return (
            <View style={styles.loading}>
                <Text style={styles.errorText}>Error loading user data: {userDbError.message || 'Unknown error'}</Text>
            </View>
        );
    }

    // Show loading if we don't have the required data
    if (!token || !userDb) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#4ade80" />
                <Text style={styles.loadingText}>
                    {!token && !userDb ? 'Missing chat token and user data' :
                     !token ? 'Missing chat token' : 'Missing user data'}
                </Text>
            </View>
        );
    }

    // Extract user data with better error handling
    const user = userDb?.data?.data ?? userDb?.data ?? userDb ?? {};
    const userId = user?.id;
    const firstName = user?.personalDetails?.firstName ?? user?.firstName;
    const lastName = user?.personalDetails?.lastName ?? user?.lastName;

    console.log('GroupChatsScreen: User data extracted:', {
        userId,
        firstName,
        lastName,
        username: user?.username,
        role: user?.role
    });

    if (!userId) {
        return (
            <View style={styles.loading}>
                <Text style={styles.errorText}>User ID not found. Please try logging in again.</Text>
            </View>
        );
    }

    const chatUser = {
        userId,
        displayName: firstName
            ? `${firstName} ${lastName ?? ""}`.trim()
            : undefined,
        name: user?.username ?? undefined,
        image: user?.imageUrl ?? clerkUser?.imageUrl ?? undefined,
        role:
            user?.role === "Host"
                ? ChatUserRole.moderator
                : user?.role === "Admin"
                    ? ChatUserRole.admin
                    : ChatUserRole.user,
        banned: false,
        invisible: false,
        online: false,
        hideOnlineStatus: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    console.log('GroupChatsScreen: Chat user created:', chatUser);

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
    loading: { 
        flex: 1, 
        backgroundColor: "#0d0d0d", 
        alignItems: "center", 
        justifyContent: "center",
        padding: 20
    },
    loadingText: {
        color: "#ffffff",
        marginTop: 16,
        textAlign: "center",
        fontSize: 16
    },
    errorText: {
        color: "#ff6b6b",
        textAlign: "center",
        fontSize: 16,
        lineHeight: 24
    }
});
