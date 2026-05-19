# ChatFrontendClient Documentation

## Overview
The ChatFrontendClient is a TypeScript class that provides a client-side interface for real-time chat functionality using Socket.IO. Built on top of the EventEmitter3 library, it manages WebSocket connections, authentication, messaging, room operations, user status, and typing indicators. It is designed to integrate seamlessly with a sparkstrand chat server and can be used standalone or with the ChatContext/useSparkStrandChat hook for React/Next.js applications.

## Purpose
The ChatFrontendClient enables developers to:

- Establish and manage WebSocket connections to a sparkstrand chat server.
- Authenticate users via a guest login API.
- Send and receive messages in real-time.
- Manage chat rooms (join, switch, leave, create).
- Track user online status and typing indicators.
- Handle connection errors, reconnections, and message queuing.
- Support some limited REST API calls - for full REST API calls and advance access, use the ChatBackendClient on the server.

## Installation
Install the required dependency in your project:
```bash
npm install @sparkstrand/chat-api-client
```

## Configuration
Configure the server URL and API key, typically via environment variables:
```
NEXT_PUBLIC_CHAT_SERVER_URL=http://sparkstrand-chat-server-url
NEXT_PUBLIC_CHAT_API_KEY=your-api-key
NEXT_PUBLIC_CHAT_API_SECRET=your-api-secret
```
or
```
REACT_APP_CHAT_SERVER_URL=http://sparkstrand-chat-server-url
REACT_APP_CHAT_API_KEY=your-api-key
REACT_APP_CHAT_API_SECRET=your-api-secret
```
or
```
VITE_CHAT_SERVER_URL=http://sparkstrand-chat-server-url
VITE_CHAT_API_KEY=your-api-key
VITE_CHAT_API_SECRET=your-api-secret
```

## Class Structure
The ChatFrontendClient extends EventEmitter and provides methods for interacting with the sparkstrand chat server, emitting events for real-time updates, and managing internal state (e.g., message queue, typing timeouts).

## Dependencies

- **socket.io-client**: For WebSocket communication.
- **eventemitter3**: For event handling.
- **TypeScript types defined in types/index.ts**.

## Types
check [types](TYPE.md) for more details

## Initialization
Create an instance of ChatFrontendClient with a SocketClientOptions object:
```typescript
import { ChatFrontendClient } from '@sparkstrand/chat-api-client/lib/frontend';

const options: SocketClientOptions = {
  url: process.env.NEXT_PUBLIC_CHAT_SERVER_URL,
  apiKey: process.env.NEXT_PUBLIC_CHAT_API_KEY,
  id: `guest-${Math.random().toString(36).substr(2, 9)}`, // you can use the userId from your platform or the assigned userId from the sparkstrand-chat-server.
  autoConnect: false,
  debug: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 30000,
  timeout: 30000,
};

const client = new ChatFrontendClient(options);
```

## Configuration Options

The SocketClientOptions interface defines the configuration options for the ChatFrontendClient:

 - url: Required. The sparkstrand chat server URL 
 - namespace: Optional. Socket.IO namespace default is the `General` namespace (other namespaces are still in development).
 - path: Optional. Socket.IO path (e.g., `/` by default).
 - apiKey: Optional. API key for authentication.
 - id: Required. Unique guest ID for the user.
 - autoConnect: Optional. Whether to connect automatically on initialization (default: false).
 - reconnection: Optional. Enable reconnection attempts (default: true).
 - reconnectionAttempts: Optional. Number of reconnection attempts (default: 10).
 - reconnectionDelay: Optional. Initial delay between reconnection attempts in ms (default: 2000).
 - reconnectionDelayMax: Optional. Maximum delay between reconnection attempts in ms (default: 30000).
 - timeout: Optional. Connection timeout in ms (default: 30000).
 - debug: Optional. Enable debug logging (default: false).

## Methods

### login(id: string): Promise<void>
Authenticates the user with the provided ID by calling the server's /api/v1/guests/login endpoint. Stores a cookie token in localStorage with name sparkstrand_token and a TTL of approximately one week(7 days). Disconnects and reconnects the socket after successful login.

**Parameters**:

- **id**: The guest ID for authentication. It can be the userId(term externalId) from your platform or the assigned userId from the sparkstrand-chat-server.

**Example**:
```typescript
await client.login('guest-123').catch((err) => console.error('Login failed:', err));
```

### reconnect(): Promise<void>
Attempts to reconnect to the server using the existing cookie token. If the token is invalid or expired, it re-authenticates using the guest ID.

**Example**:
```typescript
client.reconnect().catch((err) => console.error('Reconnection failed:', err));
```

### disconnect(): void
Disconnects the socket, clears typing timeouts, and sets the connection state to false.

**Example**:
```typescript
client.disconnect();
```

### isConnected(): boolean
Returns whether the socket is currently connected.

**Example**:
```typescript
console.log('Connected:', client.isConnected());
```

### joinRoom(roomId: string): void
Joins a chat room by emitting the join_room event.

- **roomId**: The ID of the room to join.

**Example**:
```typescript
client.joinRoom('room1');
```

### switchRoom(roomId: string): void
Switches the active room by emitting the switch_room event.

- **roomId**: The ID of the room to switch to.

**Example**:
```typescript
client.switchRoom('room2');
```

### leaveRoom(roomId: string): void
Leaves a chat room by emitting the leave_room event.

- **roomId**: The ID of the room to leave.

**Example**:
```typescript
client.leaveRoom('room1');
```

### createRoom(data: { name: string; type: RoomType; membersId: string[]; applicationId?: string }): void
Creates a new room by emitting the create_room event.

**Parameters**:
- **name**: The name of the room.
- **type**: The type of room (Direct or Group).
- **membersId**: Array of user IDs to add to the room.
- **applicationId**: Optional application ID.

**Example**:
```typescript
client.createRoom({
  name: 'New Room',
  type: RoomType.Group,
  membersId: ['guest-123', 'guest-456'],
});
```

### sendMessage(message: IMessage): void
Sends a message to the server by emitting the send_message event. Queues the message if not connected.

**Parameters**:
- **message**: An IMessage object with id, content, roomId, senderId, timestamp, and optional read.

**Example**:
```typescript
const message: IMessage = {
  id: Math.random().toString(36).substr(2, 9),
  content: 'Hello, world!',
  roomId: 'room1',
  senderId: 'guest-123',
  timestamp: new Date().toISOString(),
};
client.sendMessage(message);
```

### markMessageRead(messageId: string): void
Marks a message as read by emitting the mark_message_read event.

**Parameters**:
- **messageId**: The ID of the message to mark as read.

**Example**:
```typescript
client.markMessageRead('msg-123');
```

### setUserStatus(status: UserStatus): void
Sets the user's status by emitting the set_user_status event.

**Parameters**:
- **status**: A UserStatus value (Online, Offline, Away, Busy).

**Example**:
```typescript
client.setUserStatus(UserStatus.Away);
```

### sendTypingIndicator(roomId: string): void
Sends a typing indicator for a room by emitting the typing event. Automatically stops after 3 seconds.

**Parameters**:
- **roomId**: The ID of the room.

**Example**:
```typescript
client.sendTypingIndicator('room1');
```

### sendStopTypingIndicator(roomId: string): void
Stops the typing indicator for a room by emitting the stop_typing event.

**Parameters**:
- **roomId**: The ID of the room.

**Example**:
```typescript
client.sendStopTypingIndicator('room1');
```

### setUrl(url: string): void
Updates the server URL.

**Parameters**:
- **url**: The new server URL.

**Example**:
```typescript
client.setUrl('http://new-sparkstrand-chat-server:3000');
```

### getUserId(): string | null
Returns the current user's guest ID.

**Example**:
```typescript
console.log('User ID:', client.getUserId());
```

### getUrl(): string
Returns the current server URL.

**Example**:
```typescript
console.log('Server URL:', client.getUrl());
```

### getEventHistory(): Array<{ event: string; data: any; timestamp: Date }>
Returns the debug event history if debug is enabled.

**Example**:
```typescript
console.log('Event History:', client.getEventHistory());
```

## Events
The ChatFrontendClient emits events for various socket and chat activities. Use the on method to listen for these events:

```typescript
client.on(SocketEvent.NEW_MESSAGE, (message: IMessage) => {
  console.log('New message:', message);
});
```

### Connection Events

- **connect**: Emitted when the socket connects.
  - Data: None.

- **disconnect**: Emitted when the socket disconnects.
  - Data: Reason (e.g., io server disconnect, transport close).

- **connect_error**: Emitted on connection errors.
  - Data: Error object.

- **reconnect_attempt**: Emitted on each reconnection attempt.
  - Data: Attempt number.

- **reconnect**: Emitted on successful reconnection.
  - Data: Number of attempts.

- **reconnect_error**: Emitted on reconnection errors.
  - Data: Error object.

- **reconnect_failed**: Emitted when reconnection attempts are exhausted.
  - Data: None.



### Authentication Events

- **authenticated**: Emitted on successful authentication.
  - Data: Authentication data.

- **auth_error**: Emitted on authentication failure.
  - Data: Error object with message, success, statusCode.



### Room Events

- **room_joined**: Emitted when a room is joined.
  - Data: Room data.

- **list_of_guest_rooms**: Emitted with the list of available rooms.
  - Data: Array of room data.

- **room_left**: Emitted when a room is left.
  - Data: Room data.

- **room_created**: Emitted when a room is created.
  - Data: Room data.



### Message Events

- **new_message**: Emitted when a new message is received.
  - Data: IMessage object.

- **message_read**: Emitted when a message is marked as read.
  - Data: Message ID.



### User Events

- **user_joined**: Emitted when a user joins a room.
  - Data: User data.

- **user_online**: Emitted when a user comes online.
  - Data: User ID.

- **user_left**: Emitted when a user goes offline.
  - Data: User ID.

- **user_status_changed**: Emitted when a user's status changes.
  - Data: { userId: string; status: UserStatus }.



### Typing Events

- **user_typing**: Emitted when a user starts typing.
  - Data: { roomId: string; userId: string }.

- **user_stopped_typing**: Emitted when a user stops typing.
  - Data: { roomId: string; userId: string }.



### Error Event

- **error**: Emitted for general errors.
  - Data: Error object.



## Example Usage

### Standalone Usage
```typescript
import { ChatFrontendClient } from '@/lib/ChatFrontendClient';
import { SocketEvent, IMessage, RoomType } from '@/types';

const client = new ChatFrontendClient({
  url: process.env.NEXT_PUBLIC_CHAT_SERVER_URL,
  apiKey: process.env.NEXT_PUBLIC_SPARKSTRAND_CHAT_API_KEY,
  id: 'guest-123',
  debug: true,
});

// Handle connection
client.on(SocketEvent.CONNECT, () => {
  console.log('Connected to server');
  client.joinRoom('room1');
});

// Handle new messages
client.on(SocketEvent.NEW_MESSAGE, (message: IMessage) => {
  console.log('New message:', message.content);
});

// Handle errors
client.on(SocketEvent.CONNECT_ERROR, (err) => {
  console.error('Connection error:', err.message);
});

// Authenticate and connect
async function startChat() {
  try {
    await client.login('guest-123');
    // Send a message
    const message: IMessage = {
      id: Math.random().toString(36).substr(2, 9),
      content: 'Hello, world!',
      roomId: 'room1',
      senderId: 'guest-123',
      timestamp: new Date().toISOString(),
    };
    client.sendMessage(message);
  } catch (err) {
    console.error('Failed to start chat:', err);
  }
}

startChat();
```

### With React Context
The ChatFrontendClient is typically used under the hood when using the ChatContext for React/Next.js applications:

```tsx
// components/ChatComponent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useChat, useChatMessage, useChatRoom } from '@/sparkstrand/chat-api-client/lib/context';
import { IMessage } from '@/types';

export default function ChatComponent() {
  const { isConnected, login, userId } = useChat();
  const { messages, sendMessage } = useChatMessage();
  const { joinRoom } = useChatRoom();
  const [input, setInput] = useState('');

  useEffect(() => {
    if (userId) {
      login(userId).then(() => joinRoom('room1')).catch(console.error);
    }
  }, [userId, login, joinRoom]);

  const handleSend = () => {
    if (input.trim() && userId) {
      const message: IMessage = {
        id: Math.random().toString(36).substr(2, 9),
        content: input,
        roomId: 'room1',
        senderId: userId,
        timestamp: new Date().toISOString(),
      };
      sendMessage(message);
      setInput('');
    }
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <div>
        {messages.map((msg) => (
          <p key={msg.id}>{msg.content}</p>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## Error Handling

- **Connection Errors**: Listen for connect_error, reconnect_error, and reconnect_failed events.
- **Authentication Errors**: Handle auth_error events.
- **General Errors**: Monitor the error event.
- **Message Queuing**: Messages are queued if the socket is disconnected and sent when reconnected.

**Example**:
```typescript
client.on(SocketEvent.CONNECT_ERROR, (err) => {
  console.error('Connection error:', err.message);
});
client.on(SocketEvent.AUTH_ERROR, (err) => {
  console.error('Authentication error:', err.message);
});
```

## Best Practices

### Initialization:

- Set autoConnect: false to control connection timing manually.
- Provide a unique id for each user to avoid session conflicts.

### Authentication:

- Call login() before performing socket operations.
- Handle login failures by retrying or prompting the user to re-authenticate.

### Connection Management:

- Use reconnect() to handle temporary disconnections.
- Check isConnected() before sending messages or performing actions.

### Event Handling:

- Remove event listeners when no longer needed using off.
- Use specific event handlers to avoid unnecessary processing.

### Debugging:

- Enable debug: true during development to log events.
- Use getEventHistory() to inspect past events.

### Cleanup:

- Call disconnect() when the client is no longer needed (e.g., on component unmount in React).



## Limitations

- **Scalability**: Typing indicators may need debouncing for high-traffic rooms.

## Notes

- The client assumes the server supports WebSocket and polling transports.
- Cookie tokens are stored in localStoraga with a TTL; ensure secure handling in production.
- For React applications, prefer using the ChatContext to manage the client instance and state.

_This documentation provides a thorough guide for integrating and using the ChatFrontendClient in both standalone and React-based applications, with clear examples and best practices._

*For any issues contact Bello or Bolu on Slack*
