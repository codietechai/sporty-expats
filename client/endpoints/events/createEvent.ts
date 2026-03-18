import { backendClient } from "@/client/backendClient";
import type { CreateEventPayload, Event } from "./types";

export const CREATE_EVENT_KEY = "create-event";

export const createEvent = async (payload: CreateEventPayload): Promise<Event> => {
    const response = await backendClient.post<Event>("/events", payload);
    return response.data;
};
