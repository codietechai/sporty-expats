import { backendClient } from "@/client/backendClient";

export type LocationSuggestion = {
  place_id: number | string;
  lat: string;
  lon: string;
  display_name: string;
};

export const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
  if (query.trim().length < 3) return [];
  const response = await backendClient.get<LocationSuggestion[]>("/location", {
    params: { q: query },
  });
  return Array.isArray(response.data) ? response.data : [];
};
