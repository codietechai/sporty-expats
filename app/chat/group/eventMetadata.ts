export interface EventRoomMetadata {
    title: string;
    description?: string;
    coverImage?: { filename: string; fileUrl: string };
    startDate?: string;
    endDate?: string;
    location?: { name: string; latitude: string; longitude: string };
    category?: string;
    ticketPrice?: number;
    isPaidEvent?: boolean;
    visibility?: "Public" | "Private";
    availableTickets?: number;
    refundDeadline?: string;
    paymentDeadline?: string;
    organizers?: string[];
    creatorId?: string;
    minAttendees?: number;
    maxAttendees?: number;
}

export function isEventPast(metadata: EventRoomMetadata): boolean {
    if (!metadata?.endDate) return false;
    return new Date(metadata.endDate).getTime() < Date.now();
}

export function isEventUpcoming(metadata: EventRoomMetadata): boolean {
    if (!metadata?.endDate) return true;
    return new Date(metadata.endDate).getTime() >= Date.now();
}

export function formatEventDate(date: string): string {
    return new Date(date)
        .toLocaleDateString("en-US", {
            weekday: "short", month: "short", day: "numeric",
            year: "numeric", hour: "2-digit", minute: "2-digit",
            timeZoneName: "short",
        })
        .toUpperCase();
}
