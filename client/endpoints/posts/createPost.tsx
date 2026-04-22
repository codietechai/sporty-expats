import { backendClient } from "../../backendClient";

/**
 * Creates a new post.
 * Mirrors web's createPostService — sends multipart/form-data with
 * a JSON "post" field and file attachments.
 */
export const createPost = async (
  userId: string,
  payload: {
    description: string;
    privacy: "Public" | "Private";
    files: { uri: string; name: string; type: string }[];
  }
) => {
  const formData = new FormData();

  // JSON post object — same as web
  formData.append(
    "post",
    JSON.stringify({ description: payload.description, privacy: payload.privacy })
  );

  // Attach each file as a blob
  payload.files.forEach((file) => {
    formData.append("files", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
  });

  const response = await backendClient.post(
    `/users/${userId}/posts`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return response.data;
};
