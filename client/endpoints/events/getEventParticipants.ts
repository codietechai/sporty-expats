import { backendClient } from "@/client/backendClient";

export interface IParticipant {
  attendeeId: string;
  personId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  ticketsAssigned: number;
  attendantStatus: string; // "Going" | "Withdrew" | "Removed" | "Invited"
  amountPaid: number;
  paidAt: string;          // ISO date string
  paidByName: string | null;
  paidByEmail: string | null;
  isInvited: boolean;
  role?: "Organizer" | "Participant";
}

/**
 * GET /api/events/:eventId/participants?requestingUserId=...
 * Organizer-only, Approved events only.
 */
export async function getEventParticipants(
  eventId: string,
  requestingUserId: string,
): Promise<IParticipant[]> {
  const response = await backendClient.get(
    `/events/${eventId}/participants`,
    { params: { requestingUserId } },
  );
  const data = response.data?.data ?? response.data ?? [];
  return Array.isArray(data) ? data : [];
}

/**
 * DELETE /api/events/:eventId/participants/:personId
 * Body: { requestingUserId }
 * Marks attendee as "Removed", expires ticket, restores available tickets.
 */
export async function removeEventParticipant(
  eventId: string,
  personId: string,
  requestingUserId: string,
): Promise<void> {
  await backendClient.delete(`/events/${eventId}/participants/${personId}`, {
    data: { requestingUserId },
  });
}
