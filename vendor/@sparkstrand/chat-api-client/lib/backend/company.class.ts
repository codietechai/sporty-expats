import { IResponse, ICompany, IAccessKey, ICompanyInput, IAccessKeyInput, ICompanyDomainsInput, RestClientAuthOptions } from '../types';
import { IRestClient } from './restful.client';
import { validateRequiredFields } from './utils/validation';



/**
 * Class for managing company-related operations.
 */
export class Companies {
  private basePath = 'api/v1/companies';

  /**
   * Constructor for Companies.
   * @param restClient - The REST client for HTTP requests.
   */
  constructor(private readonly restClient: IRestClient) {}

  /**
   * Create a new company.
   * @param data - Company creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created company or error.
   */
  public async create(
    data: ICompanyInput,
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<ICompany | null>> {
    const validationError = validateRequiredFields(
      {
        name: data.name,
        website: data.website,
        industry: data.industry,
        domains: data.domains,
        monthlySpend: data.monthlySpend,
        location: data.location,
        accountId: data.accountId,
      },
      'create company'
    );
    if (validationError) return validationError;

    return await this.restClient.POST<ICompany | null>(data, `${this.basePath}`, authOptions);
  }

  /**
   * Update an existing company.
   * @param companyId - The ID of the company to update.
   * @param data - Company update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated company or error.
   */
  public async update(
    companyId: string,
    data: Partial<ICompanyInput>,
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<ICompany | null>> {
    const validationError = validateRequiredFields({ companyId }, 'update company');
    if (validationError) return validationError;

    if (!Object.keys(data).length) {
      return {
        success: false,
        message: 'No fields provided for company update',
        statusCode: 400,
        data: null,
      };
    }

    return await this.restClient.PUT<ICompany | null>(data, `${this.basePath}/${companyId}`, authOptions);
  }

  /**
   * Generate an access key for a company.
   * @param companyId - The ID of the company.
   * @param data - Access key creation data.
   * @param authOptions - Authentication options.
   * @returns Response containing the created access key or error.
   */
  public async generateAccessKey(
    companyId: string,
    data: IAccessKeyInput,
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<IAccessKey | null>> {
    const validationError = validateRequiredFields(
      {
        companyId,
        name: data.name,
        status: data.status,
        expiresAt: data.expiresAt,
        accountId: data.accountId,
        roleName: data.roleName,
      },
      'generate access key'
    );
    if (validationError) return validationError;

    return await this.restClient.POST<IAccessKey | null>(data, `${this.basePath}/${companyId}/accesskey`, authOptions);
  }

  /**
   * Update an existing access key for a company.
   * @param companyId - The ID of the company.
   * @param data - Access key update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated access key or error.
   */
  public async updateAccessKey(
    companyId: string,
    data: Partial<IAccessKeyInput>,
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<IAccessKey | null>> {
    const validationError = validateRequiredFields({ companyId }, 'update access key');
    if (validationError) return validationError;

    if (!Object.keys(data).length) {
      return {
        success: false,
        message: 'No fields provided for access key update',
        statusCode: 400,
        data: null,
      };
    }

    return await this.restClient.PUT<IAccessKey | null>(data, `${this.basePath}/${companyId}/accesskey`, authOptions);
  }

  /**
   * Delete an access key for a company.
   * @param companyId - The ID of the company.
   * @param data - Access key deletion data.
   * @param authOptions - Authentication options.
   * @returns Response indicating success or error.
   */
  public async deleteAccessKey(
    companyId: string,
    data: { apiKey: string; apiKeySecret: string },
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<null>> {
    const validationError = validateRequiredFields(
      { companyId, apiKey: data.apiKey, apiKeySecret: data.apiKeySecret },
      'delete access key'
    );
    if (validationError) return validationError;

    return await this.restClient.DELETE<null>(data, `${this.basePath}/${companyId}/accesskey`, authOptions);
  }

  /**
   * Retrieve an access key for a company.
   * @param companyId - The ID of the company.
   * @param data - Access key retrieval data.
   * @param authOptions - Authentication options.
   * @returns Response containing the access key or error.
   */
  public async getAccessKey(
    companyId: string,
    data: { key: string; accountId: string },
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<IAccessKey | null>> {
    const validationError = validateRequiredFields(
      { companyId, key: data.key, accountId: data.accountId },
      'get access key'
    );
    if (validationError) return validationError;

    return await this.restClient.GET<IAccessKey | null>(
      { key: data.key, accountId: data.accountId },
      `${this.basePath}/${companyId}/accesskey`,
      authOptions
    );
  }

  /**
   * Retrieve a company by ID.
   * @param companyId - The ID of the company.
   * @param authOptions - Authentication options.
   * @returns Response containing the company or error.
   */
  public async get(
    companyId: string,
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<ICompany | null>> {
    const validationError = validateRequiredFields({ companyId }, 'get company');
    if (validationError) return validationError;

    return await this.restClient.GET<ICompany | null>(null, `${this.basePath}/${companyId}`, authOptions);
  }

  /**
   * Update a company's domains.
   * @param companyId - The ID of the company.
   * @param data - Domains update data.
   * @param authOptions - Authentication options.
   * @returns Response containing the updated company or error.
   */
  public async updateDomains(
    companyId: string,
    data: ICompanyDomainsInput,
    authOptions: RestClientAuthOptions = { token: true, apiKey: false, apiKeySecret: false }
  ): Promise<IResponse<ICompany | null>> {
    const validationError = validateRequiredFields(
      { companyId, domainsToAdd: data.domainsToAdd, domainsToRemove: data.domainsToRemove },
      'update domains'
    );
    if (validationError) return validationError;

    return await this.restClient.PUT<ICompany | null>(data, `${this.basePath}/${companyId}/domains`, authOptions);
  }
}