import { backendClient } from "@/client/backendClient";
import type { CreateEventPayload, Event } from "./types";

export const CREATE_EVENT_KEY = "create-event";

type CreateEventResponse = Event | {
    message?: string;
    event?: Event;
    data?: Event;
};

const unwrapCreatedEvent = (payload: CreateEventResponse): Event | null => {
    if (!payload) return null;
    if ("event" in payload && payload.event) return payload.event;
    if ("data" in payload && payload.data) return payload.data;
    if ("id" in payload && payload.id) return payload as Event;
    return null;
};

export const createEvent = async (payload: CreateEventPayload): Promise<Event> => {
    const response = await backendClient.post<CreateEventResponse>("/events", payload);
    const event = unwrapCreatedEvent(response.data);

    if (!event?.id) {
        throw new Error("Event creation response did not include a created event id.");
    }

    return event;
};
