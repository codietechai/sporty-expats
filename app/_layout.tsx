import { Stack } from "expo-router";
import { useFonts } from "expo-font";

import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/translations/i18n";
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { QueryClient, QueryClientProvider } from "react-query";


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    inter: require("../assets/fonts/Inter.ttf"),
    oswald: require("../assets/fonts/Oswald.ttf"),
  });

  const Publishable_key=process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={Publishable_key}>
        <ClerkLoaded>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      </ClerkLoaded>
      </ClerkProvider>
    </I18nextProvider>
    </QueryClientProvider>
  );
}
