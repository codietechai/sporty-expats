import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getUploadedMediaByUser } from "@/client/endpoints/users/getUserUploadedMedia";
import MediaGallery from "@/components/profile/mediaGallery";
import { useUserDb } from "@/app/hooks/useUserDb";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 2;
const COLS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - GAP * (COLS + 1)) / COLS;

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function MediaSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cells = Array.from({ length: 12 });

  return (
    <Animated.View style={[sk.grid, { opacity }]}>
      {cells.map((_, i) => (
        <View key={i} style={sk.cell} />
      ))}
    </Animated.View>
  );
}

const sk = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: GAP,
  },
  cell: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: GAP / 2,
    borderRadius: 4,
    backgroundColor: "#1e1e1e",
  },
});

const MediaUploadScreen = () => {
  const navigation = useNavigation();
  const { userDb, loading: userLoading } = useUserDb();
  const [allData, setAllData] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const userId: string | null =
    userDb?.data?.data?.id ?? userDb?.data?.id ?? userDb?.id ?? null;

  const userName: string =
    userDb?.data?.data?.personalDetails?.firstName ??
    userDb?.data?.data?.firstName ??
    userDb?.data?.firstName ??
    userDb?.firstName ??
    "My Media";

  useEffect(() => {
    if (!userId) return;
    setFetching(true);
    getUploadedMediaByUser(userId)
      .then((res) => setAllData(res?.data?.data ?? []))
      .catch((err) => console.error("Error loading media", err))
      .finally(() => setFetching(false));
  }, [userId]);

  const filteredData = useCallback(() => {
    if (activeTab === "all") return allData;
    const now = new Date();
    return allData.filter((item) => {
      if (!item.createdAt) return true;
      const created = new Date(item.createdAt);
      if (activeTab === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return created >= weekAgo;
      }
      if (activeTab === "month") {
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }
      if (activeTab === "year") {
        return created.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [allData, activeTab]);

  const isLoading = userLoading || fetching;
  const data = filteredData();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Media</Text>
            <Text style={styles.headerSub}>{userName}'s uploads</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
          style={styles.tabScroll}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats bar */}
        {!isLoading && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="images-outline" size={14} color="#4ade80" />
              <Text style={styles.statText}>
                {data.length} {data.length === 1 ? "item" : "items"}
              </Text>
            </View>
            {activeTab !== "all" && allData.length !== data.length && (
              <Text style={styles.statHint}>
                {allData.length - data.length} hidden by filter
              </Text>
            )}
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <MediaSkeleton />
        ) : !userId ? (
          <View style={styles.centered}>
            <Ionicons name="person-circle-outline" size={48} color="#374151" />
            <Text style={styles.emptyTitle}>Not signed in</Text>
            <Text style={styles.emptySubtitle}>Unable to load user data.</Text>
          </View>
        ) : (
          <MediaGallery media={data} />
        )}
      </SafeAreaView>
    </>
  );
};

export default MediaUploadScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
    backgroundColor: "#111",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },

  // Tabs
  tabScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  tabRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  tabActive: {
    backgroundColor: "#166534",
    borderColor: "#4ade80",
  },
  tabText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  tabTextActive: { color: "#fff", fontWeight: "700" },

  // Stats
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
  statHint: { fontSize: 11, color: "#4B5563" },

  // States
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  loadingText: { color: "#6B7280", fontSize: 13, marginTop: 4 },
  emptyTitle: { color: "#D1D5DB", fontSize: 16, fontWeight: "600" },
  emptySubtitle: { color: "#6B7280", fontSize: 13, textAlign: "center" },
});
