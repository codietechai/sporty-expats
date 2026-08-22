import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Stack } from "expo-router";
import { getPostsById } from "@/client/endpoints/posts/getPostById";
import { normalizeMediaUrl } from "@/helpers/normalizeMediaUrl";
import { timeAgo } from "@/helpers/date";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Post {
  _id: string;
  title: string;
  desc: string;
  files: { fileUrl: string; fileType?: string }[];
  vote: number;
  total_comments: number;
  total_reactions: number;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    imageUrl: string;
  };
}

function getDisplayName(a: any): string {
  const f = a?.firstName?.trim();
  const l = a?.lastName?.trim();
  const validF = f && f !== "null" ? f : null;
  const validL = l && l !== "null" ? l : null;
  if (validF && validL) return `${validF} ${validL}`;
  if (validF) return validF;
  return a?.username?.trim() || "User";
}

function mapPost(p: any): Post {
  return {
    _id: p.id ?? p._id,
    desc: p.description ?? p.desc ?? "",
    title: p.title ?? "",
    author: p.author,
    files: (p.files ?? []).map((f: any) => ({
      ...f,
      fileUrl: normalizeMediaUrl(f.fileUrl),
    })),
    vote: p.count?.likes ?? p.vote ?? 0,
    total_comments: p.count?.comments ?? p.total_comments ?? 0,
    total_reactions: p.count?.reactions ?? p.total_reactions ?? 0,
    createdAt: p.createdAt,
  };
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SinglePostScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const postId: string = route?.params?.postId;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPost = useCallback(() => {
    if (!postId) { setError(true); setLoading(false); return; }
    setLoading(true);
    setError(false);
    getPostsById(postId)
      .then((res) => {
        const raw = res?.data?.data ?? res?.data ?? res;
        setPost(mapPost(raw));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  useFocusEffect(
    useCallback(() => { fetchPost(); }, [fetchPost])
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.safe} edges={["top"]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Post</Text>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#2ecc71" />
          </View>
        ) : error || !post ? (
          <View style={s.center}>
            <Ionicons name="alert-circle-outline" size={48} color="#374151" />
            <Text style={s.errorText}>Could not load this post.</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}>
              <Text style={s.retryTxt}>Go back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            {/* Author row */}
            <View style={s.authorRow}>
              {post.author?.imageUrl ? (
                <Image
                  source={{ uri: post.author.imageUrl }}
                  style={s.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Text style={s.avatarInitials}>
                    {getDisplayName(post.author).slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={s.authorInfo}>
                <Text style={s.authorName}>{getDisplayName(post.author)}</Text>
                <Text style={s.timeAgo}>{timeAgo(post.createdAt)}</Text>
              </View>
              <TouchableOpacity
                hitSlop={8}
                onPress={() => Share.share({ message: post.title || post.desc })}
              >
                <Ionicons name="share-social-outline" size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Caption */}
            {(post.title || post.desc) && (
              <View style={s.captionWrap}>
                {post.title ? <Text style={s.postTitle}>{post.title}</Text> : null}
                {post.desc ? <Text style={s.postDesc}>{post.desc}</Text> : null}
              </View>
            )}

            {/* Media */}
            {post.files.filter((f) => f.fileUrl?.startsWith("http")).map((f, i) => (
              <Image
                key={i}
                source={{ uri: f.fileUrl }}
                style={s.media}
                contentFit="cover"
              />
            ))}

            {/* Stats */}
            <View style={s.stats}>
              {post.vote > 0 && (
                <View style={s.statItem}>
                  <Ionicons name="heart" size={16} color="#ef4444" />
                  <Text style={s.statTxt}>{post.vote}</Text>
                </View>
              )}
              {post.total_reactions > 0 && (
                <View style={s.statItem}>
                  <Text style={{ fontSize: 15 }}>😀</Text>
                  <Text style={s.statTxt}>{post.total_reactions}</Text>
                </View>
              )}
              {post.total_comments > 0 && (
                <View style={s.statItem}>
                  <Ionicons name="chatbubble-outline" size={15} color="#9ca3af" />
                  <Text style={s.statTxt}>{post.total_comments} comments</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
    backgroundColor: "#111", gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { color: "#9ca3af", fontSize: 15 },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
  },
  retryTxt: { color: "#fff", fontWeight: "600" },
  content: { paddingBottom: 40 },
  authorRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#1f1f1f" },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#2ecc71" },
  avatarInitials: { color: "#fff", fontWeight: "700", fontSize: 15 },
  authorInfo: { flex: 1 },
  authorName: { color: "#fff", fontWeight: "700", fontSize: 14 },
  timeAgo: { color: "#555", fontSize: 12, marginTop: 1 },
  captionWrap: { paddingHorizontal: 14, paddingBottom: 12 },
  postTitle: { color: "#fff", fontWeight: "700", fontSize: 16, marginBottom: 4 },
  postDesc: { color: "#9ca3af", fontSize: 14, lineHeight: 22 },
  media: { width: "100%", height: 380, backgroundColor: "#111", marginBottom: 2 },
  stats: {
    flexDirection: "row", gap: 16,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: "#1a1a1a",
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statTxt: { color: "#9ca3af", fontSize: 13 },
});
