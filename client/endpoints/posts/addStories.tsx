import { backendClient } from "../../backendClient";

export const createStory = async (userId: string, file: { uri: string; name: string; type: string }) => {
  const formData = new FormData();
  formData.append("file", { uri: file.uri, name: file.name, type: file.type } as any);

  const response = await backendClient.post(
    `/users/${userId}/stories`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};
