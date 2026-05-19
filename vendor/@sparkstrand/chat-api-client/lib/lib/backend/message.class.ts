import {
    IResponse,
    IMessage,
    RestClientAuthOptions,
    ISendMessage,
    IUpdateMessage,
    IGetUserMessages,
    IMessageSearchResult,
    IMessageSearchFilter,
    IMessageSearchOptions,
  } from '../types';
  import { IRestClient } from './restful.client';
  import { validateRequiredFields } from './utils/validation';
  
  
  /**
   * Class for managing message-related operations.
   */
  export class Messages {
    private basePath = 'api/v1/messages';
  
    /**
     * Constructor for Messages.
     * @param restClient - The REST client for HTTP requests.
     */
    constructor(private readonly restClient: IRestClient) {}
  
    /**
     * Create a new message in a room.
     * @param data - Message creation data.
     * @param authOptions - Authentication options.
     * @returns Response containing the created message or error.
     */
    public async create(
      data: ISendMessage,
      authOptions?: RestClientAuthOptions 
    ): Promise<IResponse<IMessage | null>> {
      const validationError = validateRequiredFields(
        {
          to: data.to,
          senderId: data.senderId,
        },
        'create message'
      );
      if (validationError) return validationError;
  
      return await this.restClient.POST<IMessage | null>(data, `${this.basePath}`, authOptions);
    }
  
    /**
     * Update an existing message.
     * @param messageId - The ID of the message to update.
     * @param data - Message update data.
     * @param authOptions - Authentication options.
     * @returns Response containing the updated message or error.
     */
    public async update(
      messageId: string,
      data: IUpdateMessage,
      authOptions?: RestClientAuthOptions
    ): Promise<IResponse<IMessage | null>> {
      const validationError = validateRequiredFields({ messageId }, 'update message');
      if (validationError) return validationError;
  
      if (!Object.keys(data).length) {
        return {
          success: false,
          message: 'No fields provided for message update',
          statusCode: 400,
          data: null,
        };
      }
  
      return await this.restClient.PUT<IMessage | null>(data, `${this.basePath}/${messageId}`, authOptions);
    }
  
    /**
     * Delete a message.
     * @param messageId - The ID of the message to delete.
     * @param authOptions - Authentication options.
     * @returns Response indicating success or error.
     */
    public async delete(
      messageId: string,
      authOptions?: RestClientAuthOptions 
    ): Promise<IResponse<null>> {
      const validationError = validateRequiredFields({ messageId }, 'delete message');
      if (validationError) return validationError;
  
      return await this.restClient.DELETE<null>(null, `${this.basePath}/${messageId}`, authOptions);
    }
  
    /**
     * Retrieve a message by ID.
     * @param messageId - The ID of the message.
     * @param authOptions - Authentication options.
     * @returns Response containing the message or error.
     */
    public async get(
      messageId: string,
      authOptions?: RestClientAuthOptions
    ): Promise<IResponse<IMessage | null>> {
      const validationError = validateRequiredFields({ messageId }, 'get message');
      if (validationError) return validationError;
  
      return await this.restClient.GET<IMessage | null>(null, `${this.basePath}/${messageId}`, authOptions);
    }
  
    /**
     * Get all messages from a guest
     * @param data - Search query for filtering messages, 
     *         filters.senderId is required
     * @param authOptions - Authentication options.
     * @returns Response containing the matching messages or error.
     */
    public async getMessageBySender(
      data: IGetUserMessages,
      authOptions?: RestClientAuthOptions
    ): Promise<IResponse<IMessageSearchResult>> {
      const validationError = validateRequiredFields({ senderId: data.filters?.senderId }, 'search user message');
      if (validationError) return { ...validationError, data: { messages: [], totalCount: 0, hasMore: false } };
      
      return await this.restClient.POST<IMessageSearchResult>(data, `${this.basePath}/search/sender`, authOptions);
    }

    /**
     * Search for words across the provided roomIds  or all the rooms the guest has access to if roomIds not provided
     * @param guestId - Guest ID
     * @param data - Search query for filtering messages, 
     *         words is required
     * @param authOptions 
     * @returns 
     */
    public async searchWords(
      data: {
        guestId: string;
        words: string[];
        filters?: IMessageSearchFilter;
        options?: IMessageSearchOptions;
        roomIds?: string;
      },
      authOptions?: RestClientAuthOptions
    ): Promise<IResponse<IMessageSearchResult>> {
      const validationError = validateRequiredFields({ words: data.words, guestId: data.guestId }, 'search words');
      if (validationError) return { ...validationError, data: { messages: [], totalCount: 0, hasMore: false } };
      
      return await this.restClient.POST<IMessageSearchResult>(data, `${this.basePath}/search/words`, authOptions);
    }

    /**
     * Search for words in a room
     * @param data - Search query for filtering messages, 
     *         words and roomId are required
     * @param authOptions 
     * @returns 
     */
    public async searchForWordsInARoom(
      data: {roomId: string; words: string[]; filters?: IMessageSearchFilter; options?: IMessageSearchOptions;},
      authOptions?: RestClientAuthOptions): Promise<IResponse<IMessageSearchResult>> {
      const validationError = validateRequiredFields({ words: data.words, roomId: data.roomId }, 'search words in room');
      if (validationError) return { ...validationError, data: { messages: [], totalCount: 0, hasMore: false } };
      
      return await this.restClient.POST<IMessageSearchResult>(data, `${this.basePath}/search/room`, authOptions);
    }

    /**
     * Search for words in multiple rooms
     * @param data - Search query for filtering messages, 
     *         words and roomIds are required
     * @param authOptions 
     * @returns 
     */
    public async searchForWordsInMultipleRooms(
      data: {words: string[]; roomIds: string[]; filters?: IMessageSearchFilter; options?: IMessageSearchOptions;},
      authOptions?: RestClientAuthOptions
    ): Promise<IResponse<IMessageSearchResult>> {
      const validationError = validateRequiredFields({ words: data.words, roomIds: data.roomIds }, 'search words in multiple rooms');
      if (validationError) return { ...validationError, data: { messages: [], totalCount: 0, hasMore: false } };
      
      return await this.restClient.POST<IMessageSearchResult>(data, `${this.basePath}/search/rooms`, authOptions);
    }
  
    /**
     * Mark a message as read.
     * @param messageId - The ID of the message to mark as read.
     * @param authOptions - Authentication options.
     * @returns Response indicating success or error.
     */
    public async markAsRead(
      messageId: string,
      authOptions?: RestClientAuthOptions
    ): Promise<IResponse<null>> {
      const validationError = validateRequiredFields({ messageId }, 'mark message as read');
      if (validationError) return validationError;
  
      return await this.restClient.PUT<null>(null, `${this.basePath}/${messageId}/read`, authOptions);
    }
  }