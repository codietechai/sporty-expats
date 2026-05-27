import { backendClient } from "@/client/backendClient";
import type { Event, EventsResponse } from "./types";

export const GET_USER_CREATED_EVENTS_KEY = "user-created-events";

export const getUserCreatedEvents = async (
    userId: string,
    params: { startingAfter?: string; endingBefore?: string } = {},
): Promise<EventsResponse> => {
    try {
        const response = await backendClient.get<EventsResponse>(
            `/users/${userId}/events/created`,
            { params },
        );
        return response.data;
    } catch (err: any) {
        if (err?.response?.status === 404) {
            return { data: [] as Event[], prevCursor: "", nextCursor: "" };
        }
        throw err;
    }
};
