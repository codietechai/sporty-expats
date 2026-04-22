import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import TabsComponent from "@/components/dashboard/DashboardTabs";
import Stories from "@/components/dashboard/Stories";
import MyFeed from "@/components/dashboard/MyFeed";
import SelectedEvents from "@/components/dashboard/SelectedEvents";
import JoinedGroups from "@/components/dashboard/JoinedGroups";
import ItemSales from "@/components/dashboard/ItemSales";
import MyPurchases from "@/components/dashboard/MyPurchases";
import Header from "@/components/Header";

const Dashboard = () => {
  const [currentTab, setCurrentTab] = useState<string>("my_feed");

  const tabs = [
    { key: "my_feed", label: "My Feed", component: MyFeed },
    { key: "events", label: "Selected Events", component: SelectedEvents },
    { key: "joined_group", label: "Joined Groups", component: JoinedGroups },
    { key: "item_sales", label: "Item Sales", component: ItemSales },
    { key: "my_purchase", label: "My Purchase", component: MyPurchases },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }} edges={["top"]}>
        <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
          <Header myFeed={true} />
          <Stories />
          <TabsComponent tabs={tabs} setCurrentTab={setCurrentTab} />
        </View>
      </SafeAreaView>
    </>
  );
};

export default Dashboard;
