/**
 * Socket event types shared by the wrapper clients for type safety
 */
export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  RECONNECT = 'reconnect',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  RECONNECT_ERROR = 'reconnect_error',
  RECONNECT_FAILED = 'reconnect_failed',
  AUTHENTICATED = 'authenticated',
  AUTH_ERROR = 'auth_error',
  JOIN_ROOM = 'joinRoom',
  LEAVE_ROOM = 'leaveRoom',
  SWITCH_ROOM = 'switchRoom',
  ROOM_JOINED = 'roomJoined',
  ROOM_LEFT = 'roomLeft',
  ROOM_SWITCHED = 'roomSwitched',
  CREATE_ROOM = 'createRoom',
  ROOM_CREATED = 'roomCreated',
  LIST_OF_GUEST_ROOMS = 'listOfGuestRooms',
  GET_LIST_OF_GUEST_ROOMS = 'getListOfGuestRooms',
  GET_ROOM_Media = 'getRoomMedia',
  ROOM_MEDIA = 'roomMedia',
  GET_ROOM_DATA_BY_ID = 'getRoomDataById',
  ROOM_DATA = 'roomData',
  GET_ROOM_MESSAGES = 'getRoomMessages',
  ROOM_MESSAGES = 'roomMessages',
  USER_ONLINE = 'userOnline',
  SEND_MESSAGE = 'sendMessage',
  NEW_MESSAGE = 'newMessage',
  MESSAGE_EDITED = 'messageEdited',
  MESSAGE_DELETED = 'messageDeleted',
  EDIT_MESSAGE = 'editMessage',
  DELETE_MESSAGE = 'deleteMessage',
  MESSAGE_READ = 'messageRead',
  MARK_MESSAGE_READ = 'markMessageRead',
  USER_JOINED = 'userJoined',
  USER_LEFT = 'userLeft',
  USER_STATUS_CHANGED = 'userStatusChanged',
  SET_USER_STATUS = 'setUserStatus',
  ERROR = 'error',
  TYPING = 'typing',
  STOP_TYPING = 'stopTyping',
  USER_TYPING = 'userTyping',
  USER_STOPPED_TYPING = 'userStoppedTyping',
}

export enum RoomType {
  DM = 'dm',
  GROUP = 'group',
  SELF = 'self',
  ANONYMOUS = 'anonymous',
}

export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  OFFLINE = 'offline',
}

export enum MessageStatus {
  SENT = 'Sent',
  DELIVERED = 'Delivered',
  READ = 'Read',
}

export interface IUser {
  id: string;
  type: 'user' | 'agent' | 'guest' | 'anonymous';
  username?: string;
  status?: UserStatus;
  currentRoomId?: string | null;
}

export interface SocketClientOptions {
  url: string;
  id: string;
  path?: string;
  namespace?: string;
  apiKey?: string;
  apiKeySecret?: string;
  token?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  debug?: boolean;
}

export interface ErrorData {
  message: string;
  success: boolean;
  statusCode: number;
}

export interface AuthenticatedData {
  user: IUser;
  status: string;
  applicationName: string;
  guestRoomData: IRoom[];
}

export interface IResponse<T> {
  data?: T;
  success: boolean;
  message: string;
  statusCode: number;
}





export enum Operators {
  AND = 'AND',
  OR = 'OR',
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  IN = 'IN',
  CONTAINS = 'CONTAINS',
}

export interface QueryNode {
  operator: Operators.AND | Operators.OR;
  value: Array<QueryNode | QueryCondition>;
}

export interface QueryCondition {
  field: string;
  operator: Exclude<Operators, Operators.AND | Operators.OR>;
  value: any;
}

export interface Pagination {
  per_page?: number;
  starting_after?: string;
  skip?: number;
  take?: number;
}

export interface Sort {
  field: string;
  order: 'ASC' | 'DESC';
}

export interface SearchQuery {
  data: {
    query: QueryNode;
  };
  pagination?: Pagination;
  sort?: Sort;
}

export interface RestClientAuthOptions{
  token?: boolean;
  apiKey?: boolean;
  apiKeySecret?: boolean;
}

export interface RestClientOptions {
  baseUrl: string;
  apiKey?: string;
  apiKeySecret?: string;
  token?: string;
  debug?: boolean;
}

export interface IGuestMetaData {
  name: string;
  externalId: string;
  email?: string;
  phone?: string;
  displayName?: string;
  username: string;
  applicationId?: string;
  avatar?: { filename?: string; fileUrl?: string };
  location?: ILocation;
}

export interface ILocation {
  country?: string;
  region?: string;
  city?: string;
  longitude?: string;
  latitude?: string;
}

export interface IGuest {
  id: string;
  displayName?: string;
  name: string;
  username: string;
  externalId: string;
  email?: string;
  phone?: string;
  awayModeEnabled: boolean;
  avatar?: { filename: string; fileUrl: string };
  location?: ILocation;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
  applicationIds?: string[];
  currentRoomId?: string;
  status: UserStatus;
  hasHardBounced: boolean;
  markedEmailAsSpam: boolean;
  analyticId?: string;
  roomIds?: string[];
}

export interface IGuestLogin {
  token: string;
  data: IGuest;
}

/**
 * Interface for a company based on the CompanyRouter schema.
 */
export interface ICompany {
  id: string;
  name: string;
  website: string;
  industry: string;
  domains: string[];
  monthlySpend: number;
  location: ILocation;
  tagIds: string[];
  userIds: string[];
  guestIds: string[];
  anonymousIds: string[];
  applicationsCount: number;
  usersCount: number;
  guestsCount: number;
  createdAt: Date;
  updatedAt: Date;
  accountId: string;
}

/**
 * Interface for an access key associated with a company.
 */
export interface IAccessKey {
  key: string;
  name: string;
  status: string;
  expiresAt: Date;
  accountId: string;
  roleName: string;
}

/**
 * Input interface for creating or updating a company.
 */
export interface ICompanyInput {
  name: string;
  website: string;
  industry: string;
  domains: string[];
  monthlySpend: number;
  location: ILocation;
  tagIds?: string[];
  userIds?: string[];
  guestIds?: string[];
  anonymousIds?: string[];
  applicationsCount?: number;
  usersCount?: number;
  guestsCount?: number;
  accountId: string;
}

/**
 * Input interface for creating or updating an access key.
 */
export interface IAccessKeyInput {
  name: string;
  status: string;
  expiresAt: Date;
  accountId: string;
  roleName: string;
}

/**
 * Input interface for updating company domains.
 */
export interface ICompanyDomainsInput {
  domainsToAdd: string[];
  domainsToRemove: string[];
}

/**
 * Input interface for updating company domains.
 */
export interface ICompanyDomainsInput {
  domainsToAdd: string[];
  domainsToRemove: string[];
}

/**
 * Input interface for user signup.
 */
export interface IUserSignupInput {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  avatar?: { filename: string; fileUrl: string };
}

/**
 * Input interface for user signin.
 */
export interface IUserSigninInput {
  email: string;
  password: string;
}

/**
 * Input interface for updating user information.
 */
export interface IUserUpdateInput {
  username?: string;
  email?: string;
  displayName?: string;
  avatar?: { filename: string; fileUrl: string };
}

/**
 * Input interface for changing user password.
 */
export interface IUserChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Interface for user login response.
 */
export interface IUserLogin {
  token: string;
  data: IUser;
}


/**
 * Input interface for creating a room.
 */
export interface ICreateRoom {

  /** Name of the room */
  name: string;

  /** Description of the room (optional) */
  description?: string;

  /** Avatar of the room  (optional) */
  avatar?: Avatar;

  /** Array of ID of the members to add to the room (Optionals). Note only members of type guest are supported for now */
  memberIds?: string[];

  /** Application ID (Optional) - this represent the app instance the room belong to within a company*/
  applicationId?: string;

  /** Type of the room (optional) - default is dm */
  type?: RoomType;

  /** Setting of the room (optional) - must be {key: value} */
  setting?: Record<string, any>;

  /** ID of the user creating the room (optional) - Only need when the RoomType is GROUP and if not  specified, the current user will be used */
  creatorId?: string;

  /** Meta data of the room (optional) - must be {key: value} */
  metaData?: Record<string, any>

  /** Expiration date of the room (optional) */
  expiresAt?: Date;
}


export interface IRoomMedia {
  id: string,
  filename: string,
  fileUrl: string,
  fileType: string,
  size: number,
  createdAt: Date,
  uploader: IMessageFileUploader,
  messageId: string,
}

/**
 * Represent Information about a room member
 */
export interface IRoomGuests {

  /** ID of the member - guest Id as only guest are supported for now */
  id: string,

  /** Name of the member */
  name: string,

  /** Username of the member */
  username: string,

  /** Avatar of the member */
  avatar: Avatar,

  /** Last seen at of the member */
  lastSeenAt?: Date,

  /** Status of the member */
  status: UserStatus,

  /** Role of the member */
  role?: IPermissionEntityType,
}


/**
 * Represent the full details of a room
 */
export interface IRoom {

  /** ID of the room */
  id: string,

  /** Name of the room */
  name: string,

  /** Description of the room */
  description?: string,

  /** Avatar of the room */
  avatar?: Avatar,

  /** Archived status of the room */
  archived?: boolean,

  /** Expiration date of the room */
  expiresAt?: string | Date | null,

  /** Type of the room */
  type: RoomType,

  /** Total number of members */
  membersCount?: number,

  /** Number of online members */
  onlineMembersCount?: number,

  /** Application ID - representing app instance the room belong to */
  applicationId?: string,

  /** Date and time when the room was created */
  createdAt?: string | Date,

  /** Date and time when the room was last updated */
  updatedAt?: string | Date,

  /** Setting of the room */
  setting?: any,

  /** Meta data of the room */
  metaData?: any,

  /** List of guests in the room */
  guests: {
    /** Represent list of admins in the room */
    admins: IRoomGuests[],
    /** Represent list of moderators in the room */
    moderators: IRoomGuests[],
    /** Represent list of members in the room */
    members: IRoomGuests[],
  }

  /** List of messages in the room */
  messages: IMessage[],
}


export interface IEditMessage {
  messageId: string,
  text: string,
  roomId: string,
}

export interface IDeleteMessage {
  messageId: string,
  roomId: string,
}

export interface IRoomMedia {
  id: string,
  filename: string,
  fileUrl: string,
  fileType: string,
  size: number,
  createdAt: Date,
  uploadedBy: string,
  messageId: string,
}

export enum IPermissionEntityType {
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  ROLE = 'ROLE',
  ANONYMOUS = 'ANONYMOUS',
}

export enum IRoomPermissionType {
  // Default Room permissions
  CAN_SEND_MESSAGES = 'CAN_SEND_MESSAGES',       // can post new messages,
  CAN_DELETE_OWN_MESSAGES = 'CAN_DELETE_OWN_MESSAGES',      // can delete their own messages,
  CAN_EDIT_OWN_MESSAGES = 'CAN_EDIT_OWN_MESSAGES',      // can edit their own messages,
  CAN_UPLOAD_FILES = 'CAN_UPLOAD_FILES',          // can upload files,
  CAN_DELETE_OWN_FILES = 'CAN_DELETE_OWN_FILES',         // can delete their own files,

  // Moderator permissions
  CAN_DELETE_OTHER_MESSAGES = 'CAN_DELETE_OTHER_MESSAGES',    // can delete other people's messages,
  CAN_PIN_MESSAGES  = 'CAN_PIN_MESSAGES',       // can pin/unpin messages,
  CAN_MODERATE_USERS = 'CAN_MODERATE_USERS',      // can mute/kick/ban users,
  CAN_CHANGE_ROOM_NAME = 'CAN_CHANGE_ROOM_NAME',    // can change room name,
  CAN_CHANGE_ROOM_DESCRIPTION = 'CAN_CHANGE_ROOM_DESCRIPTION', // can change room description,

  // Admin permissions
  CAN_MANAGE_PERMISSIONS = 'CAN_MANAGE_PERMISSIONS',  // can manage room permissions,
  CAN_MANAGE_SETTINGS   = 'CAN_MANAGE_SETTINGS',   // can manage room settings,
  CAN_GRANT_MODERATOR_ROLE = 'CAN_GRANT_MODERATOR', // can grant moderator role,
  CAN_UPDATE_ROOM_DATA = 'CAN_UPDATE_ROOM_DATA',         // can update room details,
  CAN_GRANT_ADMIN_ROLE = 'CAN_GRANT_ADMIN_ROLE',
  CAN_SEND_MESSAGE = "CAN_SEND_MESSAGE", // can grant admin role
}

export interface IRoomPermission {
  id: string,
  entityType: IPermissionEntityType,
  entityId: string,
  permission: IRoomPermissionType,
  isAllowed: boolean,
}





/**
 * Represents an avatar image
 */
export interface Avatar {
  /** Name of the file (e.g. avatar.png) */
  filename: string;

  /** Public URL or path to access the file */
  fileUrl: string;
}

/**
 * Represents the sender of a message
 */
export interface IMessageSender {
  /** Unique identifier of the sender */
  id: string;

  /** Full name of the sender */
  name: string;

  /** Username (e.g. @john_doe) */
  username: string;

  /** Avatar metadata of the sender */
  avatar: Avatar;
}

/**
 * Represents a file uploaded by a user
 */
export interface IMessageFileUploader {
  /** Uploader ID */
  id: string;

  /** Uploader name */
  name: string;

  /** Uploader username */
  username: string;
}

/**
 * Represents a file attached to a message
 */
export interface IMessageFileAttachement {
  /** Unique file ID */
  id: string;

  /** File name (e.g. document.pdf) */
  filename: string;

  /** URL or path to access the file */
  fileUrl: string;

  /** MIME type of the file (e.g. image/png, application/pdf) */
  fileType?: string;

  /** File size in bytes */
  size: number;

  /** When the file was uploaded */
  createdAt: Date;

  /** Uploader information */
  uploader: IMessageFileUploader;
}

/**
 * Represents a chat message
 */
export interface IMessage {
  /** Unique ID of the message */
  id: string;

  /** Text content of the message (optional if files are attached) */
  text?: string;

  /** Whether the message is pinned */
  isPinned?: boolean;

  /** Whether the message is marked as an answer */
  isAnswered?: boolean;

  /** Whether the message is encrypted */
  isEncrypted?: boolean;

  /** Delivery status of the message */
  status?: 'Sent' | 'Delivered' | 'Read';

  /** ID of the parent message (for threads/replies) */
  parentId?: string;

  /** When the message was created */
  createdAt: Date;

  /** When the message was last updated */
  updatedAt: Date;

  /** Whether the message has been read */
  read?: boolean;

  /** Whether the message has been edited */
  edited?: boolean;

  /** The sender of the message */
  sender: IMessageSender;

  /** room Id */
  to: string;

  /** Files attached to the message */
  files?: IMessageFileAttachement[];
}

/**
 * Payload to create a new message
 */
export interface ISendMessage {
  /** Message content (optional for file-only messages) */
  text?: string;

  /** Whether the message is pinned */
  isPinned?: boolean;

  /** Sender ID (Optional) - The current socket user will be used if not specified */
  senderId?: string;

  /** Whether the message is marked as an answer */
  isAnswered?: boolean;

  /** Whether the message is encrypted */
  isEncrypted?: boolean;

  /** Parent message ID for replies or threads */
  parentId?: string;

  /** Room Id */
  to: string;

  /** Files to attach, max is 5 */
  files?: File[];
}

/**
 * Payload to update an existing message
 */
export interface IUpdateMessage {
  /** Updated text content */
  text?: string;

  /** Updated pinned status */
  isPinned?: boolean;

  /** Updated answered status */
  isAnswered?: boolean;

  /** Updated encrypted status */
  isEncrypted?: boolean;

  /** Updated delivery status */
  status?: 'Sent' | 'Delivered' | 'Read';

  /** Updated time */
  updatedAt?: Date;

  /** Whether the message was read */
  read?: boolean;

  /** Whether the message has been edited */
  edited?: boolean;
}
export interface IMessageSearchResult {
    messages: IMessage[];
    totalCount: number;
    hasMore: boolean;
    searchQuery?: string;
    filters?: IMessageSearchFilter
}

export interface IMessageSearchFilter {
  senderId?: string;
  senderType?: 'admin' | 'chatAgent' | 'aiAgent' | 'guest';
  dateFrom?: string;
  dateTo?: string;
  hasFiles?: boolean;
  fileTypes?: string[];
  isPinned?: boolean;
  isAnswered?: boolean;
  status?: "Sent" | "Delivered" | "Read";
  parentId?: string;
  isThread?: boolean;
  isEncrypted?: boolean;
  isEdited?: boolean;
  isRead?: boolean;
}

export interface IMessageSearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  includeContext?: boolean;
  highlightMatches?: boolean;
}

export interface IGetUserMessages {
  roomIds?: string[];
  filters?: IMessageSearchFilter;
  options?: IMessageSearchOptions
}

// File Upload Types
export interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileUploadConfig {
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  uploadEndpoint?: string;
  apiKey?: string;
}
