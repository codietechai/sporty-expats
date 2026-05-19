import { IResponse, IRoom, IRoomGuests, SearchQuery, RoomType, IMessage, RestClientAuthOptions, Avatar } from '../types';
import { IRestClient } from './restful.client';
import { QueryParser } from './utils/queryParser';

/**
 * Utility function to validate required fields.
 * @param fields - Object containing fields to validate.
 * @param context - Context for error message.
 * @returns Error response if validation fails, null otherwise.
 */
function validateRequiredFields(fields: Record<string, any>, context: string): IResponse<null> | null {
  const missingFields = Object.entries(fields)
    .filter(([_, value]) => value === undefined || value === null)
    .map(([key]) => key);
  
  if (missingFields.length > 0) {
    return {
      success: false,
      message: `Missing required fields in ${context}: ${missingFields.join(', ')}`,
      statusCode: 400,
      data: null,
    };
  }
  return null;
}

/**
 * Class for managing room-related operations.
 */
export class Room {
  private basePath = 'api/v1/rooms';

  /**
   * Constructor for Room.
   * @param restClient - The REST client for HTTP requests.
   * @param queryParser - The query parser for search queries.
   */
  constructor(
    private readonly restClient: IRestClient,
    private readonly queryParser: QueryParser = new QueryParser()
  ) {}

  /**
   * Create a new group room.
   * @param data - Room creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created room or error.
   */
  public async createGroup(data: {
    creatorId: string;
    name: string;
    avatar?: Avatar;
    applicationId?: string;
    membersId?: string[];
    description?: string;
    metadata?: Record<string, any>;
    setting?: Record<string, any>;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>> {
    const validationError = validateRequiredFields(
      { creatorId: data.creatorId, name: data.name },
      'createGroup'
    );
    if (validationError) return validationError;

    const postData = {
      creatorId: data.creatorId,
      avatar: data?.avatar,
      applicationId: data?.applicationId || null,
      name: data.name,
      type: RoomType.GROUP,
      description: data?.description,
      setting: data?.setting,
      guestIds: data?.membersId,
      metaData: data?.metadata,
    };
    return await this.restClient.POST<IRoom>(postData, `${this.basePath}`, authOptions);
  }

  /**
   * Create a new direct message room.
   * @param data - DM room creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created room or error.
   */
  public async createDm(data: {
    name: string;
    applicationId?: string;
    avatar?: Avatar;
    metadata?: Record<string, any>; 
    membersId: string[];
    description?: string;
    setting?: Record<string, any>;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>> {
    const validationError = validateRequiredFields(
      { name: data.name, membersId: data.membersId },
      'createDm'
    );
    if (validationError) return validationError;

    if (data.membersId?.length !== 2) {
      return {
        success: false,
        message: 'DM chats require exactly two recipients',
        statusCode: 400,
        data: null,
      };
    }

    const postData = {
      name: data.name,
      applicationId: data?.applicationId || null,
      avatar: data?.avatar,
      guestIds: data.membersId,
      metaData: data?.metadata,
      type: RoomType.DM,
      description: data?.description,
      setting: data?.setting,
    };
    return await this.restClient.POST<IRoom>(postData, `${this.basePath}`, authOptions);
  }

  /**
   * Update a room's settings.
   * @param data - Room settings update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated room or error.
   */
  public async updateSetting(data: {
    roomId: string;
    setting: Record<string, any>;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>> {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, setting: data.setting },
      'updateSetting'
    );
    if (validationError) return validationError;

    return await this.restClient.PUT<IRoom | null>({ setting: data.setting }, `${this.basePath}/${data.roomId}`, authOptions);
  }

  /**
   * Update a room's description.
   * @param data - Room description update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated room or error.
   */
  public async updateDescription(data: {
    roomId: string;
    description: string;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>> {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, description: data.description },
      'updateDescription'
    );
    if (validationError) return validationError;

    return await this.restClient.PUT<IRoom | null>({ description: data.description }, `${this.basePath}/${data.roomId}`, authOptions);
  }

  /**
   * Update a room's name.
   * @param data - Room name update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated room or error.
   */
  public async updateName(data: {
    roomId: string;
    name: string;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>> {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, name: data.name },
      'updateName'
    );
    if (validationError) return validationError;

    return await this.restClient.PUT<IRoom | null>({ name: data.name }, `${this.basePath}/${data.roomId}`, authOptions);
  }

  /**
   * Get messages for a room.
   * @param data - Message retrieval data.
   * @param authOptions - Authentication options.
   * @returns Response containing the room with messages or error.
   */
  public async getAllMessages(data: {
    roomId: string;
    limit?: number;
    before?: string;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IMessage[] | null>> {
    const validationError = validateRequiredFields({ roomId: data.roomId }, 'getAllMessages');
    if (validationError) return validationError;
    const params = {
      limit: data?.limit ?? 100,
      before: data.before,
    };
    if (data.before !== undefined) params.before = data.before;

    return await this.restClient.GET<IMessage[]>(params, `${this.basePath}/${data.roomId}/messages`, authOptions);
  }

  /**
   * Add one or more guests to a room.
   * @param data - Guest addition data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated room or error.
   */
  public async addGuests(data: {
    roomId: string;
    guestIds: string | string[];
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>> {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, guestIds: data.guestIds },
      'addGuests'
    );
    if (validationError) return validationError;

    const guestsId = Array.isArray(data.guestIds) ? data.guestIds : [data.guestIds];
    return await this.restClient.PUT<IRoom | null>({ guestsId }, `${this.basePath}/${data.roomId}/addGuests`, authOptions);
  }

  /**
   * Get all guests in a room.
   * @param data - Room guest retrieval data.
   * @param authOptions - Authentication options.
   * @returns Response containing the room guests or error.
   */
  public async getAllGuests(data: {
    roomId: string;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoomGuests[] | null>> {
    const validationError = validateRequiredFields({ roomId: data.roomId }, 'getAllGuests');
    if (validationError) return validationError;

    return await this.restClient.GET<IRoomGuests[] | null>(null, `${this.basePath}/${data.roomId}/guests`, authOptions);
  }

  /**
   * Remove one or more guests from a room.
   * @param data - Guest removal data.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  public async removeGuests(data: {
    roomId: string;
    guestsId: string | string[];
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<null>> {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, guestsId: data.guestsId },
      'removeGuests'
    );
    if (validationError) return validationError;

    const guestsId = Array.isArray(data.guestsId) ? data.guestsId : [data.guestsId];
    return await this.restClient.DELETE<null>({ guestsId }, `${this.basePath}/${data.roomId}/guests`, authOptions);
  }

  /**
   * Search for a single room.
   * @param data - Room search data.
   * @param authOptions - Authentication options.
   * @returns Response containing the found room or error.
   */
  public async findFirst(data: {
    roomId: string;
    query: SearchQuery;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>> {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, query: data.query },
      'findFirst'
    );
    if (validationError) return validationError;

    try {
      const prismaQuery = this.queryParser.parseSearchQuery(data.query);
      return await this.restClient.GET<IRoom | null>({ query: prismaQuery }, `${this.basePath}/findFirst`, authOptions);
    } catch (error: any) {
        return {
          success: false,
          message: `Failed to parse room search query: ${error.message}`,
          statusCode: 400,
          data: null,
        };
      }
    }

  /**
   * Search for multiple rooms.
   * @param data - Room search data.
   * @param authOptions - Authentication options.
   * @returns Response containing the found rooms or error.
   */
  public async findMany(data: {
    roomId: string;
    query: SearchQuery;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom[] | null>> {
    const validationError = validateRequiredFields(
      { roomId: data.roomId, query: data.query },
      'findMany'
    );
    if (validationError) return validationError;

    try {
      const prismaQuery = this.queryParser.parseSearchQuery(data.query);
      return await this.restClient.GET<IRoom[] | null>({ query: prismaQuery }, `${this.basePath}/findMany`, authOptions);
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to parse room search query: ${error.message}`,
        statusCode: 400,
        data: null,
      };
    }
  }
}
