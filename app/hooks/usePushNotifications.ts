import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { resolveNotificationDestination } from "@/helpers/navigationRef";

// Show alerts for notifications received while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
}

/**
 * Optional callback supplied by the caller so navigation can happen inside
 * the React component tree (where useNavigation() is valid).
 */
export type PushTapHandler = (screen: string, params: Record<string, unknown>) => void;

export function usePushNotifications(onTap?: PushTapHandler): PushNotificationState {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  // Keep a stable ref to the latest onTap callback so the listener closure
  // doesn't go stale when the parent re-renders.
  const onTapRef = useRef<PushTapHandler | undefined>(onTap);
  useEffect(() => { onTapRef.current = onTap; }, [onTap]);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        console.log("[PushNotifications] Expo push token:", token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notif: Notifications.Notification) => setNotification(notif)
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        // Extract the data payload that was embedded in the notification.
        // Expo push notifications carry custom data in `notification.request.content.data`.
        const data = response.notification.request.content.data as
          | Record<string, string>
          | null
          | undefined;

        const actionUrl =
          (data?.actionUrl as string | undefined) ??
          (data?.action_url as string | undefined) ??
          null;

        const destination = resolveNotificationDestination(data ?? null, actionUrl);

        if (destination && onTapRef.current) {
          onTapRef.current(destination.screen, destination.params);
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification };
}

/**
 * Schedules a local push notification immediately.
 * Call this when a new in-app notification arrives via polling
 * so the user gets a visible alert even in Expo Go / dev builds.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        badge: 1,
      },
      trigger: null, // fire immediately
    });
  } catch (err) {
    console.warn("[PushNotifications] Failed to schedule local notification:", err);
  }
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[PushNotifications] Physical device required for push tokens.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2ecc71",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[PushNotifications] Permission not granted.");
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn("[PushNotifications] No EAS projectId — push token unavailable.");
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (err) {
    console.error("[PushNotifications] Failed to get push token:", err);
    return null;
  }
}
