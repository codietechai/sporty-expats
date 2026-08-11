import React, { useEffect, useCallback } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import TabsComponent from "@/components/dashboard/DashboardTabs";
import Stories from "@/components/dashboard/Stories";
import MyFeed from "@/components/dashboard/MyFeed";
import SelectedEvents from "@/components/dashboard/SelectedEvents";
import JoinedGroups from "@/components/dashboard/JoinedGroups";
import ItemSales from "@/components/dashboard/ItemSales";
import MyPurchases from "@/components/dashboard/MyPurchases";
import Header from "@/components/Header";
import { useAuth } from "@clerk/clerk-expo";
import { useNotificationsContext } from "@/contexts/NotificationsContext";

const Dashboard = () => {
  const { isSignedIn } = useAuth();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { unreadCount, fetchNotifications } = useNotificationsContext();

  useEffect(() => {
    if (!isSignedIn) {
      navigation.navigate("Home" as any);
    }
  }, [isSignedIn]);

  // Refresh unread count whenever dashboard comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isSignedIn) return;
      fetchNotifications({ page: 1, limit: 1, includeRead: false });
    }, [isSignedIn])
  );

  if (!isSignedIn) return null;

  const tabs = [
    { key: "my_feed",      label: "My Feed",        component: MyFeed },
    { key: "events",       label: "Selected Events", component: SelectedEvents },
    { key: "joined_group", label: "Joined Groups",   component: JoinedGroups },
    { key: "item_sales",   label: "Item Sales",      component: ItemSales },
    { key: "my_purchase",  label: "My Purchase",     component: MyPurchases },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }} edges={["top"]}>
        <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
          <Header myFeed={true} unreadNotifications={unreadCount} />
          <Stories onAddPost={() => navigation.navigate("Add Feed" as any)} />
          <TabsComponent tabs={tabs} setCurrentTab={() => {}} />
        </View>
      </SafeAreaView>
    </>
  );
};

export default Dashboard;
