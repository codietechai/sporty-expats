/**
 * A module-level navigation ref that can be used outside of React component trees
 * (e.g. in usePushNotifications when the app wakes from a background push tap).
 *
 * Usage:
 *   import { navigationRef, navigateFromRef } from "@/helpers/navigationRef";
 *   // In _layout.tsx → pass `ref={navigationRef}` to the NavigationContainer (or Stack).
 *   // Elsewhere → call navigateFromRef("EventInfo", { eventId: "..." })
 */

import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef<any>();

/**
 * Navigate to a screen imperatively from outside a component.
 * Safe to call before the navigator has mounted — the call is silently dropped if
 * the ref is not yet ready.
 */
export function navigateFromRef(screen: string, params?: Record<string, unknown>): void {
  if (navigationRef.isReady()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigationRef as any).navigate(screen, params);
  }
}

/**
 * Shared helper: given a notification payload data object, resolve the correct
 * screen name and params to navigate to.
 *
 * Priority:
 *  1. metadata.postId    → "Post"
 *  2. metadata.storyId   → "Post" (stories use the same screen; the screen
 *                           gracefully falls back to the dashboard if not found)
 *  3. metadata.eventId   → "EventInfo"
 *  4. actionUrl patterns → "EventInfo" | "Post"
 *
 * Returns null if there is no navigable destination.
 */
export function resolveNotificationDestination(
  data: Record<string, string> | null | undefined,
  actionUrl?: string | null,
): { screen: string; params: Record<string, unknown> } | null {
  if (!data && !actionUrl) return null;

  // 1. Explicit metadata IDs — most reliable (set by backend after our fix)
  if (data?.postId) {
    return { screen: "Post", params: { postId: data.postId } };
  }
  if (data?.storyId) {
    return { screen: "Post", params: { postId: data.storyId } };
  }
  if (data?.eventId) {
    return { screen: "EventInfo", params: { eventId: data.eventId } };
  }

  // 2. Parse actionUrl — handles all known URL patterns from the backend.
  //    Patterns observed in production payloads:
  //      /posts/:id               (future, after backend fix)
  //      /stories/:id             (future, after backend fix)
  //      /events/:id              (event notifications)
  //      /admin/feeds/:id         (post review notification sent to admin — reused for user too)
  //      /feeds/:id               (alternate post URL)
  if (actionUrl) {
    const url = actionUrl.trim();
    if (url && url !== "#" && url !== "/") {
      // Order matters — more specific patterns first
      const eventMatch = url.match(/\/events?\/([a-zA-Z0-9_-]+)/i);
      const feedMatch  = url.match(/\/(?:admin\/)?feeds?\/([a-zA-Z0-9_-]+)/i);
      const postMatch  = url.match(/\/posts?\/([a-zA-Z0-9_-]+)/i);
      const storyMatch = url.match(/\/stor(?:y|ies)\/([a-zA-Z0-9_-]+)/i);

      if (eventMatch?.[1]) return { screen: "EventInfo", params: { eventId: eventMatch[1] } };
      if (feedMatch?.[1])  return { screen: "Post",      params: { postId:  feedMatch[1]  } };
      if (postMatch?.[1])  return { screen: "Post",      params: { postId:  postMatch[1]  } };
      if (storyMatch?.[1]) return { screen: "Post",      params: { postId:  storyMatch[1] } };
    }
  }

  // 3. Category fallback — notification has no extractable ID (e.g. "Post Approved"
  //    with actionUrl pointing to /dashboard). Navigate to Dashboard so the tap
  //    is never silently swallowed.
  if (data?.category === "posts" || data?.category === "stories") {
    return { screen: "Dashboard", params: {} };
  }

  return null;
}
