import { backendClient } from "../../backendClient";

export const createStories = async (data: any) => {
  try {
    const response = await backendClient.post("/stories/", data);
    return response;
  } catch (error) {
    throw error;
  } finally {
  }
};
