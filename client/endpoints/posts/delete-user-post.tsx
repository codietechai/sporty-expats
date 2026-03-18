import { backendClient } from '@/client/backendClient';
import { useGlobalLoader } from '@/hooks';

export const DELETE_POST_KEY = 'delete-post-key';

export const deletePostRequest = async (ids: string[]) => {
  try {
    const response = await backendClient.delete(`/admin/post/delete-post`, {
      data: { ids },
    });
    return response;
  } catch (error) {
    throw error;
  } finally {
  }
};
