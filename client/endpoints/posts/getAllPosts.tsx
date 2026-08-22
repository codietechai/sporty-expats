import { backendClient } from "../../backendClient";

export const GET_ALL_POSTS = "get-all-posts";

export interface PostsParams {
  limit?: number;
  /** Cursor returned by the previous page — pass to fetch the next page */
  startingAfter?: string;
}

export const getAllPosts = async (userId?: string, params?: PostsParams) => {
  const query: Record<string, any> = {};

  if (userId) query.userId = userId;
  if (params?.limit) query.limit = params.limit;
  if (params?.startingAfter) query.startingAfter = params.startingAfter;

  const response = await backendClient.get(`/posts`, {
    params: Object.keys(query).length > 0 ? query : undefined,
  });
  return response;
};
