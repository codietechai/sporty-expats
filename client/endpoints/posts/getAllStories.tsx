import { backendClient } from "../../backendClient";

export const GET_ALL_STORIES= "get-all-stories"
export const getAllStories = async () => {
  try {
    const response = await backendClient.get(`/stories`);
    return response;
  } catch (error) {
    throw error;
  } finally {
  }
};
