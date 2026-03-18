import { backendClient } from "../../backendClient";

export const GET_ALL_POSTS= "get-all-posts"
export const getAllPosts = async () => {
  try {
    const response = await backendClient.get(`/posts`);
    return response;
  } catch (error) {
    throw error;
  } finally {
  }
};
