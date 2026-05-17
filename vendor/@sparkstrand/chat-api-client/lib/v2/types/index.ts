import { EventEmitter } from 'eventemitter3';

//#region SOCKETEVENT ENUMS
export enum SocketEvent {
    // Connection Flow
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    CONNECT_ERROR = 'connect_error',
    CONNECTION_SUCCESS = 'connection.success',
    CONNECTION_ERROR = 'connection.error',

    // Room Actions (Inbound — client emits)
    ROOM_WATCH = 'room.watch',
    ROOM_STOP_WATCH = 'room.stop_watch',

    // Message Actions (Inbound — client emits)
    MESSAGE_SEND = 'message.send',
    MESSAGE_UPDATE = 'message.update',
    MESSAGE_DELETE = 'message.delete',
    MESSAGE_MARK_READ = 'message.mark_read',
    MESSAGE_REACTION = 'message.reaction',
    MESSAGE_REACTION_DELETE = 'message.reaction.delete',

    // Message Broadcasting (Outbound — server emits)
    MESSAGE_NEW = 'message.new',
    MESSAGE_UPDATED = 'message.updated',
    MESSAGE_DELETED = 'message.deleted',
    MESSAGE_READ = 'message.read',
    MESSAGE_REACTION_NEW = 'message.reaction.new',
    MESSAGE_REACTION_DELETED = 'message.reaction.deleted',

    // Notifications (Outbound)
    NOTIFICATION_UNREAD = 'notification.unread',
    USER_PRESENCE_CHANGED = 'user.presence.changed',

    // Typing Events (Inbound & Outbound)
    TYPING_START = 'typing.start',
    TYPING_STOP = 'typing.stop',

    // Special System Events (client-only, not sent over wire)
    CONNECTION_CHANGED = 'connection.changed',
    THREAD_NEW = 'message.new.thread',

    // Room Membership Events (Outbound — mid-session)
    ROOM_ADDED = 'room.added',
    ROOM_REMOVED = 'room.removed',

    // Room Lifecycle Events (Outbound)
    ROOM_DELETED = 'room.deleted',
    ROOM_FROZEN = 'room.frozen',
    ROOM_TRUNCATED = 'room.truncated',

    // Moderation Events (Outbound)
    MEMBER_MODERATED = 'member.moderated',

    // used by UI only not related to Socket IO Server or Client Event. Emitter by Room ( through ChatClientEmitter) when there is any updated to it state (room.state)
    STATE_SYNCED = 'state.synced'
}
// #endregion 

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// ─────────────────────────────────────────────────────────────────────
// #region SOCKET EVENT AND CALLBACKS TYPES

/**These are events that the client emits often with acknowledgement callbacks */
export interface ClientToServerEvents {
  [SocketEvent.ROOM_WATCH]: (
    payload: { roomId: string }, 
    callback?: (res: IResponse<ChatRoom>) => void
  ) => void;

  [SocketEvent.ROOM_STOP_WATCH]: (
    payload: { roomId: string, lastMessageId?: string }, 
    callback?:(res: IResponse<null>) => void
  ) => void;


  [SocketEvent.MESSAGE_SEND]: (
    Payload: ICreateMessage, 
    callback?: (res: IResponse<ChatMessage>) => void
  ) => void;

  [SocketEvent.MESSAGE_UPDATE]: (
    payload: IUpdateMessage,
    callback?: (res: IResponse<ChatMessage>) => void
  ) => void;

  [SocketEvent.MESSAGE_DELETE]: (
    payload: IDeleteMessage,
    callback?: (res: IResponse<ChatMessage>) => void
  ) => void;

  [SocketEvent.MESSAGE_MARK_READ]: (
    payload: { roomId: string },
    callback?: (res: IResponse<{ messageId: string; roomId: string }>) => void
  ) => void;

  [SocketEvent.MESSAGE_REACTION]: (
    payload: ICreateMessageReaction,
    callback?: (res: IResponse<ChatMessageReaction>) => void
  ) => void;

  [SocketEvent.MESSAGE_REACTION_DELETE]: (
    payload: IDeleteMessageReaction,
    callback?: (res: IResponse<ChatMessageReaction>) => void
  ) => void;

  // send to server when stop user start typing
  [SocketEvent.TYPING_START]: (payload: { roomId: string }) => void;
  // send to server when the user stop typing
  [SocketEvent.TYPING_STOP]: (payload: { roomId: string }) => void;
}

export interface ServerToClientEvents  {
  [SocketEvent.MESSAGE_NEW]: (arg: ChatMessage) => void;
  [SocketEvent.MESSAGE_UPDATED]: (arg: ChatMessage) => void;
  [SocketEvent.MESSAGE_DELETED]: (arg: ChatMessage) => void;
  [SocketEvent.MESSAGE_READ]:  (arg: {userId: string, roomId: string}) => void;

  [SocketEvent.MESSAGE_REACTION_NEW]: (arg: ChatMessageReaction ) => void;
  [SocketEvent.MESSAGE_REACTION_DELETED]: (arg: ChatMessageReaction) => void;

 [SocketEvent.THREAD_NEW]: (arg: ChatMessage) => void;

  [SocketEvent.NOTIFICATION_UNREAD]: (arg: { roomId: string; unreadCount: number }) => void;
  [SocketEvent.USER_PRESENCE_CHANGED]: (arg: ChatUserPresentChange) => void;

  [SocketEvent.ROOM_ADDED]: (arg: ChatRoom) => void;
  [SocketEvent.ROOM_REMOVED]: (arg: ChatRoom) => void;
  [SocketEvent.ROOM_DELETED]: (arg: ChatRoom) => void;
  [SocketEvent.ROOM_FROZEN]: (arg: ChatRoom) => void;
  [SocketEvent.ROOM_TRUNCATED]: (arg: ChatRoom) => void;

  // Emited from server to notify the user about other users who are currently typing
  [SocketEvent.TYPING_START]: (arg: {userId: string, roomId: string}) => void;
  // Emitted when other user stop typing
  [SocketEvent.TYPING_STOP]: (arg: {userId: string, roomId: string}) => void;


  [SocketEvent.MEMBER_MODERATED]: (arg: { memberId: string; action: string }) => void;

  // Special system events (no server payload required)
  [SocketEvent.CONNECTION_CHANGED]: (arg: { status: ConnectionState, userId?: string }) => void;
  [SocketEvent.CONNECTION_SUCCESS]: (arg: {userId?: string, message: string}) => void;
  [SocketEvent.CONNECTION_ERROR]: (arg: {userId?: string, message: string }) => void;

  // This is not emitted by server to client but by ChatClientEmitter to UI when socket.on('connect') happen inside client.ts.
  [SocketEvent.CONNECT]: (arg?: {status: string }) => void;

  // 1- Emitter by server  with reason usually = "io server disconnected".
  // 2- Trigger when socket.on(disconnect) happen with reason =  "io client disconnect"  or ping timeout, transport close e.t.c
  [SocketEvent.DISCONNECT]: (reason: string) => void;

  // Used by UI only not related to Socket IO Server or Client Event. 
  // Emitter by Room when there is any updated to it state (room.state) - calling room.watch, room.queryMessages trigger state.synced
  // I don't usual see a reason to listen as any rooms that has been watch or currently being watched has their states updated automatically whenever message or room related events happened
  // This means for every room.on() there is always a state change on that room before we trigger emit to UI. 
  [SocketEvent.STATE_SYNCED]: (arg: ChatRoom) => void;


}



// EventEmitter with the typed interface
export class ChatClientEmitter extends EventEmitter<ServerToClientEvents> {}

export type RouteToRoomPayload = {
    [K in keyof ServerToClientEvents]: ServerToClientEvents[K] extends (arg: infer P) => void ? P : never;
};

//#endregion


// RESPONSE TYPE FOR BOTH SOCKET CALLBACK (acknowledge when client to server events are send) AND API RESPONSE (response.json()).
// APICLIENT return response.data and throw error when success === false with message
export interface IResponse<T> {
    data?: T;
    success: boolean;
    message: string;
    statusCode: number;
}



export type TokenProvider = () => Promise<string> | string;


//#region GENERAL ENUMS
export enum RoomMemberRole {
    member = 'member',
    owner = 'owner',
    admin = 'admin',
    moderator = 'moderator',
    custom = 'custom',
}

export enum ChatUserRole {
    user = 'user',
    admin = 'admin',
    moderator = 'moderator',
    custom = 'custom',
    guest = 'guest',
}

export enum MessageType {
    text = 'text',
    image = 'image',
    file = 'file',
    system = 'system',
    mixed = 'mixed',
}

export enum RoomType {
    messaging = 'messaging',
    support = 'support',
}

export enum RoomSubType {
    group = 'group',
    direct = 'direct',
}

export enum RoomVisibility {
    private = 'private',
    public = 'public',
}
//#endregion





// #region MESSAGE RELATED TYPES
export interface ChatAttachment {
    type: 'image' | 'video' | 'file' | 'audio' | string;
    url: string;
    name: string;
    mime: string;
    size: number;
}

export interface ICreateMessage {
    roomId: string;
    tempId?: string;
    content?: string;
    messageType?: MessageType;
    attachments?: ChatAttachment[];
    replyToId: string | null;
}

export interface IUpdateMessage {
    messageId: string;
    content: string;
    roomId: string;
} 

export interface IDeleteMessage {
    messageId: string;
}

export interface ICreateMessageReaction {
    messageId: string;
    roomId: string;
    emoji: string;
    tempId?: string;
}

export interface IDeleteMessageReaction {
    messageId: string;
    roomId: string;
    emoji: string;
}

export interface ChatMessageReaction {
    id: string;
    messageId: string;
    emoji: string;
    roomId: string;
    userId: string; // public userId (from chatUser.userId, not internal chatUserId)
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
export interface ChatMessage {
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
 
    userId: string;   // sender's public userId — NOT internal senderId
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
export interface OptimisticMessage extends ChatMessage {
    status: 'sending' | 'sent' | 'failed';
}

export type AnyMessage = ChatMessage | OptimisticMessage;
// #endregion




//#region ROOM RELATED TYPES
export interface ICreateChatRoom {
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
    members: Partial<ChatRoomMember>[]
}

export interface ChatRoomMember {
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
export interface ChatRoom {
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
//#endregion 




//#region USER RELATED TYPES
export interface Location {
    country?: string;
    region?: string;
    city?: string;
    longitude?: string;
    latitude?: string;
}

export interface ChatUser {
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

export interface ChatUserPresentChange {
    userId: string;
    online: boolean;
    lastSeenAt?: Date;
    roomId?: string
}
//#endregion



//#region API TYPES
export interface RoomFilter {
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


export interface QueryMessagesRequest {
    limit?: string | number;
    parentId?: string; 
    id_gt?: string;
    id_gte?: string;
    id_lt?: string;
    id_lte?: string;
} 

export interface QueryUsersRequest {
    limit?: string | number;
    offset?: string  | number; 
    role?: ChatUserRole; 
    userId?: string;
    sort?: string; 
}

export interface QueryRoomsRequest {
     /** If true, also fetches  messages and members in each room else empty arrays */
    state: boolean;

    limit?: number;
    
    offset?: number;
    
    sort?: any;
    
    filter_conditions?: RoomFilter;
}

export interface QueryRoomsResponse {
    rooms: ChatRoom[];
    total: number;
}

export interface UploadRequest {
    name: string;
    type: string; // 'image', 'video', 'file', 'audio', 'avatar', 'logo' etc
    mime: string;
    size: number;
}

export interface UploadResponse {
    uploadUrl: string; // The Pre-Signed URL for PUT
    fileUrl: string;   // The final publicly readable URL
    key: string;       // Internal storage key/path
    name: string;
    type: string;
    mime: string;
    size: number;
}
//#endregion