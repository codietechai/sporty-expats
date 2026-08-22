import React, { useCallback, useRef, useState } from "react";
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
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { isSignedIn } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { unreadCount, fetchNotifications } = useNotificationsContext();

  // ── Shared pull-to-refresh state ────────────────────────────────────────────
  // We track two sub-tasks that must both complete before we stop the spinner:
  //   1. Stories refetch (signalled via onRefreshDone from <Stories>)
  //   2. Feed page-1 refetch (signalled when MyFeed sees refreshing flip false)
  // In practice MyFeed handles its own reset internally once refreshing goes
  // false, so we just need a short settled window.
  const [refreshing, setRefreshing] = useState(false);
  const storiesSettledRef = useRef(false);

  const handleRefresh = useCallback(() => {
    storiesSettledRef.current = false;
    setRefreshing(true);
  }, []);

  const handleStoriesRefreshDone = useCallback(() => {
    storiesSettledRef.current = true;
    // Small trailing delay so the spinner doesn't flash away instantly
    setTimeout(() => setRefreshing(false), 200);
  }, []);

  // Refresh unread count whenever dashboard comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isSignedIn) return;
      fetchNotifications({ page: 1, limit: 1, includeRead: false });
    }, [isSignedIn])
  );

  // Auth-based redirect is handled solely in Sidebar.tsx to avoid
  // competing navigation calls that cause white screens on logout.

  const tabs = [
    {
      key: "my_feed",
      label: t("Dashboard.myFeed"),
      component: MyFeed,
      componentProps: { refreshing, onRefresh: handleRefresh },
    },
    { key: "events",       label: t("Dashboard.selectedEvents"), component: SelectedEvents },
    { key: "joined_group", label: t("Dashboard.joinedGroups"),   component: JoinedGroups },
    { key: "item_sales",   label: t("Dashboard.itemSales"),      component: ItemSales },
    { key: "my_purchase",  label: t("Dashboard.myPurchases"),    component: MyPurchases },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }} edges={["top"]}>
        <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
          <Header myFeed={true} unreadNotifications={unreadCount} />
          <Stories
            onAddPost={() => navigation.navigate("Add Feed" as any)}
            refreshing={refreshing}
            onRefreshDone={handleStoriesRefreshDone}
          />
          <TabsComponent tabs={tabs} setCurrentTab={() => {}} />
        </View>
      </SafeAreaView>
    </>
  );
};

export default Dashboard;
