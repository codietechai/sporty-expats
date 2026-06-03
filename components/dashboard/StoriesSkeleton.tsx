import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

const TILE_W = 68;
const TILE_H = 90;

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

  return <Animated.View style={[{ backgroundColor: "#1e1e1e" }, style, { opacity }]} />;
}

export default function StoriesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={s.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Shimmer key={i} style={s.tile} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 10,
    paddingVertical: 10,
    backgroundColor: "#0d0d0d",
  },
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: 14,
  },
});
