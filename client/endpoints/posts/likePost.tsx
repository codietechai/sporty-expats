import { backendClient } from "@/client/backendClient";

export const likePost = async (id: string) => {
  try {

    const response = await backendClient.post(`/posts/${id}/likes`);
    return response.data;
  } catch (error: any) {
    console.error("Like post request failed:", error?.response?.data || error?.message || error);
    throw error;
  }
};
