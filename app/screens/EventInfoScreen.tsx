import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";

export default function EventInfoScreen({ navigation }: any) {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Group info</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#111827" />
          </Pressable>
        </View>

        <ScrollView>
          {/* Group Info */}
          <View style={styles.groupSection}>
            <Image
              source={{ uri: "https://picsum.photos/300" }}
              style={styles.groupAvatar}
            />
            <Text style={styles.groupName}>Volleyball Friendly</Text>
            <Text style={styles.groupMeta}>28 participants</Text>
          </View>

          {/* Description */}
          <View style={styles.block}>
            <Text style={styles.description}>
              Friendly volleyball match between team A and team B. Bring your
              best energy and let’s have fun 🏐
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.block}>
            <InfoRow icon="notifications-outline" label="Mute notifications" />
            <InfoRow icon="search-outline" label="Search in conversation" />
            <InfoRow icon="bookmark-outline" label="Starred messages" />
          </View>

          {/* Media */}
          <View style={styles.block}>
            <View style={styles.mediaHeader}>
              <Text style={styles.sectionTitle}>Media, links & docs</Text>
              <Text style={styles.linkText}>3</Text>
            </View>

            <View style={styles.mediaRow}>
              {[90, 91, 92].map((n) => (
                <Image
                  key={n}
                  source={{ uri: `https://picsum.photos/${n}` }}
                  style={styles.mediaThumb}
                />
              ))}
            </View>
          </View>

          {/* Members */}
          <View style={styles.block}>
            <Text style={styles.sectionTitle}>Participants</Text>

            {[...Array(6)].map((_, i) => (
              <View key={i} style={styles.memberRow}>
                <Image
                  source={{ uri: "https://picsum.photos/40" }}
                  style={styles.memberAvatar}
                />
                <Text style={styles.memberName}>Levi Ragh</Text>
                <Text style={styles.online}>online</Text>
              </View>
            ))}
          </View>

          {/* Danger Zone */}
          <View style={styles.block}>
            <Pressable style={styles.dangerRow}>
              <Ionicons name="exit-outline" size={22} color="#EF4444" />
              <Text style={styles.dangerText}>Exit group</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

/* ---------- Reusable Row ---------- */
function InfoRow({ icon, label }: any) {
  return (
    <Pressable style={styles.infoRow}>
      <Ionicons name={icon} size={22} color="#374151" />
      <Text style={styles.infoText}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  groupSection: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 8,
  },
  groupAvatar: {
    width: 96,
    height: 96,
    borderRadius: 16,
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  groupMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  block: {
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  description: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#111827",
    marginLeft: 16,
  },

  mediaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mediaRow: {
    flexDirection: "row",
    gap: 8,
  },
  mediaThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  linkText: {
    fontSize: 14,
    color: "#2563EB",
  },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  memberName: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  online: {
    fontSize: 12,
    color: "#22C55E",
  },

  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  dangerText: {
    marginLeft: 16,
    fontSize: 15,
    color: "#EF4444",
    fontWeight: "500",
  },
});
