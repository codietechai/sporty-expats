import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

type Props = {
  user: string;
  text: string;
  me?: boolean;
};

export default function MessageBubble({ user, text, me }: Props) {
  return (
    <View
      style={[
        styles.container,
        { alignItems: me ? "flex-end" : "flex-start" },
      ]}
    >
      {!me && <Text style={styles.username}>{user}</Text>}
      <View style={styles.row}>
        {!me && (
          <Image
            source={{ uri: "https://picsum.photos/40" }}
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.bubble,
            me ? styles.myBubble : styles.otherBubble,
          ]}
        >
          <Text style={me ? styles.myText : styles.otherText}>
            {text}
          </Text>
        </View>
        {me && (
          <Image
            source={{ uri: "https://picsum.photos/41" }}
            style={styles.avatar}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "85%",
  },
  username: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    marginLeft: 48,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  bubble: {
    width: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: "#3B82F6",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
  },
  myText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  otherText: {
    color: "#1F2937",
    fontSize: 14,
  },
});
