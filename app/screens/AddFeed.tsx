import AddFeedForm from "@/components/dashboard/AddFeed";
import Header from "@/components/Header";
import { Button } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Stack } from "expo-router";
import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddFeed() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <Header />
        <SafeAreaView style={{ flex: 1 }}>
          <AddFeedForm />
        </SafeAreaView>
      </View>
    </>
  );
}
