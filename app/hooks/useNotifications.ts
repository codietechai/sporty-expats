import { useNotifications } from "@sparkstrand/notifications-react";
import { notificationsLoginFunction } from "@/client/endpoints/notifications/notificationsClient";

/**
 * Thin wrapper around the sparkstrand useNotifications hook.
 * Passes our backend auth function so the SDK handles all token
 * management, polling, pagination, and API calls itself.
 */
export function useNotificationsHook() {
    return useNotifications({
        loginFunction: notificationsLoginFunction,
        apiUrl: "https://notifications.sparkstrand.com/api",
        enablePolling: true,
        pollInterval: 60_000,
    });
}
