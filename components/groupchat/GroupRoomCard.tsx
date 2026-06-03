import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AvatarStack } from "./ChatAvatar";
import { normalizeMediaUrl } from "@/helpers/normalizeMediaUrl";
import type { ChatRoom } from "@sparkstrand/chat-api-client/v2/types";
import type { EventRoomMetadata } from "@/app/chat/group/eventMetadata";

const { width: screenWidth } = Dimensions.get("window");
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;

const DEFAULT_IMAGE = "https://placehold.co/144x150/1e2e1e/4ade80?text=🏟️";
const IMAGE_WIDTH = isSmallScreen ? 88 : isMediumScreen ? 100 : 112;
const MIN_CARD_HEIGHT = isSmallScreen ? 100 : 110;

function formatEventDate(date: string): string {
    return new Date(date)
        .toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        .toUpperCase();
}

function isEventPast(meta: EventRoomMetadata): boolean {
    if (!meta?.endDate) return false;
    return new Date(meta.endDate).getTime() < Date.now();
}

interface Props {
    room: ChatRoom;
    isSelected?: boolean;
    onPress: (room: ChatRoom) => void;
}

export const GroupRoomCard = React.memo(({ room, isSelected = false, onPress }: Props) => {
    const meta = room.metadata as EventRoomMetadata | undefined;
    const members = room.members ?? [];
    const past = meta ? isEventPast(meta) : false;
    const title = meta?.title ?? room.roomId;
    // Use coverImage.fileUrl from metadata directly — no extra API fetch needed
    const rawUrl = meta?.coverImage?.fileUrl ?? (room as any).image ?? "";
    const coverImage = rawUrl ? normalizeMediaUrl(rawUrl) : DEFAULT_IMAGE;
    const [imgError, setImgError] = useState(false);
    console.log("[GroupRoomCard]", title, "→", coverImage);

    const handlePress = React.useCallback(() => onPress(room), [onPress, room]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[styles.card, isSelected && styles.cardSelected]}
            activeOpacity={0.8}
        >
            {/* Image — stretches to fill card height naturally */}
            <View style={styles.imageContainer}>
                {!imgError && coverImage !== DEFAULT_IMAGE ? (
                    <Image
                        source={{ uri: coverImage }}
                        style={styles.image}
                        onError={() => setImgError(true)}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderEmoji}>🏟️</Text>
                    </View>
                )}
                {meta?.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{meta.category}</Text>
                    </View>
                )}
            </View>

            {/* Content — fixed height card, content aligned top, footer pinned bottom */}
            <View style={styles.content}>
                <View>
                    {meta?.startDate && (
                        <Text style={styles.date}>{formatEventDate(meta.startDate)}</Text>
                    )}
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={12} color="#6B7280" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {past
                                ? "This event has passed"
                                : (meta?.location?.name ?? "Location TBD")}
                        </Text>
                    </View>
                    {(room.unreadCount ?? 0) > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{room.unreadCount} new</Text>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.viewText}>View Room →</Text>
                    <View style={styles.membersRow}>
                        <AvatarStack
                            users={members}
                            max={3}
                            size={isSmallScreen ? 16 : 20}
                            total={members.length}
                        />
                        <Text style={styles.memberCount}>{members.length}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}, (prev, next) =>
    prev.room.roomId === next.room.roomId &&
    prev.isSelected === next.isSelected &&
    prev.room.unreadCount === next.room.unreadCount &&
    prev.room.members?.length === next.room.members?.length
);

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#2a2a2a",
        backgroundColor: "#161616",
        marginBottom: 12,
        height: isSmallScreen ? 120 : 130,
    },
    cardSelected: {
        borderColor: "#3d7a3d",
        backgroundColor: "#1a2a1a",
    },
    imageContainer: {
        width: IMAGE_WIDTH,
        height: "100%",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#1e2e1e",
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderEmoji: {
        fontSize: isSmallScreen ? 24 : 28,
    },
    categoryBadge: {
        position: "absolute",
        top: 6,
        left: 6,
        backgroundColor: "rgba(0,0,0,0.65)",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#4ade80",
    },
    categoryText: {
        color: "#4ade80",
        fontSize: isSmallScreen ? 8 : 9,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        padding: isSmallScreen ? 7 : 8,
        justifyContent: "space-between",
    },
    contentTop: {
        gap: 2,
    },
    date: {
        fontSize: isSmallScreen ? 9 : 10,
        color: "#9CA3AF",
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    title: {
        fontSize: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
        fontWeight: "700",
        color: "#fff",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        lineHeight: isSmallScreen ? 15 : 17,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    locationText: {
        fontSize: isSmallScreen ? 10 : 11,
        color: "#9CA3AF",
        flex: 1,
    },
    unreadBadge: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(74,222,128,0.2)",
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 20,
        marginTop: 2,
    },
    unreadText: {
        fontSize: isSmallScreen ? 9 : 10,
        color: "#4ade80",
        fontWeight: "700",
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#2a2a2a",
        paddingTop: 4,
    },
    viewText: {
        fontSize: isSmallScreen ? 10 : 11,
        color: "#4ade80",
        fontWeight: "600",
    },
    membersRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    memberCount: {
        fontSize: isSmallScreen ? 10 : 11,
        color: "#9CA3AF",
    },
});
