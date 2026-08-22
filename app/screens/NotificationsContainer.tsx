import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import NotificationsScreen, { NotificationCategory, Notification } from "./NotificationsScreen";
import type { NotificationType } from "@sparkstrand/notifications-react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { resolveNotificationDestination } from "@/helpers/navigationRef";

// Map UI category keys → SDK NotificationType
const CATEGORY_TO_SDK: Partial<Record<NotificationCategory, NotificationType>> = {
    accountInformation: "INFO",
    messages:           "SYSTEM",
    invites:            "MARKETING",
    mentions:           "ALERT",
    reminders:          "REMINDER",
};

function countsByCategory(
    notifications: { type: NotificationType; isRead: boolean }[],
): Record<NotificationCategory, number> {
    const unread = notifications.filter((n) => !n.isRead);
    return {
        all:                unread.length,
        accountInformation: unread.filter((n) => n.type === "INFO").length,
        messages:           unread.filter((n) => n.type === "SYSTEM").length,
        invites:            unread.filter((n) => n.type === "MARKETING").length,
        mentions:           unread.filter((n) => n.type === "ALERT").length,
        reminders:          unread.filter((n) => n.type === "REMINDER").length,
    };
}

export default function NotificationsContainer() {
    const navigation = useNavigation<any>();
    const {
        notifications,
        unreadCount,
        isLoading,
        pagination,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchNotifications,
        refreshNotifications,
    } = useNotificationsContext();

    const [activeCategory, setActiveCategory] = useState<NotificationCategory>("all");

    // Initial load
    useEffect(() => {
        fetchNotifications({ page: 1, limit: 20, includeRead: true });
    }, []);

    // Refetch on focus so returning to this screen always shows fresh notifications
    useFocusEffect(
        useCallback(() => {
            refreshNotifications();
        }, [refreshNotifications])
    );

    const handleCategoryChange = useCallback((cat: NotificationCategory) => {
        setActiveCategory(cat);
        const sdkType = CATEGORY_TO_SDK[cat];
        fetchNotifications({
            page: 1,
            limit: 20,
            includeRead: true,
            ...(sdkType ? { type: sdkType } : {}),
        });
    }, [fetchNotifications]);

    const handleRefresh = useCallback(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    const handleLoadMore = useCallback(() => {
        if (!pagination) return;
        const nextPage = pagination.page + 1;
        if (nextPage > pagination.totalPages) return;
        const sdkType = CATEGORY_TO_SDK[activeCategory];
        fetchNotifications({
            page: nextPage,
            limit: 20,
            includeRead: true,
            ...(sdkType ? { type: sdkType } : {}),
        });
    }, [fetchNotifications, pagination, activeCategory]);

    const hasMore = pagination
        ? pagination.page < pagination.totalPages
        : false;

    const handleNavigate = useCallback((notification: Notification) => {
        const destination = resolveNotificationDestination(
            notification.metadata ?? null,
            notification.actionUrl ?? null,
        );
        if (!destination) return;
        navigation.navigate(destination.screen as never, destination.params as never);
    }, [navigation]);

    const categoryCounts = useMemo(
        () => countsByCategory(notifications as any),
        [notifications]
    );

    // Adapt SDK InAppNotification shape to our screen's Notification type
    const adapted = useMemo(() =>
        notifications.map((n) => ({
            id:        n.id,
            pushTitle: n.pushTitle,
            pushBody:  n.pushBody ?? null,
            type:      n.type as any,
            isRead:    n.isRead,
            createdAt: n.createdAt instanceof Date
                ? n.createdAt.toISOString()
                : String(n.createdAt),
            actionUrl: n.actionUrl ?? null,
            metadata:  n.metadata as Record<string, string> | null,
        })),
        [notifications]
    );

    return (
        <NotificationsScreen
            notifications={adapted}
            unreadCount={unreadCount}
            isLoading={isLoading}
            onMarkAsRead={(id) => markAsRead(id)}
            onMarkAllAsRead={() => markAllAsRead()}
            onDelete={(id) => deleteNotification(id)}
            onRefresh={handleRefresh}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            categoryCounts={categoryCounts}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            onNavigate={handleNavigate}
        />
    );
}
