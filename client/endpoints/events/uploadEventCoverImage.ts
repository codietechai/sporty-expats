import { backendClient } from "@/client/backendClient";

export type UploadedEventCoverImage = {
    filename: string;
    fileUrl: string;
};

export type EventCoverImageFile = {
    uri: string;
    name: string;
    type: string;
};

export const uploadEventCoverImage = async (
    userId: string,
    file: EventCoverImageFile
): Promise<UploadedEventCoverImage> => {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
    } as any);

    const response = await backendClient.post<UploadedEventCoverImage>(
        "/fileupload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
};
