import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-expo";
import { getUserById } from "@/client/endpoints/users/getUserById";
import { backendClient } from "@/client/backendClient";

interface UserContextValue {
  userDb: any;
  loading: boolean;
  error: any;
  refresh: () => void;
}

const UserContext = createContext<UserContextValue>({
  userDb: null,
  loading: true,
  error: null,
  refresh: () => {},
});

// Registers the device with the notification system so the backend
// can send push/in-app notifications to this user.
// Mirrors what the web app does at POST /api/notifications/auth on login.
async function registerNotifications(): Promise<void> {
  try {
    await backendClient.post("notifications/auth");
  } catch (err) {
    // Non-fatal — notifications won't work but the app still functions
    console.warn("[Notifications] Failed to register device:", err);
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userDb, setUserDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const { user, isLoaded } = useUser();
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchUserDb = useCallback(async (retryCount = 0) => {
    if (!mountedRef.current) return;
    if (retryCount === 0) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await getUserById();
      if (!mountedRef.current) return;
      const userData = response?.data?.data || response?.data || response;
      setUserDb(userData);
      setError(null);
      setLoading(false);
    } catch (err: any) {
      if (!mountedRef.current) return;
      const status = err?.response?.status;
      if ((status === 401 || status === 404) && retryCount < 3) {
        const delay = (retryCount + 1) * 800;
        retryTimeoutRef.current = setTimeout(() => fetchUserDb(retryCount + 1), delay);
      } else {
        setError(err);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    // Cancel any in-flight retry from a previous user
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    if (user) {
      fetchUserDb();
    } else {
      setUserDb(null);
      setLoading(false);
    }
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [fetchUserDb, user, isLoaded]);

  return (
    <UserContext.Provider value={{ userDb, loading, error, refresh: fetchUserDb }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
