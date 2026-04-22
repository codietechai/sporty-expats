import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import { getEvents, GET_EVENTS_KEY } from "@/client/endpoints/events/getEvents";
import type { Event, GetEventsQueryParams } from "@/client/endpoints/events/types";

export type EventFilters = {
    category?: string;
    startDate?: string;
    endDate?: string;
    minimumPrice?: number;
    maximumPrice?: number;
    creator?: string;
    userId?: string;
    timeFilter?: "upcoming" | "ongoing" | "past";
};

const DEBOUNCE_MS = 400;

export function useEvents(initialFilters: EventFilters = {}) {
    const [filters, setFilters] = useState<EventFilters>(initialFilters);
    const [debouncedFilters, setDebouncedFilters] = useState<EventFilters>(initialFilters);
    const [nextCursor, setNextCursor] = useState<string | undefined>();
    const [prevCursor, setPrevCursor] = useState<string | undefined>();
    const [activeCursor, setActiveCursor] = useState<{ startingAfter?: string; endingBefore?: string }>({});
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce filter changes
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedFilters(filters);
            // Reset pagination when filters change
            setActiveCursor({});
        }, DEBOUNCE_MS);
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [filters]);

    const queryParams: GetEventsQueryParams = {
        ...debouncedFilters,
        ...activeCursor,
    };

    const { data, isLoading, isError, error, refetch } = useQuery(
        [GET_EVENTS_KEY, queryParams],
        () => getEvents(queryParams),
        {
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            retry: 1,
            onSuccess: (res) => {
                setNextCursor(res.nextCursor || undefined);
                setPrevCursor(res.prevCursor || undefined);
            },
        }
    );

    const events: Event[] = data?.data ?? [];

    const goToNextPage = useCallback(() => {
        if (nextCursor) setActiveCursor({ startingAfter: nextCursor });
    }, [nextCursor]);

    const goToPrevPage = useCallback(() => {
        if (prevCursor) setActiveCursor({ endingBefore: prevCursor });
    }, [prevCursor]);

    const updateFilters = useCallback((newFilters: Partial<EventFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({});
        setActiveCursor({});
    }, []);

    return {
        events,
        isLoading,
        isError,
        error,
        refetch,
        filters,
        updateFilters,
        resetFilters,
        hasNextPage: !!nextCursor,
        hasPrevPage: !!prevCursor,
        goToNextPage,
        goToPrevPage,
    };
}
