import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";

type HeaderProps = {
  myFeed?: boolean;
  onAddPress?: () => void;
};

type BrandWordmarkProps = {
  size?: number;
  centered?: boolean;
};

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ size = 20, centered = false }) => (
  <Text style={[styles.wordmark, { fontSize: size }, centered && styles.wordmarkCentered]}>
    Sporty<Text style={styles.wordmarkAccent}>Expats</Text>
  </Text>
);

const Header: React.FC<HeaderProps> = ({ myFeed, onAddPress }) => {
  const navigation = useNavigation();

  const handleMenuPress = () => {
    const drawer = navigation.getParent<DrawerNavigationProp<any>>("MainDrawer" as any);
    if (drawer?.openDrawer) {
      drawer.openDrawer();
    }
  };

  const handleAddFeedPress = () => {
    if (onAddPress) {
      onAddPress();
    } else {
      // Fall back to drawer navigation
      (navigation as any).navigate("Add Feed");
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.row}>
        <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton} activeOpacity={0.7}>
          <BrandWordmark />
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={{ marginRight: 15 }}>
            <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" width={24} height={24}>
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </Svg>
          </TouchableOpacity>
          {myFeed && (
            <TouchableOpacity style={styles.addBtn} onPress={handleAddFeedPress}>
              <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" width={20} height={20}>
                <Path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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
    paddingTop: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  menuButton: {
    paddingLeft: 20,
    marginRight: 10,
  },
  wordmark: {
    color: "#fff",
    fontFamily: "oswald",
    fontWeight: "700",
  },
  wordmarkCentered: {
    textAlign: "center",
  },
  wordmarkAccent: {
    color: "#166534",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  addBtn: {
    marginRight: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "green",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});

export default Header;
