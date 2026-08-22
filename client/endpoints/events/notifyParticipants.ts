import { backendClient } from "@/client/backendClient";

export type NotifyTarget = "interested" | "everyone";

export interface NotifyParticipantsPayload {
  requestingUserId: string;
  message: string;
  target: NotifyTarget;
}

export interface NotifyParticipantsResult {
  success: boolean;
  sentCount: number;
}

/**
 * POST /events/:eventId/notify
 * Sends a custom invitation notification to users who haven't registered yet.
 * target = "interested" → users whose sport interests match the event category
 * target = "everyone"   → all platform users (excluding registrants / waitlist)
 */
export async function notifyParticipants(
  eventId: string,
  payload: NotifyParticipantsPayload,
): Promise<NotifyParticipantsResult> {
  const response = await backendClient.post(`/events/${eventId}/notify`, payload);
  return response.data;
}
