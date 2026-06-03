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
const PAGE_SIZE = 10;

export function useEvents(initialFilters: EventFilters = {}) {
    const [filters, setFilters] = useState<EventFilters>(initialFilters);
    const [debouncedFilters, setDebouncedFilters] = useState<EventFilters>(initialFilters);

    // Cursor history: index 0 = page 1 (no cursor), index n = cursor for page n+1
    const [cursorHistory, setCursorHistory] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeCursor, setActiveCursor] = useState<{ startingAfter?: string; endingBefore?: string }>({});

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedFilters(filters);
            // Reset pagination when filters change
            setActiveCursor({});
            setCurrentPage(1);
            setCursorHistory([]);
        }, DEBOUNCE_MS);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [filters]);

    const queryParams: GetEventsQueryParams = {
        ...debouncedFilters,
        ...activeCursor,
    };

    const { data, isLoading, isError, isFetching, error, refetch } = useQuery(
        [GET_EVENTS_KEY, queryParams],
        () => getEvents(queryParams),
        {
            keepPreviousData: false,
            refetchOnWindowFocus: false,
            retry: 1,
        }
    );

    const events: Event[] = data?.data ?? [];
    const nextCursor = data?.nextCursor || undefined;
    const prevCursor = data?.prevCursor || undefined;

    const goToNextPage = useCallback(() => {
        if (!nextCursor) return;
        setCursorHistory((prev) => {
            const updated = [...prev];
            updated[currentPage - 1] = nextCursor;
            return updated;
        });
        setActiveCursor({ startingAfter: nextCursor });
        setCurrentPage((p) => p + 1);
    }, [nextCursor, currentPage]);

    const goToPrevPage = useCallback(() => {
        if (currentPage <= 1) return;
        const prevPage = currentPage - 2; // index into history for the page before current
        const cursor = prevPage >= 0 ? cursorHistory[prevPage - 1] : undefined;
        setActiveCursor(cursor ? { startingAfter: cursor } : {});
        setCurrentPage((p) => p - 1);
    }, [currentPage, cursorHistory]);

    const updateFilters = useCallback((newFilters: Partial<EventFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({});
        setActiveCursor({});
        setCurrentPage(1);
        setCursorHistory([]);
    }, []);

    return {
        events,
        isLoading: isLoading || isFetching,
        isError,
        error,
        refetch,
        filters,
        updateFilters,
        resetFilters,
        currentPage,
        pageSize: PAGE_SIZE,
        hasNextPage: !!nextCursor,
        hasPrevPage: currentPage > 1,
        goToNextPage,
        goToPrevPage,
    };
}
