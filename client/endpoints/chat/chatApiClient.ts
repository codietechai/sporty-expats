import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_CHAT_SERVER_URL!;
const API_KEY = process.env.EXPO_PUBLIC_CHAT_API_KEY!;

export interface ChatLocation {
    name: string;
    latitude: string;
    longitude: string;
}

export interface CoverImage {
    filename: string;
    fileUrl: string;
}

export interface EventRoomMetadata {
    title: string;
    description?: string;
    coverImage?: CoverImage;
    startDate?: string;
    endDate?: string;
    location?: ChatLocation;
    category?: string;
    ticketPrice?: number;
    isPaidEvent?: boolean;
    visibility?: "Public" | "Private";
    availableTickets?: number;
}

export interface ChatRoomMember {
    userId: string;
    displayName?: string | null;
    name?: string | null;
    image?: string | null;
    roomRole?: string;
    lastReadMessageId?: string | null;
}

export interface ChatRoom {
    roomId: string;
    type: string;
    subType?: string;
    metadata?: EventRoomMetadata;
    members?: ChatRoomMember[];
    lastMessageAt?: string;
    createdAt: string;
    unreadCount?: number;
}

export interface MessageReaction {
    id?: string;
    emoji: string;
    userId: string;
    messageId: string;
    tempId?: string;
}

export interface ChatAttachment {
    type: string;
    url: string;
    name: string;
    mime: string;
    size: number;
}

export interface ChatMessage {
    id: string;
    tempId?: string;
    roomId: string;
    userId: string;
    content?: string | null;
    replyToId?: string | null;
    attachments?: ChatAttachment[] | null;
    reactions?: MessageReaction[] | null;
    editedAt?: string | null;
    isDeleted?: boolean;
    createdAt: string;
    updatedAt?: string;
    status?: "sending" | "failed";
}

export interface QueryRoomsResult {
    rooms: ChatRoom[];
    total: number;
}

function makeHttp(token: string) {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            "x-api-key": API_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}

export async function queryRooms(token: string, page = 1, pageSize = 10): Promise<QueryRoomsResult> {
    const http = makeHttp(token);
    const params = new URLSearchParams();
    params.append("limit", String(pageSize));
    params.append("offset", String((page - 1) * pageSize));
    params.append("state", "true");
    params.append("filter_conditions", JSON.stringify({ type: "messaging", subType: "group" }));
    const res = await http.get(`/api/v2/chat/rooms?${params.toString()}`);
    const data = res.data?.data ?? res.data;
    return { rooms: data?.rooms ?? [], total: data?.total ?? 0 };
}

export async function queryMessages(token: string, roomId: string, idLt: string, limit = 30): Promise<ChatMessage[]> {
    const http = makeHttp(token);
    const res = await http.get(`/api/v2/chat/rooms/${roomId}/messages`, { params: { id_lt: idLt, limit } });
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
}

export async function connectUser(token: string, user: {
    userId: string;
    displayName?: string;
    name?: string;
    image?: string;
    role?: string;
    banned?: boolean;
    invisible?: boolean;
    online?: boolean;
    hideOnlineStatus?: boolean;
    createdAt?: string;
    updatedAt?: string;
}): Promise<{ userId: string;[key: string]: any }> {
    const http = makeHttp(token);
    const res = await http.post(`/api/v2/chat/users/connect`, user);
    const data = res.data?.data ?? res.data;
    return data;
}
