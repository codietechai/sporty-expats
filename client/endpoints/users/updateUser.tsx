import { backendClient } from "../../backendClient";

export const updateUser = async (userId:string,data: any) => {
  try {
    const response = await backendClient.put(`/users/${userId}`, data);
    console.log(response)
    return response;
  } catch (error) {
    console.log('updateUser Api Error',error)
    throw error;
  } finally {
  }
};
