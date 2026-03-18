import { backendClient } from "../../backendClient";

export const GET_USER_DETAILS_BY_CLERK_ID= "get-user-details-by-clerk-id"
export const getUserDetailsByClerkId = async (userClerkId:string) => {
  try {
    const response = await backendClient.get(`/users/clerk/${userClerkId}`);
    return response;

  } catch (error) {
    console.log('error getUserDetailsByClerkId',error)
    throw error;
  } finally {
  }
};
