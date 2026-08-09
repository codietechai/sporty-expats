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
            `users/${userId}/events/${eventId}/attendee`,
        );
        return response.data?.data ?? null;
    } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
    }
};

export const withdrawParticipation = async (userId: string, eventId: string) => {
    // POST /events/{eventId}/withdraw with { userId } in body — matches web app
    const response = await backendClient.post(`events/${eventId}/withdraw`, { userId });
    return response.data;
};

export const getEventAttendeeStatus = async (userId: string, eventId: string) => {
    try {
        const response = await backendClient.get(`users/${userId}/events/${eventId}/status`);
        return response.data ?? null;
    } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
    }
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
export type RegisterPaidEventPayload = {
    userId: string;
    eventId: string;
    participants: number;
    tickets: TicketInfo[];
    payerName: string;
    payerEmail: string;
    amount: number;
    cardHolderName: string;
    cardNumber: string;
    expirationDate: string;
    cvv: string;
};

/**
 * Registers a user for a PAID event via PayPal card details.
 * Mirrors POST /api/payments with the card info in metaData.
 */
export const registerPaidEvent = async (payload: RegisterPaidEventPayload) => {
    const {
        userId, eventId, participants, tickets,
        payerName, payerEmail, amount,
        cardHolderName, cardNumber, expirationDate, cvv,
    } = payload;

    const transactionId = `paypal-${eventId}-${userId}-${Date.now()}`;

    const response = await backendClient.post(`payments`, {
        userId,
        amount,
        paymentType: "paypal",
        transactionId,
        refundTransactionId: transactionId,
        payer: { name: payerName, email: payerEmail },
        products: [{ purchaseType: "events", productId: eventId, quantity: participants }],
        metaData: {
            ticketsInfo: tickets,
            cardDetails: {
                cardHolderName,
                // Never log/store raw card data — pass through to backend only
                cardNumber,
                expirationDate,
                cvv,
            },
        },
    });

    return response.data;
};

export type RefundReason = "Withdrew" | "Not Attended" | "Going";

export type RequestRefundPayload = {
    userId: string;
    eventId: string;
    refundReason: RefundReason;
    description: string;
    numberOfTickets: number;
    fileUrl?: string;
};

/**
 * Submits a refund request for an event.
 * Mirrors POST /api/refund on the web app.
 */
export const requestRefund = async (payload: RequestRefundPayload) => {
    const response = await backendClient.post("refund", {
        userId: payload.userId,
        eventId: payload.eventId,
        refundReason: payload.refundReason,
        description: payload.description,
        numberOfTickets: payload.numberOfTickets,
        fileUrl: payload.fileUrl ?? "No File Provided",
    });
    return response.data;
};

export const registerFreeEvent = async (payload: RegisterFreeEventPayload) => {
    const { userId, eventId, participants, tickets, payerName, payerEmail } = payload;
    const transactionId = `free-${eventId}-${userId}-${Date.now()}`;

    const response = await backendClient.post(`payments`, {
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
