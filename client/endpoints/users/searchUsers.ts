import { backendClient } from "@/client/backendClient";

export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  imageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Search users by name, username, or email.
 * Maps to GET /users/search/users?q=<query>&limit=<limit>
 */
export async function searchUsers(
  query: string,
  limit = 8,
): Promise<UserSearchResult[]> {
  const response = await backendClient.get("/users/search/users", {
    params: { q: query, limit },
  });
  const data = response.data?.data ?? response.data ?? [];
  return Array.isArray(data) ? data : [];
}
