import { backendClient } from "@/client/backendClient";

export type SelectableUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role?: string;
};

const unwrapUsers = (payload: any): SelectableUser[] => {
  const users = payload?.data?.data ?? payload?.data ?? payload ?? [];
  return Array.isArray(users) ? users : [];
};

export const getUsers = async (limit = 1000): Promise<SelectableUser[]> => {
  const response = await backendClient.get("/users", { params: { limit } });
  return unwrapUsers(response.data);
};
