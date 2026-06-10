import React from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    FlatList,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";

const notifications = [
    { id: "1", unread: true },
    { id: "2", unread: true },
    { id: "3", unread: true },
    { id: "4", unread: true },
];

export default function ConversationScreen({ navigation: navProp }: any) {
    const navigation = useNavigation();
    const drawer = navigation.getParent<DrawerNavigationProp<any>>();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <Pressable style={styles.menuBtn} onPress={() => drawer?.openDrawer?.()}>
                        <Ionicons name="menu" size={22} color="#1a1a1a" />
                    </Pressable>
                    <Text style={styles.headerTitle}>
                        Conversations
                    </Text>
                    <View style={{ width: 36 }} />
                </View>

                <View style={styles.actionsRow}>
                    <Pressable style={styles.filterBtn}>
                        <Ionicons
                            name="filter-outline"
                            size={16}
                            color="#6B7280"
                        />
                        <Text style={styles.filterText}>Filter</Text>
                    </Pressable>

                    <Pressable style={styles.markBtn}>
                        <Ionicons
                            name="checkmark"
                            size={16}
                            color="#1a1a1a"
                        />
                        <Text style={styles.markText}>Mark As Read</Text>
                    </Pressable>
                </View>

                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NotificationItem unread={item.unread} />
                    )}
                    ItemSeparatorComponent={() => (
                        <View style={styles.separator} />
                    )}
                />
            </SafeAreaView>
        </>
    );
}


function NotificationItem({ unread }: { unread: boolean }) {
    return (
        <View style={styles.itemContainer}>
            <Image
                source={{ uri: "https://i.pravatar.cc/100?img=12" }}
                style={styles.avatar}
            />

            <View style={styles.textContainer}>
                <Text style={styles.name}>Santi Odig</Text>

                <Text style={styles.message}>
                    Replied to your comment in the knowledge based
                    article titled "Close Billing Period".
                </Text>

                <Text style={styles.time}>
                    12 August 2024 · 12:24pm
                </Text>
            </View>

            {unread && <View style={styles.unreadDot} />}
        </View>
    );
}


const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },

    header: {
        height: 56,
        paddingHorizontal: 20,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 16,
        fontWeight: "600",
        color: "#1a1a1a",
    },

    menuBtn: {
        width: 36, height: 36,
        alignItems: "center", justifyContent: "center",
    },

    actionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    filterBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    filterText: {
        fontSize: 14,
        color: "#6B7280",
    },

    markBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        backgroundColor: "#F3F4F6",
        gap: 6,
    },

    markText: {
        fontSize: 13,
        color: "#1a1a1a",
        fontWeight: "500",
    },

    separator: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginLeft: 76,
    },

    itemContainer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 14,
        alignItems: "flex-start",
        backgroundColor: "#FFFFFF",
    },

    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },

    textContainer: {
        flex: 1,
    },

    name: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1a1a1a",
        marginBottom: 4,
    },

    message: {
        fontSize: 13,
        color: "#6B7280",
        lineHeight: 18,
    },

    time: {
        fontSize: 12,
        color: "#9CA3AF",
        marginTop: 6,
    },

    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#EF4444",
        marginTop: 6,
        marginLeft: 8,
    },
});
