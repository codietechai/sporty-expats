import { useEffect, useState } from "react";
import { getEventById } from "@/client/endpoints/events/getEventById";

const cache = new Map<string, string>();

const DEFAULT = "https://placehold.co/144x150/1e2e1e/4ade80?text=🏟️";

export function useRoomCoverImage(
    eventId: string | undefined,
    fallbackUrl?: string
): string {
    const [url, setUrl] = useState<string>(() => {
        if (eventId && cache.has(eventId)) return cache.get(eventId)!;
        if (fallbackUrl && fallbackUrl.startsWith("http")) return fallbackUrl;
        return DEFAULT;
    });

    useEffect(() => {
        if (!eventId) return;
        if (cache.has(eventId)) { setUrl(cache.get(eventId)!); return; }

        getEventById(eventId)
            .then((event) => {
                const fresh = event?.coverImage?.fileUrl;
                if (fresh && fresh.startsWith("http")) {
                    cache.set(eventId, fresh);
                    setUrl(fresh);
                }
            })
            .catch((err) => {
                console.log("[useRoomCoverImage] failed for", eventId, err?.message);
            });
    }, [eventId]);

    return url;
}
