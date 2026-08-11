import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@clerk/clerk-expo";
import type {
  InAppNotification,
  NotificationFilter,
  PaginationMetadata,
} from "@sparkstrand/notifications-react";
import { notificationsLoginFunction } from "@/client/endpoints/notifications/notificationsClient";
import { scheduleLocalNotification } from "@/app/hooks/usePushNotifications";

const NOTIFICATIONS_API = "https://notifications.sparkstrand.com/api";

interface NotificationsContextValue {
  unreadCount: number;
  notifications: InAppNotification[];
  isLoading: boolean;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: (ids?: string[]) => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  fetchNotifications: (params?: NotificationFilter) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  pagination: PaginationMetadata | null;
}

const defaultValue: NotificationsContextValue = {
  unreadCount: 0,
  notifications: [],
  isLoading: false,
  markAsRead: async () => false,
  markAllAsRead: async () => false,
  deleteNotification: async () => false,
  fetchNotifications: async () => {},
  refreshNotifications: async () => {},
  pagination: null,
};

const NotificationsContext = createContext<NotificationsContextValue>(defaultValue);

export function useNotificationsContext() {
  return useContext(NotificationsContext);
}

type ApiResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

type NotificationsResult = {
  notifications: InAppNotification[];
  pagination: PaginationMetadata;
  unreadCount: number;
};

function ActiveNotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const tokenRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const apiCall = useCallback(async <T,>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResult<T>> => {
    const request = async (token: string) =>
      fetch(`${NOTIFICATIONS_API}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

    try {
      if (!tokenRef.current) {
        tokenRef.current = (await notificationsLoginFunction()).token;
      }

      let response = await request(tokenRef.current);
      if (response.status === 401) {
        tokenRef.current = (await notificationsLoginFunction()).token;
        response = await request(tokenRef.current);
      }

      const result = (await response.json()) as ApiResult<T>;
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? `Notification request failed (${response.status})`);
      }
      return result;
    } catch (error) {
      console.warn("[Notifications] Native API request failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Notification request failed",
      };
    }
  }, []);

  const fetchNotifications = useCallback(async (
    filter: NotificationFilter = { page: 1, limit: 20 },
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) params.append(key, String(value));
      });

      const result = await apiCall<NotificationsResult>(
        `/notifications/app/user?${params.toString()}`,
      );
      if (!mountedRef.current || !result.success || !result.data) return;

      const incoming = result.data.notifications.map((notification) => ({
        ...notification,
        createdAt: new Date(notification.createdAt),
        updatedAt: new Date(notification.updatedAt),
        sentAt: new Date(notification.sentAt),
        readAt: notification.readAt ? new Date(notification.readAt) : undefined,
      }));

      setNotifications((current) => {
        if ((filter.page ?? 1) <= 1) return incoming;
        const merged = new Map(current.map((item) => [item.id, item]));
        incoming.forEach((item) => merged.set(item.id, item));
        return Array.from(merged.values());
      });
      setPagination(result.data.pagination);
      setUnreadCount(result.data.unreadCount);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [apiCall]);

  const refreshNotifications = useCallback(
    () => fetchNotifications({ page: 1, limit: 20, includeRead: true }),
    [fetchNotifications],
  );

  const markAsRead = useCallback(async (id: string) => {
    const result = await apiCall("/notifications/app/user/mark-as-read", {
      method: "PUT",
      body: JSON.stringify({ notificationId: id }),
    });
    if (result.success) await refreshNotifications();
    return result.success;
  }, [apiCall, refreshNotifications]);

  const markAllAsRead = useCallback(async (ids: string[] = []) => {
    const result = await apiCall("/notifications/app/user/mark-as-read", {
      method: "PUT",
      body: JSON.stringify({ notificationId: ids }),
    });
    if (result.success) await refreshNotifications();
    return result.success;
  }, [apiCall, refreshNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    const result = await apiCall("/notifications/app/user", {
      method: "DELETE",
      body: JSON.stringify({ notificationId: id }),
    });
    if (result.success) await refreshNotifications();
    return result.success;
  }, [apiCall, refreshNotifications]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshNotifications();
    const interval = setInterval(() => void refreshNotifications(), 30_000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    if (notifications.length === 0) return;
    if (isFirstLoadRef.current) {
      notifications.forEach((notification) => seenIdsRef.current.add(notification.id));
      isFirstLoadRef.current = false;
      return;
    }

    notifications
      .filter((notification) => !notification.isRead && !seenIdsRef.current.has(notification.id))
      .forEach((notification) => {
        seenIdsRef.current.add(notification.id);
        void scheduleLocalNotification(
          notification.pushTitle ?? "New notification",
          notification.pushBody ?? "",
        );
      });
  }, [notifications]);

  return (
    <NotificationsContext.Provider value={{
      unreadCount,
      notifications,
      isLoading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      fetchNotifications,
      refreshNotifications,
      pagination,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <NotificationsContext.Provider value={defaultValue}>
        {children}
      </NotificationsContext.Provider>
    );
  }

  return <ActiveNotificationsProvider>{children}</ActiveNotificationsProvider>;
}
