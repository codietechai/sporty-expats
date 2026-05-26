import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const SCREEN_W = Dimensions.get("window").width;

function Shimmer({ style }: { style: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[{ backgroundColor: "#1a1a1a", borderRadius: 6 }, style, { opacity }]} />;
}

function PostCardSkeleton() {
  return (
    <View style={s.card}>
      {/* Author row */}
      <View style={s.authorRow}>
        <Shimmer style={s.avatar} />
        <View style={s.authorLines}>
          <Shimmer style={s.lineMed} />
          <Shimmer style={s.lineShort} />
        </View>
        <Shimmer style={s.bookmark} />
      </View>

      {/* Caption lines */}
      <View style={s.captionWrap}>
        <Shimmer style={s.lineTitle} />
        <Shimmer style={s.lineFull} />
        <Shimmer style={s.lineThreeQ} />
      </View>

      {/* Full-width image placeholder */}
      <Shimmer style={s.image} />

      {/* Actions row */}
      <View style={s.actionsRow}>
        <Shimmer style={s.actionIcon} />
        <Shimmer style={s.actionIcon} />
        <Shimmer style={s.actionIcon} />
        <Shimmer style={s.actionIcon} />
      </View>

      {/* Counts */}
      <View style={s.countsRow}>
        <Shimmer style={s.lineXS} />
        <Shimmer style={s.lineXS} />
      </View>
    </View>
  );
}

export default function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={s.list}>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  list: { paddingBottom: 20 },

  card: {
    backgroundColor: "#0d0d0d",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 14,
    gap: 0,
  },

  // Author
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  authorLines: { flex: 1, gap: 6 },
  bookmark: { width: 22, height: 22, borderRadius: 4 },
  lineMed: { height: 11, width: "40%" },
  lineShort: { height: 9, width: "25%" },

  // Caption
  captionWrap: { paddingHorizontal: 14, gap: 7, marginBottom: 10 },
  lineTitle: { height: 13, width: "55%" },
  lineFull: { height: 10, width: "100%" },
  lineThreeQ: { height: 10, width: "72%" },

  // Full-width image
  image: { width: SCREEN_W, height: 380, borderRadius: 0, marginBottom: 4 },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionIcon: { width: 28, height: 28, borderRadius: 14 },

  // Counts
  countsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 14 },
  lineXS: { height: 11, width: "18%", borderRadius: 4 },
});
