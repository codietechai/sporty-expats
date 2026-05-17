# @sparkstrand/chat-api-client/v2/frontend — Developer Reference

This document covers everything you need to integrate the V2 chat SDK into a TypeScript or JavaScript application. It explains the architecture, the full public API, every event, and all types exactly as they are defined.

---

## Table of Contents

1. Architecture overview
2. Installation and setup
3. ChatClient
4. Room
5. Event reference
6. Type reference
7. Optimistic messages and the broadcast contract
8. Authentication and token refresh
9. Error handling
10. Common patterns

---

## 1. Architecture overview

The SDK has two main classes.

`ChatClient` is a singleton. It manages the WebSocket connection, the authentication lifecycle, and the room registry. It owns the Socket.IO socket and routes every incoming server event to the correct `Room` instance via a direct `Map.get(roomId)` lookup.

`Room` represents a single chat room. It maintains a private internal state cache, handles optimistic updates for messages and reactions, and exposes both WebSocket actions (send, react, type) and REST actions (query, members, metadata) through a unified API. It extends `ChatClientEmitter`, which is `EventEmitter<ServerToClientEvents>`, so every event emitted by a `Room` instance is fully typed.

The data flow is:

```
Server broadcast
  -> ChatClient socket listener
  -> routeToRoom: O(1) activeRooms.get(roomId)
  -> room._handleEvent: mutates internal _state, then emits typed event
  -> your UI listener (getState() already reflects the update)
  -> client global emit (for notification badges, room lists, etc.)
```

The room state is always mutated before any event is emitted. This means any listener that calls `room.getState()` inside a handler will see the updated data. Global `client` events fire after the room has already been updated, so global subscribers are also safe.

Events are the primary reactive surface for UI. The internal state cache exists for reconnection recovery and one-time reads. Subscribe to events for all live UI updates.

---

## 2. Installation and setup

```bash
npm install @sparkstrand/chat-api-client
```

### Basic initialization

```ts
import { ChatClient, ChatUserRole } from '@sparkstrand/chat-api-client/v2/frontend';
import { ChatUserRole } from '@sparkstrand/chat-api-client/v2/types';

const client = ChatClient.getInstance(
  'your-api-key',
  'https://chatServer.com',
);

await client.connectUser(
  {
    userId: 'userId from your system';
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
  },
  async () => fetchTokenFromYourBackend(),
);
```

`connectUser` runs in two steps: an HTTP POST to `/api/v2/chat/users/connect` to verify credentials and populate `client.user` with the full server `ChatUser` record, then a WebSocket connection. After the promise resolves, wait for `SocketEvent.CONNECT` or check `client.isConnected()` before calling `room.watch()`.

---

## 3. ChatClient

`ChatClient` is a singleton. Call `ChatClient.getInstance(apiKey, baseURL)` everywhere — it always returns the same instance.

### Properties

| Property | Type | Notes |
|---|---|---|
| `apiKey` | `string` | The API key used at instantiation |
| `user` | `ChatUser \| null` | Populated with the full server record after `connectUser` resolves |
| `connectionState` | `ConnectionState` | `'disconnected' \| 'connecting' \| 'connected' \| 'reconnecting'` |
| `socket` | `Socket \| null` | The Socket.IO socket. Treat as read-only |
| `activeRooms` | `Map<string, Room>` | All Room instances keyed by `roomId` |

### `connectUser(user, tokenOrProvider)`

```ts
await client.connectUser(user: ChatUser, tokenOrProvider: string | TokenProvider): Promise<void>
```

Authenticates the user and opens the WebSocket. If you pass a `TokenProvider` function (`() => Promise<string> | string`), the SDK stores it and calls it automatically during reconnection when the token is near expiry. Always prefer a function over a raw string in production.

After the HTTP handshake succeeds, `client.user` is overwritten with the full `ChatUser` record returned from the server, including any server-side fields.

### `disconnectUser()`

```ts
client.disconnectUser(): void
```

Calls `room.dispose()` on every active room, then calls `socket.removeAllListeners()`, disconnects the socket, clears `activeRooms`, resets the token and reconnect counter, and emits `CONNECTION_CHANGED` with `status: 'disconnected'`.

Calling `dispose()` on each room before clearing the registry means any UI component still holding a reference to a `Room` instance will immediately see `initialized = false` and `getState()` returning `null`, preventing stale renders after logout. Call `disconnectUser()` on logout and on provider unmount in SPAs.

### `room(roomId, config?)`

```ts
const room = client.room('room_xyz'): Room
```

Returns the existing `Room` from `activeRooms`, or creates a new one and registers it. Does not watch or fetch state. Call `room.watch()` to subscribe.

### `hydrateRooms(rooms)`

```ts
client.hydrateRooms(rooms: ChatRoom[]): void
```

Creates a `Room` instance for each `ChatRoom` in the array and registers it in `activeRooms`. Idempotent — rooms already registered are left unchanged.

Use this when you have room data from any source and want socket events to start routing before the UI opens a specific room and calls `watch()`. `queryRooms` calls this automatically, so explicit calls are only needed when you obtain room data through another path (server-side props, a push notification payload, etc.):

```ts
// queryRooms calls hydrateRooms internally — no manual call needed here
const { rooms } = await client.queryRooms({ state: true, limit: 50 });

// Manual call when you have room data from another source
client.hydrateRooms(roomsFromServerProps);
```

### `initializeRooms(data)`

```ts
const rooms = client.initializeRooms([
  { roomId: 'room_1' },
  { roomId: 'room_2' },
]): Room[]
```

Creates `Room` instances for each entry without watching them. Returns the array of instances. Prefer `hydrateRooms()` when you already have `ChatRoom` objects.

### `rooms()`

```ts
client.rooms(): Room[]
```

Returns all currently registered `Room` instances as an array. Useful for iterating rooms in list components without re-querying the server:

```ts
// Sort the registered rooms by lastMessageAt for a room list UI
const sorted = client.rooms()
  .map(r => r.getState())
  .filter(Boolean)
  .sort((a, b) => {
    const aTime = a!.lastMessageAt ? new Date(a!.lastMessageAt).getTime() : 0;
    const bTime = b!.lastMessageAt ? new Date(b!.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
```

### `queryRooms(query)`

```ts
const response = await client.queryRooms(query: QueryRoomsRequest): Promise<QueryRoomsResponse>
```

Fetches rooms the connected user is a member of.

```ts
interface QueryRoomsRequest {
  state: boolean;                 // if true, populates messages[] and members[] on each room
  limit?: number;
  offset?: number;
  sort?: any;
  filter_conditions?: RoomFilter;
}

interface QueryRoomsResponse {
  rooms: ChatRoom[];
  total: number;
}
```

When `state: true`, each returned `ChatRoom` has its `messages` and `members` arrays populated. When `state: false`, both arrays are empty. Returned rooms also include `unreadCount` and `lastMessageAt` injected by the server.

`queryRooms` automatically calls `hydrateRooms` on the result, so a `Room` instance is registered for every returned room before the promise resolves. Socket events for those rooms will start routing immediately — even before the UI calls `room.watch()` on any of them.

```ts
const { rooms, total } = await client.queryRooms({
  state: true,
  limit: 20,
  offset: 0,
  filter_conditions: {
    type: RoomType.messaging,
    subType: RoomSubType.group,
    frozen: false,
    disabled: false,
  },
});
// Room instances are already registered — no manual hydrateRooms() call needed
```

### `uploadFiles(files, type?)`

```ts
const attachments = await client.uploadFiles(files: File[], type?: string): Promise<ChatAttachment[]>
```

Uploads files using the pre-signed URL flow. `type` defaults to `'file'`. Common values: `'image'`, `'video'`, `'audio'`, `'avatar'`, `'logo'`. Returns `ChatAttachment[]` ready to pass directly to `room.sendMessage`. Throws if any individual file PUT fails.

### `apiFetch<T>(endpoint, options?)`

```ts
const data = await client.apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T>
```

Authenticated fetch wrapper. Injects `Authorization: Bearer <token>` and `x-api-key` headers automatically. Throws `Error` if the client is not connected, or if the server returns `success: false`. Returns `result.data` typed as `T`.

### `isConnected()`

```ts
client.isConnected(): boolean
```

Returns `true` only when `connectionState === 'connected'` and the socket is connected at the transport layer.

---

## 4. Room

Get a Room instance from `client.room(roomId)`. Never instantiate `Room` directly.

### Properties

| Property | Type | Notes |
|---|---|---|
| `id` | `string` | The `roomId` passed at creation |
| `initialized` | `boolean` | `true` after `watch()` has resolved successfully |

### `getState()`

```ts
room.getState(): Readonly<ChatRoom> | null
```

Returns a frozen shallow copy of the internal state. Use for initial renders or one-time reads. Do not poll this for reactive UI — subscribe to events instead. The returned object is `Object.freeze`d: mutations throw in strict mode and are silently ignored otherwise.

### `watch()`

```ts
const state = await room.watch(): Promise<Readonly<ChatRoom>>
```

Subscribes to server-side events for this room and fetches the initial state snapshot. Sets `initialized = true` and emits `STATE_SYNCED` with the snapshot on success. Must be called before the room receives events. Throws if the client is not connected.

The returned `ChatRoom` includes `members`, `messages`, `unreadCount`, `lastMessageAt`, and all other room fields.

### `stopWatch()`

```ts
await room.stopWatch(): Promise<void>
```

Signals the server to stop sending events for this room to this client. Does not leave the underlying socket room or clear internal state.

### `dispose()`

```ts
room.dispose(): void
```

Clears internal state (`_state = null`), sets `initialized = false`, evicts all pending temp id entries, and removes all event listeners from this `Room` instance.

Called automatically by `disconnectUser()` on every active room and by `ROOM_REMOVED` / `ROOM_DELETED` handlers when the server removes a room. After `dispose()`, the instance is inert — calling `watch()` again will re-hydrate it cleanly from the server.

You generally do not need to call this manually. If you build a UI that destroys a room view without logging out, call `stopWatch()` to unsubscribe from server events rather than `dispose()`, since `dispose()` also removes all local listeners and clears state.

### `sendMessage(message)`

```ts
const confirmed = await room.sendMessage(message: ICreateMessage): Promise<ChatMessage>
```

```ts
interface ICreateMessage {
  roomId: string;
  id?: string;                // optional client-side id; used as tempId
  content?: string;
  messageType?: MessageType;
  attachments?: ChatAttachment[];
  replyToId: string | null;  // required — pass null for non-reply messages
}
```

An `OptimisticMessage` with `status: 'sending'` is inserted into the internal state immediately and `MESSAGE_NEW` is emitted. On ACK success, a `confirmedId → tempId` mapping is registered. The server broadcast replaces the optimistic entry and emits `MESSAGE_UPDATED`. On ACK failure, `status` becomes `'failed'` and `MESSAGE_UPDATED` is emitted — no broadcast will follow.

### `updateMessage(data)`

```ts
await room.updateMessage(data: IUpdateMessage): Promise<ChatMessage>
```

```ts
interface IUpdateMessage {
  messageId: string;
  content: string;
  roomId: string;
}
```

Applies an optimistic edit immediately. Rolls back with the original content on failure.

### `deleteMessage(messageId)`

```ts
await room.deleteMessage(messageId: string): Promise<void>
```

Removes the message from internal state optimistically. Re-inserts at the original index on failure.

### `sendReaction(messageId, emoji)`

```ts
const reaction = await room.sendReaction(messageId: string, emoji: string): Promise<ChatMessageReaction>
```

Adds an optimistic reaction deduplicated by `emoji + userId`. The broadcast that follows also deduplicates by the same key — the temp entry is replaced with the confirmed server reaction.

### `deleteReaction(payload)`

```ts
await room.deleteReaction(payload: IDeleteMessageReaction): Promise<void>
```

```ts
interface IDeleteMessageReaction {
  messageId: string;
  roomId: string;
  emoji: string;
}
```

Removes the reaction optimistically and emits `MESSAGE_UPDATED`. Rolls back and emits `MESSAGE_UPDATED` on failure.

### `markRead()`

```ts
await room.markRead(): Promise<void>
```

Marks the room read up to the latest message. The server ACK returns `{ messageId: string; roomId: string }`.

### `sendEvent(eventType)`

```ts
room.sendEvent(eventType: SocketEvent.TYPING_START | SocketEvent.TYPING_STOP): void
```

Fire-and-forget. Sends a typing indicator. The server silently drops these if `watch()` has not been called first. Call `TYPING_START` once at the start of a typing burst and `TYPING_STOP` after inactivity — do not call on every keystroke.

### `queryMessages(query?)`

```ts
const messages = await room.queryMessages(query?: Record<string, any>): Promise<ChatMessage[]>
```

Fetches a page of message history. Results are merged into internal state (deduplicated by `id`, sorted chronologically by `createdAt`) and `STATE_SYNCED` is emitted. Common params: `limit`, `before` (cursor `id` for loading older pages).

### `queryThread(parentId, query?)`

```ts
const replies = await room.queryThread(parentId: string, query?: Record<string, any>): Promise<ChatMessage[]>
```

Fetches thread replies for a parent message. Delegates to `queryMessages` with `parentId` injected.

### `queryMembers(query?)`

```ts
const result = await room.queryMembers(query?: Record<string, any>): Promise<{ members: ChatRoomMember[]; total: number }>
```

Fetches paginated room members. New members are merged into internal state (deduplicated by `userId`) and `STATE_SYNCED` is emitted.

### `addMembers(userIds)`

```ts
await room.addMembers(members: string[]): Promise<void>
```

### `removeMembers(userIds)`

```ts
await room.removeMembers(members: string[]): Promise<void>
```

### `moderateMember(userId, action)`

```ts
const member = await room.moderateMember(
  userId: string,
  action: 'ban' | 'unban' | 'shadow_ban'
): Promise<ChatRoomMember>
```

### `updateMetadata(data)`

```ts
const result = await room.updateMetadata(data: { roomId: string; set?: any; unset?: string[] }): Promise<ChatRoom>
```

PATCH the room record. Use to update `name`, `image`, `description`, `metadata`, or any other mutable room field.

### `updatePreferences(preferences)`

```ts
const member = await room.updatePreferences(preferences: Record<string, any>): Promise<ChatRoomMember>
```

Updates the calling user's `preferences` field on their `ChatRoomMember` record for this room. Returns the updated `ChatRoomMember`.

---

## 5. Event reference

Both `ChatClient` and `Room` extend `ChatClientEmitter`, which is `EventEmitter<ServerToClientEvents>`. All events and their payload types are statically typed.

Subscribe with `.on(event, handler)` and unsubscribe with `.off(event, handler)`. Room events are emitted on both the `Room` instance and on `ChatClient` globally. For components tied to a single room, subscribe on the room. For notification badges and global feeds, subscribe on the client.

### Connection events — subscribe on `client`

| Event | Payload | Notes |
|---|---|---|
| `SocketEvent.CONNECT` | `{ status: string } \| undefined` | Socket connected |
| `SocketEvent.DISCONNECT` | `string` | Disconnect reason string |
| `SocketEvent.CONNECTION_CHANGED` | `{ status: ConnectionState; userId?: string }` | Any state transition |
| `SocketEvent.CONNECTION_SUCCESS` | `{ userId?: string; message: string }` | Server confirmed auth and joined rooms |
| `SocketEvent.CONNECTION_ERROR` | `{ userId?: string; message: string }` | Auth or transport failure |

### Room and message events — subscribe on `room` or `client`

| Event | Payload | Notes |
|---|---|---|
| `MESSAGE_NEW` | `ChatMessage` | New message. On the sender's client, the optimistic entry is replaced via `MESSAGE_UPDATED` instead however the sender's client also get it - this is done to ensure that message by the sender's client show on UI across sender's devices|
| `MESSAGE_UPDATED` | `ChatMessage` | Message edited, send confirmed, or reactions changed |
| `MESSAGE_DELETED` | `ChatMessage` | Message removed |
| `THREAD_NEW` | `ChatMessage` | Reply added — message has `replyToId` set |
| `MESSAGE_REACTION_NEW` | `ChatMessageReaction` | Reaction added |
| `MESSAGE_REACTION_DELETED` | `ChatMessageReaction` | Reaction removed |
| `MESSAGE_READ` | `{ userId: string; roomId: string }` | A member marked the room as read |
| `TYPING_START` | `{ userId: string; roomId: string }` | A member started typing |
| `TYPING_STOP` | `{ userId: string; roomId: string }` | A member stopped typing |
| `NOTIFICATION_UNREAD` | `{ roomId: string; unreadCount: number }` | Unread count changed |
| `USER_PRESENCE_CHANGED` | `ChatUserPresentChange` | A user's online status changed |
| `ROOM_ADDED` | `ChatRoom` | Current user added to a room mid-session |
| `ROOM_REMOVED` | `ChatRoom` | Current user removed from a room mid-session |
| `ROOM_DELETED` | `ChatRoom` | Room permanently deleted |
| `ROOM_FROZEN` | `ChatRoom` | Room frozen — new messages disabled |
| `ROOM_TRUNCATED` | `ChatRoom` | All messages in the room cleared |
| `MEMBER_MODERATED` | `{ memberId: string; action: string }` | A member was banned, unbanned, or shadow-banned |
| `STATE_SYNCED` | `ChatRoom` | Internal state bulk-updated after `watch()`, `queryMessages()`, or `queryMembers()` |

`STATE_SYNCED` is a client-only event — it is not transmitted over the wire. The SDK emits it whenever the Room's internal state changes in bulk. It is most useful for initial render hydration. For live updates, subscribe to the individual events above.

---

## 6. Type reference

### `ChatUser`

```ts
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
```

### `ChatRoom`

```ts
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

  unreadCount?: number;           // injected by watch/queryRooms
  lastMessageAt?: string | Date | null;   // injected; use for sorting room list
  lastMessageId?: string | null;
}
```

### `ChatRoomMember`

```ts
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

  lastReadMessageId: string | null;  // use to set initial scroll position
  lastReadAt: string | Date | null;
}
```

There is no nested `user` object on `ChatRoomMember`. All profile data is flat on the member itself.

### `ChatMessage`

```ts
interface ChatMessage {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;

  content: string | null;           // null for attachment-only messages
  attachments: ChatAttachment[] | null;
  messageType: MessageType | string;

  replyToId: string | null;
  replyTo: ChatMessage | null;
  replies: ChatMessage[] | null;

  roomId: string;
  userId: string;                   // flat sender id — no nested user object

  metadata: Record<string, any> | null;
  editedAt: string | Date | null;
  isDeleted: boolean;
  deletedAt: string | Date | null;
  isPinned: boolean;

  reactions: ChatMessageReaction[] | null;
}
```

### `OptimisticMessage`

```ts
interface OptimisticMessage extends ChatMessage {
  status: 'sending' | 'sent' | 'failed';
}

type AnyMessage = ChatMessage | OptimisticMessage;
```

Narrow with `'status' in msg`:

```ts
if ('status' in msg) {
  // msg is OptimisticMessage
  if (msg.status === 'failed') showRetry();
}
```

### `ChatMessageReaction`

```ts
interface ChatMessageReaction {
  id: string;
  messageId: string;
  emoji: string;
  userId: string;   // flat — no nested user object
  roomId: string;
}
```

### `ChatAttachment`

```ts
interface ChatAttachment {
  type: 'image' | 'video' | 'file' | 'audio' | string;
  url: string;
  name: string;
  mime: string;
  size: number;
}
```

### `ChatUserPresentChange`

```ts
interface ChatUserPresentChange {
  userId: string;
  online: boolean;
  lastSeenAt?: Date;
  roomId?: string;
}
```

### `RoomFilter`

```ts
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
```

### Enums

```ts
enum RoomMemberRole  { member, owner, admin, moderator, custom }
enum ChatUserRole    { user, admin, moderator, custom, guest }
enum MessageType     { text, image, file, system, mixed }
enum RoomType        { messaging, support }
enum RoomSubType     { group, direct }
enum RoomVisibility  { private, public }
```

---

## 7. Optimistic messages and the broadcast contract

The SDK uses a two-phase pipeline to prevent duplicate messages while keeping the UI instant.

**Phase 1 — Optimistic insert**

`sendMessage` creates an `OptimisticMessage` with `status: 'sending'` and a `tempId`. It is pushed to internal state and `MESSAGE_NEW` is emitted. The UI renders it immediately.

**Phase 2 — ACK registration, no state mutation**

When the socket ACK arrives, the SDK registers `confirmedId → { tempId, insertedAt }` in `_pendingTempIds`. The ACK does not mutate state. The broadcast is the single source of truth.

**Phase 3 — Broadcast reconciliation**

The server broadcasts `MESSAGE_NEW` to all subscribers including the sender. `_handleEvent` checks `_pendingTempIds` for the confirmed id. If found, it replaces the optimistic entry in-place and emits `MESSAGE_UPDATED` — not `MESSAGE_NEW`, since the entry already exists visually. The `_pendingTempIds` entry is then deleted.

For messages arriving from other clients (no pending entry), the message is pushed into `_state.messages` and the array is sorted by `createdAt`. This guards against out-of-order delivery during reconnect replays or race conditions where a delayed broadcast arrives after a later message.

**TTL cleanup**

Each entry in `_pendingTempIds` stores `insertedAt`. `_cleanupPendingTempIds()` runs at the start of every `_handleEvent` call and evicts entries older than 60 seconds, preventing accumulation if a broadcast is lost due to a reconnect race or `stopWatch`.

**Failure path**

If the ACK returns an error: `optimisticMsg.status = 'failed'`, `MESSAGE_UPDATED` is emitted, no mapping is registered. No broadcast arrives. The entry stays in the list in a failed state. Show a retry affordance.

**Reactions**

Reactions deduplicate by `emoji + userId`, not by `id`, because temp reaction ids differ from server ids. Both the ACK handler and `_handleEvent MESSAGE_REACTION_NEW` use `emoji + userId` as the stable key.

---

## 8. Authentication and token refresh

**Reconnect room re-watch**

When the socket reconnects, the `connect` event fires and the SDK automatically re-watches all rooms where `room.initialized === true`. This is necessary because server-side room subscriptions are not preserved across socket disconnections. Each room's `watch()` is called concurrently via `Promise.allSettled` — a single room failing to re-watch does not prevent the others from recovering. Each re-watch emits `STATE_SYNCED` with the fresh server state, so the UI can re-hydrate without any extra code.

Rooms that were created via `hydrateRooms` or `room()` but never watched (`initialized === false`) are skipped — they were never subscribed on the server so there is nothing to restore.

**Proactive token refresh during reconnect**

On each `reconnect_attempt`, the SDK checks if the token expires within 60 seconds. If so, it calls `_refreshToken()`. A promise-level deduplication lock ensures concurrent `reconnect_attempt` bursts share one in-flight `tokenProvider()` call. All callers await the same promise.

**Reactive refresh on auth errors**

If `disconnect` fires with `reason === 'io server disconnect'`, or if `CONNECTION_ERROR` contains `'Authentication'` or `'Unauthorized'`, `_handleReconnectAuthError()` is called. It calls `_refreshToken()` (same dedup lock) then reconnects the socket.

**Static token**

Passing a raw string means no refresh is possible. When the token expires, `CONNECTION_ERROR` fires with no recovery path. Always pass a `TokenProvider` function in production.

---

## 9. Error handling

**`connectUser` failure**

If the HTTP handshake fails, `CONNECTION_ERROR` is emitted and `connectionState` is set to `'disconnected'`. The function returns without throwing:

```ts
client.on(SocketEvent.CONNECTION_ERROR, ({ message }) => {
  showConnectionError(message);
});
```

**`apiFetch` failure**

Throws `Error` with the server's message string when `result.success` is false or when the client is not connected:

```ts
try {
  await room.addMembers(['user_xyz']);
} catch (err) {
  console.error(err.message);
}
```

**Socket ACK failures**

All ACK-based methods (`watch`, `sendMessage`, `updateMessage`, `deleteMessage`, `sendReaction`, `deleteReaction`, `markRead`, `stopWatch`) reject their promises on failure and roll back any optimistic state first.

**Optimistic failures**

For `sendMessage`, the optimistic entry is marked `status: 'failed'` and `MESSAGE_UPDATED` is emitted before the promise rejects. Check for `'status' in msg && msg.status === 'failed'` in your `MESSAGE_UPDATED` handler.

---

## 10. Common patterns

### Connect, query rooms, and watch one

```ts
const client = ChatClient.getInstance(API_KEY, BASE_URL);

await client.connectUser(currentUser, () => getToken());

client.on(SocketEvent.CONNECT, async () => {
  // queryRooms auto-registers Room instances for all returned rooms
  const { rooms } = await client.queryRooms({ state: true, limit: 50 });

  // Now open a specific room — the instance already exists in activeRooms
  const room = client.room(rooms[0].roomId);

  room.on(SocketEvent.MESSAGE_NEW, (msg) => appendMessage(msg));
  room.on(SocketEvent.MESSAGE_UPDATED, (msg) => replaceMessage(msg));
  room.on(SocketEvent.MESSAGE_DELETED, (msg) => removeMessage(msg.id));

  const state = await room.watch();
  renderMessages(state.messages);
  renderMembers(state.members);
});
```

### Send a message with attachments

```ts
const attachments = await client.uploadFiles(selectedFiles, 'image');

await room.sendMessage({
  roomId: room.id,
  content: null,
  attachments,
  replyToId: null,
});
```

### Load older messages

```ts
const oldest = messages[0];

await room.queryMessages({ limit: 50, before: oldest.id });
// STATE_SYNCED fires with merged, sorted result
```

### Typing indicator

```ts
let typingTimer: ReturnType<typeof setTimeout>;

inputEl.addEventListener('input', () => {
  room.sendEvent(SocketEvent.TYPING_START);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    room.sendEvent(SocketEvent.TYPING_STOP);
  }, 2000);
});

room.on(SocketEvent.TYPING_START, ({ userId }) => showTyping(userId));
room.on(SocketEvent.TYPING_STOP, ({ userId }) => hideTyping(userId));
```

### Global unread badges

```ts
client.on(SocketEvent.NOTIFICATION_UNREAD, ({ roomId, unreadCount }) => {
  updateBadge(roomId, unreadCount);
});
```

### User presence

```ts
client.on(SocketEvent.USER_PRESENCE_CHANGED, ({ userId, online }) => {
  updatePresenceIndicator(userId, online);
});
```

### Room added or removed mid-session

```ts
// Both payloads are full ChatRoom objects
client.on(SocketEvent.ROOM_ADDED, (room) => prependRoomToList(room));
client.on(SocketEvent.ROOM_REMOVED, (room) => removeRoomFromList(room.roomId));
```

### Moderation response

```ts
room.on(SocketEvent.MEMBER_MODERATED, ({ memberId, action }) => {
  if (memberId === client.user?.userId && action === 'ban') {
    redirectHome();
  }
});
```

### Logout cleanup

```ts
// In a room view's unmount — stop receiving server events for this room
// but keep the Room instance alive in the registry for reconnection
await room.stopWatch();

// On user logout — disposes all rooms, clears all listeners, resets all state
client.disconnectUser();
```

`disconnectUser` calls `room.dispose()` on every registered room before clearing the registry, so any UI component still holding a Room reference will see `initialized = false` and `getState()` returning `null` immediately after the call.