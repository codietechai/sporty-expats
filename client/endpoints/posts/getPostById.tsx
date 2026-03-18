import { backendClient } from "../../backendClient";

export const GET_POST_BY_ID= "get-all-post-by-id"
export const getPostsById = async (id: string) => {

  try {
    const response = await backendClient.get(`/user/post/${id}`);
    return response;
  } catch (error) {
    throw error;
  } finally {
  }
};
