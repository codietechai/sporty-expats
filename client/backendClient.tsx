// client/backendClient.ts
import axios from "axios";

export const backendClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const setUpAuthInterceptor = (getToken: () => Promise<string | null>) => {
  backendClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        console.log("dd", token)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to get Clerk token:", error);
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
};
