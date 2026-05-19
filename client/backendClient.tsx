// client/backendClient.ts
import axios from "axios";

let authInterceptorId: number | null = null;

export const backendClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const getSafeHeadersForLog = (headers: any) => {
  const rawHeaders =
    typeof headers?.toJSON === "function" ? headers.toJSON() : { ...headers };

  if (rawHeaders.Authorization) {
    rawHeaders.Authorization = "Bearer <present>";
  }

  if (rawHeaders.authorization) {
    rawHeaders.authorization = "Bearer <present>";
  }

  return rawHeaders;
};

export const setUpAuthInterceptor = (getToken: () => Promise<string | null>) => {
  if (authInterceptorId !== null) {
    backendClient.interceptors.request.eject(authInterceptorId);
  }

  authInterceptorId = backendClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to get Clerk token:", error);
      }

      console.log("[SportyExpats app request headers]", {
        method: config.method?.toUpperCase(),
        baseURL: config.baseURL,
        url: config.url,
        headers: getSafeHeadersForLog(config.headers),
      });

      return config;
    },
    (error) => Promise.reject(error)
  );
};
