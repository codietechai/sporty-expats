import { backendClient } from "../../backendClient";

export const createPost = async (userId:string,data: any) => {
  try {
    console.log('67dd52e6d07e8bf73189be48',JSON.stringify(data,null,2))
    const response = await backendClient.post(`/user/67dd52e6d07e8bf73189be48/posts`, data);
    console.log(response)
    return response;
  } catch (error) {
    console.log(error)
    throw error;
  } finally {
  }
};
