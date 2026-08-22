import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { I18nextProvider } from "react-i18next";
import i18n from "@/translations/i18n";
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { QueryClient, QueryClientProvider } from "react-query";
import { DrawerProvider } from "@/contexts/DrawerContext";
import { UserProvider } from "@/contexts/UserContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { ChatAppProvider } from "@/contexts/ChatContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BrandWordmark } from "@/components/Header";
import * as SplashScreen from 'expo-splash-screen';
import { ToastProvider } from "@/components/common/Toast";
import { usePushNotifications } from "@/app/hooks/usePushNotifications";
import { useNavigation } from "@react-navigation/native";

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
  const [, setLanguageVersion] = useState(0);

  useEffect(() => {
    const refreshTranslations = () => setLanguageVersion((version) => version + 1);
    i18n.on("languageChanged", refreshTranslations);
    return () => i18n.off("languageChanged", refreshTranslations);
  }, []);
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
                  <ChatAppProvider>
                    <NotificationsProvider>
                      <PushNotificationInit />
                      <Stack screenOptions={{ headerShown: false }} />
                      <ToastProvider />
                    </NotificationsProvider>
                  </ChatAppProvider>
                </UserProvider>
              </DrawerProvider>
            </ClerkLoaded>
          </ClerkProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// Initialises push notifications once at the root level.
// Kept in a separate component so the hook runs inside ClerkLoaded.
// useNavigation() is valid here because this renders inside the Stack navigator.
function PushNotificationInit() {
  const navigation = useNavigation<any>();
  usePushNotifications((screen, params) => {
    navigation.navigate(screen as never, params as never);
  });
  return null;
}

