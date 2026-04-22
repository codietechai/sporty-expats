import { backendClient } from "@/client/backendClient";
import { useUserDb } from "@/app/hooks/useUserDb";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface StatusCounts {
    pending: number;
    rejected: number;
}

const PostStatusBar = () => {
    const { userDb } = useUserDb();
    const userId: string | undefined = userDb?.data?.id ?? userDb?.id;

    const [counts, setCounts] = useState<StatusCounts>({ pending: 0, rejected: 0 });
    const [dismissedPending, setDismissedPending] = useState(false);
    const [dismissedRejected, setDismissedRejected] = useState(false);

    useEffect(() => {
        if (!userId) return;
        backendClient
            .get(`/users/${userId}/posts/status`)
            .then((res) => {
                setCounts({
                    pending: res.data?.pending?.length ?? 0,
                    rejected: res.data?.rejected?.length ?? 0,
                });
            })
            .catch(() => { });
    }, [userId]);

    // Reset dismissal when new counts arrive
    useEffect(() => { setDismissedRejected(false); }, [counts.rejected]);
    useEffect(() => { setDismissedPending(false); }, [counts.pending]);

    const showPending = counts.pending > 0 && !dismissedPending;
    const showRejected = counts.rejected > 0 && !dismissedRejected;

    if (!showPending && !showRejected) return null;

    return (
        <View style={styles.wrap}>
            {showRejected && (
                <View style={styles.rejectedBar}>
                    <Ionicons name="alert-circle-outline" size={16} color="#f87171" style={styles.icon} />
                    <Text style={styles.rejectedText} numberOfLines={1}>
                        {counts.rejected === 1
                            ? "1 post rejected – check your posts"
                            : `${counts.rejected} posts rejected – check your posts`}
                    </Text>
                    <TouchableOpacity onPress={() => setDismissedRejected(true)} hitSlop={10}>
                        <Ionicons name="close" size={16} color="#f87171" />
                    </TouchableOpacity>
                </View>
            )}

            {showPending && (
                <View style={styles.pendingBar}>
                    <Ionicons name="time-outline" size={16} color="#fbbf24" style={styles.icon} />
                    <Text style={styles.pendingText} numberOfLines={1}>
                        {counts.pending === 1
                            ? "1 post under review by admin"
                            : `${counts.pending} posts under review by admin`}
                    </Text>
                    <TouchableOpacity onPress={() => setDismissedPending(true)} hitSlop={10}>
                        <Ionicons name="close" size={16} color="#fbbf24" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { paddingHorizontal: 12, paddingTop: 8, gap: 6 },

    rejectedBar: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "rgba(127,29,29,0.5)",
        borderWidth: 1, borderColor: "rgba(185,28,28,0.4)",
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    },
    rejectedText: { flex: 1, color: "#fca5a5", fontSize: 13 },

    pendingBar: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "rgba(120,53,15,0.5)",
        borderWidth: 1, borderColor: "rgba(180,83,9,0.4)",
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    },
    pendingText: { flex: 1, color: "#fde68a", fontSize: 13 },

    icon: { marginRight: 8 },
});

export default PostStatusBar;
