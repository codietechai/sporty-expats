import { backendClient } from "@/client/backendClient";

export const GET_CHAT_TOKEN_KEY = "get-chat-token";

export const getChatToken = async (): Promise<string> => {
    const response = await backendClient.get<{ token: string }>("/chat/token");
    return response.data.token;
};
