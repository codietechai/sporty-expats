import { backendClient } from "@/client/backendClient";

export const addProfilePhoto = async (userId: string, data: any) => {
  try {
    const response = await backendClient.post(
      `/users/${userId}/profilePicture`,
      data
    );
    console.log(response);
    return response;
  } catch (error) {
    console.log("updateUser Api Error", error);
    throw error;
  } finally {
  }
};

export const getProfilePhoto = async (userId: string) => {
  try {
    const response = await backendClient.get(`/users/${userId}/profilePicture`);
    console.log(response);
    return response;
  } catch (error) {
    console.log("getProfilePhoto Api Error", error);
    throw error;
  } finally {
  }
};
