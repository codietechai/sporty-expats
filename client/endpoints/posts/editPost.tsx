import { useGlobalLoader } from "../../../hooks";
import { backendClient } from "../../backendClient";

export const editPost = async (data: any) => {
  useGlobalLoader.getState().setShowLoader(true);
  try {
    const response = await backendClient.put(`/user/posts/`, data);
    return response;
  } catch (error) {
    throw error;
  } finally {
    useGlobalLoader.getState().setShowLoader(false);
  }
};
