import { IResponse, IGuestMetaData, IGuest, IGuestLogin, IRoom, RestClientAuthOptions, RoomType } from '../types';
import { IRestClient } from './restful.client';
import { validateRequiredFields } from './utils/validation';



/**
 * Class for managing guest-related operations.
 */
export class Guest {
  private basePath = 'api/v1/guests';
  private isLogin = false;

  /**
   * Constructor for Guest.
   * @param restClient - The REST client for HTTP requests.
   */
  constructor(private readonly restClient: IRestClient) {}

  /**
   * Upsert a guest.
   * @param data - Guest metadata.
   * @param authOptions - Authentication options.
   * @returns Response containing the guest data or error.
   */
  public async upsert(data: IGuestMetaData, authOptions?: RestClientAuthOptions): Promise<IResponse<IGuest | null>> {
    const validationError = validateRequiredFields(
      { externalId: data.externalId, name: data.name, username: data.username },
      'upsert'
    );
    if (validationError) return validationError;

    return await this.restClient.POST<IGuest | null>({ metaData: data }, `${this.basePath}/upsert`, authOptions);
  }

  /**
   * Update a guest's metadata.
   * @param id - Guest Id
   * @param data - Partial guest metadata for update.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated guest or error.
   */
  public async update(id: string, data: Partial<IGuestMetaData>, authOptions?: RestClientAuthOptions): Promise<IResponse<IGuest | null>> {
    const validationError = validateRequiredFields({ externalId: data.externalId, id }, 'update');
    if (validationError) return validationError;

    if (!Object.keys(data).some(key => key !== 'externalId')) {
      return {
        success: false,
        message: 'No fields provided for update',
        statusCode: 400,
        data: null,
      };
    }

    return await this.restClient.PUT<IGuest | null>({ guestId: id, metaData: data }, `${this.basePath}/update`, authOptions);
  }

  /**
   * Login a guest with their ID.
   * @param id - Guest ID or external ID.
   * @param authOptions - Authentication options.
   * @returns Response containing login data or error.
   */
  public async login(id: string, authOptions?: RestClientAuthOptions): Promise<IResponse<IGuestLogin | null>> {
    const validationError = validateRequiredFields({ id }, 'login');
    if (validationError) return validationError;

    const result = await this.restClient.POST<IGuestLogin | null>({ id }, `${this.basePath}/login`, authOptions);
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
  public async logout(): Promise<IResponse<null>> {
    this.restClient.setToken(undefined);
    this.isLogin = false;
    return {
      success: true,
      message: 'Logged out successfully',
      statusCode: 200,
      data: null,
    };
  }

  /**
   * Get the current guest information.
   * @param id  - Guest Id
   * @param authOptions - Authentication options.
   * @returns Response containing the guest data or error.
   */
  public async getInfo(id: string, authOptions?: RestClientAuthOptions): Promise<IResponse<IGuest | null>> {
    const validationError = validateRequiredFields({ id }, 'getInfo');
    if (validationError) return validationError;
    return await this.restClient.GET<IGuest | null>({guestId: id}, `${this.basePath}`, authOptions);
  }

  /**
   * Get a guest by their external ID.
   * @param externalId - External ID of the guest.
   * @param authOptions - Authentication options.
   * @returns Response containing the guest data or error.
   */
  public async getByExternalId(externalId: string, authOptions?: RestClientAuthOptions): Promise<IResponse<IGuest | null>> {
    const validationError = validateRequiredFields({ externalId }, 'getByExternalId');
    if (validationError) return validationError;

    return await this.restClient.GET<IGuest | null>(null, `${this.basePath}/${externalId}`, authOptions);
  }

  /**
   * List all rooms for the current guest.
   * @param id  - Guest Id
   * @param authOptions - Authentication options.
   * @returns Response containing the rooms or error.
   */
  public async listRooms(id: string, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom[]>> {
    const validationError = validateRequiredFields({id}, 'listRooms');
    if(validationError) return {...validationError, data: []}
    return await this.restClient.GET<IRoom[]>({ guestId: id }, `${this.basePath}/rooms`, authOptions);
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
  public async isMemberOfRoom(id: string, roomId: string, authOptions?: RestClientAuthOptions): Promise<IResponse<boolean>> {
    const validationError = validateRequiredFields({ roomId, id }, 'isMemberOfRoom');
    if (validationError) return { ...validationError, data: false };
    return await this.restClient.GET<boolean>({guestId: id}, `${this.basePath}/rooms/${roomId}/isMember`, authOptions);
  }

  /**
   * Create a room as the current guest.
   * @param data - Room creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created room or error.
   */
  public async createRoom(data: {
    name: string;
    type: RoomType;
    description?: string;
    creatorId?: string; 
    membersId?: string[];
    applicationId?: string;
    setting?: Record<string, any>;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>> {
    const validationError = validateRequiredFields({ name: data.name, type: data.type }, 'createRoom');
    if (validationError) return validationError;

    if (data.type === RoomType.DM && data.membersId?.length !== 2) {
      return {
        success: false,
        message: 'Room of type dm require exactly two recipients',
        statusCode: 400,
        data: null,
      };
    }
    if(data.type === RoomType.GROUP && !data.creatorId){
      return {
        success: false,
        message: 'Room of type group require creatorId field',
        statusCode: 400,
        data: null
      }
    }

    const postData: any = {
      name: data.name,
      type: data.type,
      description: data?.description,
      guestsId: data?.membersId,
      applicationId: data?.applicationId,
      setting: data?.setting,
    };
    if(data.creatorId) postData.creatorId = data.creatorId;
    
    return await this.restClient.POST<IRoom | null>(postData, `${this.basePath}/rooms`, authOptions);
  }

  /**
   * Update a room as the current guest.
   * @param data - Room update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated room or error.
   */
  public async updateRoom(data: {
    roomId: string;
    name?: string;
    description?: string;
    setting?: Record<string, any>;
  }, authOptions?: RestClientAuthOptions): Promise<IResponse<IRoom | null>> {
    const validationError = validateRequiredFields({ roomId: data.roomId }, 'updateRoom');
    if (validationError) return validationError;

    // if (!this.isLogin || !this.restClient.getToken()) {
    //   return {
    //     success: false,
    //     message: 'Not logged in. Call login() before using this method.',
    //     statusCode: 401,
    //     data: null,
    //   };
    // }

    if (!data.name && !data.description && !data.setting) {
      return {
        success: false,
        message: 'No fields provided for room update',
        statusCode: 400,
        data: null,
      };
    }

    const postData = {
      name: data.name,
      description: data?.description,
      setting: data?.setting,
    };
    return await this.restClient.PUT<IRoom | null>(postData, `${this.basePath}/rooms/${data.roomId}`, authOptions);
  }
}
