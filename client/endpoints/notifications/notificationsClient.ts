/**
 * Sparkstrand notifications auth for React Native.
 * The hook (useNotificationsHook) calls the SDK directly —
 * this module only provides the loginFunction the SDK needs.
 */

import { backendClient } from "@/client/backendClient";

/**
 * Called by the SDK to get a fresh auth token.
 * POSTs to /notifications/auth on our backend, which proxies to sparkstrand.
 */
export async function notificationsLoginFunction(): Promise<{ token: string }> {
    const response = await backendClient.post("notifications/auth");
    const { token } = response.data as { token: string };
    if (!token) throw new Error("No token returned from notifications auth");
    return { token };
}
