import * as React from "react";
import "../global.css";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useTranslation } from "react-i18next";

import Home from "./home";
import Event from "./screens/event";
import Dashboard from "./screens/dashboard";
import Market from "./screens/market";
import ContactUs from "./screens/contactus";
import AboutUs from "./screens/aboutus";
import Sidebar from "../components/Sidebar";
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { setUpAuthInterceptor } from "@/client/backendClient";
import CreateEvents from "./screens/createEvents";
import AddFeed from "./screens/AddFeed";
import Price from "./screens/price";

import Profile from "./screens/profile";
import PersonalInfo from "./screens/personalInfo";
import MediaUploads from "./screens/mediaUpload";
import PasswordSecurityScreen from "./screens/passwordSecurity";
import UpdateProfilePhotoScreen from "./screens/updateProfilePhoto";
import ChatScreen from "./screens/ChatScreen";
import EventInfoScreen from "./screens/EventInfoScreen";
import EventRegistrationScreen from "./screens/EventRegistrationScreen";
import EditUserScreen from "./screens/EditUserScreen";
import ConversationScreen from "./screens/Conversations";
import EventsListScreen from "./screens/EventsListScreen";
import GroupChatsScreen from "./screens/GroupChatsScreen";

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  const { t } = useTranslation("sidebar");
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    setUpAuthInterceptor(getToken);
  }, [getToken]);

  // Update initial route based on auth state
  const getInitialRouteName = () => {
    return isSignedIn ? "Dashboard" : "Home";
  };

  return (
    <Drawer.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "black",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        drawerStyle: {
          backgroundColor: "#18181A",
        },
      }}
      drawerContent={(props) => <Sidebar {...props} />}
    >
      <Drawer.Screen
        name="Home"
        component={Home}
        options={{ drawerLabel: t("home") }}
      />
      <Drawer.Screen
        name="Group Chat"
        component={ChatScreen}
        options={{ drawerLabel: t("Group Chat") }}
      />
      <Drawer.Screen
        name="Group Chats"
        component={GroupChatsScreen}
        options={{ drawerLabel: t("Group Chats") }}
      />
      <Drawer.Screen
        name="Edit User Detail"
        component={EditUserScreen}
        options={{ drawerLabel: t("Edit User Detail") }}
      />
      <Drawer.Screen
        name="Conversations"
        component={ConversationScreen}
        options={{ drawerLabel: t("Conversations") }}
      />
      <Drawer.Screen
        name="Events"
        component={Event}
        options={{ drawerLabel: t("events") }}
      />
      <Drawer.Screen
        name="Events List"
        component={EventsListScreen}
        options={{ drawerLabel: t("Events List") }}
      />
      <Drawer.Screen
        name="EventInfo"
        component={EventInfoScreen}
        options={{ drawerLabel: t("Event Info"), drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="EventRegistration"
        component={EventRegistrationScreen}
        options={{ drawerLabel: t("Event Registration"), drawerItemStyle: { display: "none" } }}
      />

      <Drawer.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ drawerLabel: t("dashboard") }}
      />
      <Drawer.Screen
        name="Market"
        component={Market}
        options={{ drawerLabel: t("market") }}
      />
      <Drawer.Screen
        name="Contact Us"
        component={ContactUs}
        options={{ drawerLabel: t("Contact Us") }}
      />
      <Drawer.Screen
        name="About Us"
        component={AboutUs}
        options={{ drawerLabel: t("About Us") }}
      />
      <Drawer.Screen
        name="Create Event"
        component={CreateEvents}
        options={{ drawerLabel: t("Create Event") }}
      />
      <Drawer.Screen
        name="Price"
        component={Price}
        options={{ drawerLabel: t("Price") }}
      />
      <Drawer.Screen
        name="Add Feed"
        component={AddFeed}
        options={{ drawerLabel: t("Add Feed") }}
      />
      <Drawer.Screen

        name="profile"
        component={Profile as any}
        options={{ drawerLabel: t("profile") }}
      />
      <Drawer.Screen
        name="Personal Info"
        component={PersonalInfo as any}
        options={{ drawerLabel: t("Personal Info") }}
      />

      <Drawer.Screen
        name="Media Uploads"
        component={MediaUploads as any}
        options={{ drawerLabel: t("Media Uploads") }}
      />
      <Drawer.Screen
        name="Password And Security"
        component={PasswordSecurityScreen as any}
        options={{ drawerLabel: t("Password And Security") }}
      />
      <Drawer.Screen
        name="Update Profile Photo"
        component={UpdateProfilePhotoScreen as any}
        options={{ drawerLabel: t("Update Profile Photo") }}
      />
    </Drawer.Navigator>
  );
}
