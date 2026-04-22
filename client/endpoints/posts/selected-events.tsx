import { backendClient } from "../../backendClient";

export const GET_SELECTED_EVENTS_BY_ID = "get-selected-events";

export const getSelectedEvents = async (
  userId: string,
  params: { startingAfter?: string } = {}
) => {
  const query = new URLSearchParams();
  if (params.startingAfter) query.set("startingAfter", params.startingAfter);

  const response = await backendClient.get(
    `/users/${userId}/events/selected?${query.toString()}`
  );
  return response;
};
