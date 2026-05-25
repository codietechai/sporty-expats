import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AvatarStack } from "./ChatAvatar";
import { useRoomCoverImage } from "@/app/hooks/useRoomCoverImage";
import type { ChatRoom } from "@sparkstrand/chat-api-client/v2/types";
import type { EventRoomMetadata } from "@/app/chat/group/eventMetadata";

const { width: screenWidth } = Dimensions.get('window');
const DEFAULT_IMAGE = "https://placehold.co/144x150/1e2e1e/4ade80?text=🏟️";

// Responsive breakpoints
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

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
    const coverImage = useRoomCoverImage(room.roomId, meta?.coverImage?.fileUrl);
    const [imgError, setImgError] = useState(false);

    // Responsive dimensions
    const cardHeight = isSmallScreen ? 100 : isMediumScreen ? 110 : 120;
    const imageWidth = isSmallScreen ? 80 : isMediumScreen ? 96 : 110;
    const contentPadding = isSmallScreen ? 8 : 10;

    const handlePress = React.useCallback(() => {
        onPress(room);
    }, [onPress, room]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[
                styles.card, 
                isSelected && styles.cardSelected,
                { height: cardHeight }
            ]}
            activeOpacity={0.8}
        >
            <View style={[styles.imageContainer, { width: imageWidth }]}>
                {!imgError && coverImage !== DEFAULT_IMAGE ? (
                    <Image
                        source={{ uri: coverImage }}
                        style={[styles.image, { height: cardHeight }]}
                        onError={() => setImgError(true)}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.imagePlaceholder, { height: cardHeight }]}>
                        <Text style={[
                            styles.placeholderEmoji,
                            { fontSize: isSmallScreen ? 24 : 28 }
                        ]}>🏟️</Text>
                    </View>
                )}
                {meta?.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={[
                            styles.categoryText,
                            { fontSize: isSmallScreen ? 8 : 9 }
                        ]}>{meta.category}</Text>
                    </View>
                )}
            </View>

            <View style={[styles.content, { padding: contentPadding }]}>
                {meta?.startDate && (
                    <Text style={[
                        styles.date,
                        { fontSize: isSmallScreen ? 9 : 10 }
                    ]}>{formatEventDate(meta.startDate)}</Text>
                )}
                <Text 
                    style={[
                        styles.title,
                        { fontSize: isSmallScreen ? 12 : isMediumScreen ? 14 : 15 }
                    ]} 
                    numberOfLines={isSmallScreen ? 2 : 1}
                >{title}</Text>
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={12} color="#6B7280" />
                    <Text 
                        style={[
                            styles.locationText,
                            { fontSize: isSmallScreen ? 10 : 11 }
                        ]} 
                        numberOfLines={1}
                    >
                        {past ? "This event has passed" : (meta?.location?.name ?? "Location TBD")}
                    </Text>
                </View>
                {(room.unreadCount ?? 0) > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={[
                            styles.unreadText,
                            { fontSize: isSmallScreen ? 9 : 10 }
                        ]}>{room.unreadCount} new</Text>
                    </View>
                )}

                <View style={styles.footer}>
                    <Text style={[
                        styles.viewText,
                        { fontSize: isSmallScreen ? 10 : 11 }
                    ]}>View Room →</Text>
                    <View style={styles.membersRow}>
                        <AvatarStack 
                            users={members} 
                            max={3} 
                            size={isSmallScreen ? 16 : 20} 
                            total={members.length} 
                        />
                        <Text style={[
                            styles.memberCount,
                            { fontSize: isSmallScreen ? 10 : 11 }
                        ]}>{members.length}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for React.memo
    return (
        prevProps.room.roomId === nextProps.room.roomId &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.room.unreadCount === nextProps.room.unreadCount &&
        prevProps.room.members?.length === nextProps.room.members?.length
    );
});

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#2a2a2a",
        backgroundColor: "#161616",
        marginBottom: 12,
        // Height is now dynamic based on screen size
    },
    cardSelected: {
        borderColor: "#3d7a3d",
        backgroundColor: "#1a2a1a",
    },
    imageContainer: {
        // Width is now dynamic based on screen size
        flexShrink: 0,
    },
    image: {
        width: "100%",
        // Height is now dynamic based on screen size
    },
    imagePlaceholder: {
        width: "100%",
        // Height is now dynamic based on screen size
        backgroundColor: "#1e2e1e",
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderEmoji: {
        // Font size is now dynamic based on screen size
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
        // Font size is now dynamic based on screen size
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        // Padding is now dynamic based on screen size
        justifyContent: "space-between",
    },
    date: {
        // Font size is now dynamic based on screen size
        color: "#9CA3AF",
        fontWeight: "600",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    title: {
        // Font size is now dynamic based on screen size
        fontWeight: "700",
        color: "#fff",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
        lineHeight: 16, // Better line height for multi-line titles on small screens
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 4,
        minHeight: 16, // Ensure consistent height
    },
    locationText: {
        // Font size is now dynamic based on screen size
        color: "#9CA3AF",
        flex: 1,
    },
    unreadBadge: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(74,222,128,0.2)",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
        marginBottom: 4,
    },
    unreadText: {
        // Font size is now dynamic based on screen size
        color: "#4ade80",
        fontWeight: "700",
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#2a2a2a",
        paddingTop: 6,
        marginTop: 4,
        minHeight: 24, // Ensure consistent footer height
    },
    viewText: {
        // Font size is now dynamic based on screen size
        color: "#4ade80",
        fontWeight: "600",
    },
    membersRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    memberCount: {
        // Font size is now dynamic based on screen size
        color: "#9CA3AF",
    },
});
