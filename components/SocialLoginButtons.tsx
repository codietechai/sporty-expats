import { useOAuth, useUser, useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useCallback, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ToastAndroid,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { getUserDetailsByClerkId } from "@/client/endpoints/users/getUserDetailsByClerkId";
import { createUser } from "@/client/endpoints/users/createUser";

WebBrowser.maybeCompleteAuthSession();

const SocialLoginButton = ({
  strategy,
  onClose,
  onSuccess,
}: {
  strategy: "facebook" | "google" | "apple";
  onClose: () => void;
  /** Called after a successful OAuth login so the parent can navigate. */
  onSuccess?: () => void;
}) => {
  const getStrategy = () => {
    if (strategy === "facebook") return "oauth_facebook";
    if (strategy === "google") return "oauth_google";
    if (strategy === "apple") return "oauth_apple";
    return "oauth_facebook";
  };

  const { startOAuthFlow } = useOAuth({ strategy: getStrategy() });
  const { user } = useUser();
  const { userId } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Warm up the browser to reduce OAuth latency
  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => { WebBrowser.coolDownAsync(); };
  }, []);

  const onSocialLoginPress = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { createdSessionId, setActive } = await startOAuthFlow({});
      
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });

        // Wait for Clerk session to propagate — user hook hasn't re-rendered yet
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use the session's userId directly instead of user?.id which is still null
        const clerkUserId = userId ?? user?.id;

        try {
          const userData = await getUserDetailsByClerkId(clerkUserId as string);
          await AsyncStorage.setItem("userDetails", JSON.stringify(userData?.data));
          ToastAndroid.show("Welcome back!", 2);
        } catch (error: any) {
          if (error?.response?.status === 404) {
            try {
              router.replace("/screens/personalInfo");
              const newUserData = {
                clerkId: clerkUserId as string,
                email: user?.primaryEmailAddress?.emailAddress as string,
                username: user?.username || user?.firstName || "user",
                firstName: user?.firstName || "",
                lastName: user?.lastName || "",
                imageUrl: user?.imageUrl || "",
              };
              // const createdUser = await createUser(newUserData);
              // await AsyncStorage.setItem("userDetails", JSON.stringify(createdUser?.data));
              ToastAndroid.show("Welcome to SportyExpats!", 2);
            } catch (createError) {
              // console.error("Failed to create user:", createError);
              ToastAndroid.show("Account setup failed.", 2);
              onClose();
              router.replace("/screens/personalInfo");
              return;
            }
          } else {
            console.error("Unexpected error fetching user:", error);
            ToastAndroid.show("Login successful, but user data unavailable.", 2);
          }
        }

        onClose();
        // Small delay so the drawer navigator fully settles before navigation
        await new Promise(resolve => setTimeout(resolve, 150));
        onSuccess?.();
      }
    } catch (err) {
      console.error("OAuth error:", JSON.stringify(err, null, 2));
      ToastAndroid.show("Login failed. Please try again.", 2);
    } finally {
      setIsLoading(false);
    }
  }, [startOAuthFlow, user, userId, onClose, onSuccess]);

  const buttonText = () => {
    if (isLoading) return "Loading...";
    if (strategy === "facebook") return "Continue with Facebook";
    if (strategy === "google") return "Continue with Google";
    if (strategy === "apple") return "Continue with Apple";
  };

  const buttonIcon = () => {
    if (strategy === "facebook") {
      return (
        <Svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <Path
            fill="#1877F2"
            d="M24 12.0736C24 5.40557 18.6274 0 12 0C5.37258 0 0 5.40557 0 12.0736C0 18.0978 4.3882 23.0933 10.125 24V15.563H7.078V12.0736H10.125V9.41257C10.125 6.38657 11.916 4.71957 14.657 4.71957C15.972 4.71957 17.344 4.94457 17.344 4.94457V7.91357H15.829C14.337 7.91357 13.875 8.83857 13.875 9.78857V12.0736H17.203L16.656 15.563H13.875V24C19.6118 23.0933 24 18.0978 24 12.0736Z"
          />
          <Path
            fill="white"
            d="M16.656 15.563L17.203 12.0736H13.875V9.78857C13.875 8.83857 14.337 7.91357 15.829 7.91357H17.344V4.94457C17.344 4.94457 15.972 4.71957 14.657 4.71957C11.916 4.71957 10.125 6.38657 10.125 9.41257V12.0736H7.078V15.563H10.125V24C10.7488 24.0977 11.3739 24.1501 12 24.1501C12.6261 24.1501 13.2512 24.0977 13.875 24V15.563H16.656Z"
          />
        </Svg>
      );
    } else if (strategy === "google") {
      return (
        <Svg x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
          <Path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <Path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <Path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <Path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </Svg>
      );
    } else if (strategy === "apple") {
      return <Ionicons name="logo-apple" size={30} color="black" />;
    }
    return null;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onSocialLoginPress}
      disabled={isLoading}
    >
      {isLoading ? <ActivityIndicator size="small" color="black" /> : buttonIcon()}
      <Text style={styles.buttonText}>{buttonText()}</Text>
      <View />
    </TouchableOpacity>
  );
};

export default SocialLoginButton;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderColor: "gray",
    marginTop: 5,
    marginBottom: 5,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: { fontSize: 15, fontWeight: "500" },
});
