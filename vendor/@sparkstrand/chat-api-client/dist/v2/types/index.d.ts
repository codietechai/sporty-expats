import { EventEmitter } from 'eventemitter3';

declare enum SocketEvent {
    CONNECT = "connect",
    DISCONNECT = "disconnect",
    CONNECT_ERROR = "connect_error",
    CONNECTION_SUCCESS = "connection.success",
    CONNECTION_ERROR = "connection.error",
    ROOM_WATCH = "room.watch",
    ROOM_STOP_WATCH = "room.stop_watch",
    MESSAGE_SEND = "message.send",
    MESSAGE_UPDATE = "message.update",
    MESSAGE_DELETE = "message.delete",
    MESSAGE_MARK_READ = "message.mark_read",
    MESSAGE_REACTION = "message.reaction",
    MESSAGE_REACTION_DELETE = "message.reaction.delete",
    MESSAGE_NEW = "message.new",
    MESSAGE_UPDATED = "message.updated",
    MESSAGE_DELETED = "message.deleted",
    MESSAGE_READ = "message.read",
    MESSAGE_REACTION_NEW = "message.reaction.new",
    MESSAGE_REACTION_DELETED = "message.reaction.deleted",
    NOTIFICATION_UNREAD = "notification.unread",
    USER_PRESENCE_CHANGED = "user.presence.changed",
    TYPING_START = "typing.start",
    TYPING_STOP = "typing.stop",
    CONNECTION_CHANGED = "connection.changed",
    THREAD_NEW = "message.new.thread",
    ROOM_ADDED = "room.added",
    ROOM_REMOVED = "room.removed",
    ROOM_DELETED = "room.deleted",
    ROOM_FROZEN = "room.frozen",
    ROOM_TRUNCATED = "room.truncated",
    MEMBER_MODERATED = "member.moderated",
    STATE_SYNCED = "state.synced"
}
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
/**These are events that the client emits often with acknowledgement callbacks */
interface ClientToServerEvents {
    [SocketEvent.ROOM_WATCH]: (payload: {
        roomId: string;
    }, callback?: (res: IResponse<ChatRoom>) => void) => void;
    [SocketEvent.ROOM_STOP_WATCH]: (payload: {
        roomId: string;
        lastMessageId?: string;
    }, callback?: (res: IResponse<null>) => void) => void;
    [SocketEvent.MESSAGE_SEND]: (Payload: ICreateMessage, callback?: (res: IResponse<ChatMessage>) => void) => void;
    [SocketEvent.MESSAGE_UPDATE]: (payload: IUpdateMessage, callback?: (res: IResponse<ChatMessage>) => void) => void;
    [SocketEvent.MESSAGE_DELETE]: (payload: IDeleteMessage, callback?: (res: IResponse<ChatMessage>) => void) => void;
    [SocketEvent.MESSAGE_MARK_READ]: (payload: {
        roomId: string;
    }, callback?: (res: IResponse<{
        messageId: string;
        roomId: string;
    }>) => void) => void;
    [SocketEvent.MESSAGE_REACTION]: (payload: ICreateMessageReaction, callback?: (res: IResponse<ChatMessageReaction>) => void) => void;
    [SocketEvent.MESSAGE_REACTION_DELETE]: (payload: IDeleteMessageReaction, callback?: (res: IResponse<ChatMessageReaction>) => void) => void;
    [SocketEvent.TYPING_START]: (payload: {
        roomId: string;
    }) => void;
    [SocketEvent.TYPING_STOP]: (payload: {
        roomId: string;
    }) => void;
}
interface ServerToClientEvents {
    [SocketEvent.MESSAGE_NEW]: (arg: ChatMessage) => void;
    [SocketEvent.MESSAGE_UPDATED]: (arg: ChatMessage) => void;
    [SocketEvent.MESSAGE_DELETED]: (arg: ChatMessage) => void;
    [SocketEvent.MESSAGE_READ]: (arg: {
        userId: string;
        roomId: string;
    }) => void;
    [SocketEvent.MESSAGE_REACTION_NEW]: (arg: ChatMessageReaction) => void;
    [SocketEvent.MESSAGE_REACTION_DELETED]: (arg: ChatMessageReaction) => void;
    [SocketEvent.THREAD_NEW]: (arg: ChatMessage) => void;
    [SocketEvent.NOTIFICATION_UNREAD]: (arg: {
        roomId: string;
        unreadCount: number;
    }) => void;
    [SocketEvent.USER_PRESENCE_CHANGED]: (arg: ChatUserPresentChange) => void;
    [SocketEvent.ROOM_ADDED]: (arg: ChatRoom) => void;
    [SocketEvent.ROOM_REMOVED]: (arg: ChatRoom) => void;
    [SocketEvent.ROOM_DELETED]: (arg: ChatRoom) => void;
    [SocketEvent.ROOM_FROZEN]: (arg: ChatRoom) => void;
    [SocketEvent.ROOM_TRUNCATED]: (arg: ChatRoom) => void;
    [SocketEvent.TYPING_START]: (arg: {
        userId: string;
        roomId: string;
    }) => void;
    [SocketEvent.TYPING_STOP]: (arg: {
        userId: string;
        roomId: string;
    }) => void;
    [SocketEvent.MEMBER_MODERATED]: (arg: {
        memberId: string;
        action: string;
    }) => void;
    [SocketEvent.CONNECTION_CHANGED]: (arg: {
        status: ConnectionState;
        userId?: string;
    }) => void;
    [SocketEvent.CONNECTION_SUCCESS]: (arg: {
        userId?: string;
        message: string;
    }) => void;
    [SocketEvent.CONNECTION_ERROR]: (arg: {
        userId?: string;
        message: string;
    }) => void;
    [SocketEvent.CONNECT]: (arg?: {
        status: string;
    }) => void;
    [SocketEvent.DISCONNECT]: (reason: string) => void;
    [SocketEvent.STATE_SYNCED]: (arg: ChatRoom) => void;
}
declare class ChatClientEmitter extends EventEmitter<ServerToClientEvents> {
}
type RouteToRoomPayload = {
    [K in keyof ServerToClientEvents]: ServerToClientEvents[K] extends (arg: infer P) => void ? P : never;
};
interface IResponse<T> {
    data?: T;
    success: boolean;
    message: string;
    statusCode: number;
}
type TokenProvider = () => Promise<string> | string;
declare enum RoomMemberRole {
    member = "member",
    owner = "owner",
    admin = "admin",
    moderator = "moderator",
    custom = "custom"
}
declare enum ChatUserRole {
    user = "user",
    admin = "admin",
    moderator = "moderator",
    custom = "custom",
    guest = "guest"
}
declare enum MessageType {
    text = "text",
    image = "image",
    file = "file",
    system = "system",
    mixed = "mixed"
}
declare enum RoomType {
    messaging = "messaging",
    support = "support"
}
declare enum RoomSubType {
    group = "group",
    direct = "direct"
}
declare enum RoomVisibility {
    private = "private",
    public = "public"
}
interface ChatAttachment {
    type: 'image' | 'video' | 'file' | 'audio' | string;
    url: string;
    name: string;
    mime: string;
    size: number;
}
interface ICreateMessage {
    roomId: string;
    tempId?: string;
    content?: string;
    messageType?: MessageType;
    attachments?: ChatAttachment[];
    replyToId: string | null;
}
interface IUpdateMessage {
    messageId: string;
    content: string;
    roomId: string;
}
interface IDeleteMessage {
    messageId: string;
}
interface ICreateMessageReaction {
    messageId: string;
    roomId: string;
    emoji: string;
    tempId?: string;
}
interface IDeleteMessageReaction {
    messageId: string;
    roomId: string;
    emoji: string;
}
interface ChatMessageReaction {
    id: string;
    messageId: string;
    emoji: string;
    roomId: string;
    userId: string;
    /**
     * Echoed back from the server on the ACK response so the SDK can locate
     * the optimistic placeholder reaction and replace it with the confirmed one.
     * Never persisted to the database.
     */
    tempId?: string;
}
/**
 * Matches formatMessage output.
 */
interface ChatMessage {
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    content: string | null;
    attachments: ChatAttachment[] | null;
    messageType: MessageType | string;
    replyToId: string | null;
    replyTo: ChatMessage | null;
    replies: ChatMessage[] | null;
    roomId: string;
    metadata: Record<string, any> | null;
    editedAt: string | Date | null;
    isDeleted: boolean;
    deletedAt: string | Date | null;
    isPinned: boolean;
    userId: string;
    reactions: ChatMessageReaction[] | null;
    /**
     * Echoed back from the server on the ACK response (and on the broadcast
     * to the originating socket) so the SDK can locate the optimistic
     * placeholder by tempId and replace it with the confirmed message.
     * Never persisted to the database. Other clients will not see this field.
     */
    tempId?: string;
}
/**
 * OptimisticMessage extends ChatMessage with a `status` field the status field is not backend - only UI knows about it.
 *  to track message.send callback return IResponse<ChatMessage>
 */
interface OptimisticMessage extends ChatMessage {
    status: 'sending' | 'sent' | 'failed';
}
type AnyMessage = ChatMessage | OptimisticMessage;
interface ICreateChatRoom {
    roomId?: string;
    type: RoomType;
    subType: RoomSubType;
    visibility: RoomVisibility;
    frozen: boolean;
    archived: boolean;
    disabled: boolean;
    name: string | null;
    image: string | null;
    description: string | null;
    createdById: string | null;
    metadata: Record<string, any> | null;
    customRoomRolePermissions: Record<string, string[]> | null;
    members: Partial<ChatRoomMember>[];
}
interface ChatRoomMember {
    userId: string;
    name: string | null;
    email: string | null;
    displayName: string | null;
    image: string | null;
    createdAt: string | Date | null;
    updatedAt: string | Date | null;
    roomRole: RoomMemberRole;
    banned: boolean;
    shadowBanned: boolean;
    roomId: string;
    customRoomRolePermissions: string[];
    preferences: Record<string, any> | null;
    /**
     * Used by the UI to determine the initial scroll position when a user starts watching a room.
     */
    lastReadMessageId: string | null;
    lastReadAt: string | Date | null;
}
/**
 * - `unreadCount` and `lastReadMessageId` are injected by watch/queryRooms call to room.states object or check their callback data
 * - `name`, `image`, metadata,  `description` are optional  fields.
 */
interface ChatRoom {
    roomId: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    name: string | null;
    image: string | null;
    description: string | null;
    type: RoomType;
    subType: RoomSubType;
    visibility: RoomVisibility;
    frozen: boolean;
    archived: boolean;
    disabled: boolean;
    createdById: string | null;
    metadata: Record<string, any> | null;
    members: ChatRoomMember[];
    messages: ChatMessage[];
    /**Injected into room.states — available after watch/queryRooms*/
    unreadCount?: number;
    /**Injected into room.states - Used by the UI to sort rooms list by the most recent message.
     * Alway available to room.states after queryRooms call with  state set to true.
     */
    lastMessageAt?: string | Date | null;
    lastMessageId?: string | null;
}
interface Location {
    country?: string;
    region?: string;
    city?: string;
    longitude?: string;
    latitude?: string;
}
interface ChatUser {
    userId: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    role: ChatUserRole;
    name?: string;
    email?: string;
    displayName?: string;
    customRole?: Record<string, any>;
    image?: string;
    banned: boolean;
    banExpires?: string | Date;
    invisible: boolean;
    lastSeenAt?: string | Date;
    location?: Location;
    online: boolean;
    hideOnlineStatus: boolean;
    customProperties?: Record<string, any>;
}
interface ChatUserPresentChange {
    userId: string;
    online: boolean;
    lastSeenAt?: Date;
    roomId?: string;
}
interface RoomFilter {
    type?: RoomType;
    subType?: RoomSubType;
    visibility?: RoomVisibility;
    createdById?: string;
    frozen?: boolean;
    members?: string[];
    disabled?: boolean;
    archived?: boolean;
    createdAt?: Date;
    lastMessageAt?: Date;
}
interface QueryMessagesRequest {
    limit?: string | number;
    parentId?: string;
    id_gt?: string;
    id_gte?: string;
    id_lt?: string;
    id_lte?: string;
}
interface QueryUsersRequest {
    limit?: string | number;
    offset?: string | number;
    role?: ChatUserRole;
    userId?: string;
    sort?: string;
}
interface QueryRoomsRequest {
    /** If true, also fetches  messages and members in each room else empty arrays */
    state: boolean;
    limit?: number;
    offset?: number;
    sort?: any;
    filter_conditions?: RoomFilter;
}
interface QueryRoomsResponse {
    rooms: ChatRoom[];
    total: number;
}
interface UploadRequest {
    name: string;
    type: string;
    mime: string;
    size: number;
}
interface UploadResponse {
    uploadUrl: string;
    fileUrl: string;
    key: string;
    name: string;
    type: string;
    mime: string;
    size: number;
}

export { type AnyMessage, type ChatAttachment, ChatClientEmitter, type ChatMessage, type ChatMessageReaction, type ChatRoom, type ChatRoomMember, type ChatUser, type ChatUserPresentChange, ChatUserRole, type ClientToServerEvents, type ConnectionState, type ICreateChatRoom, type ICreateMessage, type ICreateMessageReaction, type IDeleteMessage, type IDeleteMessageReaction, type IResponse, type IUpdateMessage, type Location, MessageType, type OptimisticMessage, type QueryMessagesRequest, type QueryRoomsRequest, type QueryRoomsResponse, type QueryUsersRequest, type RoomFilter, RoomMemberRole, RoomSubType, RoomType, RoomVisibility, type RouteToRoomPayload, type ServerToClientEvents, SocketEvent, type TokenProvider, type UploadRequest, type UploadResponse };
