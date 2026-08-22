import i18n from "@/translations/i18n";
import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useGroupRoomsContext } from "@/contexts/ChatContext";
import { GroupRoomCard } from "@/components/groupchat/GroupRoomCard";
import type { ChatRoom } from "@sparkstrand/chat-api-client/v2/types";

const JoinedGroups = () => {
  const navigation = useNavigation<any>();
  const { pastRooms, upcomingRooms, isLoading, error, refetch } = useGroupRoomsContext();
  const [refreshing, setRefreshing] = useState(false);

  const rooms = useMemo(() => [...upcomingRooms, ...pastRooms], [pastRooms, upcomingRooms]);

  const handleRoomPress = useCallback((room: ChatRoom) => {
    navigation.navigate("Group Chats", { initialRoomId: room.roomId });
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const keyExtractor = useCallback((item: ChatRoom) => item.roomId, []);
  const renderItem = useCallback(({ item }: { item: ChatRoom }) => (
    <GroupRoomCard room={item} onPress={handleRoomPress} />
  ), [handleRoomPress]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={() => navigation.navigate("Group Chats")}
      >
        <Text style={styles.viewAllText}>View All Groups</Text>
      </TouchableOpacity>

      {error ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>{i18n.t("Complaints.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : rooms.length === 0 && !isLoading ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>No joined groups yet.</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isLoading}
              onRefresh={handleRefresh}
              tintColor="#2ecc71"
              colors={["#2ecc71"]}
              progressBackgroundColor="#0d0d0d"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16, backgroundColor: "#0d0d0d" },
  viewAllBtn: {
    backgroundColor: "#166534",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2ecc71",
    marginHorizontal: 4,
    marginBottom: 12,
  },
  viewAllText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  listContent: { paddingBottom: 20, paddingHorizontal: 4 },
  stateBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: { color: "#9CA3AF", fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1f2937",
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },
});

export default JoinedGroups;
