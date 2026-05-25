import { backendClient } from "../../backendClient";

export const GET_ALL_POSTS= "get-all-posts"

interface PaginationParams {
  page?: number;
  limit?: number;
}

export const getAllPosts = async (userId?: string, pagination?: PaginationParams) => {
  try {
    const params: any = {};
    
    if (userId) {
      params.userId = userId;
    }
    
    if (pagination) {
      if (pagination.page) params.page = pagination.page;
      if (pagination.limit) params.limit = pagination.limit;
    }
    
    const response = await backendClient.get(`/posts`, {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response;
  } catch (error) {
    throw error;
  }
};
