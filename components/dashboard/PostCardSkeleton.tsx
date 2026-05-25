import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

function Shimmer({ style }: { style: any }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[{ backgroundColor: "#1f2937", borderRadius: 6 }, style, { opacity }]} />;
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
      {/* Title */}
      <Shimmer style={s.lineTitle} />
      {/* Body lines */}
      <Shimmer style={s.lineFull} />
      <Shimmer style={s.lineFull} />
      <Shimmer style={s.lineThreeQ} />
      {/* Image placeholder */}
      <Shimmer style={s.image} />
      {/* Counts */}
      <View style={s.countsRow}>
        <Shimmer style={s.lineXS} />
        <Shimmer style={s.lineXS} />
        <Shimmer style={s.lineXS} />
      </View>
      {/* Divider */}
      <View style={s.divider} />
      {/* Actions */}
      <View style={s.actionsRow}>
        <Shimmer style={s.actionBtn} />
        <Shimmer style={s.actionBtn} />
        <Shimmer style={s.actionBtn} />
        <Shimmer style={s.actionBtn} />
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
  list: { paddingBottom: 20, gap: 12, paddingHorizontal: 0 },
  card: {
    backgroundColor: "#111827", borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: "#1f2937", gap: 10,
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  authorLines: { flex: 1, gap: 6 },
  bookmark: { width: 20, height: 20, borderRadius: 4 },
  lineMed: { height: 11, width: "45%" },
  lineShort: { height: 9, width: "28%" },
  lineTitle: { height: 14, width: "60%" },
  lineFull: { height: 10, width: "100%" },
  lineThreeQ: { height: 10, width: "75%" },
  lineXS: { height: 10, width: "22%" },
  image: { height: 160, width: "100%", borderRadius: 10 },
  countsRow: { flexDirection: "row", gap: 12 },
  divider: { height: 1, backgroundColor: "#1f2937" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: { height: 20, width: "20%", borderRadius: 6 },
});
