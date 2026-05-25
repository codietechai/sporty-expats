import { backendClient } from "../../backendClient";

export interface CreateUserData {
  clerkId: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export const createUser = async (userData: CreateUserData) => {
  try {
    console.log('Creating user with data:', userData);
    const response = await backendClient.post('/users/', userData);
    console.log('User created successfully:', response);
    return response;
  } catch (error: any) {
    console.error('Error creating user:', {
      status: error?.response?.status,
      message: error?.message,
      data: error?.response?.data
    });
    throw error;
  }
};