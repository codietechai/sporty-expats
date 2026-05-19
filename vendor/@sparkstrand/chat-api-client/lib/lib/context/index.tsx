import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { ChatFrontendClient } from '../frontend';
import { SocketClientOptions, IMessage,
   UserStatus, SocketEvent, IRoom, ISendMessage,
   IRoomMedia, ICreateRoom, IEditMessage, IDeleteMessage
  } from '../types';

interface ChatContextType {
  client: ChatFrontendClient | null;
  isConnected: boolean;
  login: (id: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  error: Error | null;
  userId: string | null;
}

interface MessageContextType {
  sendMessage: (message: ISendMessage) => void;
  markMessageRead: (messageId: string) => void;
  editMessage: (message: IEditMessage) => void;
  deleteMessage: (message: IDeleteMessage) => void;
  messages: IMessage[];
}

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

interface UserStatusContextType {
  setUserStatus: (status: UserStatus) => void;
  onlineUsers: string[];
  userStatuses: Record<string, UserStatus>;
}

interface TypingContextType {
  sendTypingIndicator: (roomId: string) => void;
  sendStopTypingIndicator: (roomId: string) => void;
  typingUsers: Record<string, string[]>;
}

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
  previewFile: (fileId: string, options?: FilePreviewOptions) => string;
  getSignedUrl: (fileId: string, options?: FilePreviewOptions) => Promise<string>;
  config: FileUploadConfig;
  updateConfig: (newConfig: Partial<FileUploadConfig>) => void;
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileUploadConfig {
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  uploadEndpoint?: string;
  apiKey?: string;
}

interface FilePreviewOptions {
  download?: boolean;     // Add download parameter
  inline?: boolean;       // Force inline viewing
  baseUrl?: string;       // Custom base URL
}

// Parent context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Child contexts
const MessageContext = createContext<MessageContextType | undefined>(undefined);
const RoomContext = createContext<RoomContextType | undefined>(undefined);
const UserStatusContext = createContext<UserStatusContextType | undefined>(undefined);
const TypingContext = createContext<TypingContextType | undefined>(undefined);
const FileUploadContext = createContext<FileUploadContextType | undefined>(undefined);

interface ChatProviderProps {
  options: SocketClientOptions;
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ options, children }) => {
  const [client, setClient] = useState<ChatFrontendClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [currentRoomData, setCurrentRoomData] = useState<IRoom | null>(null);
  const [currentRoomMedia, setCurrentRoomMedia] = useState<IRoomMedia[]>([]);
  const [currentRoomMessages, setCurrentRoomMessages] = useState<IMessage[]>([]);

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [fileUploadConfig, setFileUploadConfig] = useState<FileUploadConfig>({
    maxFiles: 5,
    maxFileSize: 25,
    acceptedTypes: [
      'image/*',
      'video/*',
      'audio/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/*'
    ],
    uploadEndpoint: '/api/v1/files/guests'
  });

  // Use ref to track current room ID for message filtering
  const currentRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    const chatClient = new ChatFrontendClient(options);
    setClient(chatClient);

    // Setup connection event listeners
    chatClient.on(SocketEvent.CONNECT, () => {
      setIsConnected(chatClient.isConnected());
      setError(null);
    });

    chatClient.on(SocketEvent.DISCONNECT, (reason) => {
      setIsConnected(chatClient.isConnected());
      setError(new Error(`Disconnected: ${reason}`));
    });

    chatClient.on(SocketEvent.CONNECT_ERROR, (err) => {
      setError(err);
    });

    chatClient.on(SocketEvent.AUTH_ERROR, (err) => {
      setError(new Error(err.message));
    });

    chatClient.on(SocketEvent.ERROR, (err) => {
      setError(new Error(err.message));
    });

    // Room Switch events -  the user need to call switchRoom() to populate the currentRoomData and currentRoomMessages. which you then access via useChatRoom().currentRoomData and useChatRoom().currentRoomMessages
    chatClient.on(SocketEvent.ROOM_SWITCHED, (data) => {
      const roomId = typeof data === 'object' ? data.roomId : data;
      console.log('[ChatContext] ROOM_SWITCHED event received:', roomId);
      if (roomId) {
        setCurrentRoomMessages([]);
        setCurrentRoomData(null);
        setCurrentRoomMedia([]);
        // Update the ref to track the new room ID immediately
        currentRoomIdRef.current = roomId;

        console.log('[ChatContext] Fetching room data for:', roomId);
        //  This will populate the currentRoomData and currentRoomMessages.
        chatClient.getRoomDataById(roomId);

        //  This will populate the currentRoomMedia
        chatClient.getRoomMedia(roomId);

        // Set a backup timeout to fetch room data if not received
        setTimeout(() => {
          console.log('[ChatContext] Backup room data fetch for:', roomId);
          chatClient.getRoomDataById(roomId);
        }, 2000);
      }
    });

    // Message events
    chatClient.on(SocketEvent.NEW_MESSAGE, (message: IMessage) => {
      console.log('[ChatContext] NEW_MESSAGE event received:', message.id, 'for room:', message.to, 'current room:', currentRoomIdRef.current);
      setMessages((prev) => [...prev, message]);

      // Add message to current room messages if it belongs to the current room
      setCurrentRoomMessages(prev => {
        // Use the ref to check if this message belongs to the current room
        if (message.to === currentRoomIdRef.current) {
          console.log('[ChatContext] Adding message to current room messages');

          // Check if this is a real message replacing an optimistic one
          const existingOptimisticIndex = prev.findIndex(msg =>
            msg.id.startsWith('temp-') &&
            msg.text === message.text &&
            msg.sender.id === message.sender.id &&
            Math.abs(new Date(msg.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000 // Within 5 seconds
          );

          if (existingOptimisticIndex !== -1) {
            // Replace optimistic message with real one
            console.log('[ChatContext] Replacing optimistic message with real message');
            const newMessages = [...prev];
            newMessages[existingOptimisticIndex] = message;
            return newMessages;
          } else {
            // Add new message
            return [...prev, message];
          }
        }
        console.log('[ChatContext] Message not for current room, skipping');
        return prev;
      });
    });

    chatClient.on(SocketEvent.MESSAGE_READ, (messageId: string) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );

      setCurrentRoomMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, read: true } : msg));
    });

    chatClient.on(SocketEvent.MESSAGE_DELETED, (messageId: string) => {
      setMessages((prev) => prev.filter(msg => msg.id !== messageId));
      setCurrentRoomMessages(prev => prev.filter(msg => msg.id !== messageId));
    });

    chatClient.on(SocketEvent.MESSAGE_EDITED, (message: IMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? message : msg
        )
      );
      setCurrentRoomMessages(prev => prev.map(msg => msg.id === message.id ? message : msg));
    });

    chatClient.on(SocketEvent.MESSAGE_DELETED, (message: IMessage) => {
      setMessages((prev) => prev.filter(msg => msg.id !== message.id));
      setCurrentRoomMessages(prev => prev.filter(msg => msg.id !== message.id));
    });

    // Rooms events
    chatClient.on(SocketEvent.LIST_OF_GUEST_ROOMS, (rooms: IRoom[]) => {
      setRooms(rooms);
    });

    chatClient.on(SocketEvent.ROOM_DATA, (room: IRoom) => {
      console.log('[ChatContext] ROOM_DATA event received:', room?.id, room?.name, 'Messages:', room?.messages?.length);
      setCurrentRoomData(room);
      setCurrentRoomMessages(room.messages || []);
      // Update the ref to track current room ID
      currentRoomIdRef.current = room?.id || null;
    });

    chatClient.on(SocketEvent.ROOM_MEDIA, (media: IRoomMedia[]) => {
      setCurrentRoomMedia(media);
    });

    chatClient.on(SocketEvent.ROOM_CREATED, (room: IRoom) => {
      setRooms((prev) => [...prev, room]);
    });

    chatClient.on(SocketEvent.ROOM_MESSAGES, (messages: IMessage[]) => {
      setCurrentRoomMessages(messages);
    });

    // User status events
    chatClient.on(SocketEvent.USER_ONLINE, (userId: string) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    chatClient.on(SocketEvent.USER_LEFT, (userId: string) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    chatClient.on(SocketEvent.USER_STATUS_CHANGED, ({ userId, status }: { userId: string; status: UserStatus }) => {
      setUserStatuses((prev) => ({ ...prev, [userId]: status }));
    });

    // Typing events
    chatClient.on(SocketEvent.USER_TYPING, ({ roomId, userId }: { roomId: string; userId: string }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), userId],
      }));
    });

    chatClient.on(SocketEvent.USER_STOPPED_TYPING, ({ roomId, userId }: { roomId: string; userId: string }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter((id) => id !== userId),
      }));
    });

    return () => {
      chatClient.removeAllListeners();
      chatClient.disconnect();
      setClient(null);
    };
  }, [options]);

  const login = async (id: string) => {
    if (!client) throw new Error('Chat client not initialized');
    try {
      await client.login(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    }
  };

  const disconnect = () => {
    if (client) {
      client.disconnect();
      setIsConnected(client.isConnected());
    }
  };

  const reconnect = async () => {
    if (!client) throw new Error('Chat client not initialized');
    try {
      await client.reconnect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Reconnection failed'));
      throw err;
    }
  };


  const chatContextValue = useMemo(
    () => ({
      client,
      isConnected,
      login,
      disconnect,
      reconnect,
      error,
      userId: client?.getUserId() || null,
    }),
    [client, isConnected, error]
  );

  const messageContextValue = useMemo(
    () => ({
      sendMessage: (message: ISendMessage) => {
        // Optimistic update: add message immediately to UI
        const optimisticMessage: IMessage = {
          id: `temp-${Date.now()}`, // Temporary ID
          text: message.text,
          to: message.to,
          sender: {
            id: message.senderId || client?.getUserId() || '',
            name: client?.getUserId() || 'You',
            username: client?.getUserId() || 'You',
            avatar: {
              filename: 'default-avatar.png',
              fileUrl: '/default-avatar.png'
            }
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'Sent',
          read: false,
          edited: false,
          files: message.files ? message.files.map((file, index) => ({
            id: `temp-file-${index}`,
            filename: file.name,
            fileUrl: URL.createObjectURL(file),
            fileType: file.type,
            size: file.size,
            createdAt: new Date(),
            uploader: {
              id: message.senderId || client?.getUserId() || '',
              name: client?.getUserId() || 'You',
              username: client?.getUserId() || 'You'
            }
          })) : []
        };

        // Add to current room messages immediately if it's for the current room
        if (message.to === currentRoomIdRef.current) {
          console.log('[ChatContext] Adding optimistic message to current room');
          setCurrentRoomMessages(prev => [...prev, optimisticMessage]);
        }

        // Send the actual message
        return client?.sendMessage(message);
      },
      markMessageRead: (messageId: string) => client?.markMessageRead(messageId),
      editMessage: (message: IEditMessage) => client?.editMessage(message),
      deleteMessage: (message: IDeleteMessage) => client?.deleteMessage(message),
      messages,
    }),
    [client, messages]
  );

  const roomContextValue = useMemo(
    () => ({
      joinRoom: (roomId: string) => client?.joinRoom(roomId),
      switchRoom: (roomId: string) => client?.switchRoom(roomId),
      leaveRoom: (roomId: string) => client?.leaveRoom(roomId),
      createRoom: (data: ICreateRoom) => client?.createRoom(data),
      emitGetListOfGuestRooms: () => client?.getListOfGuestRooms(),
      setRooms,
      rooms,
      currentRoomData,
      currentRoomMedia,
      currentRoomMessages,
      getRoomDataById: (roomId: string) => client?.getRoomDataById(roomId),
      getRoomMedia: (roomId: string) => client?.getRoomMedia(roomId),
      getRoomMessages: (roomId: string, limit: number, cursor?: string) => client?.getRoomMessages(roomId, limit, cursor),
    }),
    [client, rooms, currentRoomData, currentRoomMedia, currentRoomMessages]
  );

  const userStatusContextValue = useMemo(
    () => ({
      setUserStatus: (status: UserStatus) => client?.setUserStatus(status),
      onlineUsers,
      userStatuses,
    }),
    [client, onlineUsers, userStatuses]
  );

  const typingContextValue = useMemo(
    () => ({
      sendTypingIndicator: (roomId: string) => client?.sendTypingIndicator(roomId),
      sendStopTypingIndicator: (roomId: string) => client?.sendStopTypingIndicator(roomId),
      typingUsers,
    }),
    [client, typingUsers]
  );

  // File upload functions
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > (fileUploadConfig.maxFileSize || 25) * 1024 * 1024) {
      return `File size must be less than ${fileUploadConfig.maxFileSize || 25}MB`;
    }

    // Check file type
    const isAccepted = fileUploadConfig.acceptedTypes?.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return 'File type not supported';
    }

    return null;
  }, [fileUploadConfig.maxFileSize, fileUploadConfig.acceptedTypes]);

  const addFiles = useCallback(async (files: FileList) => {
    const newFiles: FilePreview[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      // Check if we've reached max files
      if (selectedFiles.length + newFiles.length >= (fileUploadConfig.maxFiles || 5)) {
        errors.push(`Maximum ${fileUploadConfig.maxFiles || 5} files allowed`);
        return;
      }

      // Validate file
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        return;
      }

      // Create preview
      const filePreview: FilePreview = {
        file,
        id: `${Date.now()}-${Math.random()}`,
        uploadStatus: 'pending'
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          filePreview.preview = e.target?.result as string;
          setSelectedFiles(prev =>
            prev.map(f => f.id === filePreview.id ? filePreview : f)
          );
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(filePreview);
    });

    if (errors.length > 0) {
      console.error('File upload errors:', errors);
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, [selectedFiles.length, fileUploadConfig.maxFiles, validateFile]);

  const removeFile = useCallback((id: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview && fileToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[id];
      return newProgress;
    });
  }, []);

  const clearFiles = useCallback(() => {
    // Revoke object URLs to prevent memory leaks
    selectedFiles.forEach(file => {
      if (file.preview && file.preview.startsWith('blob:')) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
    setUploadProgress({});
  }, [selectedFiles]);

  const uploadFiles = useCallback(async (roomId?: string): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setIsUploading(true);
    const uploadedFileIds: string[] = [];

    try {
      // Update all files to uploading status
      setSelectedFiles(prev =>
        prev.map(file => ({ ...file, uploadStatus: 'uploading' as const }))
      );

      // Create FormData
      const formData = new FormData();
      selectedFiles.forEach(filePreview => {
        formData.append('files', filePreview.file);
      });

      // Add roomId only once, outside the loop
      if (roomId) {
        formData.append('roomId', roomId);
      }

      // Get API key from config
      const apiKey = fileUploadConfig.apiKey;
      const uploadEndpoint = fileUploadConfig.uploadEndpoint || '/api/v1/files/guests';

      // Upload files
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: apiKey ? { 'X-API-KEY': apiKey } : {},
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      // Extract file IDs
      const fileIds = data.data.map((file: any) => file.id);
      uploadedFileIds.push(...fileIds);

      // Update files to completed status
      setSelectedFiles(prev =>
        prev.map(file => ({ ...file, uploadStatus: 'completed' as const }))
      );

      return fileIds;
    } catch (error) {
      console.error('File upload error:', error);

      // Update files to error status
      setSelectedFiles(prev =>
        prev.map(file => ({
          ...file,
          uploadStatus: 'error' as const,
          error: error instanceof Error ? error.message : 'Upload failed'
        }))
      );

      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, fileUploadConfig.apiKey, fileUploadConfig.uploadEndpoint]);

  const getFileIcon = useCallback((fileType: string): React.ReactNode => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    return '📁';
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getSignedUrl = useCallback(async (fileId: string, options: FilePreviewOptions = {}): Promise<string> => {    
    const apiBaseUrl = options.baseUrl || client?.getUrl() || '';
    const url = `${apiBaseUrl}/api/v1/files/view/${fileId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': fileUploadConfig.apiKey || client?.getPublicApiKey() || '',
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to get signed URL');
    }
    // if(options.download) {
    //   data.data.url += '?download=true';
    // }
    // if(options.inline) {
    //   data.data.url += '?inline=true';
    // }

    return data.data;
  }, [client, fileUploadConfig.apiKey]);

  const previewFile = useCallback((fileIdOrUrl: string, options: FilePreviewOptions = {}): string => {
    const { download = false, inline = false, baseUrl } = options;

    // Check if input is already a complete URL (contains /api/v1/files/view/)
    if (fileIdOrUrl.includes('/api/v1/files/view/')) {
      // It's already a complete URL, just modify query parameters if needed
      const url = new URL(fileIdOrUrl, window.location.origin);

      if (download) {
        url.searchParams.set('download', 'true');
      }
      if (inline) {
        url.searchParams.set('inline', 'true');
      }

      return url.toString();
    } else {
      // It's a fileId, construct the complete URL
      const apiBaseUrl = baseUrl || client?.getUrl() || '';
      let previewUrl = `${apiBaseUrl}/api/v1/files/view/${fileIdOrUrl}`;

      // Add query parameters
      const params = new URLSearchParams();
      if (download) {
        params.append('download', 'true');
      }
      if (inline) {
        params.append('inline', 'true');
      }

      if (params.toString()) {
        previewUrl += `?${params.toString()}`;
      }

      return previewUrl;
    }
  }, [client]);

  const updateConfig = useCallback((newConfig: Partial<FileUploadConfig>) => {
    setFileUploadConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const fileUploadContextValue = useMemo(
    () => ({
      selectedFiles,
      addFiles,
      removeFile,
      clearFiles,
      uploadFiles,
      uploadProgress,
      isUploading,
      validateFile,
      getFileIcon,
      formatFileSize,
      previewFile,
      getSignedUrl,
      config: fileUploadConfig,
      updateConfig,
    }),
    [
      selectedFiles,
      addFiles,
      removeFile,
      clearFiles,
      uploadFiles,
      uploadProgress,
      isUploading,
      validateFile,
      getFileIcon,
      formatFileSize,
      previewFile,
      getSignedUrl,
      fileUploadConfig,
      updateConfig,
    ]
  );

  return (
    <ChatContext.Provider value={chatContextValue}>
      <MessageContext.Provider value={messageContextValue}>
        <RoomContext.Provider value={roomContextValue}>
          <UserStatusContext.Provider value={userStatusContextValue}>
            <TypingContext.Provider value={typingContextValue}>
              <FileUploadContext.Provider value={fileUploadContextValue}>
                {children}
              </FileUploadContext.Provider>
            </TypingContext.Provider>
          </UserStatusContext.Provider>
        </RoomContext.Provider>
      </MessageContext.Provider>
    </ChatContext.Provider>
  );
};

// Hooks for accessing contexts
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};

export const useChatMessage = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (!context) throw new Error('useChatMessage must be used within a ChatProvider');
  return context;
};

export const useChatRoom = (): RoomContextType => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useChatRoom must be used within a ChatProvider');
  return context;
};

export const useUserOnline = (): UserStatusContextType => {
  const context = useContext(UserStatusContext);
  if (!context) throw new Error('useUserOnline must be used within a ChatProvider');
  return context;
};

export const useUserTyping = (): TypingContextType => {
  const context = useContext(TypingContext);
  if (!context) throw new Error('useUserTyping must be used within a ChatProvider');
  return context;
};

export const useFileUpload = (): FileUploadContextType => {
  const context = useContext(FileUploadContext);
  if (!context) {
    throw new Error('useFileUpload must be used within a ChatProvider');
  }
  return context;
};
