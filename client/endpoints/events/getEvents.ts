import { backendClient } from "@/client/backendClient";
import type { EventsResponse, GetEventsQueryParams } from "./types";

export const GET_EVENTS_KEY = "get-events";

export const getEvents = async (
    params: GetEventsQueryParams = {}
): Promise<EventsResponse> => {
    // Only include params that have a defined, non-empty value
    const cleanParams: Record<string, string | number> = {};

    if (params.startingAfter) cleanParams.startingAfter = params.startingAfter;
    if (params.endingBefore) cleanParams.endingBefore = params.endingBefore;
    if (params.userId) cleanParams.userId = params.userId;
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;
    if (params.category) cleanParams.category = params.category;
    if (params.creator) cleanParams.creator = params.creator;
    if (params.minimumPrice != null) cleanParams.minimumPrice = params.minimumPrice;
    if (params.maximumPrice != null) cleanParams.maximumPrice = params.maximumPrice;

    const response = await backendClient.get<EventsResponse>("/events", {
        params: cleanParams,
    });

    return response.data;
};
