import { IResponse, IUser, IUserSignupInput, IUserSigninInput, IUserUpdateInput, IUserChangePasswordInput, IUserLogin, RestClientAuthOptions } from '../types';
import { IRestClient } from './restful.client';
import { validateRequiredFields } from './utils/validation';



/**
 * Class for managing user-related operations.
 */
export class Users {
  private basePath = 'api/v1/users';
  private isLogin = false;

  /**
   * Constructor for Users.
   * @param restClient - The REST client for HTTP requests.
   */
  constructor(private readonly restClient: IRestClient) {}

  /**
   * Sign up a new user.
   * @param data - User signup data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created user or error.
   */
  public async signup(
    data: IUserSignupInput,
    authOptions: RestClientAuthOptions = { token: false, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<IUser | null>> {
    const validationError = validateRequiredFields(
      {
        username: data.username,
        email: data.email,
        password: data.password,
      },
      'signup'
    );
    if (validationError) return validationError;

    return await this.restClient.POST<IUser | null>(data, `${this.basePath}/signup`, authOptions);
  }

  /**
   * Sign in an existing user.
   * @param data - User signin data.
   * @param authOptions - Authentication options.
   * @returns Response containing login data or error.
   */
  public async signin(
    data: IUserSigninInput,
    authOptions: RestClientAuthOptions = { token: false, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<IUserLogin | null>> {
    const validationError = validateRequiredFields(
      {
        email: data.email,
        password: data.password,
      },
      'signin'
    );
    if (validationError) return validationError;

    const result = await this.restClient.POST<IUserLogin | null>(data, `${this.basePath}/signin`, authOptions);
    if (result.success && result.data) {
      this.restClient.setToken(result.data.token);
      this.isLogin = true;
    }
    return result;
  }

  /**
   * Sign out the current user.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  public async signout(
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<null>> {
    if (!this.isLogin || !this.restClient.getToken()) {
      return {
        success: false,
        message: 'Not logged in. Call signin() before using this method.',
        statusCode: 401,
        data: null,
      };
    }

    const result = await this.restClient.POST<null>(null, `${this.basePath}/signout`, authOptions);
    if (result.success) {
      this.restClient.setToken(undefined);
      this.isLogin = false;
    }
    return result;
  }

  /**
   * Update the current user's information.
   * @param data - User update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated user or error.
   */
  public async update(
    data: IUserUpdateInput,
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<IUser | null>> {
    if (!this.isLogin || !this.restClient.getToken()) {
      return {
        success: false,
        message: 'Not logged in. Call signin() before using this method.',
        statusCode: 401,
        data: null,
      };
    }

    if (!Object.keys(data).length) {
      return {
        success: false,
        message: 'No fields provided for user update',
        statusCode: 400,
        data: null,
      };
    }

    return await this.restClient.PUT<IUser | null>(data, `${this.basePath}/update`, authOptions);
  }

  /**
   * Change the current user's password.
   * @param data - Password change data.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  public async changePassword(
    data: IUserChangePasswordInput,
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<null>> {
    const validationError = validateRequiredFields(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      'change password'
    );
    if (validationError) return validationError;

    if (!this.isLogin || !this.restClient.getToken()) {
      return {
        success: false,
        message: 'Not logged in. Call signin() before using this method.',
        statusCode: 401,
        data: null,
      };
    }

    return await this.restClient.PUT<null>(data, `${this.basePath}/password/change`, authOptions);
  }

  /**
   * Delete the current user account.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  public async delete(
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<null>> {
    if (!this.isLogin || !this.restClient.getToken()) {
      return {
        success: false,
        message: 'Not logged in. Call signin() before using this method.',
        statusCode: 401,
        data: null,
      };
    }

    const result = await this.restClient.DELETE<null>(null, `${this.basePath}`, authOptions);
    if (result.success) {
      this.restClient.setToken(undefined);
      this.isLogin = false;
    }
    return result;
  }
}