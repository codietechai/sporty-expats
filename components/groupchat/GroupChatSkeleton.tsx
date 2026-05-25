import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const isSmallScreen = screenWidth < 375;
const IMAGE_WIDTH = isSmallScreen ? 88 : 100;
const MIN_HEIGHT = isSmallScreen ? 120 : 130;

function SkeletonCard({ opacity }: { opacity: Animated.Value }) {
    return (
        <Animated.View style={[styles.card, { opacity }]}>
            <View style={styles.image} />
            <View style={styles.content}>
                <View style={styles.lineShort} />
                <View style={styles.lineLong} />
                <View style={styles.lineMid} />
                <View style={styles.lineXShort} />
                <View style={styles.footer}>
                    <View style={styles.lineXShort} />
                    <View style={styles.avatarRow}>
                        <View style={styles.avatar} />
                        <View style={styles.avatar} />
                        <View style={styles.avatar} />
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

export default function GroupChatSkeleton({ count = 6 }: { count?: number }) {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} opacity={opacity} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: isSmallScreen ? 12 : 16, paddingTop: 12 },
    card: {
        flexDirection: "row",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
        marginBottom: 12,
        height: MIN_HEIGHT,
    },
    image: { width: IMAGE_WIDTH, height: "100%", backgroundColor: "#2a2a2a" },
    content: {
        flex: 1,
        padding: 10,
        justifyContent: "space-between",
        gap: 6,
    },
    lineShort: { height: 9, width: "40%", backgroundColor: "#2a2a2a", borderRadius: 4 },
    lineLong: { height: 13, width: "85%", backgroundColor: "#2a2a2a", borderRadius: 4 },
    lineMid: { height: 10, width: "60%", backgroundColor: "#2a2a2a", borderRadius: 4 },
    lineXShort: { height: 10, width: "25%", backgroundColor: "#2a2a2a", borderRadius: 4 },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#2a2a2a",
        paddingTop: 6,
    },
    avatarRow: { flexDirection: "row", gap: 4 },
    avatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#2a2a2a" },
});
