import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";

const JoinedGroups = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={() => navigation.navigate("Group Chats")}
      >
        <Text style={styles.viewAllText}>View All Group Chats →</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        Your event group chats appear here. Tap above to open the full chat view.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },
  viewAllBtn: {
    backgroundColor: "#166534",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  viewAllText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  hint: { color: "#6B7280", fontSize: 13, textAlign: "center", marginTop: 16, lineHeight: 20 },
});

export default JoinedGroups;
