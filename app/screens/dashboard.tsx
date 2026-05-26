import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";
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

const Dashboard = () => {
  const { isSignedIn } = useAuth();
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  useEffect(() => {
    if (!isSignedIn) {
      // Stay inside the drawer navigator so Header can still open the sidebar
      navigation.navigate("Home" as any);
    }
  }, [isSignedIn]);

  if (!isSignedIn) return null;

  const tabs = [
    { key: "my_feed", label: "My Feed", component: MyFeed },
    { key: "events", label: "Selected Events", component: SelectedEvents },
    { key: "joined_group", label: "Joined Groups", component: JoinedGroups },
    { key: "item_sales", label: "Item Sales", component: ItemSales },
    { key: "my_purchase", label: "My Purchase", component: MyPurchases },
  ];

  const handleAddPost = () => {
    navigation.navigate("Add Feed" as any);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }} edges={["top"]}>
        <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
          <Header myFeed={true} />
          <Stories onAddPost={handleAddPost} />
          <TabsComponent tabs={tabs} setCurrentTab={() => {}} />
        </View>
      </SafeAreaView>
    </>
  );
};

export default Dashboard;
