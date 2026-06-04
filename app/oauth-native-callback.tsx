import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserDetailsByClerkId } from '@/client/endpoints/users/getUserDetailsByClerkId';
import { backendClient } from '@/client/backendClient';
import { useRouter } from 'expo-router';

export default function OAuthCallback() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const handledRef = useRef(false);

  const createUser = async (userData: any) => {
    const response = await backendClient.post('/users/', userData);
    return response;
  };

  useEffect(() => {
    if (handledRef.current) return;
    if (!isSignedIn || !user) return;

    handledRef.current = true;

    const handleOAuthCallback = async () => {
      let isNewUser = false;

      try {
        const userData = await getUserDetailsByClerkId(user.id);
        await AsyncStorage.setItem("userDetails", JSON.stringify(userData?.data));
      } catch (error: any) {
        if (error?.response?.status === 404) {
          isNewUser = true;
          try {
            const newUserData = {
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress || '',
              username: user.username || user.firstName || 'user',
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              imageUrl: user.imageUrl || '',
            };
            // const createdUser = await createUser(newUserData);
            // await AsyncStorage.setItem("userDetails", JSON.stringify(createdUser?.data));
          } catch (createError) {
            console.error("Failed to create user:", createError);
          }
        }
      }

      if (isNewUser) {
        // New users: go to personalInfo (Stack screen, no sidebar needed)
        router.replace('/screens/personalInfo');
      } else {
        // Existing users: replace with index route (Drawer navigator)
        // index.tsx detects isSignedIn=true and navigates to Dashboard
        router.replace('/');
      }
    };

    const timer = setTimeout(handleOAuthCallback, 800);
    return () => clearTimeout(timer);
  }, [isSignedIn, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d0d0d' }}>
      <ActivityIndicator size="large" color="#2ecc71" />
      <Text style={{ color: 'white', marginTop: 16, fontSize: 16 }}>Completing login...</Text>
      <Text style={{ color: '#666', marginTop: 8, fontSize: 12, textAlign: 'center' }}>Setting up your account</Text>
    </View>
  );
}
