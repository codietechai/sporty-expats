# ChatContext Documentation

## Table of Contents
- [Overview](#overview)
- [Purpose](#purpose)
- [Installation](#installation)
- [Context Structure](#context-structure)
- [Setup](#setup)
- [Hooks](#hooks)
  - [useChat](#1-usechat)
  - [useChatMessage](#2-usechatmessage)
  - [useChatRoom](#3-usechatroom)
  - [useUserOnline](#4-useruseronline)
  - [useUserTyping](#5-useusertyping)
  - [useFileUpload](#6-usefileupload)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Socket Events](#socket-events)
- [Types](#types)
- [Limitations](#limitations)
- [Example Full Application](#example-full-application)

## Overview
The ChatContext is a React Context API implementation designed to manage real-time chat functionality using the ChatFrontendClient SDK. It provides a centralized interface for handling WebSocket connections, user authentication, messaging, room management, user status, and typing indicators in a chat application. The context is structured with a parent ChatContext and child contexts for modularity, accessible via custom hooks.

## Purpose
The ChatContext enables developers to:

- Establish and manage WebSocket connections to the Sparkstrand chat server.
- Authenticate users and manage sessions.
- Send and receive messages in real-time.
- Manage chat rooms (join, switch, leave, create, etc.).
- Track online users and their statuses.
- Display typing indicators.
- Ensure type-safe interactions with the chat server via TypeScript interfaces.

## Installation
Install the required dependency:
```bash
npm install @sparkstrand/chat-api-client
```

Configure environment variables for the server URL and API key:

**For Next.js**
```
NEXT_PUBLIC_CHAT_SERVER_URL=http://sparkstrand-chat-server-url
NEXT_PUBLIC_CHAT_API_KEY=your-api-key
NEXT_CHAT_API_SECRET=your-api-secret
```

**For Create React App**
```
REACT_APP_CHAT_SERVER_URL=http://sparkstrand-chat-server-url
REACT_APP_CHAT_API_KEY=your-api-key
REACT_APP_CHAT_API_SECRET=your-api-secret
```

**For Vite**
```
VITE_CHAT_SERVER_URL=http://sparkstrand-chat-server-url
VITE_CHAT_API_KEY=your-api-key
VITE_CHAT_API_SECRET=your-api-secret
```

## Context Structure
The ChatContext consists of one parent context and four child contexts, each with a dedicated hook:

### Parent Context
- **ChatContext** (via `useChat`): Manages the ChatFrontendClient instance, connection state, authentication, and errors.

### Child Contexts
- **MessageContext** (via `useChatMessage`): Handles message sending, editing, deletion, and reading.
- **RoomContext** (via `useChatRoom`): Manages room actions and data.
- **UserStatusContext** (via `useUserOnline`): Tracks user online status.
- **TypingContext** (via `useUserTyping`): Manages typing indicators.
- **FileUploadContext** (via `useFileUpload`): Manages file upload functionality and state.

## Setup
Wrap your application or component tree with ChatProvider to provide context:

```tsx
// app/layout.tsx
import { ChatProvider } from '@sparkstrand/chat-api-client/lib/context';
import { SocketClientOptions } from '@sparkstrand/chat-api-client/lib/types';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const chatOptions: SocketClientOptions = {
    url: process.env.NEXT_PUBLIC_CHAT_SERVER_URL!,
    apiKey: process.env.NEXT_PUBLIC_CHAT_API_KEY!,
    id: `guest-${Math.random().toString(36).substr(2, 9)}`,
    autoConnect: false,
    debug: process.env.NODE_ENV !== 'production',
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30000,
    timeout: 30000,
  };

  return (
    <html lang="en">
      <body>
        <ChatProvider options={chatOptions}>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
```

### SocketClientOptions:

- **url**: Chat server URL (required).
- **apiKey**: API key for authentication (required).
- **id**: Unique guest ID (optional, can be platform or server-assigned).
- **autoConnect**: Connect automatically (default: false).
- **debug**: Enable debug logging (default: false).
- **reconnection**: Enable reconnection (default: true).
- **reconnectionAttempts**: Max reconnection attempts (default: 10).
- **reconnectionDelay**: Initial reconnection delay (default: 2000 ms).
- **reconnectionDelayMax**: Max reconnection delay (default: 30000 ms).
- **timeout**: Connection timeout (default: 30000 ms).

## Hooks

### 1. useChat

**Purpose**: Manages the chat client, connection state, and authentication.

**Interface**:
```typescript
interface ChatContextType {
  client: ChatFrontendClient | null;
  isConnected: boolean;
  login: (id: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  error: Error | null;
  userId: string | null;
}
```

**Properties and Methods**:

- **client**: ChatFrontendClient instance or null.
- **isConnected**: Indicates socket connection status.
- **login(id: string)**: Authenticates and connects the socket.
- **disconnect()**: Disconnects the socket and clears typing timeouts.
- **reconnect()**: Reconnects using the existing session.
- **error**: Connection or authentication error, or null.
- **userId**: Current user's ID, or null.

**Example**:
```tsx
'use client';

import { useEffect } from 'react';
import { useChat } from '@sparkstrand/chat-api-client/lib/context';

export default function ChatStatus() {
  const { isConnected, login, userId, error } = useChat();

  useEffect(() => {
    if (userId && !isConnected) {
      login(userId).catch((err) => console.error('Login failed:', err));
    }
  }, [userId, login, isConnected]);

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {error && <p className="text-red-500">Error: {error.message}</p>}
      <button
        onClick={() => login(userId || `guest-${Math.random().toString(36).substr(2, 9)}`)}
        disabled={isConnected}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        Login
      </button>
    </div>
  );
}
```

**Notes**:

- Check isConnected before socket operations.
- Handle error for user feedback.
- Call login on mount or when userId changes.

### 2. useChatMessage

**Purpose**: Manages message operations.

**Interface**:
```typescript
interface MessageContextType {
  sendMessage: (message: ISendMessage) => void;
  markMessageRead: (messageId: string) => void;
  editMessage: (message: IEditMessage) => void;
  deleteMessage: (message: IDeleteMessage) => void;
  messages: IMessage[];
}
```

**ISendMessage**:
```typescript
interface ISendMessage {
  text?: string;
  isPinned?: boolean;
  senderId?: string;
  isAnswered?: boolean;
  isEncrypted?: boolean;
  parentId?: string;
  to: string;
  files?: File[];
}
```

**Example**:
```tsx
'use client';

import { useState } from 'react';
import { useChat, useChatMessage } from '@sparkstrand/chat-api-client/lib/context';

export default function ChatBox({ roomId }: { roomId: string }) {
  const { userId } = useChat();
  const { messages, sendMessage } = useChatMessage();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && userId) {
      sendMessage({
        to: roomId,
        text: input,
        senderId: userId,
      });
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4">
        {messages
          .filter((msg) => msg.to === roomId)
          .map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 ${msg.senderId === userId ? 'text-right' : 'text-left'}`}
            >
              <span
                className={`inline-block p-2 rounded ${msg.senderId === userId ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                {msg.text}
              </span>
            </div>
          ))}
      </div>
      <div className="p-4 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
}
```

**Notes**:

- Filter messages by to (room ID) for room-specific display.
- Ensure userId is set before sending messages.
- Messages update automatically via SocketEvent.NEW_MESSAGE.

### 3. useChatRoom

**Purpose**: Manages room operations and data.

**Interface**:
```typescript
interface RoomContextType {
  joinRoom: (roomId: string) => void;
  switchRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  createRoom: (data: ICreateRoom) => void;
  emitGetListOfGuestRooms: () => void;
  rooms: IRoom[];
  setRooms: React.Dispatch<React.SetStateAction<IRoom[]>>;
  currentRoomData: IRoom | null;
  currentRoomMedia: IRoomMedia[];
  currentRoomMessages: IMessage[];
  getRoomDataById: (roomId: string) => void;
  getRoomMedia: (roomId: string) => void;
  getRoomMessages: (roomId: string, limit: number, cursor?: string) => void;
}
```

**ICreateRoom**:
```typescript
interface ICreateRoom {
  name: string;
  description?: string;
  avatar?: { filename: string; fileUrl: string };
  memberIds?: string[];
  applicationId?: string;
  type?: RoomType;
  setting?: Record<string, any>;
  creatorId?: string;
  metaData?: Record<string, any>;
  expiresAt?: Date;
}
```

**Example**:
```tsx
'use client';

import { useChat, useChatRoom } from '@sparkstrand/chat-api-client/lib/context';
import { RoomType } from '@sparkstrand/chat-api-client/lib/types';

export default function RoomSelector() {
  const { userId } = useChat();
  const { rooms, createRoom, switchRoom } = useChatRoom();

  const handleCreateRoom = () => {
    if (userId) {
      createRoom({
        name: `Room ${rooms.length + 1}`,
        type: RoomType.GROUP,
        memberIds: [], // Replace with valid server-assigned guest IDs
      });
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleCreateRoom}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Create Room
      </button>
      <ul>
        {rooms.map((room) => (
          <li
            key={room.id}
            onClick={() => switchRoom(room.id)}
            className="p-2 cursor-pointer hover:bg-gray-100 rounded"
          >
            {room.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Notes**:

- switchRoom triggers getRoomDataById and getRoomMedia to populate currentRoomData and currentRoomMessages.
- createRoom requires valid memberIds (guest IDs from the server).
- Use currentRoomMessages for room-specific messages to avoid filtering.

### 4. useUserOnline

**Purpose**: Tracks online users and statuses.

**Interface**:
```typescript
interface UserStatusContextType {
  setUserStatus: (status: UserStatus) => void;
  onlineUsers: string[];
  userStatuses: Record<string, UserStatus>;
}
```

**UserStatus**:
```typescript
enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  OFFLINE = 'offline',
}
```

**Example**:
```tsx
'use client';

import { useUserOnline } from '@sparkstrand/chat-api-client/lib/context';
import { UserStatus } from '@sparkstrand/chat-api-client/lib/types';

export default function OnlineUsers() {
  const { onlineUsers, userStatuses, setUserStatus } = useUserOnline();

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2">Online Users</h3>
      <select
        onChange={(e) => setUserStatus(e.target.value as UserStatus)}
        className="mb-4 p-2 border rounded"
      >
        <option value={UserStatus.ONLINE}>Online</option>
        <option value={UserStatus.AWAY}>Away</option>
        <option value={UserStatus.OFFLINE}>Offline</option>
      </select>
      <ul>
        {onlineUsers.map((userId) => (
          <li key={userId} className="p-1">
            User {userId} - {userStatuses[userId] || 'Online'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Notes**:

- onlineUsers updates via SocketEvent.USER_ONLINE and SocketEvent.USER_LEFT.
- setUserStatus broadcasts status changes.
- userStatuses maps user IDs to their status.

### 5. useUserTyping

**Purpose**: Manages typing indicators.

**Interface**:
```typescript
interface TypingContextType {
  sendTypingIndicator: (roomId: string) => void;
  sendStopTypingIndicator: (roomId: string) => void;
  typingUsers: Record<string, string[]>;
}
```

**Example**:
```tsx
'use client';

import { useState } from 'react';
import { useChat, useChatMessage, useUserTyping } from '@sparkstrand/chat-api-client/lib/context';

export default function ChatInput({ roomId }: { roomId: string }) {
  const { userId } = useChat();
  const { sendMessage } = useChatMessage();
  const { sendTypingIndicator, sendStopTypingIndicator, typingUsers } = useUserTyping();
  const [input, setInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value && userId) {
      sendTypingIndicator(roomId);
    } else {
      sendStopTypingIndicator(roomId);
    }
  };

  const handleSend = () => {
    if (input.trim() && userId) {
      sendMessage({
        to: roomId,
        text: input,
        senderId: userId,
      });
      setInput('');
      sendStopTypingIndicator(roomId);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2 text-sm text-gray-500">
        {typingUsers[roomId]?.length > 0 &&
          `${typingUsers[roomId].join(', ')} ${typingUsers[roomId].length > 1 ? 'are' : 'is'} typing...`}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

**Notes**:

- sendTypingIndicator triggers when typing starts.
- sendStopTypingIndicator triggers after 3 seconds or on input clear/send.
- typingUsers maps room IDs to typing user IDs.

### 6. useFileUpload

**Purpose**: Manages file upload functionality, including file selection, validation, upload progress, and integration with messages.

**Interface**:
```typescript
interface FileUploadContextType {
  selectedFiles: FilePreview[];
  addFiles: (files: FileList) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  uploadFiles: (roomId?: string) => Promise<string[]>;
  uploadProgress: Record<string, number>;
  isUploading: boolean;
  validateFile: (file: File) => string | null;
  getFileIcon: (fileType: string) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
  previewFile: (fileIdOrUrl: string, options?: FilePreviewOptions) => string;
  getSignedUrl: (fileId: string, options?: FilePreviewOptions) => Promise<string>;
  config: FileUploadConfig;
  updateConfig: (newConfig: Partial<FileUploadConfig>) => void;
}
```

**FileUploadConfig**:
```typescript
interface FileUploadConfig {
  maxFiles?: number;        // Default: 5
  maxFileSize?: number;     // Default: 25 MB
  acceptedTypes?: string[]; // Default: ['image/*', 'video/*', 'audio/*', 'application/pdf', ...]
  uploadEndpoint?: string;  // Default: '/api/v1/files/guests'
  apiKey?: string;         // Optional API key for uploads
}
```

**FilePreview**:
```typescript
interface FilePreview {
  file: File;
  id: string;
  preview?: string;        // Blob URL for image previews
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}
```

**FilePreviewOptions**:
```typescript
interface FilePreviewOptions {
  download?: boolean;     // Add download parameter to force download
  inline?: boolean;       // Force inline viewing (for images/videos)
  baseUrl?: string;       // Custom base URL (overrides context baseUrl)
}
```

**Basic File Upload Example**:
```tsx
'use client';

import { useFileUpload } from '@sparkstrand/chat-api-client/context';
import { Upload, X, File, Image, Video, Music } from 'lucide-react';

export default function SimpleFileUpload() {
  const { selectedFiles, addFiles, removeFile, clearFiles, formatFileSize } = useFileUpload();

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
            <button onClick={clearFiles} className="text-red-500 text-sm">Clear All</button>
          </div>

          {selectedFiles.map((filePreview) => (
            <div key={filePreview.id} className="flex items-center space-x-3 p-2 border rounded">
              {/* File preview/icon */}
              <div className="flex-shrink-0">
                {filePreview.preview ? (
                  <img src={filePreview.preview} alt={filePreview.file.name} className="w-8 h-8 object-cover rounded" />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    {getFileIcon(filePreview.file.type)}
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{filePreview.file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(filePreview.file.size)}</p>
              </div>

              {/* Remove button */}
              <button onClick={() => removeFile(filePreview.id)} className="text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Advanced File Upload with Messages Example**:
```tsx
'use client';

import { useState } from 'react';
import { useFileUpload, useChatMessage, useChat } from '@sparkstrand/chat-api-client/context';
import { Upload, Send, X } from 'lucide-react';

export default function MessageInputWithFiles({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState('');
  const { userId } = useChat();
  const { sendMessage } = useChatMessage();
  const { selectedFiles, addFiles, removeFile, clearFiles, config } = useFileUpload();

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if ((trimmedMessage || selectedFiles.length > 0) && userId) {
      // Send message with files - files are automatically uploaded
      sendMessage({
        text: trimmedMessage,
        to: roomId,
        senderId: userId,
        files: selectedFiles.map(f => f.file) // Files from context
      });

      setMessage('');
      clearFiles(); // Clear files after sending
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* File Upload Area */}
      <div className="flex items-center space-x-2">
        <input
          type="file"
          multiple
          accept={config.acceptedTypes?.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
        >
          <Upload className="w-5 h-5" />
        </label>
        <span className="text-sm text-gray-500">
          {selectedFiles.length}/{config.maxFiles || 5} files selected
        </span>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {selectedFiles.map((filePreview) => (
            <div key={filePreview.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              <span className="text-sm truncate flex-1">{filePreview.file.name}</span>
              <button onClick={() => removeFile(filePreview.id)} className="text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() && selectedFiles.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

**Drag & Drop File Upload Example**:
```tsx
'use client';

import { useState } from 'react';
import { useFileUpload } from '@sparkstrand/chat-api-client/context';
import { Upload } from 'lucide-react';

export default function DragDropFileUpload() {
  const [dragActive, setDragActive] = useState(false);
  const { addFiles, selectedFiles } = useFileUpload();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        Drag and drop files here, or{' '}
        <label className="text-blue-600 cursor-pointer">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          browse
        </label>
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {selectedFiles.length} files selected
      </p>
    </div>
  );
}
```

**File Upload Configuration Example**:
```tsx
'use client';

import { useFileUpload } from '@sparkstrand/chat-api-client/context';

export default function FileUploadSettings() {
  const { config, updateConfig } = useFileUpload();

  const presets = {
    images: {
      maxFiles: 3,
      maxFileSize: 10,
      acceptedTypes: ['image/*']
    },
    documents: {
      maxFiles: 1,
      maxFileSize: 20,
      acceptedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    },
    media: {
      maxFiles: 5,
      maxFileSize: 25, //max is 25 on server too.
      acceptedTypes: ['image/*', 'video/*', 'audio/*']
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">File Upload Settings</h3>

      {/* Presets */}
      <div className="space-x-2">
        <button onClick={() => updateConfig(presets.images)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
          Images Only
        </button>
        <button onClick={() => updateConfig(presets.documents)} className="px-3 py-1 bg-green-500 text-white rounded text-sm">
          Documents Only
        </button>
        <button onClick={() => updateConfig(presets.media)} className="px-3 py-1 bg-purple-500 text-white rounded text-sm">
          All Media
        </button>
      </div>

      {/* Current Config */}
      <div className="text-sm space-y-1">
        <p><strong>Max Files:</strong> {config.maxFiles}</p>
        <p><strong>Max Size:</strong> {config.maxFileSize}MB</p>
        <p><strong>Accepted Types:</strong> {config.acceptedTypes?.join(', ')}</p>
      </div>
    </div>
  );
}
```

**Manual File Upload Example**:
```tsx
'use client';

import { useFileUpload } from '@sparkstrand/chat-api-client/context';

export default function ManualFileUpload({ roomId }: { roomId: string }) {
  const { selectedFiles, uploadFiles, isUploading, clearFiles } = useFileUpload();

  const handleUpload = async () => {
    try {
      const fileIds = await uploadFiles(roomId);
      console.log('Uploaded file IDs:', fileIds);
      alert(`Successfully uploaded ${fileIds.length} files!`);
      clearFiles(); // Clear after successful upload
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      {selectedFiles.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            {selectedFiles.length} files ready to upload
          </p>
          <div className="space-x-2">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
            <button
              onClick={clearFiles}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Clear Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**File Preview and Display Example**:
```tsx
'use client';

import { useFileUpload } from '@sparkstrand/chat-api-client/context';
import { Download, Eye, ExternalLink } from 'lucide-react';

export default function FileDisplayComponent({ message }: { message: any }) {
  const { getSignedUrl, getFileIcon, formatFileSize } = useFileUpload();

  const handleFilePreview = (file: any) => {
    // Get preview signal URL for inline viewing
    const previewUrl = getSignedUrl(file.id, { inline: true });

    // For images and videos, open in modal or new tab
    if (file.fileType?.startsWith('image/') || file.fileType?.startsWith('video/')) {
      window.open(previewUrl, '_blank');
    } else {
      // For documents (PDFs, etc.), open in new tab for viewing
      window.open(previewUrl, '_blank');
    }
  };

  const handleFileDownload = (file: any) => {
    // Get download URL
    const downloadUrl = getSignedUrl(file.id, { download: true });

    // Create temporary link for download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2">
      {message.files?.map((file: any, index: number) => (
        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
          {/* File preview/thumbnail */}
          <div className="flex-shrink-0">
            {file.fileType?.startsWith('image/') ? (
              <img
                src={getSignedUrl(file.id, { inline: true })}
                alt={file.filename}
                className="w-12 h-12 object-cover rounded cursor-pointer"
                onClick={() => handleFilePreview(file)}
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                {getFileIcon(file.fileType)}
              </div>
            )}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.filename}</p>
            <p className="text-sm text-gray-500">
              {formatFileSize(file.size)} • {file.fileType}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Preview button */}
            <button
              onClick={() => handleFilePreview(file)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Preview file"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Download button */}
            <button
              onClick={() => handleFileDownload(file)}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Open in new tab */}
            <a
              href={getSignedUrl(file.id, { inline: true })}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Advanced File Preview Usage**:
```tsx
'use client';

import { useFileUpload } from '@sparkstrand/chat-api-client/context';

export default function AdvancedFilePreview() {
  const { previewFile, getSignedUrl } = useFileUpload();

  // Example file object from server response
  const exampleFile = {
    id: 'file-123',
    filename: 'document.pdf',
    fileType: 'application/pdf',
    size: 1024000
  };

  const examples = {
    // Basic preview URL
    basicPreview: getSignedUrl(exampleFile.id), 

    // Force download
    downloadUrl: getSignedUrl(exampleFile.id, { download: true }),

    // Force inline viewing (for PDFs, images)
    inlineUrl: getSignedUrl(exampleFile.id, { inline: true }),

    // Custom base URL
    customBaseUrl: getSignedUrl(exampleFile.id, {
      baseUrl: 'https://sparkstrand-chat.com',
      inline: true
    }),

    // Combined options using previewFile or getSignedUrl
    downloadWithCustomBase: getSignedUrl(exampleFile.id, {
      baseUrl: 'https://custom-domain.com',
      download: true
    })
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">File Preview URL Examples</h3>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Basic Preview:</strong>
          <code className="block bg-gray-100 p-2 rounded mt-1">
            {examples.basicPreview}
          </code>
        </div>

        <div>
          <strong>Download URL:</strong>
          <code className="block bg-gray-100 p-2 rounded mt-1">
            {examples.downloadUrl}
          </code>
        </div>

        <div>
          <strong>Inline Viewing:</strong>
          <code className="block bg-gray-100 p-2 rounded mt-1">
            {examples.inlineUrl}
          </code>
        </div>

        <div>
          <strong>Custom Base URL:</strong>
          <code className="block bg-gray-100 p-2 rounded mt-1">
            {examples.customBaseUrl}
          </code>
        </div>
      </div>

      {/* Interactive examples */}
      <div className="space-y-2">
        <h4 className="font-medium">Interactive Examples:</h4>

        <button
          onClick={() => window.open(examples.inlineUrl, '_blank')}
          className="px-3 py-2 bg-blue-500 text-white rounded mr-2"
        >
          Preview File
        </button>

        <a
          href={examples.downloadUrl}
          download={exampleFile.filename}
          className="inline-block px-3 py-2 bg-green-500 text-white rounded"
        >
          Download File
        </a>
      </div>
    </div>
  );
}
```

**Notes**:

- **Automatic Upload**: Files are automatically uploaded when sending messages with `sendMessage({ files: [...] })`.
- **Manual Upload**: Use `uploadFiles(roomId)` for manual upload control.
- **File Validation**: Files are automatically validated against `config.acceptedTypes` and `config.maxFileSize`.
- **Progress Tracking**: Use `isUploading` and `uploadProgress` for upload status.
- **Configuration**: Use `updateConfig()` to change upload settings dynamically.
- **File Previews**: Images automatically generate preview URLs in `filePreview.preview`.
- **Error Handling**: Upload errors are stored in `filePreview.error` and `uploadStatus`.
- **File URLs**: Server returns `fileUrl` in format `baseUrl/api/v1/files/view/:fileId` - use directly for preview.
- **Preview Function**: `previewFile()` accepts either a `fileId` or complete `fileUrl` and can add query parameters.
- **Signed URLs**: `getSignedUrl()` fetches a signed URL for direct access and accepts fileId and/or options of type `FilePreviewOptions`.
- **Download URLs**: Use `previewFile(fileUrl, { download: true })` to add download parameter to existing URLs.

## Error Handling

Each hook provides error information:

- **useChat.error**: Captures connection, authentication, and socket errors.

**Example**:
```tsx
import { useChat } from '@sparkstrand/chat-api-client/lib/context';

export default function ErrorDisplay() {
  const { error } = useChat();

  if (!error) return null;

  return (
    <div className="p-4 bg-red-100 text-red-700 rounded">
      Error: {error.message}
    </div>
  );
}
```

## Best Practices

### Initialization

- Place ChatProvider at the highest required level (e.g., layout.tsx).
- Configure SocketClientOptions with valid url and apiKey.

### Authentication

- Call useChat().login on mount or userId change.
- Handle login errors with retries or user feedback.

### State Management

- Use useChat().isConnected for conditional rendering.
- Prefer useChatRoom().currentRoomMessages over filtering useChatMessage().messages.
- Cap message arrays to prevent memory issues:
```typescript
const MAX_MESSAGES = 1000;
setMessages((prev) => [...prev, message].slice(-MAX_MESSAGES));
```

### Performance

- Use useMemo in components to optimize context access.
- Debounce sendTypingIndicator to reduce socket emissions:
```typescript
import { debounce } from 'lodash';
const debouncedTyping = debounce(() => sendTypingIndicator(roomId), 500);
```

### Cleanup

- ChatProvider disconnects the socket and removes event listeners on unmount:
```typescript
useEffect(() => {
  const chatClient = new ChatFrontendClient(options);
  setClient(chatClient);
  // ... event listeners
  return () => {
    chatClient.removeAllListeners();
    chatClient.disconnect();
    setClient(null);
  };
}, [options]);
```

- Clear local state (e.g., input fields) on room switch.

### File Upload Best Practices

- **File Validation**: Always validate files on both client and server side.
- **Progress Feedback**: Use `isUploading` and `uploadProgress` for user feedback.
- **Error Handling**: Handle upload errors gracefully with retry options.
- **Memory Management**: Clear file previews with `clearFiles()` to prevent memory leaks.
- **Configuration**: Set appropriate `maxFileSize` and `acceptedTypes` for your use case.
- **Security**: Validate file types on the server to prevent malicious uploads.

```typescript
// Example: Robust file upload with error handling
const handleFileUpload = async () => {
  try {
    setIsUploading(true);
    const fileIds = await uploadFiles(roomId);

    // Send message with uploaded files
    await sendMessage({
      text: message,
      to: roomId,
      files: fileIds, // Use uploaded file IDs
    });

    clearFiles();
    setMessage('');
  } catch (error) {
    console.error('Upload failed:', error);
    // Show user-friendly error message
    setError('Failed to upload files. Please try again.');
  } finally {
    setIsUploading(false);
  }
};
```

## Socket Events

The ChatFrontendClient emits events defined in SocketEvent:

- **Connection**: CONNECT, DISCONNECT, CONNECT_ERROR, RECONNECT, etc.
- **Authentication**: AUTHENTICATED, AUTH_ERROR.
- **Rooms**: ROOM_JOINED, ROOM_LEFT, ROOM_SWITCHED, ROOM_CREATED, etc.
- **Messages**: NEW_MESSAGE, MESSAGE_EDITED, MESSAGE_DELETED, MESSAGE_READ.
- **Users**: USER_ONLINE, USER_LEFT, USER_STATUS_CHANGED.
- **Typing**: USER_TYPING, USER_STOPPED_TYPING.

See types for full details.

## Types

Key interfaces and enums:

- **SocketEvent**: Defines socket event types (e.g., CONNECT, NEW_MESSAGE).
- **RoomType**: DM, GROUP, SELF, ANONYMOUS.
- **UserStatus**: ONLINE, AWAY, OFFLINE.
- **IMessage**: Message structure with id, text, to, sender, etc.
- **ISendMessage**: Payload for sending messages.
- **IRoom**: Room details with id, name, type, messages, etc.
- **ICreateRoom**: Payload for creating rooms.
- **IRoomMedia**: Media files associated with rooms.

For complete type definitions, refer to the SDK's type exports.

## Limitations

- **Server Dependency**: Requires a running Sparkstrand chat server. Verify with url/api/v1/health.
- **Scalability**: Optimize for high message volumes with message caps and debouncing.
- **Message Duplication**: messages and currentRoomMessages require synchronization.

## Example Full Application

A complete chat interface using all hooks:

```tsx
// components/ChatApp.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  useChat,
  useChatMessage,
  useChatRoom,
  useUserOnline,
  useUserTyping,
  useFileUpload,
} from '@sparkstrand/chat-api-client/lib/context';
import { RoomType } from '@sparkstrand/chat-api-client/lib/types';

export default function ChatApp() {
  const { isConnected, login, userId, error } = useChat();
  const { messages, sendMessage } = useChatMessage();
  const { joinRoom, rooms, createRoom, switchRoom, currentRoomMessages } = useChatRoom();
  const { onlineUsers } = useUserOnline();
  const { typingUsers, sendTypingIndicator, sendStopTypingIndicator } = useUserTyping();
  const { selectedFiles, addFiles, removeFile, clearFiles } = useFileUpload();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (userId && !isConnected) {
      login(userId).catch((err) => console.error('Login failed:', err));
    }
    if (isConnected && !selectedRoom && rooms.length > 0) {
      joinRoom(rooms[0].id);
      setSelectedRoom(rooms[0].id);
    }
  }, [userId, isConnected, login, joinRoom, rooms, selectedRoom]);

  const handleSendMessage = () => {
    const trimmedMessage = messageInput.trim();
    if ((trimmedMessage || selectedFiles.length > 0) && selectedRoom && userId) {
      sendMessage({
        to: selectedRoom,
        text: trimmedMessage,
        senderId: userId,
        files: selectedFiles.length > 0 ? selectedFiles.map(f => f.file) : undefined,
      });
      setMessageInput('');
      clearFiles(); // Clear files after sending
      sendStopTypingIndicator(selectedRoom);
    }
  };

  const handleCreateRoom = () => {
    if (userId) {
      createRoom({
        name: `Room ${rooms.length + 1}`,
        type: RoomType.GROUP,
        memberIds: [], // Replace with valid guest IDs
      });
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
        >
          Create Room
        </button>
        <ul>
          {rooms.map((room) => (
            <li
              key={room.id}
              onClick={() => {
                setSelectedRoom(room.id);
                switchRoom(room.id);
              }}
              className={`p-2 cursor-pointer rounded ${
                selectedRoom === room.id ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              {room.name}
            </li>
          ))}
        </ul>
        <h3 className="text-lg font-semibold mt-4">Online Users</h3>
        <ul>
          {onlineUsers.map((id) => (
            <li key={id} className="p-1">
              User {id}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="w-3/4 flex flex-col">
        <div className="bg-white p-4 border-b">
          <h2 className="text-lg font-semibold">
            {selectedRoom ? rooms.find((r) => r.id === selectedRoom)?.name : 'Select a room'}
          </h2>
          <p className="text-sm text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
            {error && ` | Error: ${error.message}`}
          </p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {currentRoomMessages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 flex ${
                msg.sender.id === userId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  msg.sender.id === userId ? 'bg-blue-500 text-white' : 'bg-white border'
                }`}
              >
                {msg.text && <p>{msg.text}</p>}

                {/* File attachments */}
                {msg.files && msg.files.length > 0 && (
                  <div className={`space-y-2 ${msg.text ? 'mt-2' : ''}`}>
                    {msg.files.map((file, fileIndex) => (
                      <div key={fileIndex} className="flex items-center space-x-2 text-xs">
                        {file.fileType?.startsWith('image/') ? (
                          <img
                            src={file.fileUrl}
                            alt={file.filename}
                            className="w-16 h-16 object-cover rounded cursor-pointer"
                            onClick={() => window.open(file.fileUrl, '_blank')}
                          />
                        ) : (
                          <div className="flex items-center space-x-2 p-2 bg-black bg-opacity-10 rounded">
                            <span>📄</span>
                            <span className="truncate">{file.filename}</span>
                            <a
                              href={file.fileUrl}
                              download={file.filename}
                              className="text-blue-300 hover:text-blue-100"
                            >
                              ⬇️
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {selectedRoom && typingUsers[selectedRoom]?.length > 0 && (
            <div className="text-sm text-gray-500 italic">
              {typingUsers[selectedRoom].join(', ')} {typingUsers[selectedRoom].length > 1 ? 'are' : 'is'} typing...
            </div>
          )}
        </div>
        <div className="bg-white p-4 border-t space-y-3">
          {/* File Upload Area */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Selected Files ({selectedFiles.length})</span>
                <button onClick={clearFiles} className="text-red-500 text-sm">Clear All</button>
              </div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {selectedFiles.map((filePreview) => (
                  <div key={filePreview.id} className="flex items-center space-x-2 p-1 bg-gray-50 rounded text-sm">
                    <span className="flex-1 truncate">{filePreview.file.name}</span>
                    <button onClick={() => removeFile(filePreview.id)} className="text-red-500">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex gap-2">
            <input
              type="file"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
              title="Attach files"
            >
              📎
            </label>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                if (e.target.value && selectedRoom) {
                  sendTypingIndicator(selectedRoom);
                } else if (selectedRoom) {
                  sendStopTypingIndicator(selectedRoom);
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded"
              disabled={!selectedRoom}
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
              disabled={(!messageInput.trim() && selectedFiles.length === 0) || !selectedRoom}
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

For issues, contact Bello or Bolu on Slack.
