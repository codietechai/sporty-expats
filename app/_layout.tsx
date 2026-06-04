import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { I18nextProvider } from "react-i18next";
import i18n from "@/translations/i18n";
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { QueryClient, QueryClientProvider } from "react-query";
import { DrawerProvider } from "@/contexts/DrawerContext";
import { UserProvider } from "@/contexts/UserContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BrandWordmark } from "@/components/Header";
import * as SplashScreen from 'expo-splash-screen';
import { ToastProvider } from "@/components/common/Toast";

SplashScreen.preventAutoHideAsync();

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    inter: require("../assets/fonts/Inter.ttf"),
    oswald: require("../assets/fonts/Oswald.ttf"),
  });

  const Publishable_key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ClerkProvider tokenCache={tokenCache} publishableKey={Publishable_key}>
            <ClerkLoaded>
              <DrawerProvider>
                <UserProvider>
                  <Stack screenOptions={{ headerShown: false }} />
                  <ToastProvider />
                </UserProvider>
              </DrawerProvider>
            </ClerkLoaded>
          </ClerkProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

