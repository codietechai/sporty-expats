import TabsComponent from "@/components/dashboard/DashboardTabs";
import React, { useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack } from "expo-router";
import Header from "@/components/Header";
import { getUploadedMediaByUser } from "@/client/endpoints/users/getUserUploadedMedia";
import MediaGallery from "@/components/profile/mediaGallery";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Dashboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("");
  const tabs = [
    {
      key: "home",
      label: "My Feed",
      component: () => <MediaGallery media={data} />,
    },
    {
      key: "week",
      label: "This week",
      component: () => <MediaGallery media={data} />,
    },
    {
      key: "month",
      label: "This Month",
      component: () => <MediaGallery media={data} />,
    },
    {
      key: "year",
      label: "This year",
      component: () => <MediaGallery media={data} />,
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUserDetails = await AsyncStorage.getItem("userDetails");
        if (storedUserDetails) {
          const parsed = JSON.parse(storedUserDetails);
          setUserId(parsed.id);
          console.log("parsed.id", parsed.id);

          const res = await getUploadedMediaByUser(parsed.id);
          setData(res.data.data || []);
        } else {
          console.warn("No userDetails found in AsyncStorage");
        }
      } catch (err) {
        console.error("Error loading user data or media", err);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ backgroundColor: "black", height: "100%" }}>
        <Header />
        <SafeAreaView style={{ paddingBottom: 200 }}>
          <TabsComponent tabs={tabs} setCurrentTab={setCurrentTab}/>
        </SafeAreaView>
      </View>
    </>
  );
};

export default Dashboard;
