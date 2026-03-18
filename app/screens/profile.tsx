import { RootDrawerParamList } from "@/components/Sidebar";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import React from "react";
import { View, Text, Pressable } from "react-native";

export default function Profile(props: DrawerContentComponentProps) {
  const navigateTo = (screenName: keyof RootDrawerParamList) => {
    props.navigation.navigate(screenName);
  };

  const menuItems: { label: string; screen?: keyof RootDrawerParamList }[] = [
    { label: "Personal Information", screen: "Personal Info" },
    { label: "Profile Photo", screen: "Update Profile Photo" },
    { label: "Password And Security", screen: "Password And Security" },
    { label: "Media Uploads", screen: "Media Uploads" },
  ];

  return (
    <View className="flex-1 bg-black px-4 pt-10">
      {menuItems.map((item, index) => (
        <Pressable
          key={index}
          onPress={() => item.screen && navigateTo(item.screen)}
          className="border-b border-gray-700 py-4"
        >
          <Text className="text-white text-base">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
