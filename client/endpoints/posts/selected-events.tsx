import { backendClient } from "../../backendClient";

export const GET_SELECTED_EVENTS_BY_ID = "get-selected-events";
export const getSelectedEvents = async () => {
  try {
    const response = await backendClient.get(`/events`);
    return response;
  } catch (error) {
    throw error;
  } finally {
  }
};
