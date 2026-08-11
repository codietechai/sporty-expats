/**
 * PayPal payment flow for React Native
 *
 * 1. POST payments/paypal/createOrder       → backend, returns orderId
 * 2. POST {PAYPAL_BASE}/v2/checkout/orders/{id}/confirm-payment-source → PayPal direct
 * 3. POST payments/paypal/{id}/captureOrder → backend
 * 4. POST payments                          → record payment in DB
 */

import axios from "axios";
import { backendClient } from "@/client/backendClient";
import { TicketInfo } from "@/client/endpoints/events/eventRegistration";

const PAYPAL_BASE_URL =
    process.env.EXPO_PUBLIC_PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID =
    process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID ?? "";

// ── Types ────────────────────────────────────────────────────────────────────

export type CardDetails = {
    cardHolderName: string;
    cardNumber: string;
    expirationDate: string;
    cvv: string;
};

export type PaypalPaymentPayload = {
    userId: string;
    eventId: string;
    participants: number;
    amount: number;
    payerName: string;
    payerEmail: string;
    tickets: TicketInfo[];
    card: CardDetails;
};

// ── Step 1: Create order ─────────────────────────────────────────────────────

export const createPaypalOrder = async (
    eventId: string,
    participants: number,
): Promise<string> => {
    const response = await backendClient.post("payments/paypal/createOrder", [
        { productId: eventId, quantity: participants, purchaseType: "events" },
    ]);

    const data = response.data;
    const orderId: string = data?.orderData?.id ?? data?.id ?? data?.data?.id;

    if (!orderId) {
        throw new Error(`No PayPal order ID returned. Response: ${JSON.stringify(data)}`);
    }

    return orderId;
};

// ── Step 2: Confirm payment source ───────────────────────────────────────────

export const confirmPaypalOrder = async (
    orderId: string,
    card: CardDetails,
): Promise<void> => {
    const [expMonth, expYear] = card.expirationDate.split("/");
    const fullYear = expYear.length === 2 ? `20${expYear}` : expYear;

    await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/confirm-payment-source`,
        {
            payment_source: {
                card: {
                    name: card.cardHolderName,
                    number: card.cardNumber,
                    expiry: `${fullYear}-${expMonth.padStart(2, "0")}`,
                    security_code: card.cvv,
                },
            },
        },
        {
            headers: {
                Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:`)}`,
                "Content-Type": "application/json",
            },
        },
    );
};

// ── Step 3: Capture order ────────────────────────────────────────────────────

export const capturePaypalOrder = async (orderId: string): Promise<string> => {
    const response = await backendClient.post(`payments/paypal/${orderId}/captureOrder`);

    return (
        response.data?.transactionId ??
        response.data?.data?.transactionId ??
        response.data?.captureData?.id ??
        orderId
    );
};

// ── Step 4: Record payment ───────────────────────────────────────────────────

export const recordPaypalPayment = async (
    payload: Omit<PaypalPaymentPayload, "card"> & {
        transactionId: string;
        refundTransactionId: string;
    },
): Promise<void> => {
    const {
        userId,
        eventId,
        participants,
        amount,
        payerName,
        payerEmail,
        tickets,
        transactionId,
        refundTransactionId,
    } = payload;

    await backendClient.post("payments", {
        userId,
        amount,
        paymentType: "paypal",
        transactionId,
        refundTransactionId,
        payer: { name: payerName, email: payerEmail },
        products: [{ purchaseType: "events", productId: eventId, quantity: participants }],
        metaData: { ticketsInfo: tickets },
    });
};

// ── Main flow ────────────────────────────────────────────────────────────────

export const processPaypalPayment = async (
    payload: PaypalPaymentPayload,
    onStatus?: (status: string) => void,
): Promise<void> => {
    const { userId, eventId, participants, amount, payerName, payerEmail, tickets, card } = payload;

    // onStatus?.("Creating order...");
    const orderId = await createPaypalOrder(eventId, participants);

    // onStatus?.("Authorizing card...");
    await confirmPaypalOrder(orderId, card);

    // onStatus?.("Completing payment...");
    const refundTransactionId = await capturePaypalOrder(orderId);

    // onStatus?.("Saving registration...");
    await recordPaypalPayment({
        userId,
        eventId,
        participants,
        amount,
        payerName,
        payerEmail,
        tickets,
        transactionId: orderId,
        refundTransactionId,
    });
};
