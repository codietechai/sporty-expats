import AddFeedForm from "@/components/dashboard/AddFeed";
import Header from "@/components/Header";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddFeed() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <Header onAddPress={() => (navigation as any).navigate("Add Feed")} />
      <SafeAreaView style={{ flex: 1 }}>
        <AddFeedForm />
      </SafeAreaView>
    </View>
  );
}
