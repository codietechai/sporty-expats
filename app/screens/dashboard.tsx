import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import TabsComponent from "@/components/dashboard/DashboardTabs";
import Stories from "@/components/dashboard/Stories";
import MyFeed from "@/components/dashboard/MyFeed";
import SelectedEvents from "@/components/dashboard/SelectedEvents";
import JoinedGroups from "@/components/dashboard/JoinedGroups";
import ItemSales from "@/components/dashboard/ItemSales";
import MyPurchases from "@/components/dashboard/MyPurchases";
import Header from "@/components/Header";
import { useAuth } from "@clerk/clerk-expo";
import TouchSwipeWrapper from "@/components/TouchSwipeWrapper";

const Dashboard = () => {
  const [currentTab, setCurrentTab] = useState<string>("my_feed");
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.replace('/home');
    }
  }, [isSignedIn, router]);

  if (!isSignedIn) return null;

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
      <TouchSwipeWrapper>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }} edges={["top"]}>
          <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
            <Header myFeed={true} />
            <Stories onAddPost={() => router.push("/screens/AddFeed")} />
            <TabsComponent tabs={tabs} setCurrentTab={setCurrentTab} />
          </View>
        </SafeAreaView>
      </TouchSwipeWrapper>
    </>
  );
};

export default Dashboard;
