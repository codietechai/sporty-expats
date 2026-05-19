// lib/v2/backend/index.ts
import jwt from "jsonwebtoken";
var ChatServerClient = class _ChatServerClient {
  constructor(apiKey, apiSecret, baseURL = "http://localhost:3000") {
    if (!apiKey || !apiSecret) {
      throw new Error("ChatServerClient requires both an API Key and an API Secret.");
    }
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = baseURL;
  }
  /**
   * Initializes a new instance of the ChatServerClient.
   * This should only be used on server environments (Node.js) to prevent leaking the apiSecret.
   */
  static getInstance(apiKey, apiSecret, baseURL) {
    return new _ChatServerClient(apiKey, apiSecret, baseURL);
  }
  /**
   * Generates an offline token for a given user.
   * This token implies the application's backend has verified the user.
   * @param userId The unique ID of the user.
   * @param role Optional role (e.g. 'user', 'admin', 'moderator'). Defaults to 'user'.
   * @param exp Optional expiration time (in seconds). Defaults to 30 days.
   * @returns A signed JWT string that the frontend SDK can use to connect.
   */
  createToken(userId, role = "user", exp) {
    if (!userId) {
      throw new Error("userId is required to create a token");
    }
    const payload = {
      userId,
      role
    };
    const options = {
      algorithm: "HS256",
      expiresIn: exp || 60 * 60 * 24 * 30
      // 30 days default
    };
    return jwt.sign(payload, this.apiSecret, options);
  }
  // #region REST API Wrappers
  async apiFetch(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "x-api-key-secret": this.apiSecret,
      ...options.headers || {}
    };
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || result.error || "Server API Request failed");
    return result.data;
  }
  // --- Users ---
  async upsertUsers(users) {
    return this.apiFetch(`/api/v2/chat/users/upsert`, {
      method: "POST",
      body: JSON.stringify({ users })
    });
  }
  async queryUsers(query) {
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => queryParams.append(key, String(val)));
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.apiFetch(`/api/v2/chat/users${queryString}`, { method: "GET" });
  }
  async partialUpdateUsers(updates) {
    return this.apiFetch(`/api/v2/chat/users`, {
      method: "PATCH",
      body: JSON.stringify({ updates })
    });
  }
  async deactivateUser(userId) {
    return this.apiFetch(`/api/v2/chat/users/${userId}/deactivate`, { method: "POST" });
  }
  async reactivateUser(userId) {
    return this.apiFetch(`/api/v2/chat/users/${userId}/reactivate`, { method: "POST" });
  }
  // --- Rooms ---
  async createRoom(data) {
    return this.apiFetch(`/api/v2/chat/rooms`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async truncateRoom(roomId) {
    return this.apiFetch(`/api/v2/chat/rooms/${roomId}/truncate`, { method: "POST" });
  }
  async freezeRoom(roomId, freeze = true) {
    return this.apiFetch(`/api/v2/chat/rooms/${roomId}/freeze`, {
      method: "POST",
      body: JSON.stringify({ freeze })
    });
  }
  async deleteRoom(roomId, hardDelete = false) {
    return this.apiFetch(`/api/v2/chat/rooms/${roomId}?hard_delete=${hardDelete}`, { method: "DELETE" });
  }
  async updateRoomMetadata(roomId, data) {
    return this.apiFetch(`/api/v2/chat/rooms/${roomId}/metadata`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  }
  async queryRooms(query) {
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => {
      if (typeof val === "object") queryParams.append(key, JSON.stringify(val));
      else queryParams.append(key, String(val));
    });
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.apiFetch(`/api/v2/chat/rooms${queryString}`, { method: "GET" });
  }
  async queryMembers(roomId, query = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => {
      if (typeof val === "object") queryParams.append(key, JSON.stringify(val));
      else queryParams.append(key, String(val));
    });
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.apiFetch(`/api/v2/chat/rooms/${roomId}/members${queryString}`, { method: "GET" });
  }
  async addMembers(roomId, members) {
    return this.apiFetch(`/api/v2/chat/rooms/${roomId}/members`, {
      method: "POST",
      body: JSON.stringify({ members })
    });
  }
  async removeMembers(roomId, members) {
    return this.apiFetch(`/api/v2/chat/rooms/${roomId}/members`, {
      method: "DELETE",
      body: JSON.stringify({ members })
    });
  }
  async moderateMember(roomId, userId, action) {
    return this.apiFetch(`/api/v2/chat/rooms/${roomId}/moderate`, {
      method: "POST",
      body: JSON.stringify({ userId, action })
    });
  }
  async updatePreferences(roomId, preferences) {
    return this.apiFetch(`/api/v2/chat/rooms/${roomId}/preferences`, {
      method: "POST",
      body: JSON.stringify(preferences)
    });
  }
  // --- Messages ---
  async queryMessages(roomId, query) {
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => queryParams.append(key, String(val)));
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.apiFetch(`/api/v2/chat/rooms/${roomId}/messages${queryString}`, { method: "GET" });
  }
  async deleteMessage(messageId) {
    return this.apiFetch(`/api/v2/chat/messages/${messageId}`, { method: "DELETE" });
  }
  async updateMessage(messageId, text) {
    return this.apiFetch(`/api/v2/chat/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ text })
    });
  }
  async deleteReaction(messageId, emoji) {
    return this.apiFetch(`/api/v2/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, { method: "DELETE" });
  }
  // --- Storage ---
  async getUploadUrls(files) {
    return this.apiFetch(`/api/v2/chat/storage/upload-url`, {
      method: "POST",
      body: JSON.stringify({ files })
    });
  }
  // #endregion
};
export {
  ChatServerClient
};
//# sourceMappingURL=index.mjs.map