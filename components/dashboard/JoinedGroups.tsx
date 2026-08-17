import i18n from "@/translations/i18n";
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useGroupRoomsContext } from "@/contexts/ChatContext";
import { GroupRoomCard } from "@/components/groupchat/GroupRoomCard";
import type { ChatRoom } from "@sparkstrand/chat-api-client/v2/types";

const JoinedGroups = () => {
  const navigation = useNavigation<any>();
  const { pastRooms, upcomingRooms, isLoading, error, refetch } = useGroupRoomsContext();

  // Most recently active rooms first — mix past and upcoming
  const rooms = useMemo(() => [...upcomingRooms, ...pastRooms], [pastRooms, upcomingRooms]);

  const handleRoomPress = (room: ChatRoom) => {
    navigation.navigate("Group Chats", { initialRoomId: room.roomId });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={() => navigation.navigate("Group Chats")}
      >
        <Text style={styles.viewAllText}>View All Groups</Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Loading your groups…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>{i18n.t("Complaints.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : rooms.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>No joined groups yet.</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.roomId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <GroupRoomCard room={item} onPress={handleRoomPress} />
          )}
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
