import { getUserById } from "@/client/endpoints/users/getUserById";
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState, useCallback } from "react";

export function useUserDb() {
  const [userDb, setUserDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
      const { user } = useUser();

  const fetchUserDb = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserById();
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
