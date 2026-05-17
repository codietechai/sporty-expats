import { backendClient } from "@/client/backendClient";

export type AttendeeStatus =
    | "Going"
    | "NotAttended"
    | "Withdrew"
    | "not present";

export type AttendeeData = {
    id: string;
    eventId: string;
    personId: string;
    ticketId: string;
    ticketsAssigned: number;
    attendantStatus: AttendeeStatus;
};

/**
 * Fetches the attendee record for a user on an event.
 * Mirrors GET /api/users/{id}/events/{eventId}/attendee on the web.
 * Returns null if the user is not registered (404).
 */
export const getAttendee = async (
    userId: string,
    eventId: string,
): Promise<AttendeeData | null> => {
    try {
        const response = await backendClient.get(
            `/users/${userId}/events/${eventId}/attendee`,
        );
        return response.data?.data ?? null;
    } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
    }
};

export const withdrawParticipation = async (userId: string, eventId: string) => {
    const response = await backendClient.post(`/users/${userId}/events/${eventId}/withdraw`);
    return response.data;
};

export type TicketInfo = {
    name: string;
    email: string;
    phone: string;
    numTickets: number;
    note: string;
};

export type RegisterFreeEventPayload = {
    userId: string;
    eventId: string;
    participants: number;
    tickets: TicketInfo[];
    payerName: string;
    payerEmail: string;
};

/**
 * Registers a user for a FREE event.
 * Mirrors POST /api/payments with amount: 0 — same as the web app.
 */
export const registerFreeEvent = async (payload: RegisterFreeEventPayload) => {
    const { userId, eventId, participants, tickets, payerName, payerEmail } = payload;
    const transactionId = `free-${eventId}-${userId}-${Date.now()}`;

    const response = await backendClient.post(`/payments`, {
        userId,
        amount: 0,
        paymentType: "paypal",
        transactionId,
        refundTransactionId: transactionId,
        payer: { name: payerName, email: payerEmail },
        products: [{ purchaseType: "events", productId: eventId, quantity: participants }],
        metaData: { ticketsInfo: tickets },
    });

    return response.data;
};
