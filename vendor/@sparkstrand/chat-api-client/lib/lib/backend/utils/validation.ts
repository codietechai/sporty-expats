import { IResponse } from "../../types";

/**
 * Utility function to validate required fields.
 * @param fields - Object containing fields to validate.
 * @param context - Context for error message.
 * @returns Error response if validation fails, null otherwise.
 */
export function validateRequiredFields(fields: Record<string, any>, context: string): IResponse<null> | null {
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