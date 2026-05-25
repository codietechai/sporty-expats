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
      const response = await getUserById();
      console.log('useUserDb - Full response:', JSON.stringify(response, null, 2));
      
      // Extract the actual user data from the axios response
      // The response structure is likely: { data: { data: actualUserData } }
      const userData = response?.data?.data || response?.data || response;
      console.log('useUserDb - Extracted userData:', JSON.stringify(userData, null, 2));
      
      setUserDb(userData);
    } catch (err) {
      console.error('useUserDb - Error fetching user:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserDb();
    }
  }, [fetchUserDb, user]);

  return { userDb, loading, error, refresh: fetchUserDb };
}
