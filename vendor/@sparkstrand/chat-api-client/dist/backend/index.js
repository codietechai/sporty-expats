"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/backend/index.ts
var backend_exports = {};
__export(backend_exports, {
  RestClient: () => RestClient,
  SocketClient: () => SocketClient
});
module.exports = __toCommonJS(backend_exports);

// lib/backend/socket.client.ts
var import_socket = require("socket.io-client");
var import_eventemitter3 = require("eventemitter3");
var SocketClient = class extends import_eventemitter3.EventEmitter {
  constructor(options) {
    super();
    this.messageQueue = [];
    this.connected = false;
    this.debug = false;
    this.eventHistory = [];
    this.options = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1e3,
      reconnectionDelayMax: 5e3,
      timeout: 2e4,
      debug: false,
      ...options
    };
    this.debug = this.options.debug ?? false;
    const url = this.options.namespace ? `${this.options.url}/${this.options.namespace}` : this.options.url;
    this.socket = (0, import_socket.io)(url, {
      path: this.options.path,
      autoConnect: this.options.autoConnect,
      reconnection: this.options.reconnection,
      reconnectionAttempts: this.options.reconnectionAttempts,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionDelayMax: this.options.reconnectionDelayMax,
      timeout: this.options.timeout,
      auth: this.options.token ? { token: this.options.token } : void 0
    });
    this.setupEventListeners();
  }
  setupEventListeners() {
    this.socket.on("connect" /* CONNECT */, () => {
      this.connected = true;
      this.log("Connected to server");
      this.emit("connect" /* CONNECT */);
      this.processMessageQueue();
    });
    this.socket.on("disconnect" /* DISCONNECT */, (reason) => {
      this.connected = false;
      this.log(`Disconnected from server: ${reason}`);
      this.emit("disconnect" /* DISCONNECT */, reason);
    });
    this.socket.on("connect_error" /* CONNECT_ERROR */, (error) => {
      this.log(`Connection error: ${error.message}`);
      this.emit("connect_error" /* CONNECT_ERROR */, error);
    });
    this.socket.on("reconnect_attempt" /* RECONNECT_ATTEMPT */, (attempt) => {
      this.log(`Reconnection attempt ${attempt}`);
      this.emit("reconnect_attempt" /* RECONNECT_ATTEMPT */, attempt);
    });
    this.socket.on("reconnect" /* RECONNECT */, (attempt) => {
      this.connected = true;
      this.log(`Reconnected after ${attempt} attempts`);
      this.emit("reconnect" /* RECONNECT */, attempt);
      this.processMessageQueue();
    });
    this.socket.on("reconnect_error" /* RECONNECT_ERROR */, (error) => {
      this.log(`Reconnection error: ${error.message}`);
      this.emit("reconnect_error" /* RECONNECT_ERROR */, error);
    });
    this.socket.on("reconnect_failed" /* RECONNECT_FAILED */, () => {
      this.log("Failed to reconnect");
      this.emit("reconnect_failed" /* RECONNECT_FAILED */);
    });
    this.socket.on("authenticated" /* AUTHENTICATED */, (data) => {
      this.log("Authenticated", data);
      this.emit("authenticated" /* AUTHENTICATED */, data);
    });
    this.socket.on("auth_error" /* AUTH_ERROR */, (error) => {
      this.log(`Authentication error: ${error.message}`);
      this.emit("auth_error" /* AUTH_ERROR */, error);
    });
    this.socket.on("roomJoined" /* ROOM_JOINED */, (data) => {
      this.log("Room joined", data);
      this.emit("roomJoined" /* ROOM_JOINED */, data);
    });
    this.socket.on("listOfGuestRooms" /* LIST_OF_GUEST_ROOMS */, (data) => {
      this.log("List of guest rooms", data);
      this.emit("listOfGuestRooms" /* LIST_OF_GUEST_ROOMS */, data);
    });
    this.socket.on("roomLeft" /* ROOM_LEFT */, (data) => {
      this.log("Room left", data);
      this.emit("roomLeft" /* ROOM_LEFT */, data);
    });
    this.socket.on("roomCreated" /* ROOM_CREATED */, (data) => {
      this.log("Room created", data);
      this.emit("roomCreated" /* ROOM_CREATED */, data);
    });
    this.socket.on("newMessage" /* NEW_MESSAGE */, (data) => {
      this.log("New message received", data);
      this.emit("newMessage" /* NEW_MESSAGE */, data);
    });
    this.socket.on("messageRead" /* MESSAGE_READ */, (data) => {
      this.log("Message read", data);
      this.emit("messageRead" /* MESSAGE_READ */, data);
    });
    this.socket.on("userJoined" /* USER_JOINED */, (data) => {
      this.log("User joined", data);
      this.emit("userJoined" /* USER_JOINED */, data);
    });
    this.socket.on("userOnline" /* USER_ONLINE */, (data) => {
      this.log("User online", data);
      this.emit("userOnline" /* USER_ONLINE */, data);
    });
    this.socket.on("userLeft" /* USER_LEFT */, (data) => {
      this.log("User left", data);
      this.emit("userLeft" /* USER_LEFT */, data);
    });
    this.socket.on("userStatusChanged" /* USER_STATUS_CHANGED */, (data) => {
      this.log("User status changed", data);
      this.emit("userStatusChanged" /* USER_STATUS_CHANGED */, data);
    });
    this.socket.on("error" /* ERROR */, (error) => {
      this.log("Error", error);
      this.emit("error" /* ERROR */, error);
    });
  }
  /* PUBLIC METHODS SECTION */
  connect() {
    this.socket.connect();
  }
  disconnect() {
    this.socket.disconnect();
  }
  isConnected() {
    return this.connected;
  }
  setToken(token) {
    this.options.token = token;
    this.socket.disconnect();
    this.socket = (0, import_socket.io)(this.options.url, {
      path: this.options.path,
      auth: { token },
      autoConnect: this.options.autoConnect,
      reconnection: this.options.reconnection,
      reconnectionAttempts: this.options.reconnectionAttempts,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionDelayMax: this.options.reconnectionDelayMax,
      timeout: this.options.timeout
    });
    this.setupEventListeners();
    this.socket.connect();
  }
  joinRoom(roomId) {
    this.log(`Joining room ${roomId}`);
    this.socket.emit("joinRoom" /* JOIN_ROOM */, roomId);
  }
  leaveRoom(roomId) {
    this.log(`Leaving room ${roomId}`);
    this.socket.emit("leaveRoom" /* LEAVE_ROOM */, roomId);
  }
  createRoom(data) {
    this.log("Creating room", data);
    this.socket.emit("createRoom" /* CREATE_ROOM */, data);
  }
  sendMessage(message) {
    if (!this.connected) {
      this.log("Not connected, queueing message", message);
      this.messageQueue.push(message);
      return;
    }
    this.log("Sending message", message);
    this.socket.emit("sendMessage" /* SEND_MESSAGE */, message);
  }
  markMessageRead(messageId) {
    this.log(`Marking message ${messageId} as read`);
    this.socket.emit("markMessageRead" /* MARK_MESSAGE_READ */, messageId);
  }
  setUserStatus(status) {
    this.log(`Setting user status to ${status}`);
    this.socket.emit("setUserStatus" /* SET_USER_STATUS */, status);
  }
  processMessageQueue() {
    if (this.messageQueue.length === 0) {
      return;
    }
    this.log(`Processing ${this.messageQueue.length} queued messages`);
    const batchSize = 10;
    const batches = Math.ceil(this.messageQueue.length / batchSize);
    for (let i = 0; i < batches; i++) {
      const batch = this.messageQueue.splice(0, batchSize);
      batch.forEach((message) => {
        this.sendMessage(message);
      });
    }
  }
  log(message, data) {
    if (!this.debug) {
      return;
    }
    if (data) {
      console.log(`[SocketClient] ${message}:`, data);
    } else {
      console.log(`[SocketClient] ${message}`);
    }
  }
  getEventHistory() {
    return this.eventHistory;
  }
};

// lib/backend/utils/queryParser.ts
var QueryParser = class {
  /**
   * Parses a search query into a Prisma-compatible query object.
   * @param query - The search query containing query conditions, pagination, and sorting options.
   * @returns A Prisma query object with `where`, `take`, `skip`, `cursor`, and `orderBy` clauses.
   * @throws Error if the query is missing or invalid.
   */
  parseSearchQuery(query) {
    if (!query.data.query) {
      throw new Error("Missing query in search request");
    }
    const where = this.parseQueryNode(query.data.query);
    const { pagination, sort } = query;
    const take = pagination?.take ?? pagination?.per_page;
    const skip = pagination?.skip;
    let cursor;
    if (pagination?.starting_after) {
      cursor = { id: this.decodeStartingAfter(pagination.starting_after) };
    }
    const orderBy = sort ? [{ [sort.field]: sort.order.toLowerCase() }] : void 0;
    return {
      where,
      ...take && { take },
      ...skip && { skip },
      ...cursor && { cursor, skip: 1 },
      ...orderBy && { orderBy }
    };
  }
  /**
   * Parses a query node containing AND or OR operations.
   * @param node - The query node with an operator (AND/OR) and values (conditions or nested nodes).
   * @returns A Prisma-compatible filter object (e.g., `{ AND: [...] }` or `{ OR: [...] }`).
   * @throws Error if the operator is unsupported.
   */
  parseQueryNode(node) {
    const conditions = node.value.map(
      (item) => "operator" in item ? this.parseQueryNode(item) : this.parseCondition(item)
    );
    switch (node.operator) {
      case "AND" /* AND */:
        return { AND: conditions };
      case "OR" /* OR */:
        return { OR: conditions };
      default:
        throw new Error(`Unsupported operator: ${node.operator}`);
    }
  }
  /**
   * Parses an individual query condition (e.g., field comparison).
   * @param condition - The query condition with field, operator, and value.
   * @returns A Prisma-compatible filter object for the condition.
   * @throws Error if the field, value, or operator is invalid or unsupported.
   */
  parseCondition(condition) {
    const { field, operator, value } = condition;
    if (!field || value === void 0 || value === null) {
      throw new Error(`Invalid condition: field=${field}, value=${value}`);
    }
    const fieldPath = field.split(".");
    const currentField = {};
    let temp = currentField;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      temp[fieldPath[i]] = { some: {} };
      temp = temp[fieldPath[i]].some;
    }
    const lastField = fieldPath[fieldPath.length - 1];
    switch (operator) {
      case "EQUALS" /* EQUALS */:
        temp[lastField] = { equals: value };
        break;
      case "NOT_EQUALS" /* NOT_EQUALS */:
        temp[lastField] = { not: { equals: value } };
        break;
      case "GREATER_THAN" /* GREATER_THAN */:
        temp[lastField] = { gt: value };
        break;
      case "LESS_THAN" /* LESS_THAN */:
        temp[lastField] = { lt: value };
        break;
      case "GREATER_THAN_OR_EQUAL" /* GREATER_THAN_OR_EQUAL */:
        temp[lastField] = { gte: value };
        break;
      case "LESS_THAN_OR_EQUAL" /* LESS_THAN_OR_EQUAL */:
        temp[lastField] = { lte: value };
        break;
      case "IN" /* IN */:
        if (!Array.isArray(value)) {
          throw new Error(`IN operator requires an array value`);
        }
        temp[lastField] = { in: value };
        break;
      case "CONTAINS" /* CONTAINS */:
        if (typeof value !== "string") {
          throw new Error(`CONTAINS operator requires a string value`);
        }
        temp[lastField] = { contains: value, mode: "insensitive" };
        break;
      default:
        throw new Error(`Unsupported condition operator: ${operator}`);
    }
    return currentField;
  }
  /**
   * Decodes a base64-encoded `starting_after` cursor for pagination.
   * Expects a JSON array with [timestamp, id, number] format.
   * @param startingAfter - The base64-encoded cursor string.
   * @returns The decoded ID to be used in Prisma's cursor-based pagination.
   * @throws Error if the cursor is invalid or cannot be decoded.
   */
  decodeStartingAfter(startingAfter) {
    try {
      const decoded = Buffer.from(startingAfter, "base64").toString("utf-8");
      const [timestamp, id, number] = JSON.parse(decoded);
      if (typeof timestamp !== "number" || typeof id !== "string" || typeof number !== "number") {
        throw new Error("Invalid cursor format: expected [timestamp, id, number]");
      }
      return id;
    } catch (error) {
      throw new Error(`Failed to decode starting_after cursor: ${error?.message || error}`);
    }
  }
};

// lib/backend/room.class.ts
function validateRequiredFields(fields, context) {
  const missingFields = Object.entries(fields).filter(([_, value]) => value === void 0 || value === null).map(([key]) => key);
  if (missingFields.length > 0) {
    return {
      success: false,
      message: `Missing required fields in ${context}: ${missingFields.join(", ")}`,
      statusCode: 400,
      data: null
    };
  }
  return null;
}
var Room = class {
  /**
   * Constructor for Room.
   * @param restClient - The REST client for HTTP requests.
   * @param queryParser - The query parser for search queries.
   */
  constructor(restClient, queryParser = new QueryParser()) {
    this.restClient = restClient;
    this.queryParser = queryParser;
    this.basePath = "api/v1/rooms";
  }
  /**
   * Create a new group room.
   * @param data - Room creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created room or error.
   */
  async createGroup(data, authOptions) {
    const validationError = validateRequiredFields(
      { creatorId: data.creatorId, name: data.name },
      "createGroup"
    );
    if (validationError) return validationError;
    const postData = {
      creatorId: data.creatorId,
      avatar: data?.avatar,
      applicationId: data?.applicationId || null,
      name: data.name,
      type: "group" /* GROUP */,
      description: data?.description,
      setting: data?.setting,
      guestIds: data?.membersId,
      metaData: data?.metadata
    };
    return await this.restClient.POST(postData, `${this.basePath}`, authOptions);
  }
  /**
   * Create a new direct message room.
   * @param data - DM room creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created room or error.
   */
  async createDm(data, authOptions) {
    const validationError = validateRequiredFields(
      { name: data.name, membersId: data.membersId },
      "createDm"
    );
    if (validationError) return validationError;
    if (data.membersId?.length !== 2) {
      return {
        success: false,
        message: "DM chats require exactly two recipients",
        statusCode: 400,
        data: null
      };
    }
    const postData = {
      name: data.name,
      applicationId: data?.applicationId || null,
      avatar: data?.avatar,
      guestIds: data.membersId,
      metaData: data?.metadata,
      type: "dm" /* DM */,
      description: data?.description,
      setting: data?.setting
    };
    return await this.restClient.POST(postData, `${this.basePath}`, authOptions);
  }
  /**
   * Update a room's settings.
   * @param data - Room settings update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated room or error.
   */
  async updateSetting(data, authOptions) {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, setting: data.setting },
      "updateSetting"
    );
    if (validationError) return validationError;
    return await this.restClient.PUT({ setting: data.setting }, `${this.basePath}/${data.roomId}`, authOptions);
  }
  /**
   * Update a room's description.
   * @param data - Room description update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated room or error.
   */
  async updateDescription(data, authOptions) {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, description: data.description },
      "updateDescription"
    );
    if (validationError) return validationError;
    return await this.restClient.PUT({ description: data.description }, `${this.basePath}/${data.roomId}`, authOptions);
  }
  /**
   * Update a room's name.
   * @param data - Room name update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated room or error.
   */
  async updateName(data, authOptions) {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, name: data.name },
      "updateName"
    );
    if (validationError) return validationError;
    return await this.restClient.PUT({ name: data.name }, `${this.basePath}/${data.roomId}`, authOptions);
  }
  /**
   * Get messages for a room.
   * @param data - Message retrieval data.
   * @param authOptions - Authentication options.
   * @returns Response containing the room with messages or error.
   */
  async getAllMessages(data, authOptions) {
    const validationError = validateRequiredFields({ roomId: data.roomId }, "getAllMessages");
    if (validationError) return validationError;
    const params = {
      limit: data?.limit ?? 100,
      before: data.before
    };
    if (data.before !== void 0) params.before = data.before;
    return await this.restClient.GET(params, `${this.basePath}/${data.roomId}/messages`, authOptions);
  }
  /**
   * Add one or more guests to a room.
   * @param data - Guest addition data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated room or error.
   */
  async addGuests(data, authOptions) {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, guestIds: data.guestIds },
      "addGuests"
    );
    if (validationError) return validationError;
    const guestsId = Array.isArray(data.guestIds) ? data.guestIds : [data.guestIds];
    return await this.restClient.PUT({ guestsId }, `${this.basePath}/${data.roomId}/addGuests`, authOptions);
  }
  /**
   * Get all guests in a room.
   * @param data - Room guest retrieval data.
   * @param authOptions - Authentication options.
   * @returns Response containing the room guests or error.
   */
  async getAllGuests(data, authOptions) {
    const validationError = validateRequiredFields({ roomId: data.roomId }, "getAllGuests");
    if (validationError) return validationError;
    return await this.restClient.GET(null, `${this.basePath}/${data.roomId}/guests`, authOptions);
  }
  /**
   * Remove one or more guests from a room.
   * @param data - Guest removal data.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  async removeGuests(data, authOptions) {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, guestsId: data.guestsId },
      "removeGuests"
    );
    if (validationError) return validationError;
    const guestsId = Array.isArray(data.guestsId) ? data.guestsId : [data.guestsId];
    return await this.restClient.DELETE({ guestsId }, `${this.basePath}/${data.roomId}/guests`, authOptions);
  }
  /**
   * Search for a single room.
   * @param data - Room search data.
   * @param authOptions - Authentication options.
   * @returns Response containing the found room or error.
   */
  async findFirst(data, authOptions) {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, query: data.query },
      "findFirst"
    );
    if (validationError) return validationError;
    try {
      const prismaQuery = this.queryParser.parseSearchQuery(data.query);
      return await this.restClient.GET({ query: prismaQuery }, `${this.basePath}/findFirst`, authOptions);
    } catch (error) {
      return {
        success: false,
        message: `Failed to parse room search query: ${error.message}`,
        statusCode: 400,
        data: null
      };
    }
  }
  /**
   * Search for multiple rooms.
   * @param data - Room search data.
   * @param authOptions - Authentication options.
   * @returns Response containing the found rooms or error.
   */
  async findMany(data, authOptions) {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, query: data.query },
      "findMany"
    );
    if (validationError) return validationError;
    try {
      const prismaQuery = this.queryParser.parseSearchQuery(data.query);
      return await this.restClient.GET({ query: prismaQuery }, `${this.basePath}/findMany`, authOptions);
    } catch (error) {
      return {
        success: false,
        message: `Failed to parse room search query: ${error.message}`,
        statusCode: 400,
        data: null
      };
    }
  }
};

// lib/backend/utils/validation.ts
function validateRequiredFields2(fields, context) {
  const missingFields = Object.entries(fields).filter(([_, value]) => value === void 0 || value === null).map(([key]) => key);
  if (missingFields.length > 0) {
    return {
      success: false,
      message: `Missing required fields in ${context}: ${missingFields.join(", ")}`,
      statusCode: 400,
      data: null
    };
  }
  return null;
}

// lib/backend/guest.class.ts
var Guest = class {
  /**
   * Constructor for Guest.
   * @param restClient - The REST client for HTTP requests.
   */
  constructor(restClient) {
    this.restClient = restClient;
    this.basePath = "api/v1/guests";
    this.isLogin = false;
  }
  /**
   * Upsert a guest.
   * @param data - Guest metadata.
   * @param authOptions - Authentication options.
   * @returns Response containing the guest data or error.
   */
  async upsert(data, authOptions) {
    const validationError = validateRequiredFields2(
      { externalId: data.externalId, name: data.name, username: data.username },
      "upsert"
    );
    if (validationError) return validationError;
    return await this.restClient.POST({ metaData: data }, `${this.basePath}/upsert`, authOptions);
  }
  /**
   * Update a guest's metadata.
   * @param id - Guest Id
   * @param data - Partial guest metadata for update.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated guest or error.
   */
  async update(id, data, authOptions) {
    const validationError = validateRequiredFields2({ externalId: data.externalId, id }, "update");
    if (validationError) return validationError;
    if (!Object.keys(data).some((key) => key !== "externalId")) {
      return {
        success: false,
        message: "No fields provided for update",
        statusCode: 400,
        data: null
      };
    }
    return await this.restClient.PUT({ guestId: id, metaData: data }, `${this.basePath}/update`, authOptions);
  }
  /**
   * Login a guest with their ID.
   * @param id - Guest ID or external ID.
   * @param authOptions - Authentication options.
   * @returns Response containing login data or error.
   */
  async login(id, authOptions) {
    const validationError = validateRequiredFields2({ id }, "login");
    if (validationError) return validationError;
    const result = await this.restClient.POST({ id }, `${this.basePath}/login`, authOptions);
    if (result.success && result.data) {
      this.restClient.setToken(result.data.token);
      this.isLogin = true;
    }
    return result;
  }
  /**
   * Logout the current guest.
   * @returns Response indicating success or error.
   */
  async logout() {
    this.restClient.setToken(void 0);
    this.isLogin = false;
    return {
      success: true,
      message: "Logged out successfully",
      statusCode: 200,
      data: null
    };
  }
  /**
   * Get the current guest information.
   * @param id  - Guest Id
   * @param authOptions - Authentication options.
   * @returns Response containing the guest data or error.
   */
  async getInfo(id, authOptions) {
    const validationError = validateRequiredFields2({ id }, "getInfo");
    if (validationError) return validationError;
    return await this.restClient.GET({ guestId: id }, `${this.basePath}`, authOptions);
  }
  /**
   * Get a guest by their external ID.
   * @param externalId - External ID of the guest.
   * @param authOptions - Authentication options.
   * @returns Response containing the guest data or error.
   */
  async getByExternalId(externalId, authOptions) {
    const validationError = validateRequiredFields2({ externalId }, "getByExternalId");
    if (validationError) return validationError;
    return await this.restClient.GET(null, `${this.basePath}/${externalId}`, authOptions);
  }
  /**
   * List all rooms for the current guest.
   * @param id  - Guest Id
   * @param authOptions - Authentication options.
   * @returns Response containing the rooms or error.
   */
  async listRooms(id, authOptions) {
    const validationError = validateRequiredFields2({ id }, "listRooms");
    if (validationError) return { ...validationError, data: [] };
    return await this.restClient.GET({ guestId: id }, `${this.basePath}/rooms`, authOptions);
  }
  // /**
  //  * List rooms for the current guest filtered by application ID.
  //  * @param applicationId - Application ID.
  //  * @param authOptions - Authentication options.
  //  * @returns Response containing the rooms or error.
  //  */
  // public async listRoomsByApplication(applicationId: string, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom[]>> {
  //   const validationError = validateRequiredFields({ applicationId }, 'listRoomsByApplicationId');
  //   if (validationError) return { ...validationError, data: []};
  //   return await this.restClient.GET<IRoom[]>(null, `${this.basePath}/rooms/${applicationId}`, authOptions);
  // }
  /**
   * Check if the current guest is a member of a room.
   * @param id  - Guest Id
   * @param roomId - Room ID.
   * @param authOptions - Authentication options.
   * @returns Response indicating membership status or error.
   */
  async isMemberOfRoom(id, roomId, authOptions) {
    const validationError = validateRequiredFields2({ roomId, id }, "isMemberOfRoom");
    if (validationError) return { ...validationError, data: false };
    return await this.restClient.GET({ guestId: id }, `${this.basePath}/rooms/${roomId}/isMember`, authOptions);
  }
  /**
   * Create a room as the current guest.
   * @param data - Room creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created room or error.
   */
  async createRoom(data, authOptions) {
    const validationError = validateRequiredFields2({ name: data.name, type: data.type }, "createRoom");
    if (validationError) return validationError;
    if (data.type === "dm" /* DM */ && data.membersId?.length !== 2) {
      return {
        success: false,
        message: "Room of type dm require exactly two recipients",
        statusCode: 400,
        data: null
      };
    }
    if (data.type === "group" /* GROUP */ && !data.creatorId) {
      return {
        success: false,
        message: "Room of type group require creatorId field",
        statusCode: 400,
        data: null
      };
    }
    const postData = {
      name: data.name,
      type: data.type,
      description: data?.description,
      guestsId: data?.membersId,
      applicationId: data?.applicationId,
      setting: data?.setting
    };
    if (data.creatorId) postData.creatorId = data.creatorId;
    return await this.restClient.POST(postData, `${this.basePath}/rooms`, authOptions);
  }
  /**
   * Update a room as the current guest.
   * @param data - Room update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated room or error.
   */
  async updateRoom(data, authOptions) {
    const validationError = validateRequiredFields2({ roomId: data.roomId }, "updateRoom");
    if (validationError) return validationError;
    if (!data.name && !data.description && !data.setting) {
      return {
        success: false,
        message: "No fields provided for room update",
        statusCode: 400,
        data: null
      };
    }
    const postData = {
      name: data.name,
      description: data?.description,
      setting: data?.setting
    };
    return await this.restClient.PUT(postData, `${this.basePath}/rooms/${data.roomId}`, authOptions);
  }
};

// lib/backend/company.class.ts
var Companies = class {
  /**
   * Constructor for Companies.
   * @param restClient - The REST client for HTTP requests.
   */
  constructor(restClient) {
    this.restClient = restClient;
    this.basePath = "api/v1/companies";
  }
  /**
   * Create a new company.
   * @param data - Company creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created company or error.
   */
  async create(data, authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2(
      {
        name: data.name,
        website: data.website,
        industry: data.industry,
        domains: data.domains,
        monthlySpend: data.monthlySpend,
        location: data.location,
        accountId: data.accountId
      },
      "create company"
    );
    if (validationError) return validationError;
    return await this.restClient.POST(data, `${this.basePath}`, authOptions);
  }
  /**
   * Update an existing company.
   * @param companyId - The ID of the company to update.
   * @param data - Company update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated company or error.
   */
  async update(companyId, data, authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2({ companyId }, "update company");
    if (validationError) return validationError;
    if (!Object.keys(data).length) {
      return {
        success: false,
        message: "No fields provided for company update",
        statusCode: 400,
        data: null
      };
    }
    return await this.restClient.PUT(data, `${this.basePath}/${companyId}`, authOptions);
  }
  /**
   * Generate an access key for a company.
   * @param companyId - The ID of the company.
   * @param data - Access key creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created access key or error.
   */
  async generateAccessKey(companyId, data, authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2(
      {
        companyId,
        name: data.name,
        status: data.status,
        expiresAt: data.expiresAt,
        accountId: data.accountId,
        roleName: data.roleName
      },
      "generate access key"
    );
    if (validationError) return validationError;
    return await this.restClient.POST(data, `${this.basePath}/${companyId}/accesskey`, authOptions);
  }
  /**
   * Update an existing access key for a company.
   * @param companyId - The ID of the company.
   * @param data - Access key update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated access key or error.
   */
  async updateAccessKey(companyId, data, authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2({ companyId }, "update access key");
    if (validationError) return validationError;
    if (!Object.keys(data).length) {
      return {
        success: false,
        message: "No fields provided for access key update",
        statusCode: 400,
        data: null
      };
    }
    return await this.restClient.PUT(data, `${this.basePath}/${companyId}/accesskey`, authOptions);
  }
  /**
   * Delete an access key for a company.
   * @param companyId - The ID of the company.
   * @param data - Access key deletion data.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  async deleteAccessKey(companyId, data, authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2(
      { companyId, apiKey: data.apiKey, apiKeySecret: data.apiKeySecret },
      "delete access key"
    );
    if (validationError) return validationError;
    return await this.restClient.DELETE(data, `${this.basePath}/${companyId}/accesskey`, authOptions);
  }
  /**
   * Retrieve an access key for a company.
   * @param companyId - The ID of the company.
   * @param data - Access key retrieval data.
   * @param authOptions - Authentication options.
   * @returns Response containing the access key or error.
   */
  async getAccessKey(companyId, data, authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2(
      { companyId, key: data.key, accountId: data.accountId },
      "get access key"
    );
    if (validationError) return validationError;
    return await this.restClient.GET(
      { key: data.key, accountId: data.accountId },
      `${this.basePath}/${companyId}/accesskey`,
      authOptions
    );
  }
  /**
   * Retrieve a company by ID.
   * @param companyId - The ID of the company.
   * @param authOptions - Authentication options.
   * @returns Response containing the company or error.
   */
  async get(companyId, authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2({ companyId }, "get company");
    if (validationError) return validationError;
    return await this.restClient.GET(null, `${this.basePath}/${companyId}`, authOptions);
  }
  /**
   * Update a company's domains.
   * @param companyId - The ID of the company.
   * @param data - Domains update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated company or error.
   */
  async updateDomains(companyId, data, authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2(
      { companyId, domainsToAdd: data.domainsToAdd, domainsToRemove: data.domainsToRemove },
      "update domains"
    );
    if (validationError) return validationError;
    return await this.restClient.PUT(data, `${this.basePath}/${companyId}/domains`, authOptions);
  }
};

// lib/backend/user.class.ts
var Users = class {
  /**
   * Constructor for Users.
   * @param restClient - The REST client for HTTP requests.
   */
  constructor(restClient) {
    this.restClient = restClient;
    this.basePath = "api/v1/users";
    this.isLogin = false;
  }
  /**
   * Sign up a new user.
   * @param data - User signup data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created user or error.
   */
  async signup(data, authOptions = { token: false, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2(
      {
        username: data.username,
        email: data.email,
        password: data.password
      },
      "signup"
    );
    if (validationError) return validationError;
    return await this.restClient.POST(data, `${this.basePath}/signup`, authOptions);
  }
  /**
   * Sign in an existing user.
   * @param data - User signin data.
   * @param authOptions - Authentication options.
   * @returns Response containing login data or error.
   */
  async signin(data, authOptions = { token: false, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2(
      {
        email: data.email,
        password: data.password
      },
      "signin"
    );
    if (validationError) return validationError;
    const result = await this.restClient.POST(data, `${this.basePath}/signin`, authOptions);
    if (result.success && result.data) {
      this.restClient.setToken(result.data.token);
      this.isLogin = true;
    }
    return result;
  }
  /**
   * Sign out the current user.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  async signout(authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    if (!this.isLogin || !this.restClient.getToken()) {
      return {
        success: false,
        message: "Not logged in. Call signin() before using this method.",
        statusCode: 401,
        data: null
      };
    }
    const result = await this.restClient.POST(null, `${this.basePath}/signout`, authOptions);
    if (result.success) {
      this.restClient.setToken(void 0);
      this.isLogin = false;
    }
    return result;
  }
  /**
   * Update the current user's information.
   * @param data - User update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated user or error.
   */
  async update(data, authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    if (!this.isLogin || !this.restClient.getToken()) {
      return {
        success: false,
        message: "Not logged in. Call signin() before using this method.",
        statusCode: 401,
        data: null
      };
    }
    if (!Object.keys(data).length) {
      return {
        success: false,
        message: "No fields provided for user update",
        statusCode: 400,
        data: null
      };
    }
    return await this.restClient.PUT(data, `${this.basePath}/update`, authOptions);
  }
  /**
   * Change the current user's password.
   * @param data - Password change data.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  async changePassword(data, authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    const validationError = validateRequiredFields2(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      },
      "change password"
    );
    if (validationError) return validationError;
    if (!this.isLogin || !this.restClient.getToken()) {
      return {
        success: false,
        message: "Not logged in. Call signin() before using this method.",
        statusCode: 401,
        data: null
      };
    }
    return await this.restClient.PUT(data, `${this.basePath}/password/change`, authOptions);
  }
  /**
   * Delete the current user account.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  async delete(authOptions = { token: true, apiKey: false, apiKeySecret: false }) {
    if (!this.isLogin || !this.restClient.getToken()) {
      return {
        success: false,
        message: "Not logged in. Call signin() before using this method.",
        statusCode: 401,
        data: null
      };
    }
    const result = await this.restClient.DELETE(null, `${this.basePath}`, authOptions);
    if (result.success) {
      this.restClient.setToken(void 0);
      this.isLogin = false;
    }
    return result;
  }
};

// lib/backend/message.class.ts
var Messages = class {
  /**
   * Constructor for Messages.
   * @param restClient - The REST client for HTTP requests.
   */
  constructor(restClient) {
    this.restClient = restClient;
    this.basePath = "api/v1/messages";
  }
  /**
   * Create a new message in a room.
   * @param data - Message creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created message or error.
   */
  async create(data, authOptions) {
    const validationError = validateRequiredFields2(
      {
        to: data.to,
        senderId: data.senderId
      },
      "create message"
    );
    if (validationError) return validationError;
    return await this.restClient.POST(data, `${this.basePath}`, authOptions);
  }
  /**
   * Update an existing message.
   * @param messageId - The ID of the message to update.
   * @param data - Message update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated message or error.
   */
  async update(messageId, data, authOptions) {
    const validationError = validateRequiredFields2({ messageId }, "update message");
    if (validationError) return validationError;
    if (!Object.keys(data).length) {
      return {
        success: false,
        message: "No fields provided for message update",
        statusCode: 400,
        data: null
      };
    }
    return await this.restClient.PUT(data, `${this.basePath}/${messageId}`, authOptions);
  }
  /**
   * Delete a message.
   * @param messageId - The ID of the message to delete.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  async delete(messageId, authOptions) {
    const validationError = validateRequiredFields2({ messageId }, "delete message");
    if (validationError) return validationError;
    return await this.restClient.DELETE(null, `${this.basePath}/${messageId}`, authOptions);
  }
  /**
   * Retrieve a message by ID.
   * @param messageId - The ID of the message.
   * @param authOptions - Authentication options.
   * @returns Response containing the message or error.
   */
  async get(messageId, authOptions) {
    const validationError = validateRequiredFields2({ messageId }, "get message");
    if (validationError) return validationError;
    return await this.restClient.GET(null, `${this.basePath}/${messageId}`, authOptions);
  }
  /**
   * Get all messages from a guest
   * @param data - Search query for filtering messages, 
   *         filters.senderId is required
   * @param authOptions - Authentication options.
   * @returns Response containing the matching messages or error.
   */
  async getMessageBySender(data, authOptions) {
    const validationError = validateRequiredFields2({ senderId: data.filters?.senderId }, "search user message");
    if (validationError) return { ...validationError, data: { messages: [], totalCount: 0, hasMore: false } };
    return await this.restClient.POST(data, `${this.basePath}/search/sender`, authOptions);
  }
  /**
   * Search for words across the provided roomIds  or all the rooms the guest has access to if roomIds not provided
   * @param guestId - Guest ID
   * @param data - Search query for filtering messages, 
   *         words is required
   * @param authOptions 
   * @returns 
   */
  async searchWords(data, authOptions) {
    const validationError = validateRequiredFields2({ words: data.words, guestId: data.guestId }, "search words");
    if (validationError) return { ...validationError, data: { messages: [], totalCount: 0, hasMore: false } };
    return await this.restClient.POST(data, `${this.basePath}/search/words`, authOptions);
  }
  /**
   * Search for words in a room
   * @param data - Search query for filtering messages, 
   *         words and roomId are required
   * @param authOptions 
   * @returns 
   */
  async searchForWordsInARoom(data, authOptions) {
    const validationError = validateRequiredFields2({ words: data.words, roomId: data.roomId }, "search words in room");
    if (validationError) return { ...validationError, data: { messages: [], totalCount: 0, hasMore: false } };
    return await this.restClient.POST(data, `${this.basePath}/search/room`, authOptions);
  }
  /**
   * Search for words in multiple rooms
   * @param data - Search query for filtering messages, 
   *         words and roomIds are required
   * @param authOptions 
   * @returns 
   */
  async searchForWordsInMultipleRooms(data, authOptions) {
    const validationError = validateRequiredFields2({ words: data.words, roomIds: data.roomIds }, "search words in multiple rooms");
    if (validationError) return { ...validationError, data: { messages: [], totalCount: 0, hasMore: false } };
    return await this.restClient.POST(data, `${this.basePath}/search/rooms`, authOptions);
  }
  /**
   * Mark a message as read.
   * @param messageId - The ID of the message to mark as read.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  async markAsRead(messageId, authOptions) {
    const validationError = validateRequiredFields2({ messageId }, "mark message as read");
    if (validationError) return validationError;
    return await this.restClient.PUT(null, `${this.basePath}/${messageId}/read`, authOptions);
  }
};

// lib/backend/restful.client.ts
var RestClient = class {
  /**
   * Constructor for RestClient.
   * @param options - Configuration options for the REST client.
   * @throws Error if baseUrl is invalid.
   */
  constructor(options) {
    this.timeoutMs = 1e4;
    try {
      new URL(options.baseUrl);
    } catch {
      throw new Error("Invalid baseUrl provided");
    }
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.apiKeySecret = options.apiKeySecret;
    this.token = options.token;
    this.debug = options.debug || false;
    this.room = new Room(this);
    this.guest = new Guest(this);
    this.companies = new Companies(this);
    this.user = new Users(this);
    this.messages = new Messages(this);
  }
  /**
   * Set the authentication token.
   * @param token - The authentication token.
   */
  setToken(token) {
    this.token = token;
    this.log("Token set");
  }
  getToken() {
    return this.token;
  }
  /**
   * Set the API key and secret.
   * @param apiKey - The API key.
   * @param apiKeySecret - The API key secret.
   */
  setApiCredentials(apiKey, apiKeySecret) {
    this.apiKey = apiKey;
    this.apiKeySecret = apiKeySecret;
    this.log("API credentials set");
  }
  /**
   * Get headers for API requests.
   * @param authOptions - Authentication options.
   * @returns Headers object.
   */
  getHeaders(authOptions = { token: false, apiKey: true, apiKeySecret: true }) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (!authOptions.token && !authOptions.apiKey && !authOptions.apiKeySecret) {
      return headers;
    }
    if (authOptions.token && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    if (authOptions.apiKey && this.apiKey) {
      headers["X-RESTCLIENT"] = "true";
      headers["X-API-Key"] = this.apiKey;
    }
    if (authOptions.apiKeySecret && this.apiKeySecret) {
      headers["X-API-Secret"] = this.apiKeySecret;
    }
    return headers;
  }
  /**
   * Handle API response.
   * @param response - Fetch response.
   * @returns Parsed response data.
   * @throws Error if response is invalid.
   */
  async handleResponse(response) {
    try {
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON response, got ${contentType}`);
      }
      const data = await response.json();
      if (!data || typeof data.success !== "boolean" || typeof data.statusCode !== "number") {
        throw new Error("Invalid response format");
      }
      this.log(`Response received: ${response.status} ${response.statusText}`, data);
      return data;
    } catch (error) {
      throw new Error(`Failed to handle response: ${error.message}`);
    }
  }
  /**
   * Log debug messages.
   * @param message - Message to log.
   * @param data - Optional data to log.
   */
  log(message, data) {
    if (!this.debug) return;
    console.log(`[RestClient] ${message}`, data || "");
  }
  /**
   * POST request.
   * @param data - Data to send.
   * @param path - API path.
   * @param authOptions - Authentication options.
   * @returns Promise with the response.
   */
  async POST(data, path, authOptions) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      this.log(`POST ${path}`, data);
      const response = await fetch(`${this.baseUrl}/${path}`, {
        method: "POST",
        headers: this.getHeaders(authOptions),
        body: data ? JSON.stringify(data) : void 0,
        signal: controller.signal
      });
      return await this.handleResponse(response);
    } catch (error) {
      throw new Error(`POST request failed: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
  /**
   * PUT request.
   * @param data - Data to send.
   * @param path - API path.
   * @param authOptions - Authentication options.
   * @returns Promise with the response.
   */
  async PUT(data, path, authOptions) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      this.log(`PUT ${path}`, data);
      const response = await fetch(`${this.baseUrl}/${path}`, {
        method: "PUT",
        headers: this.getHeaders(authOptions),
        body: data ? JSON.stringify(data) : void 0,
        signal: controller.signal
      });
      return await this.handleResponse(response);
    } catch (error) {
      throw new Error(`PUT request failed: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
  /**
   * GET request.
   * @param params - Query parameters.
   * @param path - API path.
   * @param authOptions - Authentication options.
   * @returns Promise with the response.
   */
  async GET(params, path, authOptions) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let url = `${this.baseUrl}/${path}`;
      if (params) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== void 0 && value !== null) {
            query.append(key, String(value));
          }
        }
        url += `?${query.toString()}`;
      }
      this.log(`GET ${url}`);
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(authOptions),
        signal: controller.signal
      });
      return await this.handleResponse(response);
    } catch (error) {
      throw new Error(`GET request failed: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
  /**
   * DELETE request.
   * @param data - Data to send.
   * @param path - API path.
   * @param authOptions - Authentication options.
   * @returns Promise with the response.
   */
  async DELETE(data, path, authOptions) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      this.log(`DELETE ${path}`, data);
      const response = await fetch(`${this.baseUrl}/${path}`, {
        method: "DELETE",
        headers: this.getHeaders(authOptions),
        body: data ? JSON.stringify(data) : void 0,
        signal: controller.signal
      });
      return await this.handleResponse(response);
    } catch (error) {
      throw new Error(`DELETE request failed: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RestClient,
  SocketClient
});
//# sourceMappingURL=index.js.map