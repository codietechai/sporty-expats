import { backendClient } from "../../backendClient";

export const GET_USER_BY_ID= "get-user-by-token"
export const getUserById = async () => {

  try {
    const response = await backendClient.get(`/users/me/`);
    console.log(JSON.stringify(response,null,2))
    return response;
  } catch (error) {
    throw error;
  } finally {
  }
};
