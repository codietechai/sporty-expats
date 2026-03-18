import React from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ChatInput() {
  return (
    <View style={styles.container}>
      <View style={styles.inputBox}>
        <TextInput
          placeholder="Message"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          multiline
        />
        <Pressable>
          <Ionicons name="happy-outline" size={22} color="#6B7280" />
        </Pressable>
      </View>

      <Pressable style={styles.sendBtn}>
        <Ionicons name="send" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "flex-end",
  },
  inputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginRight: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 6,
  },
  sendBtn: {
    backgroundColor: "#2563EB",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
