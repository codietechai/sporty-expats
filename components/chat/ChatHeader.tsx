import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useNotificationsContext } from "@/contexts/NotificationsContext";

type Props = {
  onInfo?: () => void;
};

export default function ChatHeader({ onInfo }: Props) {
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotificationsContext();

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.left}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </Pressable>

          <Image
            source={{ uri: "https://picsum.photos/200" }}
            style={styles.avatar}
          />

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              Volleyball Friendly
            </Text>
            <Text style={styles.subtitle}>
              28 members • Active now
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.bellBtn}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#1a1a1a" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable style={styles.infoBtn} onPress={onInfo}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#1a1a1a"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingTop: Platform.OS === "ios" ? 12 : 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    height: 72,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backBtn: {
    paddingVertical: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 8,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  bellBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
  },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
