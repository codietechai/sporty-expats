import { EventEmitter } from 'eventemitter3';
import { SocketClientOptions, RoomType, IMessage, UserStatus, SearchQuery, Avatar, RestClientAuthOptions, IResponse, IRoom, IRoomGuests, IGuestMetaData, IGuest, IGuestLogin, ICompanyInput, ICompany, IAccessKeyInput, IAccessKey, ICompanyDomainsInput, IUserSignupInput, IUser, IUserSigninInput, IUserLogin, IUserUpdateInput, IUserChangePasswordInput, ISendMessage, IUpdateMessage, IGetUserMessages, IMessageSearchResult, IMessageSearchFilter, IMessageSearchOptions, RestClientOptions } from '../types/index.js';

declare class SocketClient extends EventEmitter {
    private socket;
    private options;
    private messageQueue;
    private connected;
    private debug;
    private eventHistory;
    constructor(options: SocketClientOptions);
    private setupEventListeners;
    connect(): void;
    disconnect(): void;
    isConnected(): boolean;
    setToken(token: string): void;
    joinRoom(roomId: string): void;
    leaveRoom(roomId: string): void;
    createRoom(data: {
        name: string;
        type: RoomType;
        membersId: string[];
        applicationId?: string;
    }): void;
    sendMessage(message: IMessage): void;
    markMessageRead(messageId: string): void;
    setUserStatus(status: UserStatus): void;
    private processMessageQueue;
    private log;
    getEventHistory(): Array<{
        event: string;
        data: any;
        timestamp: Date;
    }>;
}

/**
 * A class to parse search queries into Prisma-compatible query objects.
 * Supports nested AND/OR operations, various comparison operators, pagination, and sorting.
 */
declare class QueryParser {
    /**
     * Parses a search query into a Prisma-compatible query object.
     * @param query - The search query containing query conditions, pagination, and sorting options.
     * @returns A Prisma query object with `where`, `take`, `skip`, `cursor`, and `orderBy` clauses.
     * @throws Error if the query is missing or invalid.
     */
    parseSearchQuery(query: SearchQuery): any;
    /**
     * Parses a query node containing AND or OR operations.
     * @param node - The query node with an operator (AND/OR) and values (conditions or nested nodes).
     * @returns A Prisma-compatible filter object (e.g., `{ AND: [...] }` or `{ OR: [...] }`).
     * @throws Error if the operator is unsupported.
     */
    private parseQueryNode;
    /**
     * Parses an individual query condition (e.g., field comparison).
     * @param condition - The query condition with field, operator, and value.
     * @returns A Prisma-compatible filter object for the condition.
     * @throws Error if the field, value, or operator is invalid or unsupported.
     */
    private parseCondition;
    /**
     * Decodes a base64-encoded `starting_after` cursor for pagination.
     * Expects a JSON array with [timestamp, id, number] format.
     * @param startingAfter - The base64-encoded cursor string.
     * @returns The decoded ID to be used in Prisma's cursor-based pagination.
     * @throws Error if the cursor is invalid or cannot be decoded.
     */
    private decodeStartingAfter;
}

/**
 * Class for managing room-related operations.
 */
declare class Room {
    private readonly restClient;
    private readonly queryParser;
    private basePath;
    /**
     * Constructor for Room.
     * @param restClient - The REST client for HTTP requests.
     * @param queryParser - The query parser for search queries.
     */
    constructor(restClient: IRestClient, queryParser?: QueryParser);
    /**
     * Create a new group room.
     * @param data - Room creation data.
     * @param authOptions - Authentication options.
     * @returns Response containing the created room or error.
     */
    createGroup(data: {
        creatorId: string;
        name: string;
        avatar?: Avatar;
        applicationId?: string;
        membersId?: string[];
        description?: string;
        metadata?: Record<string, any>;
        setting?: Record<string, any>;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>>;
    /**
     * Create a new direct message room.
     * @param data - DM room creation data.
     * @param authOptions - Authentication options.
     * @returns Response containing the created room or error.
     */
    createDm(data: {
        name: string;
        applicationId?: string;
        avatar?: Avatar;
        metadata?: Record<string, any>;
        membersId: string[];
        description?: string;
        setting?: Record<string, any>;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>>;
    /**
     * Update a room's settings.
     * @param data - Room settings update data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated room or error.
     */
    updateSetting(data: {
        roomId: string;
        setting: Record<string, any>;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>>;
    /**
     * Update a room's description.
     * @param data - Room description update data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated room or error.
     */
    updateDescription(data: {
        roomId: string;
        description: string;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>>;
    /**
     * Update a room's name.
     * @param data - Room name update data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated room or error.
     */
    updateName(data: {
        roomId: string;
        name: string;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>>;
    /**
     * Get messages for a room.
     * @param data - Message retrieval data.
     * @param authOptions - Authentication options.
     * @returns Response containing the room with messages or error.
     */
    getAllMessages(data: {
        roomId: string;
        limit?: number;
        before?: string;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IMessage[] | null>>;
    /**
     * Add one or more guests to a room.
     * @param data - Guest addition data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated room or error.
     */
    addGuests(data: {
        roomId: string;
        guestIds: string | string[];
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>>;
    /**
     * Get all guests in a room.
     * @param data - Room guest retrieval data.
     * @param authOptions - Authentication options.
     * @returns Response containing the room guests or error.
     */
    getAllGuests(data: {
        roomId: string;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoomGuests[] | null>>;
    /**
     * Remove one or more guests from a room.
     * @param data - Guest removal data.
     * @param authOptions - Authentication options.
     * @returns Response indicating success or error.
     */
    removeGuests(data: {
        roomId: string;
        guestsId: string | string[];
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<null>>;
    /**
     * Search for a single room.
     * @param data - Room search data.
     * @param authOptions - Authentication options.
     * @returns Response containing the found room or error.
     */
    findFirst(data: {
        roomId: string;
        query: SearchQuery;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>>;
    /**
     * Search for multiple rooms.
     * @param data - Room search data.
     * @param authOptions - Authentication options.
     * @returns Response containing the found rooms or error.
     */
    findMany(data: {
        roomId: string;
        query: SearchQuery;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom[] | null>>;
}

/**
 * Class for managing guest-related operations.
 */
declare class Guest {
    private readonly restClient;
    private basePath;
    private isLogin;
    /**
     * Constructor for Guest.
     * @param restClient - The REST client for HTTP requests.
     */
    constructor(restClient: IRestClient);
    /**
     * Upsert a guest.
     * @param data - Guest metadata.
     * @param authOptions - Authentication options.
     * @returns Response containing the guest data or error.
     */
    upsert(data: IGuestMetaData, authOptions?: RestClientAuthOptions): Promise<IResponse<IGuest | null>>;
    /**
     * Update a guest's metadata.
     * @param id - Guest Id
     * @param data - Partial guest metadata for update.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated guest or error.
     */
    update(id: string, data: Partial<IGuestMetaData>, authOptions?: RestClientAuthOptions): Promise<IResponse<IGuest | null>>;
    /**
     * Login a guest with their ID.
     * @param id - Guest ID or external ID.
     * @param authOptions - Authentication options.
     * @returns Response containing login data or error.
     */
    login(id: string, authOptions?: RestClientAuthOptions): Promise<IResponse<IGuestLogin | null>>;
    /**
     * Logout the current guest.
     * @returns Response indicating success or error.
     */
    logout(): Promise<IResponse<null>>;
    /**
     * Get the current guest information.
     * @param id  - Guest Id
     * @param authOptions - Authentication options.
     * @returns Response containing the guest data or error.
     */
    getInfo(id: string, authOptions?: RestClientAuthOptions): Promise<IResponse<IGuest | null>>;
    /**
     * Get a guest by their external ID.
     * @param externalId - External ID of the guest.
     * @param authOptions - Authentication options.
     * @returns Response containing the guest data or error.
     */
    getByExternalId(externalId: string, authOptions?: RestClientAuthOptions): Promise<IResponse<IGuest | null>>;
    /**
     * List all rooms for the current guest.
     * @param id  - Guest Id
     * @param authOptions - Authentication options.
     * @returns Response containing the rooms or error.
     */
    listRooms(id: string, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom[]>>;
    /**
     * Check if the current guest is a member of a room.
     * @param id  - Guest Id
     * @param roomId - Room ID.
     * @param authOptions - Authentication options.
     * @returns Response indicating membership status or error.
     */
    isMemberOfRoom(id: string, roomId: string, authOptions?: RestClientAuthOptions): Promise<IResponse<boolean>>;
    /**
     * Create a room as the current guest.
     * @param data - Room creation data.
     * @param authOptions - Authentication options.
     * @returns Response containing the created room or error.
     */
    createRoom(data: {
        name: string;
        type: RoomType;
        description?: string;
        creatorId?: string;
        membersId?: string[];
        applicationId?: string;
        setting?: Record<string, any>;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>>;
    /**
     * Update a room as the current guest.
     * @param data - Room update data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated room or error.
     */
    updateRoom(data: {
        roomId: string;
        name?: string;
        description?: string;
        setting?: Record<string, any>;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>>;
}

/**
 * Class for managing company-related operations.
 */
declare class Companies {
    private readonly restClient;
    private basePath;
    /**
     * Constructor for Companies.
     * @param restClient - The REST client for HTTP requests.
     */
    constructor(restClient: IRestClient);
    /**
     * Create a new company.
     * @param data - Company creation data.
     * @param authOptions - Authentication options.
     * @returns Response containing the created company or error.
     */
    create(data: ICompanyInput, authOptions?: RestClientAuthOptions): Promise<IResponse<ICompany | null>>;
    /**
     * Update an existing company.
     * @param companyId - The ID of the company to update.
     * @param data - Company update data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated company or error.
     */
    update(companyId: string, data: Partial<ICompanyInput>, authOptions?: RestClientAuthOptions): Promise<IResponse<ICompany | null>>;
    /**
     * Generate an access key for a company.
     * @param companyId - The ID of the company.
     * @param data - Access key creation data.
     * @param authOptions - Authentication options.
     * @returns Response containing the created access key or error.
     */
    generateAccessKey(companyId: string, data: IAccessKeyInput, authOptions?: RestClientAuthOptions): Promise<IResponse<IAccessKey | null>>;
    /**
     * Update an existing access key for a company.
     * @param companyId - The ID of the company.
     * @param data - Access key update data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated access key or error.
     */
    updateAccessKey(companyId: string, data: Partial<IAccessKeyInput>, authOptions?: RestClientAuthOptions): Promise<IResponse<IAccessKey | null>>;
    /**
     * Delete an access key for a company.
     * @param companyId - The ID of the company.
     * @param data - Access key deletion data.
     * @param authOptions - Authentication options.
     * @returns Response indicating success or error.
     */
    deleteAccessKey(companyId: string, data: {
        apiKey: string;
        apiKeySecret: string;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<null>>;
    /**
     * Retrieve an access key for a company.
     * @param companyId - The ID of the company.
     * @param data - Access key retrieval data.
     * @param authOptions - Authentication options.
     * @returns Response containing the access key or error.
     */
    getAccessKey(companyId: string, data: {
        key: string;
        accountId: string;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IAccessKey | null>>;
    /**
     * Retrieve a company by ID.
     * @param companyId - The ID of the company.
     * @param authOptions - Authentication options.
     * @returns Response containing the company or error.
     */
    get(companyId: string, authOptions?: RestClientAuthOptions): Promise<IResponse<ICompany | null>>;
    /**
     * Update a company's domains.
     * @param companyId - The ID of the company.
     * @param data - Domains update data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated company or error.
     */
    updateDomains(companyId: string, data: ICompanyDomainsInput, authOptions?: RestClientAuthOptions): Promise<IResponse<ICompany | null>>;
}

/**
 * Class for managing user-related operations.
 */
declare class Users {
    private readonly restClient;
    private basePath;
    private isLogin;
    /**
     * Constructor for Users.
     * @param restClient - The REST client for HTTP requests.
     */
    constructor(restClient: IRestClient);
    /**
     * Sign up a new user.
     * @param data - User signup data.
     * @param authOptions - Authentication options.
     * @returns Response containing the created user or error.
     */
    signup(data: IUserSignupInput, authOptions?: RestClientAuthOptions): Promise<IResponse<IUser | null>>;
    /**
     * Sign in an existing user.
     * @param data - User signin data.
     * @param authOptions - Authentication options.
     * @returns Response containing login data or error.
     */
    signin(data: IUserSigninInput, authOptions?: RestClientAuthOptions): Promise<IResponse<IUserLogin | null>>;
    /**
     * Sign out the current user.
     * @param authOptions - Authentication options.
     * @returns Response indicating success or error.
     */
    signout(authOptions?: RestClientAuthOptions): Promise<IResponse<null>>;
    /**
     * Update the current user's information.
     * @param data - User update data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated user or error.
     */
    update(data: IUserUpdateInput, authOptions?: RestClientAuthOptions): Promise<IResponse<IUser | null>>;
    /**
     * Change the current user's password.
     * @param data - Password change data.
     * @param authOptions - Authentication options.
     * @returns Response indicating success or error.
     */
    changePassword(data: IUserChangePasswordInput, authOptions?: RestClientAuthOptions): Promise<IResponse<null>>;
    /**
     * Delete the current user account.
     * @param authOptions - Authentication options.
     * @returns Response indicating success or error.
     */
    delete(authOptions?: RestClientAuthOptions): Promise<IResponse<null>>;
}

/**
 * Class for managing message-related operations.
 */
declare class Messages {
    private readonly restClient;
    private basePath;
    /**
     * Constructor for Messages.
     * @param restClient - The REST client for HTTP requests.
     */
    constructor(restClient: IRestClient);
    /**
     * Create a new message in a room.
     * @param data - Message creation data.
     * @param authOptions - Authentication options.
     * @returns Response containing the created message or error.
     */
    create(data: ISendMessage, authOptions?: RestClientAuthOptions): Promise<IResponse<IMessage | null>>;
    /**
     * Update an existing message.
     * @param messageId - The ID of the message to update.
     * @param data - Message update data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated message or error.
     */
    update(messageId: string, data: IUpdateMessage, authOptions?: RestClientAuthOptions): Promise<IResponse<IMessage | null>>;
    /**
     * Delete a message.
     * @param messageId - The ID of the message to delete.
     * @param authOptions - Authentication options.
     * @returns Response indicating success or error.
     */
    delete(messageId: string, authOptions?: RestClientAuthOptions): Promise<IResponse<null>>;
    /**
     * Retrieve a message by ID.
     * @param messageId - The ID of the message.
     * @param authOptions - Authentication options.
     * @returns Response containing the message or error.
     */
    get(messageId: string, authOptions?: RestClientAuthOptions): Promise<IResponse<IMessage | null>>;
    /**
     * Get all messages from a guest
     * @param data - Search query for filtering messages,
     *         filters.senderId is required
     * @param authOptions - Authentication options.
     * @returns Response containing the matching messages or error.
     */
    getMessageBySender(data: IGetUserMessages, authOptions?: RestClientAuthOptions): Promise<IResponse<IMessageSearchResult>>;
    /**
     * Search for words across the provided roomIds  or all the rooms the guest has access to if roomIds not provided
     * @param guestId - Guest ID
     * @param data - Search query for filtering messages,
     *         words is required
     * @param authOptions
     * @returns
     */
    searchWords(data: {
        guestId: string;
        words: string[];
        filters?: IMessageSearchFilter;
        options?: IMessageSearchOptions;
        roomIds?: string;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IMessageSearchResult>>;
    /**
     * Search for words in a room
     * @param data - Search query for filtering messages,
     *         words and roomId are required
     * @param authOptions
     * @returns
     */
    searchForWordsInARoom(data: {
        roomId: string;
        words: string[];
        filters?: IMessageSearchFilter;
        options?: IMessageSearchOptions;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IMessageSearchResult>>;
    /**
     * Search for words in multiple rooms
     * @param data - Search query for filtering messages,
     *         words and roomIds are required
     * @param authOptions
     * @returns
     */
    searchForWordsInMultipleRooms(data: {
        words: string[];
        roomIds: string[];
        filters?: IMessageSearchFilter;
        options?: IMessageSearchOptions;
    }, authOptions?: RestClientAuthOptions): Promise<IResponse<IMessageSearchResult>>;
    /**
     * Mark a message as read.
     * @param messageId - The ID of the message to mark as read.
     * @param authOptions - Authentication options.
     * @returns Response indicating success or error.
     */
    markAsRead(messageId: string, authOptions?: RestClientAuthOptions): Promise<IResponse<null>>;
}

/**
 * Interface for REST client implementations.
 */
interface IRestClient {
    setToken(token?: string): void;
    getToken(): string | undefined;
    setApiCredentials(apiKey: string, apiKeySecret: string): void;
    POST<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
    PUT<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
    GET<T>(params: Record<string, any> | null, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
    DELETE<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
}
/**
 * Client for making RESTful API calls to the chat server.
 */
declare class RestClient implements IRestClient {
    private baseUrl;
    private apiKey?;
    private apiKeySecret?;
    private token?;
    private debug;
    private readonly timeoutMs;
    room: Room;
    guest: Guest;
    companies: Companies;
    user: Users;
    messages: Messages;
    /**
     * Constructor for RestClient.
     * @param options - Configuration options for the REST client.
     * @throws Error if baseUrl is invalid.
     */
    constructor(options: RestClientOptions);
    /**
     * Set the authentication token.
     * @param token - The authentication token.
     */
    setToken(token?: string): void;
    getToken(): string | undefined;
    /**
     * Set the API key and secret.
     * @param apiKey - The API key.
     * @param apiKeySecret - The API key secret.
     */
    setApiCredentials(apiKey: string, apiKeySecret: string): void;
    /**
     * Get headers for API requests.
     * @param authOptions - Authentication options.
     * @returns Headers object.
     */
    private getHeaders;
    /**
     * Handle API response.
     * @param response - Fetch response.
     * @returns Parsed response data.
     * @throws Error if response is invalid.
     */
    private handleResponse;
    /**
     * Log debug messages.
     * @param message - Message to log.
     * @param data - Optional data to log.
     */
    private log;
    /**
     * POST request.
     * @param data - Data to send.
     * @param path - API path.
     * @param authOptions - Authentication options.
     * @returns Promise with the response.
     */
    POST<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
    /**
     * PUT request.
     * @param data - Data to send.
     * @param path - API path.
     * @param authOptions - Authentication options.
     * @returns Promise with the response.
     */
    PUT<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
    /**
     * GET request.
     * @param params - Query parameters.
     * @param path - API path.
     * @param authOptions - Authentication options.
     * @returns Promise with the response.
     */
    GET<T>(params: Record<string, any> | null, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
    /**
     * DELETE request.
     * @param data - Data to send.
     * @param path - API path.
     * @param authOptions - Authentication options.
     * @returns Promise with the response.
     */
    DELETE<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
}

export { RestClient, SocketClient };
