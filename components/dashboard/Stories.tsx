import { GET_ALL_STORIES, getAllStories } from "@/client/endpoints/posts/getAllStories";
import { createStory } from "@/client/endpoints/posts/addStories";
import { useUserDb } from "@/app/hooks/useUserDb";
import { backendClient } from "@/client/backendClient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useQuery } from "react-query";
import { useNavigation } from "@react-navigation/native";

const DEFAULT_AVATAR = "https://storage.strandcdn.com/avatar.svg";

export type Story = {
  authorId: string;
  id: string;
  file: { filename: string; fileUrl: string };
  creationTime: string;
  name: string;
  imageUrl: string;
};

type GroupedStory = {
  authorId: string;
  name: string;
  imageUrl: string;
  stories: Story[];
};

type StoryStatus = {
  pending: Story[];
  rejected: Story[];
};

function groupByAuthor(stories: Story[]): GroupedStory[] {
  const map = new Map<string, GroupedStory>();
  stories.forEach((s) => {
    if (!map.has(s.authorId)) {
      map.set(s.authorId, { authorId: s.authorId, name: s.name, imageUrl: s.imageUrl, stories: [] });
    }
    map.get(s.authorId)!.stories.push(s);
  });
  return Array.from(map.values());
}

// ── Story Upload Modal ────────────────────────────────────────────────────────
function StoryUploadModal({
  userId,
  userAvatar,
  onClose,
  onSuccess,
}: {
  userId: string;
  userAvatar?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Please allow media access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const a = result.assets[0];
      setPickedUri(a.uri);
      setPickedFile({
        uri: a.uri,
        name: a.fileName ?? a.uri.split("/").pop() ?? "story.jpg",
        type: a.mimeType ?? "image/jpeg",
      });
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!pickedFile) { setError("Please select a file to upload."); return; }
    setUploading(true);
    setError(null);
    try {
      await createStory(userId, pickedFile);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={um.overlay}>
          <TouchableWithoutFeedback>
            <View style={um.sheet}>
              <Text style={um.title}>Upload New Story</Text>

              {/* Preview / pick area */}
              <TouchableOpacity style={um.previewArea} onPress={pickImage} activeOpacity={0.8}>
                {pickedUri ? (
                  <Image source={{ uri: pickedUri }} style={um.preview} resizeMode="cover" />
                ) : (
                  <View style={um.previewPlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#6b7280" />
                    <Text style={um.previewHint}>Tap to select image</Text>
                  </View>
                )}
              </TouchableOpacity>

              {pickedFile && (
                <Text style={um.fileName} numberOfLines={1}>{pickedFile.name}</Text>
              )}

              {error && <Text style={um.errorText}>{error}</Text>}

              <View style={um.btnRow}>
                <TouchableOpacity style={um.cancelBtn} onPress={onClose} disabled={uploading}>
                  <Text style={um.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[um.uploadBtn, uploading && um.uploadBtnDisabled]}
                  onPress={handleUpload}
                  disabled={uploading}
                >
                  {uploading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={um.uploadText}>Upload</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const um = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center", alignItems: "center",
  },
  sheet: {
    width: 320, backgroundColor: "#111",
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#2ecc71", gap: 12,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  previewArea: {
    width: "100%", height: 200, borderRadius: 12,
    overflow: "hidden", backgroundColor: "#1f2937",
  },
  preview: { width: "100%", height: "100%" },
  previewPlaceholder: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 8,
  },
  previewHint: { color: "#6b7280", fontSize: 13 },
  fileName: { color: "#9ca3af", fontSize: 12 },
  errorText: { color: "#f87171", fontSize: 13 },
  btnRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 4 },
  cancelBtn: {
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 10, borderWidth: 1, borderColor: "#2ecc71",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cancelText: { color: "#fff", fontWeight: "600" },
  uploadBtn: {
    paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 10, backgroundColor: "#166534",
    borderWidth: 1, borderColor: "#2ecc71",
    minWidth: 90, alignItems: "center",
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadText: { color: "#fff", fontWeight: "700" },
});

// ── Main Stories component ────────────────────────────────────────────────────
export default function Stories() {
  const navigation = useNavigation<any>();
  const { userDb } = useUserDb();
  const userId: string | undefined = userDb?.data?.id ?? userDb?.id;
  const userAvatar: string | undefined = userDb?.data?.imageUrl ?? userDb?.imageUrl;

  const [grouped, setGrouped] = useState<GroupedStory[]>([]);
  const [storyStatus, setStoryStatus] = useState<StoryStatus>({ pending: [], rejected: [] });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedStory | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);

  const { data, refetch } = useQuery([GET_ALL_STORIES], () => getAllStories(), {
    keepPreviousData: false,
    refetchOnWindowFocus: true,
    retry: 0,
  });

  // Fetch story statuses (pending / rejected)
  const fetchStatus = () => {
    if (!userId) return;
    backendClient
      .get(`/users/${userId}/stories/status`)
      .then((res) => setStoryStatus({
        pending: res.data?.pending ?? [],
        rejected: res.data?.rejected ?? [],
      }))
      .catch(() => { });
  };

  useEffect(() => { fetchStatus(); }, [userId]);

  useEffect(() => {
    if (!data) return;
    const raw: Story[] = (data?.data?.data ?? []).map((s: any) => ({
      authorId: s.authorId,
      id: s.id,
      file: s.file,
      name: s.name,
      creationTime: s.creationTime,
      imageUrl: s.imageUrl,
    }));
    setGrouped(groupByAuthor(raw));
  }, [data]);

  const handleUploadSuccess = () => {
    refetch();
    fetchStatus();
  };

  // ── Story viewer ─────────────────────────────────────────────────────────────
  const openGroup = (group: GroupedStory) => {
    setSelectedGroup(group);
    setStoryIndex(0);
  };

  const nextStory = () => {
    if (!selectedGroup) return;
    if (storyIndex < selectedGroup.stories.length - 1) setStoryIndex((i) => i + 1);
    else setSelectedGroup(null);
  };

  const prevStory = () => {
    if (storyIndex > 0) setStoryIndex((i) => i - 1);
  };

  // ── List items ───────────────────────────────────────────────────────────────
  type ListItem =
    | { type: "add_post" }
    | { type: "upload" }
    | { type: "status" }
    | { type: "story"; group: GroupedStory };

  const hasStatus = storyStatus.pending.length > 0 || storyStatus.rejected.length > 0;

  const listData: ListItem[] = [
    { type: "add_post" },
    { type: "upload" },
    ...(hasStatus ? [{ type: "status" as const }] : []),
    ...grouped.map((g) => ({ type: "story" as const, group: g })),
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyExtractor={(item, i) =>
          item.type === "story" ? item.group.authorId : `${item.type}-${i}`
        }
        renderItem={({ item }) => {
          // ── Add Post tile ──
          if (item.type === "add_post") {
            return (
              <TouchableOpacity
                style={styles.addPostTile}
                onPress={() => navigation.navigate("Add Feed")}
              >
                <View style={styles.addPostIcon}>
                  <Ionicons name="add" size={22} color="#2ecc71" />
                </View>
                <Text style={styles.tileLabel}>New Post</Text>
              </TouchableOpacity>
            );
          }

          // ── Upload Story tile ──
          if (item.type === "upload") {
            return (
              <TouchableOpacity
                style={styles.uploadTile}
                onPress={() => setShowUploadModal(true)}
              >
                <Image
                  source={{ uri: userAvatar || DEFAULT_AVATAR }}
                  style={styles.uploadAvatar}
                />
                <View style={styles.uploadBadge}>
                  <Ionicons name="add" size={12} color="#fff" />
                </View>
                <Text style={styles.tileLabel}>Upload{"\n"}New Story</Text>
              </TouchableOpacity>
            );
          }

          // ── Status tile ──
          if (item.type === "status") {
            const isRejected = storyStatus.rejected.length > 0;
            const count = isRejected ? storyStatus.rejected.length : storyStatus.pending.length;
            const previewUrl = isRejected
              ? storyStatus.rejected[0]?.file?.fileUrl
              : storyStatus.pending[0]?.file?.fileUrl;

            return (
              <View style={[styles.statusTile, isRejected ? styles.statusTileRejected : styles.statusTilePending]}>
                {previewUrl && (
                  <Image source={{ uri: previewUrl }} style={styles.statusBg} blurRadius={4} />
                )}
                <View style={styles.statusOverlay}>
                  <Ionicons
                    name={isRejected ? "alert-circle-outline" : "time-outline"}
                    size={18}
                    color={isRejected ? "#f87171" : "rgba(255,255,255,0.4)"}
                  />
                  <Text style={[styles.statusLabel, isRejected && styles.statusLabelRejected]}>
                    {isRejected ? "Rejected" : "Under\nreview"}
                  </Text>
                </View>
                {/* Count badge */}
                <View style={[styles.countBadge, isRejected && styles.countBadgeRejected]}>
                  <Text style={styles.countBadgeText}>{count}</Text>
                </View>
              </View>
            );
          }

          // ── Story tile ──
          const { group } = item;
          const cover = group.stories[0]?.file?.fileUrl;
          return (
            <TouchableOpacity style={styles.storyTile} onPress={() => openGroup(group)}>
              <Image source={{ uri: cover || DEFAULT_AVATAR }} style={styles.storyThumb} />
              <View style={styles.storyRing} />
              <Text style={styles.storyLabel} numberOfLines={1}>{group.name}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Upload modal ── */}
      {showUploadModal && userId && (
        <StoryUploadModal
          userId={userId}
          userAvatar={userAvatar}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* ── Story viewer modal ── */}
      <Modal visible={!!selectedGroup} transparent animationType="fade">
        {selectedGroup && (
          <View style={styles.viewerBg}>
            <View style={styles.progressRow}>
              {selectedGroup.stories.map((_, i) => (
                <View key={i} style={[styles.progressDot, i === storyIndex && styles.progressDotActive]} />
              ))}
            </View>
            <View style={styles.viewerHeader}>
              <Image source={{ uri: selectedGroup.imageUrl || DEFAULT_AVATAR }} style={styles.viewerAvatar} />
              <Text style={styles.viewerName}>{selectedGroup.name}</Text>
              <TouchableOpacity onPress={() => setSelectedGroup(null)} hitSlop={12}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: selectedGroup.stories[storyIndex]?.file?.fileUrl }}
              style={styles.viewerImage}
              resizeMode="cover"
            />
            <View style={styles.tapZones}>
              <TouchableWithoutFeedback onPress={prevStory}>
                <View style={styles.tapLeft} />
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={nextStory}>
                <View style={styles.tapRight} />
              </TouchableWithoutFeedback>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const TILE_W = 68;
const TILE_H = 90;

const styles = StyleSheet.create({
  container: { backgroundColor: "#0d0d0d", paddingVertical: 10 },
  list: { paddingHorizontal: 12, gap: 10 },

  addPostTile: {
    width: TILE_W, height: TILE_H, borderRadius: 14,
    backgroundColor: "#0f1f14",
    borderWidth: 1.5, borderColor: "#2ecc71",
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  addPostIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(46,204,113,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  uploadTile: {
    width: TILE_W, height: TILE_H, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "flex-end",
    paddingBottom: 6, position: "relative",
  },
  uploadAvatar: {
    position: "absolute", top: 0, left: 0, right: 0,
    width: TILE_W, height: TILE_H / 2, borderTopLeftRadius: 14, borderTopRightRadius: 14,
  },
  uploadBadge: {
    position: "absolute", bottom: 28, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#166534", borderWidth: 1.5, borderColor: "#0d0d0d",
    alignItems: "center", justifyContent: "center",
  },

  // Status tile
  statusTile: {
    width: TILE_W, height: TILE_H, borderRadius: 14,
    overflow: "hidden", position: "relative",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  statusTilePending: { borderColor: "rgba(255,255,255,0.1)" },
  statusTileRejected: { borderColor: "rgba(239,68,68,0.6)", borderWidth: 2 },
  statusBg: { position: "absolute", width: "100%", height: "100%", opacity: 0.25 },
  statusOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  statusLabel: {
    color: "rgba(255,255,255,0.4)", fontSize: 10,
    fontWeight: "600", textAlign: "center",
  },
  statusLabelRejected: { color: "#fca5a5" },
  countBadge: {
    position: "absolute", top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  countBadgeRejected: { backgroundColor: "#ef4444" },
  countBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  storyTile: {
    width: TILE_W, height: TILE_H, borderRadius: 14,
    overflow: "hidden", position: "relative",
    alignItems: "center", justifyContent: "flex-end",
  },
  storyThumb: {
    position: "absolute", top: 0, left: 0,
    width: TILE_W, height: TILE_H, borderRadius: 14,
  },
  storyRing: {
    position: "absolute", top: 0, left: 0,
    width: TILE_W, height: TILE_H, borderRadius: 14,
    borderWidth: 2, borderColor: "#2ecc71",
  },
  storyLabel: {
    color: "#fff", fontSize: 10, fontWeight: "600",
    textAlign: "center", paddingHorizontal: 2, marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  tileLabel: {
    color: "#fff", fontSize: 10, fontWeight: "600",
    textAlign: "center", paddingHorizontal: 2,
  },

  viewerBg: { flex: 1, backgroundColor: "#000" },
  progressRow: {
    flexDirection: "row", gap: 4,
    position: "absolute", top: 50, left: 12, right: 12, zIndex: 10,
  },
  progressDot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" },
  progressDotActive: { backgroundColor: "#fff" },
  viewerHeader: {
    position: "absolute", top: 62, left: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 10, zIndex: 10,
  },
  viewerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#2ecc71" },
  viewerName: { flex: 1, color: "#fff", fontWeight: "700", fontSize: 14 },
  viewerImage: { width: "100%", height: "100%" },
  tapZones: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row" },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
});
