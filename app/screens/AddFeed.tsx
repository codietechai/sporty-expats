import AddFeedForm from "@/components/dashboard/AddFeed";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddFeed() {
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <AddFeedForm />
      </SafeAreaView>
    </View>
  );
}
