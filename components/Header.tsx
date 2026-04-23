import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";

type RootDrawerParamList = {
  Home: undefined;
  Events: undefined;
  Dashboard: undefined;
  Market: undefined;
  "Contact Us": undefined;
  "About Us": undefined;
  "Add Feed": undefined,
};

type HeaderProps = {
  myFeed?: boolean;
};
const Header: React.FC<HeaderProps> = ({ myFeed }) => {
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

  return (
    <View style={styles.headerContainer}>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
        >
          <Text
            className="text-white text-2xl font-oswald"
            style={{ fontSize: 20 }}
          >
            Sporty<Text className="text-main">Expats</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ display: "flex", flexDirection: "row" }}>
          <TouchableOpacity style={{ marginRight: 15 }}>
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
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </Svg>
          </TouchableOpacity>
          {myFeed && (
            <TouchableOpacity
              style={{
                marginRight: 15,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "green",
                borderRadius: 100,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
              onPress={() => navigation.navigate("Add Feed")}

            >
              <Svg
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="white"
                width={20}
                height={20}
              >
                <Path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </Svg>
              <Text style={{ color: "white", fontSize: 12 }}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "black",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    justifyContent: "space-between",
    paddingBottom: 20,
    gap: 50,
  },
  menuButton: {
    paddingLeft: 20,
    marginRight: 10,
  },
  title: {
    color: "white",
    fontSize: 18,
  },
});

export default Header;