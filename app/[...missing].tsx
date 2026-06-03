import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function NotFoundScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    
    // Redirect to dashboard regardless of auth state
    const timer = setTimeout(() => {
      router.replace('/screens/dashboard');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#0d0d0d' 
    }}>
      <ActivityIndicator size="large" color="#2ecc71" />
      <Text style={{ color: 'white', marginTop: 16, textAlign: 'center' }}>
        Redirecting to dashboard...
      </Text>
    </View>
  );
}