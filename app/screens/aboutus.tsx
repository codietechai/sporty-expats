import { Button } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { View, Text } from "react-native";

export default function AboutUs() {
  const navigation = useNavigation();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        About us Page
      </Text>
      <Button onPress={() => navigation.navigate("Home")}>Go back home</Button>
    </View>
  );
}
