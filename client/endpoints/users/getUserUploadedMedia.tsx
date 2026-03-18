import { backendClient } from "../../backendClient";

export const GET_UPLOADED_MEDIA_BY_USER= "get-uploaded-media-by-user"
export const getUploadedMediaByUser = async (userId:string) => {
  try {
    const response = await backendClient.get(`/users/${userId}/files`);
    return response;
  } catch (error) {
    throw error;
  } finally {
  }
};
