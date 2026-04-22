import { backendClient } from "@/client/backendClient";

export const getUserEventStatus = async (userId: string, eventId: string) => {
    const response = await backendClient.get(`/users/${userId}/events/${eventId}/status`);
    return response.data as { status: string; isAttending: boolean };
};

export const withdrawParticipation = async (userId: string, eventId: string) => {
    const response = await backendClient.post(`/users/${userId}/events/${eventId}/withdraw`);
    return response.data;
};
