import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  Image, StyleSheet,
} from "react-native";
import { DrawerContentComponentProps, DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AuthModal from "@/components/AuthModal";
import { useUser } from "@clerk/clerk-expo";
import { useAuth } from "@clerk/clerk-react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfilePhoto } from "@/client/endpoints/users/addProfilePhoto";
import { useUserDb } from "@/app/hooks/useUserDb";

export type RootDrawerParamList = {
  Home: undefined;
  Events: undefined;
  "Events List": undefined;
  Dashboard: undefined;
  Market: undefined;
  "Contact Us": undefined;
  "About Us": undefined;
  "Create Event": undefined;
  Price: undefined;
  profile: undefined;
  "Personal Info": undefined;
  "Media Uploads": undefined;
  "Password And Security": undefined;
  "Update Profile Photo": undefined;
  "Group Chat": undefined;
  "Group Chats": undefined;
  "Edit User Detail": undefined;
  "Conversations": undefined;
};

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: keyof RootDrawerParamList;
};

const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", icon: "grid-outline", screen: "Dashboard" },
  { label: "Events", icon: "star-outline", screen: "Events List" },
  { label: "Market", icon: "storefront-outline", screen: "Market" },
  { label: "Group Chats", icon: "chatbubbles-outline", screen: "Group Chats" },
  { label: "Media", icon: "videocam-outline", screen: "Media Uploads" },
  { label: "Create Event", icon: "add-circle-outline", screen: "Create Event" },
];

const BOTTOM_NAV: NavItem[] = [
  { label: "Contact Admin", icon: "desktop-outline", screen: "Contact Us" },
  { label: "Subscription", icon: "card-outline", screen: "Price" },
  { label: "Profile", icon: "person-circle-outline", screen: "profile" },
];

export default function Sidebar(props: DrawerContentComponentProps) {
  const { i18n } = useTranslation("sidebar");
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const { user } = useUser();
  const { userDb } = useUserDb();
  const { signOut } = useAuth();

  const activeRoute = props.state.routeNames[props.state.index];

  const navigateTo = (screenName: keyof RootDrawerParamList) => {
    props.navigation.navigate(screenName);
    props.navigation.closeDrawer();
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    setLanguageModalVisible(false);
  };

  useEffect(() => {
    if (user) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
      setModalVisible(false);
      setShowDropdown(false);
    }
  }, [user]);

  useEffect(() => {
    if (!userDb) return;
    getProfilePhoto(userDb.id)
      .then((res) => {
        if (res?.data?.fileUrl) setImage(`${res.data.fileUrl}?t=${Date.now()}`);
      })
      .catch(() => { });
  }, [userDb]);

  const logOut = async () => {
    signOut();
    await AsyncStorage.clear();
  };

  return (
    <View style={styles.root}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.inner}>
          {/* Logo + language */}
          <View style={styles.logoRow}>
            <Text style={styles.logo}>
              Sporty<Text style={styles.logoAccent}>Expats</Text>
            </Text>
            <TouchableOpacity onPress={() => setLanguageModalVisible(true)} style={styles.langBtn}>
              <Image
                source={{
                  uri: selectedLanguage === "en"
                    ? "https://static.vecteezy.com/system/resources/thumbnails/025/687/930/small/american-national-flag-usa-independence-day-vector.jpg"
                    : "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/1280px-Flag_of_France.svg.png",
                }}
                style={styles.flag}
              />
              <Text style={styles.langText}>{selectedLanguage === "en" ? "EN" : "FR"}</Text>
            </TouchableOpacity>
          </View>

          {/* Main nav */}
          <View style={styles.navSection}>
            {MAIN_NAV.map((item) => {
              const isActive = activeRoute === item.screen;
              return (
                <TouchableOpacity
                  key={item.screen}
                  onPress={() => navigateTo(item.screen)}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? "#2ecc71" : "#9CA3AF"}
                  />
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </DrawerContentScrollView>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {BOTTOM_NAV.map((item) => (
          <TouchableOpacity
            key={item.screen}
            onPress={() => navigateTo(item.screen)}
            style={styles.navItem}
          >
            <Ionicons name={item.icon} size={20} color="#9CA3AF" />
            <Text style={styles.navLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        {/* Profile / Login */}
        {loggedIn ? (
          <>
            <TouchableOpacity
              onPress={() => setShowDropdown((p) => !p)}
              style={styles.profileRow}
            >
              <Image
                source={{ uri: image ?? user?.imageUrl ?? "https://storage.strandcdn.com/avatar.svg" }}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.username ?? user?.firstName}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
              <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
            </TouchableOpacity>

            {showDropdown && (
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => { setShowDropdown(false); navigateTo("profile"); }}
                >
                  <Ionicons name="person-outline" size={16} color="#D1D5DB" />
                  <Text style={styles.dropdownText}>View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => { logOut(); setShowDropdown(false); }}
                >
                  <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                  <Text style={[styles.dropdownText, { color: "#EF4444" }]}>Log Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <TouchableOpacity style={styles.loginBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <AuthModal visible={modalVisible} onClose={() => setModalVisible(false)} />

      {/* Language modal */}
      <Modal visible={isLanguageModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.langModal}>
            {[
              { lang: "en", label: "English", flag: "https://static.vecteezy.com/system/resources/thumbnails/025/687/930/small/american-national-flag-usa-independence-day-vector.jpg" },
              { lang: "fr", label: "Français", flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/1280px-Flag_of_France.svg.png" },
            ].map((item) => (
              <TouchableOpacity
                key={item.lang}
                onPress={() => changeLanguage(item.lang)}
                style={styles.langItem}
              >
                <Image source={{ uri: item.flag }} style={styles.flag} />
                <Text style={styles.langItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#18181A" },
  inner: { paddingHorizontal: 16, paddingTop: 16 },

  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  logo: { fontSize: 22, fontWeight: "700", color: "#fff", fontFamily: "oswald" },
  logoAccent: { color: "#166534" },
  langBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#2a2a2a", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  flag: { width: 18, height: 18, borderRadius: 9 },
  langText: { color: "#D1D5DB", fontSize: 12, fontWeight: "600" },

  navSection: { gap: 2 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, position: "relative" },
  navItemActive: { backgroundColor: "rgba(22,101,52,0.15)" },
  navLabel: { fontSize: 15, color: "#9CA3AF", flex: 1 },
  navLabelActive: { color: "#fff", fontWeight: "600" },
  activeIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#2ecc71" },

  bottomSection: { paddingHorizontal: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: "#2a2a2a", paddingTop: 12, gap: 2 },

  profileRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#1f1f1f", marginTop: 8 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  profileInfo: { flex: 1 },
  profileName: { color: "#fff", fontSize: 13, fontWeight: "600" },
  profileEmail: { color: "#6B7280", fontSize: 11, marginTop: 1 },

  dropdown: { backgroundColor: "#1f1f1f", borderRadius: 10, marginTop: 4, overflow: "hidden", borderWidth: 1, borderColor: "#2a2a2a" },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 16 },
  dropdownText: { fontSize: 14, color: "#D1D5DB" },

  loginBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#166534", borderRadius: 10, paddingVertical: 12, marginTop: 8 },
  loginText: { color: "#fff", fontWeight: "600", fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  langModal: { backgroundColor: "#1f1f1f", borderRadius: 12, padding: 16, width: 200, gap: 4 },
  langItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  langItemText: { fontSize: 15, color: "#fff" },
});
