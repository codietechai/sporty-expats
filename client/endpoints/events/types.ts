export type GetEventsQueryParams = {
    startingAfter?: string;
    endingBefore?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    creator?: string;
    minimumPrice?: number;
    maximumPrice?: number;
};

export type EventCoverImage = {
    filename: string;
    fileUrl: string;
};

export type EventLocation = {
    name: string;
    longitude: string;
    latitude: string;
};

export type Event = {
    id: string;
    title: string;
    description: string;
    coverImage: EventCoverImage;
    location: EventLocation;
    startDate: string;
    endDate: string;
    minAttendees: number;
    maxAttendees: number;
    category: string;
    ticketPrice: number;
    visibility: "Public" | "Private";
    status: string;
    availableTickets: number;
    paymentDeadline: string;
    refundDeadline: string;
    creatorId: string;
    organizers: string[];
    isPaidEvent: boolean;
    isFavoritedByUser: boolean;
    isBookmarkedByUser: boolean;
    createdAt: string;
    updatedAt: string;
    roomId: string | null;
    sourceId: string | null;
    rejectionReason: string | null;
    version: number;
};

export type EventsResponse = {
    data: Event[];
    prevCursor: string;
    nextCursor: string;
};

export type CreateEventPayload = {
    title: string;
    description: string;
    coverImage: EventCoverImage;
    location: EventLocation;
    startDate: string;
    endDate: string;
    minAttendees: number;
    maxAttendees: number;
    category: string;
    ticketPrice: number;
    visibility: "Public" | "Private";
    availableTickets: number;
    paymentDeadline: string;
    refundDeadline: string;
    isPaidEvent: boolean;
    organizers: string[];
    creatorId: string;
};
