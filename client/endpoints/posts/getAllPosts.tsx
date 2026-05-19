import { backendClient } from "../../backendClient";

export const GET_ALL_POSTS= "get-all-posts"
export const getAllPosts = async (userId?: string) => {
  try {
    const response = await backendClient.get(`/posts`, {
      params: userId ? { userId } : undefined,
    });
    return response;
  } catch (error) {
    throw error;
  } finally {
  }
};
