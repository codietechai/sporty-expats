import { backendClient } from "@/client/backendClient";
import type { Event } from "./types";

export const getEventById = async (eventId: string): Promise<Event> => {
    const response = await backendClient.get<Event>(`/events/${eventId}`);
    return response.data;
};
