import React from 'react';
import { ChatFrontendClient } from '../frontend/index.js';
import { SocketClientOptions, ISendMessage, IEditMessage, IDeleteMessage, IMessage, ICreateRoom, IRoom, IRoomMedia, UserStatus } from '../types/index.js';
import 'eventemitter3';

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
    maxFileSize?: number;
    acceptedTypes?: string[];
    uploadEndpoint?: string;
    apiKey?: string;
}
interface FilePreviewOptions {
    download?: boolean;
    inline?: boolean;
    baseUrl?: string;
}
interface ChatProviderProps {
    options: SocketClientOptions;
    children: React.ReactNode;
}
declare const ChatProvider: React.FC<ChatProviderProps>;
declare const useChat: () => ChatContextType;
declare const useChatMessage: () => MessageContextType;
declare const useChatRoom: () => RoomContextType;
declare const useUserOnline: () => UserStatusContextType;
declare const useUserTyping: () => TypingContextType;
declare const useFileUpload: () => FileUploadContextType;

export { ChatProvider, useChat, useChatMessage, useChatRoom, useFileUpload, useUserOnline, useUserTyping };
