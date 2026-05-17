import { backendClient } from "@/client/backendClient";

export const reactToPost = async (postId: string, emoji: string) => {
    const response = await backendClient.post(`/posts/${postId}/reactions`, { emoji });
    return response.data;
};

export const bookmarkPost = async (postId: string) => {
    const response = await backendClient.post(`/posts/${postId}/bookmarks`);
    return response.data;
};

export const addComment = async (
    userId: string,
    postId: string,
    comment: string,
    parentId?: string
) => {
    const formData = new FormData();
    formData.append("comment", comment);
    if (parentId) formData.append("parentId", parentId);

    const response = await backendClient.post(
        `/users/${userId}/posts/${postId}/comments`,
        formData
        // Do NOT set Content-Type manually — Axios + React Native sets the
        // multipart/form-data boundary automatically when it's omitted.
    );
    return response.data;
};

export const getPostComments = async (postId: string) => {
    const response = await backendClient.get(`/posts/${postId}/comments`);
    return response.data;
};
