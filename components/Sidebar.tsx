import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Button,
  StyleSheet,
} from "react-native";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import Svg, { G, Path } from "react-native-svg";
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
  "Edit User Detail": undefined;
  "Conversations": undefined;
};

export default function Sidebar(props: DrawerContentComponentProps) {
  const { t, i18n } = useTranslation("sidebar");
  const [isHomeOpen, setIsHomeOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [modalVisible, setModalVisible] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const handleHomePress = () => setIsHomeOpen((prev) => !prev);
  const handleDashboardPress = () => setIsDashboardOpen((prev) => !prev);
  const toggleLanguageModal = () => setLanguageModalVisible((prev) => !prev);

  const navigateTo = (screenName: keyof RootDrawerParamList) => {
    props.navigation.navigate(screenName);
    props.navigation.closeDrawer();
  };



  const activeRoute = props.state.routeNames[props.state.index];
  // console.log(activeRoute)

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    setSelectedLanguage(language);
    toggleLanguageModal();
  };

  const { user } = useUser();
  const { userDb } = useUserDb();
  const { signOut } = useAuth();
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
    if (userDb) {
      const fetchProfilePhoto = async () => {
        try {
          const res = await getProfilePhoto(userDb.id);
          if (res) {
            const url = res.data.fileUrl
              ? `${res.data.fileUrl}?t=${Date.now()}`
              : null;
            setImage(url);
            console.log("Fetched profile photo in side bar: ", url);
          }
        } catch (error) {
          console.log("Error fetching profile photo in Sidebar: ", error);
        }
      };
      fetchProfilePhoto();
    } else {
    }
  }, [userDb]);

  const [showDropdown, setShowDropdown] = useState(false);

  const logOut = async () => {
    signOut();
    await AsyncStorage.removeItem("auth_token");
  };

  return (
    <View className="flex-1 ">
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="p-5">
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Text className="text-white text-2xl font-oswald">
              Sporty<Text className="text-main">Expats</Text>
            </Text>
            <TouchableOpacity
              onPress={toggleLanguageModal}
              style={{ display: "flex", flexDirection: "row", gap: 10 }}
            >
              <Image
                source={{
                  uri:
                    selectedLanguage === "en"
                      ? "https://static.vecteezy.com/system/resources/thumbnails/025/687/930/small/american-national-flag-usa-independence-day-vector.jpg"
                      : "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/1280px-Flag_of_France.svg.png",
                }}
                alt="image"
                style={{ width: 20, height: 20 }}
              />
              <Text className="text-white">
                {selectedLanguage === "en" ? "English" : "Français"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Home Section */}
          <TouchableOpacity
            onPress={handleHomePress} // className="flex-row justify-between w-full pr-5"
          >
            <View
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: `${activeRoute === "Home" ? "gray" : "transparent"
                    }`,
                  gap: 5,
                }}
                onPress={() => navigateTo("Home")}
              >
                <Svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="white"
                  width={24}
                  height={24}
                >
                  <Path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  />
                </Svg>
                <Text className="text-xl text-white">{t("home")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ display: "flex", flexDirection: "row" }}
                onPress={handleHomePress}
              >
                {isHomeOpen ? (
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={24}
                    height={24}
                  >
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 15.75 7.5-7.5 7.5 7.5"
                    />
                  </Svg>
                ) : (
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={24}
                    height={24}
                  >
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </Svg>
                )}
              </TouchableOpacity>
            </View>

            {/* Home Dropdown */}
            {isHomeOpen && (
              <View style={{ paddingLeft: 20, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => navigateTo("Events")}
                  style={styles.flexRow}
                // className="flex flex-row items-center"
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={20}
                    height={24}
                  >
                    <Path
                      d="M9 2L11.3175 6.695L16.5 7.4525L12.75 11.105L13.635 16.265L9 13.8275L4.365 16.265L5.25 11.105L1.5 7.4525L6.6825 6.695L9 2Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">{t("events")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Market")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={20}
                    height={24}
                  >
                    <G clip-path="url(#clip0_292_94)">
                      <Path
                        d="M9 1.25V17.75"
                        stroke="#A1A1A1"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <Path
                        d="M12.75 4.25H7.125C6.42881 4.25 5.76113 4.52656 5.26884 5.01884C4.77656 5.51113 4.5 6.17881 4.5 6.875C4.5 7.57119 4.77656 8.23887 5.26884 8.73116C5.76113 9.22344 6.42881 9.5 7.125 9.5H10.875C11.5712 9.5 12.2389 9.77656 12.7312 10.2688C13.2234 10.7611 13.5 11.4288 13.5 12.125C13.5 12.8212 13.2234 13.4889 12.7312 13.9812C12.2389 14.4734 11.5712 14.75 10.875 14.75H4.5"
                        stroke="#A1A1A1"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </G>
                  </Svg>

                  <Text className="text-white py-3 pl-2">{t("market")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Events List")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={20}
                    height={24}
                  >
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                    />
                  </Svg>
                  <Text className="text-white py-3 pl-2">Events List</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Contact Us")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="#A1A1A1"
                    width={20}
                    height={20}
                  >
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">
                    {t("contact_us")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("About Us")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="#A1A1A1"
                    width={20}
                    height={20}
                  >
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.712 4.33a9.027 9.027 0 0 1 1.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 0 0-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 0 1 0 9.424m-4.138-5.976a3.736 3.736 0 0 0-.88-1.388 3.737 3.737 0 0 0-1.388-.88m2.268 2.268a3.765 3.765 0 0 1 0 2.528m-2.268-4.796a3.765 3.765 0 0 0-2.528 0m4.796 4.796c-.181.506-.475.982-.88 1.388a3.736 3.736 0 0 1-1.388.88m2.268-2.268 4.138 3.448m0 0a9.027 9.027 0 0 1-1.306 1.652c-.51.51-1.064.944-1.652 1.306m0 0-3.448-4.138m3.448 4.138a9.014 9.014 0 0 1-9.424 0m5.976-4.138a3.765 3.765 0 0 1-2.528 0m0 0a3.736 3.736 0 0 1-1.388-.88 3.737 3.737 0 0 1-.88-1.388m2.268 2.268L7.288 19.67m0 0a9.024 9.024 0 0 1-1.652-1.306 9.027 9.027 0 0 1-1.306-1.652m0 0 4.138-3.448M4.33 16.712a9.014 9.014 0 0 1 0-9.424m4.138 5.976a3.765 3.765 0 0 1 0-2.528m0 0c.181-.506.475-.982.88-1.388a3.736 3.736 0 0 1 1.388-.88m-2.268 2.268L4.33 7.288m6.406 1.18L7.288 4.33m0 0a9.024 9.024 0 0 0-1.652 1.306A9.025 9.025 0 0 0 4.33 7.288"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">{t("about_us")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Price")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="#A1A1A1"
                    width={20}
                    height={20}
                  >
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">{t("pricing")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* Dashboard Section */}
          <View className="mt-5">
            <TouchableOpacity
              onPress={handleDashboardPress} // className="flex-row justify-between w-full pr-5"
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
                onPress={() => navigateTo("Dashboard")}
              >
                <Svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="white"
                  width={24}
                  height={24}
                >
                  <Path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                  />
                </Svg>

                <Text className="text-xl text-white">{t("dashboard")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDashboardPress}
                style={{ display: "flex", flexDirection: "row" }}
              >
                {isDashboardOpen ? (
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={24}
                    height={24}
                  >
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 15.75 7.5-7.5 7.5 7.5"
                    />
                  </Svg>
                ) : (
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={24}
                    height={24}
                  >
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </Svg>
                )}
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Dashboard Dropdown */}
            {isDashboardOpen && (
              <View style={{ paddingLeft: 20, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => navigateTo("Events")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={20}
                    height={24}
                  >
                    <Path
                      d="M9 2L11.3175 6.695L16.5 7.4525L12.75 11.105L13.635 16.265L9 13.8275L4.365 16.265L5.25 11.105L1.5 7.4525L6.6825 6.695L9 2Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">{t("events")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Market")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={20}
                    height={24}
                  >
                    <G clip-path="url(#clip0_292_94)">
                      <Path
                        d="M9 1.25V17.75"
                        stroke="#A1A1A1"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <Path
                        d="M12.75 4.25H7.125C6.42881 4.25 5.76113 4.52656 5.26884 5.01884C4.77656 5.51113 4.5 6.17881 4.5 6.875C4.5 7.57119 4.77656 8.23887 5.26884 8.73116C5.76113 9.22344 6.42881 9.5 7.125 9.5H10.875C11.5712 9.5 12.2389 9.77656 12.7312 10.2688C13.2234 10.7611 13.5 11.4288 13.5 12.125C13.5 12.8212 13.2234 13.4889 12.7312 13.9812C12.2389 14.4734 11.5712 14.75 10.875 14.75H4.5"
                        stroke="#A1A1A1"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </G>
                  </Svg>

                  <Text className="text-white py-3 pl-2">{t("market")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Group Chat")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={20}
                    height={24}
                  >
                    <Path
                      d="M12.75 16.25V14.75C12.75 13.9544 12.4339 13.1913 11.8713 12.6287C11.3087 12.0661 10.5456 11.75 9.75 11.75H3.75C2.95435 11.75 2.19129 12.0661 1.62868 12.6287C1.06607 13.1913 0.75 13.9544 0.75 14.75V16.25"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M6.75 8.75C8.40685 8.75 9.75 7.40685 9.75 5.75C9.75 4.09315 8.40685 2.75 6.75 2.75C5.09315 2.75 3.75 4.09315 3.75 5.75C3.75 7.40685 5.09315 8.75 6.75 8.75Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M17.25 16.25V14.75C17.2495 14.0853 17.0283 13.4396 16.621 12.9142C16.2138 12.3889 15.6436 12.0137 15 11.8475"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M12 2.8475C12.6453 3.01273 13.2173 3.38803 13.6257 3.91424C14.0342 4.44044 14.2559 5.08763 14.2559 5.75375C14.2559 6.41988 14.0342 7.06706 13.6257 7.59327C13.2173 8.11948 12.6453 8.49478 12 8.66"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">
                    {t("group_chat")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Edit User Detail")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={20}
                    height={24}
                  >
                    <Path
                      d="M12.75 16.25V14.75C12.75 13.9544 12.4339 13.1913 11.8713 12.6287C11.3087 12.0661 10.5456 11.75 9.75 11.75H3.75C2.95435 11.75 2.19129 12.0661 1.62868 12.6287C1.06607 13.1913 0.75 13.9544 0.75 14.75V16.25"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M6.75 8.75C8.40685 8.75 9.75 7.40685 9.75 5.75C9.75 4.09315 8.40685 2.75 6.75 2.75C5.09315 2.75 3.75 4.09315 3.75 5.75C3.75 7.40685 5.09315 8.75 6.75 8.75Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M17.25 16.25V14.75C17.2495 14.0853 17.0283 13.4396 16.621 12.9142C16.2138 12.3889 15.6436 12.0137 15 11.8475"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M12 2.8475C12.6453 3.01273 13.2173 3.38803 13.6257 3.91424C14.0342 4.44044 14.2559 5.08763 14.2559 5.75375C14.2559 6.41988 14.0342 7.06706 13.6257 7.59327C13.2173 8.11948 12.6453 8.49478 12 8.66"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">
                    Edit User Detail
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Conversations")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={24}
                    height={24}
                  >
                    <Path
                      d="M17.25 5.75L12 9.5L17.25 13.25V5.75Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M10.5 4.25H2.25C1.42157 4.25 0.75 4.92157 0.75 5.75V13.25C0.75 14.0784 1.42157 14.75 2.25 14.75H10.5C11.3284 14.75 12 14.0784 12 13.25V5.75C12 4.92157 11.3284 4.25 10.5 4.25Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">Conversations</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Contact Us")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={24}
                    height={24}
                  >
                    <Path
                      d="M17.25 5.75L12 9.5L17.25 13.25V5.75Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M10.5 4.25H2.25C1.42157 4.25 0.75 4.92157 0.75 5.75V13.25C0.75 14.0784 1.42157 14.75 2.25 14.75H10.5C11.3284 14.75 12 14.0784 12 13.25V5.75C12 4.92157 11.3284 4.25 10.5 4.25Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">{t("media")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("About Us")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={24}
                    height={24}
                  >
                    <Path
                      d="M15.75 3.5H2.25C1.42157 3.5 0.75 4.17157 0.75 5V14C0.75 14.8284 1.42157 15.5 2.25 15.5H15.75C16.5784 15.5 17.25 14.8284 17.25 14V5C17.25 4.17157 16.5784 3.5 15.75 3.5Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M0.75 8H17.25"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">{t("wallet")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Create Event")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={24}
                    height={24}
                  >
                    <Path
                      d="M9 17C13.1421 17 16.5 13.6421 16.5 9.5C16.5 5.35786 13.1421 2 9 2C4.85786 2 1.5 5.35786 1.5 9.5C1.5 13.6421 4.85786 17 9 17Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M9 6.5V12.5"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M6 9.5H12"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">
                    {t("create_event")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("Create Event")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.2}
                    stroke="#A1A1A1"
                    width={20}
                    height={20}
                  >
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </Svg>

                  <Text className="text-white py-3 pl-2">
                    {t("contact_admin")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigateTo("About Us")}
                  style={styles.flexRow}
                >
                  <Svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="white"
                    width={24}
                    height={24}
                  >
                    <Path
                      d="M12.75 16.25V14.75C12.75 13.9544 12.4339 13.1913 11.8713 12.6287C11.3087 12.0661 10.5456 11.75 9.75 11.75H3.75C2.95435 11.75 2.19129 12.0661 1.62868 12.6287C1.06607 13.1913 0.75 13.9544 0.75 14.75V16.25"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M6.75 8.75C8.40685 8.75 9.75 7.40685 9.75 5.75C9.75 4.09315 8.40685 2.75 6.75 2.75C5.09315 2.75 3.75 4.09315 3.75 5.75C3.75 7.40685 5.09315 8.75 6.75 8.75Z"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M17.25 16.25V14.75C17.2495 14.0853 17.0283 13.4396 16.621 12.9142C16.2138 12.3889 15.6436 12.0137 15 11.8475"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M12 2.8475C12.6453 3.01273 13.2173 3.38803 13.6257 3.91424C14.0342 4.44044 14.2559 5.08763 14.2559 5.75375C14.2559 6.41988 14.0342 7.06706 13.6257 7.59327C13.2173 8.11948 12.6453 8.49478 12 8.66"
                      stroke="#A1A1A1"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </Svg>
                  <Text className="text-white py-3 pl-2">
                    {t("subscription")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </DrawerContentScrollView>

      {loggedIn === false && (
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          {/* Profile Section */}
          <TouchableOpacity
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
              marginBottom: 10,
            }}
            onPress={() => {
              setModalVisible(true);
            }}
          >
            <Text
              style={{ color: "white", width: `100%`, textAlign: "center" }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <AuthModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
      {loggedIn && (
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          {/* Profile Section */}
          <TouchableOpacity
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 20,
              marginBottom: 10,
            }}
            onPress={() => setShowDropdown((prev) => !prev)} // 👈 toggle dropdown
          >
            <Image
              source={
                image
                  ? { uri: image }
                  : {
                    uri: user?.imageUrl,
                  }
              }
              style={{ width: 50, height: 50, borderRadius: 200 }}
            />
            <View>
              <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
                <Text className="text-white">{user?.username}</Text>
                {/* <Text className="text-white">
                  {user?.externalAccounts[0].lastName}
                </Text> */}
              </View>
              <Text className="text-white">
                {user?.externalAccounts?.[0]?.emailAddress ??
                  user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
          </TouchableOpacity>
          {showDropdown && (
            <View
              style={{
                backgroundColor: "white",
                padding: 10,
                borderRadius: 8,
                marginLeft: 20,
                marginBottom: 8,
                width: 150,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <TouchableOpacity
                style={{ paddingVertical: 10 }}
                onPress={() => {
                  setShowDropdown(false);
                  navigateTo("profile");
                }}
              >
                <Text style={{ color: "black" }}>View Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: 10 }}
                onPress={() => {
                  logOut();
                  setShowDropdown(false);
                  AsyncStorage.clear();
                }}
              >
                <Text style={{ color: "red" }}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Language Modal */}
      <Modal visible={isLanguageModalVisible} transparent animationType="slide">
        <View style={styles.container}>
          <View style={styles.modalContent}>
            <FlatList
              data={[
                {
                  lang: "en",
                  label: "English",
                  flag: "https://static.vecteezy.com/system/resources/thumbnails/025/687/930/small/american-national-flag-usa-independence-day-vector.jpg",
                },
                {
                  lang: "fr",
                  label: "Français",
                  flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/1280px-Flag_of_France.svg.png",
                },
              ]}
              keyExtractor={(item) => item.lang}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => changeLanguage(item.lang)}
                  style={styles.languageItem}
                >
                  <Image source={{ uri: item.flag }} style={styles.flag} />
                  <Text style={styles.languageText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flexRow: {
    display: "flex",
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  menuButton: {
    paddingLeft: 20,
    marginRight: 10,
  },
  title: {
    color: "white",
    fontSize: 18,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 200,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  flag: {
    width: 20,
    height: 20,
  },
  languageText: {
    fontSize: 16,
  },
});
