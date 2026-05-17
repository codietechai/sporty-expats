# useSparkStrandChat Hook Documentation

## Overview
The useSparkStrandChat hook is a custom React hook that integrates the ChatFrontendClient SDK into a React application. It manages the chat client's lifecycle, including initialization, authentication, connection handling, and state updates for real-time chat functionality. The hook provides a singleton instance of the ChatFrontendClient and a comprehensive state object to track connection status, user data, rooms, messages, typing users, and errors.


## Purpose
The useSparkStrandChat hook enables developers to:

- Initialize and manage a singleton ChatFrontendClient instance.
- Handle user authentication and session management.
- Track real-time chat state (connection, rooms, messages, typing users).
- Respond to socket events (e.g., new messages, user status changes).
- Provide a centralized state for building chat UI components.
- Ensure proper cleanup of socket connections and event listeners.

## Installation
Install the required dependency @sparkstrand/chat-api-client in your project:
```bash
npm install @sparkstrand/chat-api-client
```

Configure environment variables for the chat server URL and API key in .env.local:
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

Alternatively, pass the API key directly to the hook.

## Hook Interface
The hook returns an object with two properties:

- **socket**: The singleton ChatFrontendClient instance.
- **state**: A SocketState object containing the current chat state.

## SocketState Interface
```typescript
export interface SocketState {
  isConnected: boolean;
  user: IUser | null;
  rooms: IRoom[];
  messages: IMessage[];
  typingUsers: { [roomId: string]: string[] };
  error: ErrorData | null;
  eventHistory: Array<{ event: string; data: any; timestamp: Date }>;
  currentRoomId: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
  lastDisconnectReason: string | null;
}
```
## Types
check [types](TYPE.md) for more details


## Usage

### Hook Parameters
```typescript
useSparkStrandChat(
  url: string,
  id: string,
  apiKey?: string,
  options?: { debug: boolean; autoConnect: boolean }
)
```

- **url**: Required. The chat server URL.
- **id**: Required. The unique guest ID for the user.
- **apiKey**: Optional. The API key for authentication. Defaults to environment variables (NEXT_PUBLIC_SPARKSTRAND_CHAT_API_KEY, REACT_APP_STARKSTRAND_CHAT_API_KEY, or VITE_SPARKSTRAND_CHAT_API_KEY).
- **options**: Optional. Configuration options:
  - **debug**: Enable debug logging (default: false).
  - **autoConnect**: Automatically connect the socket (default: false).

### Return Value
```typescript
{
  socket: ChatFrontendClient;
  state: SocketState;
}
```

- **socket**: The ChatFrontendClient instance for direct interaction (e.g., sending messages, joining rooms).
- **state**: The current chat state, including connection status, user data, rooms, messages, and more.

## Example Usage
Below is a complete example of using the useSparkStrandChat hook in a React component to build a simple chat interface:

```tsx
// components/ChatComponent.tsx
'use client';

import { useState } from 'react';
import { useSparkStrandChat } from '@/hooks/useSparkStrandChat';
import { IMessage, RoomType } from '@/types';

export default function ChatComponent() {
  const { socket, state } = useSparkStrandChat(
    process.env.NEXT_PUBLIC_CHAT_SERVER_URL,
    `guest-${Math.random().toString(36).substr(2, 9)}`,
    process.env.NEXT_PUBLIC_SPARKSTRAND_CHAT_API_KEY,
    { debug: true, autoConnect: false }
  );
  const [messageInput, setMessageInput] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedRoomId && state.user?.id) {
      const message: IMessage = {
        id: Math.random().toString(36).substr(2, 9),
        content: messageInput,
        roomId: selectedRoomId,
        senderId: state.user.id,
        timestamp: new Date().toISOString(),
      };
      socket.sendMessage(message);
      setMessageInput('');
    }
  };

  const handleCreateRoom = () => {
    if (state.user?.id) {
      const roomId = Math.random().toString(36).substr(2, 9);
      socket.createRoom({
        name: `Room ${state.rooms.length + 1}`,
        type: RoomType.Group,
        membersId: [state.user.id],
      });
      setSelectedRoomId(roomId);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r p-4">
        <h2 className="text-lg font-semibold mb-4">Rooms</h2>
        <button
          onClick={handleCreateRoom}
          className="w-full bg-blue-500 text-white py-2 rounded mb-4"
          disabled={!state.isConnected}
        >
          Create Room
        </button>
        <ul>
          {state.rooms.map((room) => (
            <li
              key={room.id}
              onClick={() => {
                setSelectedRoomId(room.id);
                socket.joinRoom(room.id);
              }}
              className={`p-2 cursor-pointer rounded ${
                selectedRoomId === room.id ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              {room.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="w-3/4 flex flex-col">
        <div className="bg-white p-4 border-b">
          <h2 className="text-lg font-semibold">
            {selectedRoomId
              ? state.rooms.find((r) => r.id === selectedRoomId)?.name
              : 'Select a room'}
          </h2>
          <p className="text-sm text-gray-500">
            Status: {state.connectionStatus}
            {state.error && ` | Error: ${state.error.message}`}
          </p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {state.messages
            .filter((msg) => msg.roomId === selectedRoomId)
            .map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${
                  msg.senderId === state.user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    msg.senderId === state.user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          {selectedRoomId && state.typingUsers[selectedRoomId]?.length > 0 && (
            <div className="text-sm text-gray-500 italic">
              {state.typingUsers[selectedRoomId].join(', ')}{' '}
              {state.typingUsers[selectedRoomId].length > 1 ? 'are' : 'is'} typing...
            </div>
          )}
        </div>
        <div className="bg-white p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                if (e.target.value && selectedRoomId) {
                  socket.sendTypingIndicator(selectedRoomId);
                } else if (selectedRoomId) {
                  socket.sendStopTypingIndicator(selectedRoomId);
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded"
              disabled={!selectedRoomId || !state.isConnected}
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
              disabled={!messageInput.trim() || !selectedRoomId || !state.isConnected}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## State Management
The SocketState object tracks the following properties:

- **isConnected**: Whether the socket is connected (true/false).
- **user**: The authenticated user object (IUser) or null.
- **rooms**: Array of available rooms (IRoom[]).
- **messages**: Array of received messages (IMessage[]).
- **typingUsers**: Object mapping room IDs to arrays of usernames currently typing.
- **error**: Error data (ErrorData) or null.
- **eventHistory**: Array of debug events if debug is enabled.
- **currentRoomId**: ID of the currently active room or null.
- **connectionStatus**: Current connection state (connected, disconnected, connecting, reconnecting).
- **lastDisconnectReason**: Reason for the last disconnection or null.

## State Updates
The hook listens to ChatFrontendClient events and updates the state accordingly:

- **Connection Events**: Updates isConnected, connectionStatus, error, and lastDisconnectReason.
- **Authentication Events**: Sets user and rooms on successful authentication.
- **Room Events**: Manages rooms and currentRoomId for joining, switching, leaving, or creating rooms.
- **Message Events**: Appends new messages and updates read status.
- **User Events**: Updates user.status for the current user.
- **Typing Events**: Manages typingUsers for each room.
- **Error Events**: Sets error for connection, authentication, or general errors.

## Event Handlers
The hook sets up event listeners for the following SocketEvent values:

- **connect**: Sets isConnected to true and connectionStatus to connected.
- **disconnect**: Updates isConnected, connectionStatus, lastDisconnectReason, and error.
- **reconnect_attempt**: Sets connectionStatus to reconnecting.
- **reconnect**: Sets connectionStatus to connected and clears error.
- **reconnect_error**: Sets connectionStatus to disconnected and updates error.
- **reconnect_failed**: Sets connectionStatus to disconnected and sets a failure error.
- **authenticated**: Updates user and rooms.
- **auth_error**: Sets error.
- **list_of_guest_rooms**: Updates rooms.
- **room_switched**: Updates currentRoomId and user.currentRoomId.
- **room_joined**: Adds or updates a room and sets currentRoomId.
- **room_left**: Removes a room and clears currentRoomId.
- **room_created**: Adds a new room.
- **new_message**: Appends a new message.
- **message_read**: Marks a message as read.
- **user_status_changed**: Updates user.status for the current user.
- **user_online**: Updates user.status for the current user.
- **user_typing**: Adds a username to typingUsers for a room.
- **user_stopped_typing**: Removes a username from typingUsers for a room.
- **error**: Sets error.
- **eventHistory**: Updates eventHistory for debug logging.

## Best Practices

### Singleton Management:

- The hook maintains a singleton ChatFrontendClient instance, recreated only if url or id changes.
- Avoid creating multiple instances in different components to prevent connection conflicts.

### Authentication:

- Ensure a valid id is provided before calling the hook.
- Handle authentication errors using state.error.

### Connection Handling:

- Check state.isConnected or state.connectionStatus before performing socket operations.
- Use socket.reconnect() to manually retry connections if needed.

### State Usage:

- Filter state.messages by state.currentRoomId to display room-specific messages.
- Use state.typingUsers to show typing indicators only for the active room.

### Cleanup:

- The hook automatically disconnects the socket and removes event listeners on unmount.
- Ensure components using the hook are unmounted cleanly to avoid memory leaks.

### Error Handling:

- Display state.error in the UI to inform users of issues.
- Implement retry logic for recoverable errors (e.g., reconnection failures).

### Debugging:

- Enable options.debug during development to log events and inspect state.eventHistory.



## Limitations

- **Typing Users**: Tracks usernames instead of user IDs, which may lead to conflicts if usernames are not unique.
- **Scalability**: Typing indicators may need debouncing in high-traffic rooms.

## Example Integration with Next.js

```tsx
// app/page.tsx
'use client';

import ChatComponent from '@/components/ChatComponent';

export default function Home() {
  return <ChatComponent />;
}

// components/ChatComponent.tsx
'use client';

import { useSparkStrandChat } from '@sparkstrand/chat-api-client/lib/hooks';

export default function ChatComponent() {
  const { socket, state } = useSparkStrandChat(
    process.env.NEXT_PUBLIC_CHAT_SERVER_URL,
    `guest-${Math.random().toString(36).substr(2, 9)}`,
    process.env.NEXT_PUBLIC_SPARKSTRAND_CHAT_API_KEY,
    { debug: true, autoConnect: false }
  );

  return (
    <div>
      <h1>Chat App</h1>
      <p>Status: {state.connectionStatus}</p>
      <p>User: {state.user?.username || 'Not logged in'}</p>
      <h2>Rooms</h2>
      <ul>
        {state.rooms.map((room) => (
          <li key={room.id} onClick={() => socket.joinRoom(room.id)}>
            {room.name}
          </li>
        ))}
      </ul>
      <h2>Messages</h2>
      <div>
        {state.messages
          .filter((msg) => msg.roomId === state.currentRoomId)
          .map((msg) => (
            <p key={msg.id}>{msg.content}</p>
          ))}
      </div>
    </div>
  );
}
```

## Comparison with @sparkstrand/chat-api-client/lib/context
The *@sparkstrand/chat-api-client/lib/hooks/useSparkStrandChat* hook serves a similar purpose to the ChatContext but with key differences:

- **Singleton vs. Context**: useSparkStrandChat uses a singleton ChatFrontendClient instance, while ChatContext creates a new instance per ChatProvider.
- **State Management**: useSparkStrandChat consolidates all state in a single SocketState object, while ChatContext splits state across multiple contexts (ChatContext, MessageContext, etc.).
- **API Exposure**: useSparkStrandChat directly exposes the ChatFrontendClient instance, while ChatContext abstracts it behind hooks (useChat, useChatMessage, etc.).
- **Granularity**: ChatContext provides modular hooks for specific features, while useSparkStrandChat requires manual state filtering (e.g., for room-specific messages).

Use useSparkStrandChat for simpler integrations or when direct access to the ChatFrontendClient is needed. Use ChatContext for larger applications requiring modular, context-based state management.

## Notes

- Ensure the server supports the emitted SocketEvent types and data parameters.

This documentation provides a clear guide for using the useSparkStrandChat hook, with practical examples and best practices for integrating real-time chat functionality into a React or Next.js application.

*For any issues contact Bello or Bolu on Slack*

