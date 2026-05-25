import { Stack } from "expo-router";
import { useFonts } from "expo-font";

import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/translations/i18n";
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { QueryClient, QueryClientProvider } from "react-query";
import { DrawerProvider } from "@/contexts/DrawerContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
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

  const Publishable_key=process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ClerkProvider tokenCache={tokenCache} publishableKey={Publishable_key}>
            <ClerkLoaded>
              <DrawerProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                />
              </DrawerProvider>
            </ClerkLoaded>
          </ClerkProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
