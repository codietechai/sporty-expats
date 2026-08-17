import { backendClient } from "../../backendClient";

export const GET_USER_BY_ID= "get-user-by-token"
export const getUserById = async () => {
  try {
    const response = await backendClient.get(`/users/me/`);
    return response;
  } catch (error) {
    throw error;
  }
};
