import { backendClient } from "@/client/backendClient";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InvitationStatus =
  | "Pending"
  | "Accepted"
  | "Declined"
  | "Withdrew"
  | "Attended"
  | "NotAttended";

export interface InvitedUser {
  id: string;           // EventInvitation.id
  eventId: string;
  personId: string;     // PersonalDetails.id (stored in DB)
  status: InvitationStatus;
  paid: boolean;
  invitee: {
    id: string;         // PersonalDetails.id
    email: string;
    firstName: string | null;
    lastName: string | null;
    user: { id: string } | null;  // User.id — needed for resend
  };
}

export interface SendInvitePayload {
  personId: string;          // User.id (API resolves to PersonalDetails.id internally)
  requestingUserId: string;  // must be event creator
}

// ── GET /events/:eventId/invitations?requestingUserId=... ─────────────────────

export async function getEventInvitations(
  eventId: string,
  requestingUserId: string,
): Promise<InvitedUser[]> {
  const response = await backendClient.get(
    `/events/${eventId}/invitations`,
    { params: { requestingUserId } },
  );
  // API returns the array directly
  const data = response.data?.data ?? response.data ?? [];
  return Array.isArray(data) ? data : [];
}

// ── POST /events/:eventId/invitations ─────────────────────────────────────────
// Idempotent upsert — safe to call for "resend" too.

export async function sendEventInvitation(
  eventId: string,
  payload: SendInvitePayload,
): Promise<void> {
  await backendClient.post(`/events/${eventId}/invitations`, payload);
}
