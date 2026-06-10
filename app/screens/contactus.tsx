import { Button } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ContactUs() {
  const navigation = useNavigation();
  const drawer = navigation.getParent<DrawerNavigationProp<any>>();

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
      <View style={s.header}>
        <TouchableOpacity style={s.menuBtn} onPress={() => drawer?.openDrawer?.()} hitSlop={8}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.title}>Contact Us</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontSize: 16 }}>Contact us Page</Text>
        <Button onPress={() => navigation.navigate("Home")}>Go back home</Button>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#1e1e1e", backgroundColor: "#111",
  },
  menuBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    alignItems: "center", justifyContent: "center",
  },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: "#fff" },
});
