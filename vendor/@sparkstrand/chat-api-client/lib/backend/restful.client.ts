import { IResponse, RestClientOptions, RestClientAuthOptions } from '../types';
import { Room } from './room.class';
import { Guest } from './guest.class';
import { Companies } from './company.class';
import { Users } from './user.class';
import { Messages } from './message.class';

/**
 * Interface for REST client implementations.
 */
export interface IRestClient {
  setToken(token?: string): void;
  getToken(): string | undefined;
  setApiCredentials(apiKey: string, apiKeySecret: string): void;
  POST<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
  PUT<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
  GET<T>(params: Record<string, any> | null, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
  DELETE<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>>;
}

/**
 * Client for making RESTful API calls to the chat server.
 */
export class RestClient implements IRestClient {
  private baseUrl: string;
  private apiKey?: string;
  private apiKeySecret?: string;
  private token?: string;
  private debug: boolean;
  private readonly timeoutMs: number = 10000; // 10 seconds timeout
  public room: Room;
  public guest: Guest;
  public companies: Companies;
  public user: Users;
  public messages: Messages;

  /**
   * Constructor for RestClient.
   * @param options - Configuration options for the REST client.
   * @throws Error if baseUrl is invalid.
   */
  constructor(options: RestClientOptions) {
    // Validate baseUrl
    try {
      new URL(options.baseUrl);
    } catch {
      throw new Error('Invalid baseUrl provided');
    }

    this.baseUrl = options.baseUrl.replace(/\/$/, ''); 
    this.apiKey = options.apiKey;
    this.apiKeySecret = options.apiKeySecret;
    this.token = options.token;
    this.debug = options.debug || false;
    this.room = new Room(this);
    this.guest = new Guest(this);
    this.companies = new Companies(this);
    this.user = new Users(this);
    this.messages = new Messages(this);
  }

  /**
   * Set the authentication token.
   * @param token - The authentication token.
   */
  public setToken(token?: string): void {
    this.token = token;
    this.log('Token set');
  }

  public getToken(): string | undefined {
    return this.token;
  }

  /**
   * Set the API key and secret.
   * @param apiKey - The API key.
   * @param apiKeySecret - The API key secret.
   */
  public setApiCredentials(apiKey: string, apiKeySecret: string): void {
    this.apiKey = apiKey;
    this.apiKeySecret = apiKeySecret;
    this.log('API credentials set');
  }

  /**
   * Get headers for API requests.
   * @param authOptions - Authentication options.
   * @returns Headers object.
   */
  private getHeaders(authOptions: RestClientAuthOptions = { token: false, apiKey: true, apiKeySecret: true }): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!authOptions.token && !authOptions.apiKey && !authOptions.apiKeySecret) {
      return headers;
    }

    if (authOptions.token && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    if (authOptions.apiKey && this.apiKey) {
      headers['X-RESTCLIENT'] = 'true';
      headers['X-API-Key'] = this.apiKey;
    }

    if (authOptions.apiKeySecret && this.apiKeySecret) {
      headers['X-API-Secret'] = this.apiKeySecret;
    }

    return headers;
  }

  /**
   * Handle API response.
   * @param response - Fetch response.
   * @returns Parsed response data.
   * @throws Error if response is invalid.
   */
  private async handleResponse<T>(response: Response): Promise<IResponse<T>> {
    try {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response, got ${contentType}`);
      }

      const data = await response.json() as IResponse<T>;
      if (!data || typeof data.success !== 'boolean' || typeof data.statusCode !== 'number') {
        throw new Error('Invalid response format');
      }

      this.log(`Response received: ${response.status} ${response.statusText}`, data);
      return data;
    } catch (error: any) {
      throw new Error(`Failed to handle response: ${error.message}`);
    }
  }

  /**
   * Log debug messages.
   * @param message - Message to log.
   * @param data - Optional data to log.
   */
  private log(message: string, data?: any): void {
    if (!this.debug) return;
    console.log(`[RestClient] ${message}`, data || '');
  }

  /**
   * POST request.
   * @param data - Data to send.
   * @param path - API path.
   * @param authOptions - Authentication options.
   * @returns Promise with the response.
   */
  public async POST<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      this.log(`POST ${path}`, data);
      const response = await fetch(`${this.baseUrl}/${path}`, {
        method: 'POST',
        headers: this.getHeaders(authOptions),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      throw new Error(`POST request failed: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * PUT request.
   * @param data - Data to send.
   * @param path - API path.
   * @param authOptions - Authentication options.
   * @returns Promise with the response.
   */
  public async PUT<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      this.log(`PUT ${path}`, data);
      const response = await fetch(`${this.baseUrl}/${path}`, {
        method: 'PUT',
        headers: this.getHeaders(authOptions),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      throw new Error(`PUT request failed: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * GET request.
   * @param params - Query parameters.
   * @param path - API path.
   * @param authOptions - Authentication options.
   * @returns Promise with the response.
   */
  public async GET<T>(params: Record<string, any> | null, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let url = `${this.baseUrl}/${path}`;
      if (params) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            query.append(key, String(value));
          }
        }
        url += `?${query.toString()}`;
      }

      this.log(`GET ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(authOptions),
        signal: controller.signal,
      });
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      throw new Error(`GET request failed: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * DELETE request.
   * @param data - Data to send.
   * @param path - API path.
   * @param authOptions - Authentication options.
   * @returns Promise with the response.
   */
  public async DELETE<T>(data: any, path: string, authOptions?: RestClientAuthOptions): Promise<IResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      this.log(`DELETE ${path}`, data);
      const response = await fetch(`${this.baseUrl}/${path}`, {
        method: 'DELETE',
        headers: this.getHeaders(authOptions),
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      throw new Error(`DELETE request failed: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
