import { useEffect, useState, useCallback } from "react";
import { getUserPersonalInfo } from "@/client/endpoints/users/getUserDetails";

export function useUserDb() {
  const [userDb, setUserDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchUserDb = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserPersonalInfo();
      setUserDb(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserDb();
  }, [fetchUserDb]);

  return { userDb, loading, error, refresh: fetchUserDb };
}
