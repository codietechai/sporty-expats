import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { RootDrawerParamList } from "@/components/Sidebar";
import { useUserDb } from "@/app/hooks/useUserDb";
import { useUser } from "@clerk/clerk-expo";

type MenuItem = {
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: keyof RootDrawerParamList;
};

const MENU_ITEMS: MenuItem[] = [
  { label: "Personal Information", sub: "Name, phone, location, bio", icon: "person-outline", screen: "Personal Info" },
  { label: "Profile Photo", sub: "Update your profile picture", icon: "camera-outline", screen: "Update Profile Photo" },
  { label: "Password & Security", sub: "Password and 2FA settings", icon: "shield-outline", screen: "Password And Security" },
  { label: "Media Uploads", sub: "Your uploaded photos and videos", icon: "images-outline", screen: "Media Uploads" },
];

export default function Profile(props: DrawerContentComponentProps) {
  const { userDb } = useUserDb();
  const { user: clerkUser } = useUser();

  const u = userDb?.data?.data ?? userDb?.data ?? userDb;
  const firstName = u?.personalDetails?.firstName ?? u?.firstName ?? clerkUser?.firstName ?? "";
  const lastName = u?.personalDetails?.lastName ?? u?.lastName ?? clerkUser?.lastName ?? "";
  const username = u?.username ?? clerkUser?.username ?? "";
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? "";
  const imageUrl = u?.imageUrl ?? clerkUser?.imageUrl ?? null;

  const navigateTo = (screen: keyof RootDrawerParamList) => props.navigation.navigate(screen);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.safe} edges={["top"]}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => props.navigation.dispatch(DrawerActions.openDrawer())} style={s.menuBtn} hitSlop={8}>
            <Ionicons name="menu" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Profile</Text>
            <Text style={s.headerSub}>Manage your account</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* User card */}
        <View style={s.userCard}>
          <View style={s.avatarWrap}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitials}>
                  {(firstName[0] ?? username[0] ?? "?").toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={s.userInfo}>
            {(firstName || lastName) ? (
              <Text style={s.userName}>{`${firstName} ${lastName}`.trim()}</Text>
            ) : (
              <Text style={s.userName}>{username || "User"}</Text>
            )}
            {username ? <Text style={s.userHandle}>@{username}</Text> : null}
            {email ? <Text style={s.userEmail}>{email}</Text> : null}
          </View>
        </View>

        {/* Menu */}
        <Text style={s.sectionHeader}>Settings</Text>
        <View style={s.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <React.Fragment key={item.screen}>
              <TouchableOpacity style={s.menuItem} onPress={() => navigateTo(item.screen)} activeOpacity={0.7}>
                <View style={s.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color="#4ade80" />
                </View>
                <View style={s.menuText}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Text style={s.menuSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#374151" />
              </TouchableOpacity>
              {i < MENU_ITEMS.length - 1 && <View style={s.divider} />}
            </React.Fragment>
          ))}
        </View>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },
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
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },

  // User card
  userCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    margin: 16, padding: 16,
    backgroundColor: "#111", borderRadius: 14,
    borderWidth: 1, borderColor: "#1e1e1e",
  },
  avatarWrap: {},
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "#2a2a2a" },
  avatarFallback: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#166534", alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { color: "#fff", fontSize: 22, fontWeight: "700" },
  userInfo: { flex: 1, gap: 2 },
  userName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  userHandle: { color: "#4ade80", fontSize: 13 },
  userEmail: { color: "#6B7280", fontSize: 12 },

  // Section
  sectionHeader: {
    fontSize: 11, fontWeight: "700", color: "#4ade80",
    letterSpacing: 1, textTransform: "uppercase",
    marginLeft: 20, marginBottom: 8,
  },

  // Menu
  menuCard: {
    marginHorizontal: 16, backgroundColor: "#111",
    borderRadius: 14, borderWidth: 1, borderColor: "#1e1e1e", overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(74,222,128,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuLabel: { color: "#fff", fontSize: 15, fontWeight: "600" },
  menuSub: { color: "#6B7280", fontSize: 12, marginTop: 1 },
  divider: { height: 1, backgroundColor: "#1e1e1e", marginLeft: 64 },
});
