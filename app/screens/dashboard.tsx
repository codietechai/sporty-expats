import TabsComponent from "@/components/dashboard/DashboardTabs";
import Stories from "@/components/dashboard/Stories";
import React, { useState } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { Stack } from "expo-router";
import Header from "@/components/Header";
import MyFeed from "@/components/dashboard/MyFeed";
import SelectedEvents from "@/components/dashboard/SelectedEvents";
import JoinedGroups from "@/components/dashboard/JoinedGroups";
import ItemSales from "@/components/dashboard/ItemSales";

const purchase = () => (
  <View>
    <Text style={{ fontSize: 18, color: "white" }}>
      💵 This is your purchase areas.
    </Text>
  </View>
);

const Dashboard = () => {
  const [currentTab, setCurrentTab] = useState<string>("");
  const tabs = [
    { key: "my_feed", label: "My Feed", component: MyFeed },
    { key: "events", label: "Selected Events", component: SelectedEvents },
    { key: "joined_group", label: "Joined Groups", component: JoinedGroups },
    { key: "item_sales", label: "Item Sales", component: ItemSales },
    { key: "my_purchase", label: "My Purchase", component: ItemSales },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <Header myFeed={currentTab === "my_feed"} />
        <Stories />

        <SafeAreaView style={{ flex: 1 }}>
          <TabsComponent tabs={tabs} setCurrentTab={setCurrentTab} />
        </SafeAreaView>
      </View>
    </>
  );
};

export default Dashboard;
