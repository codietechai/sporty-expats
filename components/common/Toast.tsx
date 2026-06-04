import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ToastType = "error" | "success" | "warning" | "info";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

const CONFIG: Record<ToastType, { bg: string; border: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  error:   { bg: "#1a0a0a", border: "#ef4444", icon: "alert-circle-outline",     color: "#f87171" },
  success: { bg: "#0a1a0f", border: "#22c55e", icon: "checkmark-circle-outline",  color: "#4ade80" },
  warning: { bg: "#1a1200", border: "#f59e0b", icon: "warning-outline",           color: "#fbbf24" },
  info:    { bg: "#0a0f1a", border: "#3b82f6", icon: "information-circle-outline", color: "#60a5fa" },
};

// ── Singleton ref ─────────────────────────────────────────────────────────────
let _show: ((message: string, type?: ToastType, duration?: number) => void) | null = null;

export function showToast(message: string, type: ToastType = "error", duration = 4000) {
  _show?.(message, type, duration);
}

// ── Provider — mount once in _layout.tsx ─────────────────────────────────────
export function ToastProvider() {
  const [state, setState] = useState<ToastState>({ visible: false, message: "", type: "error" });
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    _show = (message, type = "error", duration = 4000) => {
      if (timer.current) clearTimeout(timer.current);
      // Reset position before showing
      translateY.setValue(-120);
      opacity.setValue(0);
      setState({ visible: true, message, type });
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(hide, duration);
    };
    return () => { _show = null; };
  }, []);

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setState(s => ({ ...s, visible: false })));
  };

  if (!state.visible) return null;

  const cfg = CONFIG[state.type];

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]} pointerEvents="box-none">
      <View style={[styles.toast, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.color} style={{ flexShrink: 0 }} />
        <Text style={[styles.message, { color: cfg.color }]} numberOfLines={4}>{state.message}</Text>
        <TouchableOpacity onPress={hide} hitSlop={10} style={{ flexShrink: 0 }}>
          <Ionicons name="close" size={18} color={cfg.color} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
});
