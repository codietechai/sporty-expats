import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserDetailsByClerkId } from '@/client/endpoints/users/getUserDetailsByClerkId';
import { backendClient } from '@/client/backendClient';

export default function OAuthCallback() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // Create user function
  const createUser = async (userData: any) => {
    try {

      const response = await backendClient.post('/users/', userData);
      return response;
    } catch (error: any) {
      console.error('Error creating user:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      throw error;
    }
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      
      if (isSignedIn && user) {
        try {
          // Try to get existing user data from backend
          const userData = await getUserDetailsByClerkId(user.id);
          await AsyncStorage.setItem("userDetails", JSON.stringify(userData?.data));
        } catch (error: any) {
          // If user doesn't exist (404), create a new user
          if (error?.response?.status === 404) {
            try {
              const newUserData = {
                clerkId: user.id,
                email: user.primaryEmailAddress?.emailAddress || '',
                username: user.username || user.firstName || 'user',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                imageUrl: user.imageUrl || '',
              };
              
              const createdUser = await createUser(newUserData);
              await AsyncStorage.setItem("userDetails", JSON.stringify(createdUser?.data));
            } catch (createError) {
              console.error("Failed to create user oauthhhhhhhhhh:", createError);
            }
          } else {
            console.error("Unexpected error fetching user:", error);
          }
        }
        
        // Always redirect to dashboard after processing
        router.replace('/screens/dashboard');
      } else {
        // If not signed in, redirect to home
        console.log('User not signed in, redirecting to home');
        router.replace('/home');
      }
    };

    // Add a small delay to ensure auth state is properly set
    const timer = setTimeout(handleOAuthCallback, 1500);
    return () => clearTimeout(timer);
  }, [isSignedIn, user, router]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#0d0d0d' 
    }}>
      <ActivityIndicator size="large" color="#2ecc71" />
      <Text style={{ color: 'white', marginTop: 16, fontSize: 16 }}>
        Completing login...
      </Text>
      <Text style={{ color: '#666', marginTop: 8, fontSize: 12, textAlign: 'center' }}>
        Setting up your account
      </Text>
    </View>
  );
}