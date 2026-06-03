import { GET_ALL_POSTS, getAllPosts } from "@/client/endpoints/posts/getAllPosts";
import { likePost } from "@/client/endpoints/posts/likePost";
import { reactToPost, bookmarkPost, addComment, getPostComments } from "@/client/endpoints/posts/postActions";
import { useUserDb } from "@/app/hooks/useUserDb";
import PostStatusBar from "@/components/dashboard/PostStatusBar";
import FeedSkeleton from "@/components/dashboard/PostCardSkeleton";
import { timeAgo } from "@/helpers/date";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, FlatList, KeyboardAvoidingView,
  Modal, Platform, ScrollView, Share, StyleSheet, Text,
  TextInput, TouchableOpacity, TouchableWithoutFeedback, View,
} from "react-native";
import { useQuery, useQueryClient } from "react-query";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CommentAuthor {
  id: string; username: string; imageUrl?: string | null;
  firstName?: string | null; lastName?: string | null;
}
interface IComment {
  id: string; comment: string; createdAt: string;
  author: CommentAuthor; parentId?: string | null; children?: IComment[];
}
interface Post {
  _id: string; desc: string; files: { fileUrl: string; fileType?: string }[];
  vote: number; title: string; total_comments: number; total_reactions: number;
  author: { id: string; firstName: string; lastName: string; username: string; imageUrl: string };
  createdAt: string; isLikedByUser: boolean; isBookmarkedByUser: boolean;
  userReaction: string | null; emojiCounts: Record<string, number>; comments: IComment[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDisplayName(a: { firstName?: string | null; lastName?: string | null; username?: string | null } | null | undefined): string {
  const f = a?.firstName?.trim();
  const l = a?.lastName?.trim();
  // Guard against the string "null" coming back from the API
  const validF = f && f !== "null" ? f : null;
  const validL = l && l !== "null" ? l : null;
  if (validF && validL) return `${validF} ${validL}`;
  if (validF) return validF;
  return a?.username?.trim() || "User";
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c","#3498db","#9b59b6","#e91e63"];
function avatarColor(name: string): string {
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}



// ─── Avatar with fallback ─────────────────────────────────────────────────────
function Avatar({ uri, name, size = 36, style }: { uri?: string | null; name: string; size?: number; style?: any }) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(name || "U");
  const bg = avatarColor(name || "U");
  const radius = size / 2;

  if (!uri || failed) {
    return (
      <View style={[{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: "center", justifyContent: "center" }, style]}>
        <Text style={{ color: "#fff", fontSize: size * 0.36, fontWeight: "700" }}>{initials}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[{ width: size, height: size, borderRadius: radius, backgroundColor: "#1f1f1f" }, style]}
      contentFit="cover"
      onError={() => setFailed(true)}
    />
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
const QUICK_EMOJIS = ["👍","❤️","😂","😮","😢","😡","🎉","🔥","👏","💪"];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={ep.overlay}>
        <TouchableWithoutFeedback>
          <View style={ep.box}>
            {QUICK_EMOJIS.map((e) => (
              <TouchableOpacity key={e} style={ep.btn} onPress={() => onSelect(e)}>
                <Text style={ep.emoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}
const ep = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  box: {
    position: "absolute", bottom: 52, left: 0,
    backgroundColor: "#1a1a1a", borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: "#2a2a2a", zIndex: 101,
    flexDirection: "row", flexWrap: "wrap", gap: 4, width: 232,
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  btn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  emoji: { fontSize: 22 },
});

// ─── Comment skeleton ─────────────────────────────────────────────────────────
function CommentSkeleton() {
  const op = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[csk.row, { opacity: op }]}>
      <View style={csk.av} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={csk.name} /><View style={csk.line} /><View style={csk.short} />
      </View>
    </Animated.View>
  );
}
const csk = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, paddingVertical: 10, paddingHorizontal: 16 },
  av: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a2a2a" },
  name: { height: 10, width: "30%", backgroundColor: "#2a2a2a", borderRadius: 4 },
  line: { height: 12, width: "80%", backgroundColor: "#2a2a2a", borderRadius: 4 },
  short: { height: 10, width: "45%", backgroundColor: "#2a2a2a", borderRadius: 4 },
});

// ─── Comment item ─────────────────────────────────────────────────────────────
// Max one level of nesting. Replies show @username inline. No deeper nesting.
function CommentItem({ comment, isReply = false, onReply }: {
  comment: IComment;
  isReply?: boolean;
  onReply: (parentId: string, username: string, displayName: string) => void;
}) {
  const name = getDisplayName(comment.author);
  const username = comment.author?.username || name;

  return (
    <View style={[ci.wrap, isReply && ci.replyWrap]}>
      <Avatar uri={comment.author?.imageUrl} name={name} size={isReply ? 28 : 34} />
      <View style={ci.body}>
        <View style={ci.nameRow}>
          <Text style={ci.name}>{name}</Text>
          <Text style={ci.time}>{timeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={ci.text} numberOfLines={0}>
          {isReply ? <Text style={ci.mention}>@{username} </Text> : null}
          {comment.comment}
        </Text>
        <TouchableOpacity onPress={() => onReply(comment.id, username, name)} hitSlop={8}>
          <Text style={ci.replyBtn}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Renders a top-level comment + its replies at one indent level (no deeper)
function CommentThread({ comment, onReply }: {
  comment: IComment;
  onReply: (parentId: string, username: string, displayName: string) => void;
}) {
  return (
    <View>
      <CommentItem comment={comment} isReply={false} onReply={onReply} />
      {comment.children?.map((child) => (
        <CommentItem key={child.id} comment={child} isReply={true} onReply={onReply} />
      ))}
    </View>
  );
}

const ci = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 8, alignItems: "flex-start" },
  replyWrap: { paddingLeft: 42 },
  body: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  name: { color: "#fff", fontSize: 13, fontWeight: "700" },
  time: { color: "#555", fontSize: 11 },
  text: { color: "#D1D5DB", fontSize: 14, lineHeight: 20 },
  mention: { color: "#4ade80", fontWeight: "700" },
  replyBtn: { color: "#4ade80", fontSize: 12, fontWeight: "600", marginTop: 4 },
});

// ─── Comments bottom-sheet modal ──────────────────────────────────────────────
function CommentsModal({ visible, postId, total, userId, onClose, onPosted, initialReply }: {
  visible: boolean; postId: string; total: number; userId?: string;
  onClose: () => void; onPosted: () => void;
  initialReply: { id: string; username: string; displayName: string } | null;
}) {
  const [comments, setComments] = useState<IComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; displayName: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const slide = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
      // Load comments
      setLoading(true);
      getPostComments(postId)
        .then((r) => setComments(r?.data ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      slide.setValue(600);
      setText("");
      setReplyTo(null);
    }
  }, [visible]);

  // When opened via Reply tap — set reply target and focus input
  useEffect(() => {
    if (visible && initialReply) {
      setReplyTo(initialReply);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [visible, initialReply]);

  const handleReply = (parentId: string, username: string, displayName: string) => {
    setReplyTo({ id: parentId, username, displayName });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (!userId) { Alert.alert("Sign in required", "Please sign in to comment."); return; }
    const t = text.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    // Optimistic: add comment immediately
    const optimistic: IComment = {
      id: `_opt_${Date.now()}`,
      comment: t,
      createdAt: new Date().toISOString(),
      author: { id: userId, username: "", firstName: "You", lastName: null, imageUrl: null },
      parentId: replyTo?.id ?? null,
    };
    setComments((prev) => [...prev, optimistic]);
    setText("");
    setReplyTo(null);
    onPosted();
    try {
      await addComment(userId, postId, t, replyTo?.id);
      // Refresh to get real data
      const r = await getPostComments(postId);
      setComments(r?.data ?? []);
    } catch {
      // Roll back optimistic
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      Alert.alert("Error", "Could not post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const count = total > 0 ? `${total} ${total === 1 ? "comment" : "comments"}` : "Comments";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={cm.backdrop} />
      </TouchableWithoutFeedback>
      <Animated.View style={[cm.sheet, { transform: [{ translateY: slide }] }]}>
        <View style={cm.handle} />
        <View style={cm.header}>
          <Text style={cm.title}>{count}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}><Ionicons name="close" size={22} color="#9CA3AF" /></TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {loading ? (
              <><CommentSkeleton /><CommentSkeleton /><CommentSkeleton /><CommentSkeleton /></>
            ) : comments.length === 0 ? (
              <View style={cm.empty}><Text style={cm.emptyTxt}>No comments yet. Be the first!</Text></View>
            ) : (
              comments.map((c) => <CommentThread key={c.id} comment={c} onReply={handleReply} />)
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
          {replyTo && (
            <View style={cm.replyBanner}>
              <Text style={cm.replyTxt}>Replying to <Text style={{ color: "#4ade80" }}>@{replyTo.username || replyTo.displayName}</Text></Text>
              <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8}><Ionicons name="close-circle" size={16} color="#6B7280" /></TouchableOpacity>
            </View>
          )}
          <View style={cm.inputBar}>
            <TextInput
              ref={inputRef}
              style={cm.input}
              placeholder={replyTo ? `Reply to @${replyTo.username || replyTo.displayName}…` : "Add a comment…"}
              placeholderTextColor="#555"
              value={text}
              onChangeText={setText}
              multiline
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[cm.postBtn, (!text.trim() || submitting) && { opacity: 0.35 }]}
              onPress={handleSubmit}
              disabled={!text.trim() || submitting}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#4ade80" />
                : <Text style={[cm.postTxt, !!text.trim() && { color: "#4ade80" }]}>Post</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
const cm = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: "78%",
    backgroundColor: "#111", borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden",
  },
  handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#333", marginTop: 10, marginBottom: 2 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  title: { color: "#fff", fontSize: 15, fontWeight: "700" },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyTxt: { color: "#555", fontSize: 14 },
  replyBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginBottom: 4, backgroundColor: "#1a1a1a", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  replyTxt: { color: "#9CA3AF", fontSize: 12 },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1e1e1e", backgroundColor: "#111" },
  input: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#1a1a1a", borderRadius: 20, borderWidth: 1, borderColor: "#2a2a2a", maxHeight: 90 },
  postBtn: { paddingHorizontal: 4, paddingVertical: 4, minWidth: 36, alignItems: "center" },
  postTxt: { color: "#4B5563", fontWeight: "700", fontSize: 14 },
});

// ─── Post Card ────────────────────────────────────────────────────────────────
const PostCard = React.memo(({ post, userId, onUpdate }: {
  post: Post; userId?: string; onUpdate: (id: string, patch: Partial<Post>) => void;
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [initialReply, setInitialReply] = useState<{ id: string; username: string; displayName: string } | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const { width: SW } = require("react-native").Dimensions.get("window");

  const validFiles = post.files.filter((f) => f.fileUrl?.startsWith("http"));
  const authorName = getDisplayName(post.author);

  const openComments = () => { setInitialReply(null); setCommentsOpen(true); };
  const openReply = (parentId: string, username: string, displayName: string) => {
    setInitialReply({ id: parentId, username, displayName });
    setCommentsOpen(true);
  };

  const handleLike = async () => {
    const next = !post.isLikedByUser;
    onUpdate(post._id, { isLikedByUser: next, vote: next ? post.vote + 1 : Math.max(post.vote - 1, 0) });
    try {
      const r = await likePost(post._id);
      if (typeof r?.liked === "boolean" && r.liked !== next)
        onUpdate(post._id, { isLikedByUser: r.liked, vote: r.liked ? post.vote + 1 : Math.max(post.vote - 1, 0) });
    } catch { onUpdate(post._id, { isLikedByUser: post.isLikedByUser, vote: post.vote }); }
  };

  const handleReact = async (emoji: string) => {
    setShowEmoji(false);
    const had = !!post.userReaction;
    const removing = post.userReaction === emoji;
    onUpdate(post._id, {
      userReaction: removing ? null : emoji,
      total_reactions: removing ? Math.max(post.total_reactions - 1, 0) : had ? post.total_reactions : post.total_reactions + 1,
    });
    try {
      const r = await reactToPost(post._id, emoji);
      if (r?.action === "removed") onUpdate(post._id, { userReaction: null, total_reactions: Math.max(post.total_reactions - 1, 0) });
      else if (r?.action === "added") onUpdate(post._id, { userReaction: emoji, total_reactions: had ? post.total_reactions : post.total_reactions + 1 });
      else if (r?.action === "updated") onUpdate(post._id, { userReaction: emoji, total_reactions: post.total_reactions });
    } catch { onUpdate(post._id, { userReaction: post.userReaction, total_reactions: post.total_reactions }); }
  };

  const bookmarking = useRef(false);

  const handleBookmark = async () => {
    if (bookmarking.current) return;
    bookmarking.current = true;
    const next = !post.isBookmarkedByUser;
    onUpdate(post._id, { isBookmarkedByUser: next });
    try {
      const res = await bookmarkPost(post._id);
      const confirmed = res?.data?.isBookmarkedByUser ?? res?.isBookmarkedByUser;
      if (typeof confirmed === "boolean" && confirmed !== next) {
        onUpdate(post._id, { isBookmarkedByUser: confirmed });
      }
    } catch {
      onUpdate(post._id, { isBookmarkedByUser: post.isBookmarkedByUser });
    } finally {
      bookmarking.current = false;
    }
  };

  return (
    <View style={pc.card}>
      {/* Author */}
      <View style={pc.authorRow}>
        <Avatar uri={post.author?.imageUrl} name={authorName} size={38} style={pc.avatar} />
        <View style={pc.authorInfo}>
          <Text style={pc.authorName}>{authorName}</Text>
          <Text style={pc.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        <TouchableOpacity onPress={handleBookmark} hitSlop={8}>
          <Ionicons name={post.isBookmarkedByUser ? "bookmark" : "bookmark-outline"} size={22} color={post.isBookmarkedByUser ? "#4ade80" : "#6b7280"} />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {(post.title || post.desc) && (
        <View style={pc.captionWrap}>
          {post.title ? <Text style={pc.postTitle}>{post.title}</Text> : null}
          {post.desc ? <Text style={pc.postDesc}>{post.desc}</Text> : null}
        </View>
      )}

      {/* Media */}
      {validFiles.length > 0 && (
        <View style={pc.mediaWrap}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setActiveImg(Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width))}>
            {validFiles.map((f, i) => (
              <Image key={i} source={{ uri: f.fileUrl }} style={[pc.mediaImg, { width: SW }]} contentFit="cover" />
            ))}
          </ScrollView>
          {validFiles.length > 1 && (
            <View style={pc.dots}>
              {validFiles.map((_, i) => <View key={i} style={[pc.dot, i === activeImg && pc.dotActive]} />)}
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={pc.actions}>
        <TouchableOpacity onPress={handleLike} hitSlop={8} style={pc.btn}>
          <Ionicons name={post.isLikedByUser ? "heart" : "heart-outline"} size={26} color={post.isLikedByUser ? "#EF4444" : "#fff"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={openComments} hitSlop={8} style={pc.btn}>
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ position: "relative" }}>
          <TouchableOpacity onPress={() => setShowEmoji((p) => !p)} hitSlop={8} style={pc.btn}>
            <Text style={{ fontSize: 24 }}>{post.userReaction ?? "😀"}</Text>
          </TouchableOpacity>
          {showEmoji && <EmojiPicker onSelect={handleReact} onClose={() => setShowEmoji(false)} />}
        </View>
        <TouchableOpacity onPress={() => Share.share({ message: post.title ?? post.desc })} hitSlop={8} style={pc.btn}>
          <Ionicons name="share-social-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Counts */}
      <View style={pc.counts}>
        {post.vote > 0 && <Text style={pc.countTxt}>{post.vote} {post.vote === 1 ? "like" : "likes"}</Text>}
        {post.total_reactions > 0 && <Text style={pc.countTxt}>{post.total_reactions} {post.total_reactions === 1 ? "reaction" : "reactions"}</Text>}
      </View>

      {/* View comments + quick reply bar (Instagram style) */}
      {post.total_comments > 0 && (
        <TouchableOpacity onPress={openComments} style={pc.viewComments}>
          <Text style={pc.viewCommentsTxt}>View all {post.total_comments} {post.total_comments === 1 ? "comment" : "comments"}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={pc.quickBar} onPress={openComments} activeOpacity={0.7}>
        <Text style={pc.quickPlaceholder}>Add a comment…</Text>
      </TouchableOpacity>

      <CommentsModal
        visible={commentsOpen}
        postId={post._id}
        total={post.total_comments}
        userId={userId}
        initialReply={initialReply}
        onClose={() => { setCommentsOpen(false); setInitialReply(null); }}
        onPosted={() => onUpdate(post._id, { total_comments: post.total_comments + 1 })}
      />
    </View>
  );
}, (prev, next) =>
  prev.post._id === next.post._id &&
  prev.post.total_reactions === next.post.total_reactions &&
  prev.post.total_comments === next.post.total_comments &&
  prev.post.isLikedByUser === next.post.isLikedByUser &&
  prev.post.isBookmarkedByUser === next.post.isBookmarkedByUser &&
  prev.post.userReaction === next.post.userReaction &&
  prev.userId === next.userId
);

const pc = StyleSheet.create({
  card: { backgroundColor: "#0d0d0d", borderBottomWidth: 1, borderBottomColor: "#1a1a1a", paddingBottom: 4 },
  authorRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  avatar: { borderWidth: 1.5, borderColor: "#2a2a2a" },
  authorInfo: { flex: 1 },
  authorName: { color: "#fff", fontWeight: "700", fontSize: 14 },
  time: { color: "#555", fontSize: 12, marginTop: 1 },
  captionWrap: { paddingHorizontal: 14, paddingBottom: 10 },
  postTitle: { color: "#fff", fontWeight: "700", fontSize: 15, marginBottom: 3 },
  postDesc: { color: "#9CA3AF", fontSize: 14, lineHeight: 21 },
  mediaWrap: { marginBottom: 4 },
  mediaImg: { height: 380, backgroundColor: "#111" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, paddingVertical: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2a2a2a" },
  dotActive: { backgroundColor: "#4ade80", width: 18, borderRadius: 3 },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6 },
  btn: { padding: 6 },
  counts: { flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingBottom: 4 },
  countTxt: { color: "#fff", fontSize: 13, fontWeight: "600" },
  viewComments: { paddingHorizontal: 14, paddingBottom: 4 },
  viewCommentsTxt: { color: "#6B7280", fontSize: 13 },
  quickBar: { marginHorizontal: 14, marginBottom: 8, backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: "#2a2a2a" },
  quickPlaceholder: { color: "#555", fontSize: 13 },
});

// ─── MyFeed ───────────────────────────────────────────────────────────────────
function mapPost(p: any): Post {
  return {
    _id: p.id, desc: p.description, title: p.title, author: p.author,
    files: p.files ?? [], vote: p.count?.likes ?? 0,
    total_comments: p.count?.comments ?? 0, total_reactions: p.count?.reactions ?? 0,
    createdAt: p.createdAt, isLikedByUser: p.isLikedByUser ?? false,
    isBookmarkedByUser: p.isBookmarkedByUser ?? false,
    userReaction: p.reactions?.userReaction ?? null, emojiCounts: p.reactions?.emojiCounts ?? {}, comments: [],
  };
}

const MyFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const queryClient = useQueryClient();
  const { userDb, loading: userLoading } = useUserDb();
  const userId: string | undefined = userDb?.id;
  const initializedRef = useRef(false);

  const { data, isLoading } = useQuery(
    [GET_ALL_POSTS, userId, page],
    () => getAllPosts(userId, { page, limit: 10 }),
    { enabled: !!userId && !userLoading, keepPreviousData: true, refetchOnWindowFocus: false, refetchOnMount: true, retry: 1, staleTime: 2 * 60 * 1000 }
  );

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore || isLoading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const newPosts = (await getAllPosts(userId, { page: nextPage, limit: 10 }))?.data?.data ?? [];
      if (newPosts.length === 0) { setHasMore(false); return; }
      const formatted: Post[] = newPosts.map(mapPost);
      setPosts((prev) => {
        const ids = new Set(prev.map((p: Post) => p._id));
        const unique = formatted.filter((p: Post) => !ids.has(p._id));
        return unique.length === 0 ? prev : [...prev, ...unique];
      });
      setPage(nextPage);
      if (newPosts.length < 10) setHasMore(false);
    } catch { /* ignore */ } finally { setLoadingMore(false); }
  }, [loadingMore, hasMore, isLoading, page, userId]);

  useEffect(() => {
    if (!data || page !== 1) return;
    const incoming: Post[] = (data?.data?.data ?? []).map(mapPost);
    if (!initializedRef.current) {
      initializedRef.current = true;
      setPosts(incoming);
      setHasMore(incoming.length === 10);
    } else {
      setPosts((prev) => incoming.map((s) => {
        const l = prev.find((p) => p._id === s._id);
        return l ? { ...s, isLikedByUser: l.isLikedByUser, vote: l.vote, isBookmarkedByUser: l.isBookmarkedByUser, userReaction: l.userReaction, total_reactions: l.total_reactions, total_comments: l.total_comments, comments: l.comments } : s;
      }));
    }
  }, [data]);

  const handleUpdate = useCallback((id: string, patch: Partial<Post>) => {
    setPosts((prev) => prev.map((p) => p._id === id ? { ...p, ...patch } : p));
    queryClient.setQueriesData(GET_ALL_POSTS, (old: any) => {
      const arr = old?.data?.data;
      if (!Array.isArray(arr)) return old;
      return { ...old, data: { ...old.data, data: arr.map((p: any) => p.id !== id ? p : {
        ...p,
        count: { ...p.count, likes: patch.vote ?? p.count?.likes, comments: patch.total_comments ?? p.count?.comments, reactions: patch.total_reactions ?? p.count?.reactions },
        isLikedByUser: patch.isLikedByUser ?? p.isLikedByUser,
        isBookmarkedByUser: patch.isBookmarkedByUser ?? p.isBookmarkedByUser,
        reactions: { ...(p.reactions ?? {}), userReaction: patch.userReaction !== undefined ? patch.userReaction : p.reactions?.userReaction },
      })}};
    });
  }, [queryClient]);

  const keyExtractor = useCallback((item: Post) => item._id, []);
  const renderItem = useCallback(({ item }: { item: Post }) => (
    <PostCard post={item} userId={userId} onUpdate={handleUpdate} />
  ), [userId, handleUpdate]);

  const renderFooter = () => {
    if (loadingMore) return <FeedSkeleton count={2} />;
    if (!hasMore && posts.length > 0) return (
      <View style={s.eof}>
        <View style={s.eofLine} /><Text style={s.eofTxt}>You're all caught up</Text><View style={s.eofLine} />
      </View>
    );
    return null;
  };

  if (userLoading || (isLoading && page === 1) || (!initializedRef.current && !isLoading))
    return <FeedSkeleton count={3} />;

  if (posts.length === 0 && initializedRef.current && !isLoading)
    return (
      <View style={s.centered}>
        <Ionicons name="newspaper-outline" size={48} color="#374151" />
        <Text style={s.emptyTxt}>No posts yet</Text>
      </View>
    );

  return (
    <FlatList
      data={posts} keyExtractor={keyExtractor} renderItem={renderItem}
      showsVerticalScrollIndicator={false} contentContainerStyle={s.list}
      keyboardShouldPersistTaps="handled" ListHeaderComponent={<PostStatusBar />}
      ListFooterComponent={renderFooter} onEndReached={loadMorePosts}
      onEndReachedThreshold={0.3} removeClippedSubviews maxToRenderPerBatch={5}
      windowSize={10} initialNumToRender={5}
    />
  );
};

const s = StyleSheet.create({
  list: { paddingBottom: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyTxt: { color: "#6B7280", fontSize: 14 },
  eof: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 28, gap: 12 },
  eofLine: { flex: 1, height: 1, backgroundColor: "#1a1a1a" },
  eofTxt: { color: "#374151", fontSize: 12, fontWeight: "500" },
});

export default MyFeed;
