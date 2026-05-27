import React, { useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface ChatAvatarProps {
    userId: string;
    displayName?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    size?: number;
}

function hashColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 55%, 38%)`;
}

export function ChatAvatar({ userId, displayName, name, email, image, size = 36 }: ChatAvatarProps) {
    const [imgError, setImgError] = useState(false);
    const fallbackSource = email || displayName || name || userId || "?";
    const initials = fallbackSource.trim().charAt(0).toUpperCase() || "?";
    const hasImage = !imgError && !!image && (image.startsWith("http://") || image.startsWith("https://"));

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
            {hasImage ? (
                <Image
                    source={{ uri: image! }}
                    style={[styles.img, { borderRadius: size / 2 }]}
                    onError={() => setImgError(true)}
                />
            ) : (
                <View style={[styles.fallback, { borderRadius: size / 2, backgroundColor: hashColor(fallbackSource) }]}>
                    <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
                </View>
            )}
        </View>
    );
}

export function AvatarStack({
    users,
    max = 3,
    size = 24,
    total,
}: {
    users: { userId: string; displayName?: string | null; name?: string | null; email?: string | null; image?: string | null }[];
    max?: number;
    size?: number;
    total?: number;
}) {
    const visible = users.slice(0, max);
    const overflow = (total ?? users.length) - visible.length;
    return (
        <View style={styles.stack}>
            {visible.map((u, i) => (
                <View key={u.userId} style={{ marginLeft: i === 0 ? 0 : -(size * 0.3) }}>
                    <ChatAvatar {...u} size={size} />
                </View>
            ))}
            {overflow > 0 && (
                <View
                    style={[
                        styles.overflow,
                        { width: size, height: size, borderRadius: size / 2, marginLeft: -(size * 0.3) },
                    ]}
                >
                    <Text style={[styles.overflowText, { fontSize: size * 0.32 }]}>+{overflow}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { overflow: "hidden" },
    img: { width: "100%", height: "100%" },
    fallback: { flex: 1, alignItems: "center", justifyContent: "center" },
    initials: { color: "#fff", fontWeight: "600" },
    stack: { flexDirection: "row", alignItems: "center" },
    overflow: {
        backgroundColor: "#2a2a2a",
        alignItems: "center",
        justifyContent: "center",
    },
    overflowText: { color: "#d1d5db", fontWeight: "600" },
});
