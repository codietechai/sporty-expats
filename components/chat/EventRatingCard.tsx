import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export default function EventRatingCard() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>How would you rate this event?</Text>

      <View style={styles.row}>
        <RatingItem emoji="👍" label="Good" />
        <RatingItem emoji="✋" label="Neutral" />
        <RatingItem emoji="👎" label="Bad" />
      </View>
    </View>
  );
}

function RatingItem({ emoji, label }: { emoji: string; label: string }) {
  return (
    <Pressable style={styles.item}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginVertical: 12,
  },
  title: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  item: {
    alignItems: "center",
    width: 80,
  },
  emoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
  },
});
