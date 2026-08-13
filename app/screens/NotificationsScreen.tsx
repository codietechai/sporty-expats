import i18n from "@/translations/i18n";
import React from "react";
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationCategory =
    | "all"
    | "accountInformation"
    | "messages"
    | "invites"
    | "mentions"
    | "reminders";

export type NotificationType = "INFO" | "SYSTEM" | "MARKETING" | "ALERT" | "REMINDER";

export type Notification = {
    id: string;
    pushTitle: string;
    pushBody: string | null;
    type: NotificationType;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string | null;
    metadata?: Record<string, string> | null;
};

// ── Category pills ────────────────────────────────────────────────────────────

const CATEGORIES: { key: NotificationCategory; label: string }[] = [
    { key: "all",                label: i18n.t("Complaints.allStatuses") },
    { key: "accountInformation", label: "Account" },
    { key: "messages",           label: i18n.t("DirectChat.title") },
    { key: "invites",            label: "Invites" },
    { key: "mentions",           label: "Mentions" },
    { key: "reminders",          label: "Reminders" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: string) => void;
    onRefresh: () => void;
    onLoadMore: () => void;
    hasMore: boolean;
    categoryCounts: Record<NotificationCategory, number>;
    activeCategory: NotificationCategory;
    onCategoryChange: (cat: NotificationCategory) => void;
};

// ── Notification card ─────────────────────────────────────────────────────────

function NotifCard({
    item,
    onMarkAsRead,
    onDelete,
}: {
    item: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const sender = item.metadata?.senderName ?? item.metadata?.userName ?? "";
    const showBody = (item.type === "INFO" || item.type === "MARKETING") && !!item.pushBody;
    const isInvite = item.type === "ALERT";

    return (
        <TouchableOpacity
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => { if (!item.isRead) onMarkAsRead(item.id); }}
            activeOpacity={0.85}
        >
            {/* Unread accent bar */}
            {!item.isRead && <View style={styles.unreadBar} />}

            <View style={styles.cardInner}>
                {/* Icon */}
                <View style={styles.iconCircle}>
                    <Ionicons name="notifications" size={18} color="#2ecc71" />
                    {!item.isRead && <View style={styles.iconDot} />}
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                    <View style={styles.cardTop}>
                        <View style={styles.cardTitleWrap}>
                            {sender ? (
                                <Text style={styles.cardTitle} numberOfLines={2}>
                                    <Text style={styles.senderName}>{sender} </Text>
                                    {item.pushTitle}
                                </Text>
                            ) : (
                                <Text style={styles.cardTitle} numberOfLines={2}>{item.pushTitle}</Text>
                            )}
                        </View>
                        <View style={styles.cardRight}>
                            <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
                            <TouchableOpacity
                                onPress={() => onDelete(item.id)}
                                hitSlop={12}
                                style={styles.dismissBtn}
                            >
                                <Ionicons name="close" size={14} color="#4b5563" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showBody && (
                        <View style={styles.bodyBubble}>
                            <Text style={styles.bodyText}>{item.pushBody}</Text>
                        </View>
                    )}

                    {isInvite && (
                        <View style={styles.inviteRow}>
                            <TouchableOpacity style={styles.denyBtn}>
                                <Text style={styles.denyText}>Deny</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.acceptBtn}>
                                <Text style={styles.acceptText}>{i18n.t("MessageRequests.accept")}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
    return (
        <View style={[styles.card, { opacity: 0.35 }]}>
            <View style={styles.cardInner}>
                <View style={[styles.iconCircle, { backgroundColor: "#1e1e1e" }]} />
                <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ height: 13, width: "65%", backgroundColor: "#1e1e1e", borderRadius: 4 }} />
                    <View style={{ height: 11, width: "40%", backgroundColor: "#1e1e1e", borderRadius: 4 }} />
                    <View style={{ height: 44, backgroundColor: "#1e1e1e", borderRadius: 10 }} />
                </View>
            </View>
        </View>
    );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NotificationsScreen({
    notifications,
    unreadCount,
    isLoading,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onRefresh,
    onLoadMore,
    hasMore,
    categoryCounts,
    activeCategory,
    onCategoryChange,
}: Props) {
    const navigation = useNavigation<any>();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safe} edges={["top"]}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                        hitSlop={8}
                    >
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        {unreadCount > 0 && (
                            <View style={styles.headerBadge}>
                                <Text style={styles.headerBadgeText}>
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={onRefresh} hitSlop={8} style={styles.headerIconBtn}>
                            <Ionicons name="refresh-outline" size={19} color="#9ca3af" />
                        </TouchableOpacity>
                        {unreadCount > 0 && (
                            <TouchableOpacity onPress={onMarkAllAsRead} hitSlop={8} style={styles.headerIconBtn}>
                                <Ionicons name="checkmark-done-outline" size={19} color="#2ecc71" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ── Category pills ── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.pillsScroll}
                    contentContainerStyle={styles.pillsContent}
                >
                    {CATEGORIES.map((cat) => {
                        const count = categoryCounts[cat.key] ?? 0;
                        const active = activeCategory === cat.key;
                        return (
                            <TouchableOpacity
                                key={cat.key}
                                style={[styles.pill, active && styles.pillActive]}
                                onPress={() => onCategoryChange(cat.key)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                    {cat.label}
                                </Text>
                                {count > 0 && (
                                    <View style={[styles.pillBadge, active && styles.pillBadgeActive]}>
                                        <Text style={[styles.pillBadgeText, active && styles.pillBadgeTextActive]}>
                                            {count > 99 ? "99+" : count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* ── List ── */}
                {isLoading && notifications.length === 0 ? (
                    <ScrollView contentContainerStyle={{ paddingTop: 8 }}>
                        {[...Array(5)].map((_, i) => <Skeleton key={i} />)}
                    </ScrollView>
                ) : notifications.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={52} color="#374151" />
                        <Text style={styles.emptyTitle}>No notifications</Text>
                        <Text style={styles.emptySubtitle}>You're all caught up</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <NotifCard
                                item={item}
                                onMarkAsRead={onMarkAsRead}
                                onDelete={onDelete}
                            />
                        )}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        onEndReached={hasMore ? onLoadMore : undefined}
                        onEndReachedThreshold={0.4}
                        ListFooterComponent={
                            isLoading ? (
                                <View style={styles.loadingMore}>
                                    <ActivityIndicator size="small" color="#2ecc71" />
                                </View>
                            ) : null
                        }
                    />
                )}
            </SafeAreaView>
        </>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0d0d0d" },

    // Header
    header: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
        backgroundColor: "#111",
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
        marginRight: 10,
    },
    headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    headerBadge: {
        backgroundColor: "#166534", borderRadius: 10,
        paddingHorizontal: 7, paddingVertical: 2,
        borderWidth: 1, borderColor: "#2ecc71",
    },
    headerBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
    headerIconBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },

    // Pills
    pillsScroll: {
        flexGrow: 0,
        borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
        minHeight: 58,
    },
    pillsContent: {
        paddingHorizontal: 14, paddingVertical: 10, gap: 8,
        alignItems: "center",
    },
    pill: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 20, borderWidth: 1,
        borderColor: "#2a2a2a", backgroundColor: "#1a1a1a",
        height: 40,
    },
    pillActive: {
        backgroundColor: "#0f2a1a", borderColor: "#2ecc71",
    },
    pillText: { color: "#9ca3af", fontSize: 13, fontWeight: "500" },
    pillTextActive: { color: "#2ecc71", fontWeight: "700" },
    pillBadge: {
        backgroundColor: "#2a2a2a", borderRadius: 8,
        paddingHorizontal: 5, paddingVertical: 1,
    },
    pillBadgeActive: { backgroundColor: "rgba(46,204,113,0.2)" },
    pillBadgeText: { color: "#6b7280", fontSize: 10, fontWeight: "700" },
    pillBadgeTextActive: { color: "#2ecc71" },

    // List
    list: { paddingTop: 6, paddingBottom: 32 },
    empty: {
        flex: 1, alignItems: "center", justifyContent: "center",
        gap: 10, paddingBottom: 60,
    },
    emptyTitle: { color: "#9ca3af", fontSize: 16, fontWeight: "600" },
    emptySubtitle: { color: "#4b5563", fontSize: 13 },
    loadingMore: { paddingVertical: 20, alignItems: "center" },

    // Card
    card: {
        marginHorizontal: 12, marginVertical: 4,
        borderRadius: 14, backgroundColor: "#111",
        borderWidth: 1, borderColor: "#1e1e1e",
        overflow: "hidden",
    },
    cardUnread: {
        backgroundColor: "#0f1a12",
        borderColor: "rgba(46,204,113,0.2)",
    },
    unreadBar: {
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: 3, backgroundColor: "#2ecc71", borderRadius: 2,
    },
    cardInner: {
        flexDirection: "row", gap: 12,
        padding: 14,
    },
    iconCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "rgba(46,204,113,0.1)",
        borderWidth: 1, borderColor: "rgba(46,204,113,0.2)",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
    },
    iconDot: {
        position: "absolute", top: 1, right: 1,
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: "#2ecc71", borderWidth: 2, borderColor: "#0f1a12",
    },
    cardContent: { flex: 1, gap: 8 },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    cardTitleWrap: { flex: 1 },
    cardTitle: { color: "#d1d5db", fontSize: 13, lineHeight: 19 },
    senderName: { color: "#fff", fontWeight: "700" },
    cardRight: { alignItems: "flex-end", gap: 6, flexShrink: 0 },
    timeAgo: { color: "#6b7280", fontSize: 11 },
    dismissBtn: {
        width: 22, height: 22, borderRadius: 6,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },

    bodyBubble: {
        backgroundColor: "#1a1a1a", borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: "#2a2a2a",
    },
    bodyText: { color: "#d1d5db", fontSize: 13, lineHeight: 19 },

    inviteRow: { flexDirection: "row", gap: 8 },
    denyBtn: {
        flex: 1, paddingVertical: 9, borderRadius: 8,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#374151",
        alignItems: "center",
    },
    denyText: { color: "#9ca3af", fontSize: 13, fontWeight: "600" },
    acceptBtn: {
        flex: 1, paddingVertical: 9, borderRadius: 8,
        backgroundColor: "rgba(46,204,113,0.12)", borderWidth: 1, borderColor: "#2ecc71",
        alignItems: "center",
    },
    acceptText: { color: "#2ecc71", fontSize: 13, fontWeight: "700" },
});
