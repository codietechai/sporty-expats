import React, { useState } from "react";
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Text,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type MediaItem = {
  id: string;
  fileUrl: string;
  fileType?: string;
  filename?: string;
};

type Props = {
  media: MediaItem[];
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 2;
const COLS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - GAP * (COLS + 1)) / COLS;

const isVideo = (item: MediaItem) =>
  item.fileType?.startsWith("video/") ||
  /\.(mp4|mov|avi|mkv|webm)$/i.test(item.fileUrl ?? "");

const MediaGallery: React.FC<Props> = ({ media }) => {
  const [selected, setSelected] = useState<MediaItem | null>(null);

  if (media.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="images-outline" size={56} color="#2a2a2a" />
        <Text style={styles.emptyTitle}>No media yet</Text>
        <Text style={styles.emptySubtitle}>
          Your uploaded photos and videos will appear here.
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={media}
        keyExtractor={(item) => item.id}
        numColumns={COLS}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSelected(item)}
            style={styles.cell}
          >
            <Image source={{ uri: item.fileUrl }} style={styles.image} />
            {/* Video badge */}
            {isVideo(item) && (
              <View style={styles.videoBadge}>
                <Ionicons name="play" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Lightbox */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <SafeAreaView style={styles.lightbox}>
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setSelected(null)}
            hitSlop={12}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>

          {selected && (
            <Image
              source={{ uri: selected.fileUrl }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}

          {selected?.filename && (
            <Text style={styles.lightboxCaption} numberOfLines={1}>
              {selected.filename}
            </Text>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default MediaGallery;

const styles = StyleSheet.create({
  grid: {
    padding: GAP,
    paddingBottom: 100,
  },
  cell: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: GAP / 2,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  videoBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 4,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    color: "#D1D5DB",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  emptySubtitle: {
    color: "#4B5563",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  // Lightbox
  lightbox: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  lightboxClose: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 6,
  },
  lightboxImage: {
    width: "100%",
    height: "80%",
  },
  lightboxCaption: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 12,
  },
});
