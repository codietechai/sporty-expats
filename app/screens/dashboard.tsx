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
import CustomDrawer from "@/components/CustomDrawer";
import { useDrawer } from "@/contexts/DrawerContext";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import SwipeGestureWrapper from "@/components/SwipeGestureWrapper";

const Dashboard = () => {
  const [currentTab, setCurrentTab] = useState<string>("my_feed");
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const navigation = useNavigation();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // Redirect to home if user is not signed in
  useEffect(() => {
    if (!isSignedIn) {
      console.log('User not signed in, redirecting to home');
      router.replace('/home');
    }
  }, [isSignedIn, router]);

  // Don't render dashboard if user is not signed in
  if (!isSignedIn) {
    return null;
  }

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
      <SwipeGestureWrapper>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }} edges={["top"]}>
          <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
            <Header myFeed={true} />
            <Stories />
            <TabsComponent tabs={tabs} setCurrentTab={setCurrentTab} />
          </View>
        </SafeAreaView>
      </SwipeGestureWrapper>
      
      {/* Custom Drawer */}
      <CustomDrawer 
        visible={isDrawerOpen} 
        onClose={closeDrawer} 
        navigation={navigation}
      />
    </>
  );
};

export default Dashboard;
