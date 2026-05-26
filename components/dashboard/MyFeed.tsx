import { GET_ALL_POSTS, getAllPosts } from "@/client/endpoints/posts/getAllPosts";
import { likePost } from "@/client/endpoints/posts/likePost";
import { reactToPost, bookmarkPost, addComment, getPostComments } from "@/client/endpoints/posts/postActions";
import { useUserDb } from "@/app/hooks/useUserDb";
import PostStatusBar from "@/components/dashboard/PostStatusBar";
import FeedSkeleton from "@/components/dashboard/PostCardSkeleton";
import { timeAgo } from "@/helpers/date";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator, Alert, FlatList,
  ScrollView, Share, StyleSheet, Text,
  TextInput, TouchableOpacity, TouchableWithoutFeedback, View,
} from "react-native";
import { useQuery, useQueryClient } from "react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommentAuthor {
  id: string;
  username: string;
  imageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

interface IComment {
  id: string;
  comment: string;
  createdAt: string;
  author: CommentAuthor;
  parentId?: string | null;
  children?: IComment[];
}

interface Post {
  _id: string;
  desc: string;
  files: { fileUrl: string; fileType?: string }[];
  vote: number;
  title: string;
  total_comments: number;
  total_reactions: number;
  author: { id: string; firstName: string; lastName: string; username: string; imageUrl: string };
  createdAt: string;
  isLikedByUser: boolean;
  isBookmarkedByUser: boolean;
  userReaction: string | null;
  emojiCounts: Record<string, number>;
  comments: IComment[];
}

const DEFAULT_AVATAR = "https://storage.strandcdn.com/avatar.svg";

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥", "👏", "💪"];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={ep.overlay}>
        <TouchableWithoutFeedback>
          <View style={ep.box}>
            <View style={ep.grid}>
              {QUICK_EMOJIS.map((e) => (
                <TouchableOpacity key={e} style={ep.emojiBtn} onPress={() => onSelect(e)}>
                  <Text style={ep.emoji}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4, width: 224 },
  emojiBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  emoji: { fontSize: 22 },
});

// ─── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment, depth = 0, onReply,
}: {
  comment: IComment; depth?: number; onReply: (parentId: string, username: string) => void;
}) {
  const authorName = comment.author?.firstName
    ? `${comment.author.firstName} ${comment.author.lastName ?? ""}`.trim()
    : comment.author?.username ?? "User";

  return (
    <View style={[ci.wrap, depth > 0 && ci.replyWrap]}>
      {depth > 0 && <View style={ci.threadLine} />}
      <View style={ci.row}>
        <Image
          source={{ uri: comment.author?.imageUrl || DEFAULT_AVATAR }}
          style={[ci.avatar, depth > 0 && ci.avatarSmall]}
        />
        <View style={ci.body}>
          <View style={ci.nameRow}>
            <Text style={ci.name}>{authorName}</Text>
            <Text style={ci.time}>{timeAgo(comment.createdAt)}</Text>
          </View>
          <Text style={ci.text}>{comment.comment}</Text>
          <TouchableOpacity
            onPress={() => onReply(comment.id, comment.author?.username ?? "")}
            hitSlop={8}
          >
            <Text style={ci.replyBtn}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
      {comment.children?.map((child) => (
        <CommentItem key={child.id} comment={child} depth={depth + 1} onReply={onReply} />
      ))}
    </View>
  );
}

const ci = StyleSheet.create({
  wrap: { marginBottom: 14 },
  replyWrap: { marginLeft: 44, marginBottom: 10 },
  threadLine: {
    position: "absolute", left: -20, top: 0, bottom: 0,
    width: 1.5, backgroundColor: "#2a2a2a",
  },
  row: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarSmall: { width: 26, height: 26, borderRadius: 13 },
  body: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  name: { color: "#fff", fontSize: 13, fontWeight: "700" },
  time: { color: "#4B5563", fontSize: 11 },
  text: { color: "#D1D5DB", fontSize: 14, lineHeight: 20 },
  replyBtn: { color: "#4ade80", fontSize: 12, fontWeight: "600", marginTop: 5 },
});

// ─── Post Card ────────────────────────────────────────────────────────────────

const PostCard = React.memo(({ post, userId, onUpdate }: {
  post: Post; userId?: string; onUpdate: (id: string, patch: Partial<Post>) => void;
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<IComment[]>(post.comments ?? []);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { width: SCREEN_W } = require("react-native").Dimensions.get("window");

  const validFiles = post.files.filter((f) => f.fileUrl?.startsWith("http"));

  const handleLike = async () => {
    const nextLiked = !post.isLikedByUser;
    onUpdate(post._id, { isLikedByUser: nextLiked, vote: nextLiked ? post.vote + 1 : Math.max(post.vote - 1, 0) });
    try {
      const result = await likePost(post._id);
      if (typeof result?.liked === "boolean" && result.liked !== nextLiked) {
        onUpdate(post._id, { isLikedByUser: result.liked, vote: result.liked ? post.vote + 1 : Math.max(post.vote - 1, 0) });
      }
    } catch { onUpdate(post._id, { isLikedByUser: post.isLikedByUser, vote: post.vote }); }
  };

  const handleReact = async (emoji: string) => {
    setShowEmoji(false);
    const hadReaction = !!post.userReaction;
    const isRemoving = post.userReaction === emoji;
    onUpdate(post._id, {
      userReaction: isRemoving ? null : emoji,
      total_reactions: isRemoving ? Math.max(post.total_reactions - 1, 0) : hadReaction ? post.total_reactions : post.total_reactions + 1,
    });
    try {
      const result = await reactToPost(post._id, emoji);
      if (result?.action === "removed") onUpdate(post._id, { userReaction: null, total_reactions: Math.max(post.total_reactions - 1, 0) });
      else if (result?.action === "added") onUpdate(post._id, { userReaction: emoji, total_reactions: hadReaction ? post.total_reactions : post.total_reactions + 1 });
      else if (result?.action === "updated") onUpdate(post._id, { userReaction: emoji, total_reactions: post.total_reactions });
    } catch { onUpdate(post._id, { userReaction: post.userReaction, total_reactions: post.total_reactions }); }
  };

  const handleBookmark = async () => {
    onUpdate(post._id, { isBookmarkedByUser: !post.isBookmarkedByUser });
    try { await bookmarkPost(post._id); }
    catch { onUpdate(post._id, { isBookmarkedByUser: post.isBookmarkedByUser }); }
  };

  const handleShare = async () => {
    try { await Share.share({ message: `Check out this post on Sporty Expats!\n\n${post.title ?? post.desc}` }); }
    catch { /* ignore */ }
  };

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    if (comments.length > 0) return;
    setCommentsLoading(true);
    try { const data = await getPostComments(post._id); setComments(data?.data ?? []); }
    catch { /* ignore */ }
    finally { setCommentsLoading(false); }
  };

  const handleSubmitComment = async () => {
    if (!userId) { Alert.alert("Sign in required", "Please sign in to comment."); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(userId, post._id, commentText.trim(), replyTo?.id);
      setCommentText(""); setReplyTo(null);
      onUpdate(post._id, { total_comments: post.total_comments + 1 });
      const data = await getPostComments(post._id);
      setComments(data?.data ?? []);
    } catch { Alert.alert("Error", "Could not post comment. Please try again."); }
    finally { setSubmitting(false); }
  };

  const handleReply = (parentId: string, username: string) => {
    setReplyTo({ id: parentId, username });
    setShowComments(true);
  };

  const authorName = post.author?.firstName
    ? `${post.author.firstName} ${post.author.lastName ?? ""}`.trim()
    : post.author?.username ?? "User";

  return (
    <View style={pc.card}>
      {/* ── Author row ── */}
      <View style={pc.authorRow}>
        <Image source={{ uri: post.author?.imageUrl || DEFAULT_AVATAR }} style={pc.avatar} />
        <View style={pc.authorInfo}>
          <Text style={pc.authorName}>{authorName}</Text>
          <Text style={pc.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        <TouchableOpacity onPress={handleBookmark} hitSlop={8} style={pc.bookmarkBtn}>
          <Ionicons
            name={post.isBookmarkedByUser ? "bookmark" : "bookmark-outline"}
            size={22}
            color={post.isBookmarkedByUser ? "#4ade80" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>

      {/* ── Caption ── */}
      {(post.title || post.desc) && (
        <View style={pc.captionWrap}>
          {post.title ? <Text style={pc.postTitle}>{post.title}</Text> : null}
          {post.desc ? <Text style={pc.postDesc}>{post.desc}</Text> : null}
        </View>
      )}

      {/* ── Media — full width, paged ── */}
      {validFiles.length > 0 && (
        <View style={pc.mediaWrap}>
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
              setActiveImageIndex(idx);
            }}
          >
            {validFiles.map((file, i) => (
              <Image key={i} source={{ uri: file.fileUrl }} style={[pc.mediaImage, { width: SCREEN_W }]} contentFit="cover" />
            ))}
          </ScrollView>
          {validFiles.length > 1 && (
            <View style={pc.dots}>
              {validFiles.map((_, i) => (
                <View key={i} style={[pc.dot, i === activeImageIndex && pc.dotActive]} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Action bar ── */}
      <View style={pc.actions}>
        <View style={pc.actionsLeft}>
          <TouchableOpacity onPress={handleLike} hitSlop={8} style={pc.actionBtn}>
            <Ionicons name={post.isLikedByUser ? "heart" : "heart-outline"} size={26} color={post.isLikedByUser ? "#EF4444" : "#fff"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadComments} hitSlop={8} style={pc.actionBtn}>
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ position: "relative" }}>
            <TouchableOpacity onPress={() => setShowEmoji((p) => !p)} hitSlop={8} style={pc.actionBtn}>
              <Text style={pc.emojiIcon}>{post.userReaction ?? "😀"}</Text>
            </TouchableOpacity>
            {showEmoji && <EmojiPicker onSelect={handleReact} onClose={() => setShowEmoji(false)} />}
          </View>
          <TouchableOpacity onPress={handleShare} hitSlop={8} style={pc.actionBtn}>
            <Ionicons name="share-social-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Counts ── */}
      <View style={pc.countsRow}>
        {post.vote > 0 && <Text style={pc.countText}>{post.vote} {post.vote === 1 ? "like" : "likes"}</Text>}
        {post.total_reactions > 0 && <Text style={pc.countText}>{post.total_reactions} reactions</Text>}
      </View>

      {/* View comments link */}
      {post.total_comments > 0 && !showComments && (
        <TouchableOpacity onPress={loadComments} style={pc.viewCommentsBtn}>
          <Text style={pc.viewCommentsText}>View all {post.total_comments} comments</Text>
        </TouchableOpacity>
      )}

      {/* ── Comments list ── */}
      {showComments && (
        <View style={pc.commentsSection}>
          {commentsLoading ? (
            <ActivityIndicator color="#4ade80" style={{ marginVertical: 12 }} />
          ) : comments.length === 0 ? (
            <Text style={pc.noComments}>No comments yet. Be the first!</Text>
          ) : (
            <View style={pc.commentsList}>
              {comments.map((c) => (
                <CommentItem key={c.id} comment={c} onReply={handleReply} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Comment input ── */}
      <View style={pc.inputSection}>
        {replyTo && (
          <View style={pc.replyBanner}>
            <Text style={pc.replyBannerText}>Replying to @{replyTo.username}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}
        <View style={pc.commentInputRow}>
          <TextInput
            style={pc.commentInput}
            placeholder={replyTo ? `Reply to @${replyTo.username}…` : "Add a comment…"}
            placeholderTextColor="#4B5563"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={[pc.sendBtn, (!commentText.trim() || submitting) && pc.sendBtnDisabled]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#4ade80" />
              : <Text style={[pc.sendText, !!commentText.trim() && pc.sendTextActive]}>Post</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
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
  card: {
    backgroundColor: "#0d0d0d",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 4,
  },
  // Author
  authorRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: "#2a2a2a" },
  authorInfo: { flex: 1 },
  authorName: { color: "#fff", fontWeight: "700", fontSize: 14 },
  time: { color: "#4B5563", fontSize: 12, marginTop: 1 },
  bookmarkBtn: { padding: 4 },
  // Caption
  captionWrap: { paddingHorizontal: 14, paddingBottom: 10 },
  postTitle: { color: "#fff", fontWeight: "700", fontSize: 15, marginBottom: 3 },
  postDesc: { color: "#9CA3AF", fontSize: 14, lineHeight: 21 },
  // Media
  mediaWrap: { marginBottom: 4 },
  mediaImage: { height: 380, backgroundColor: "#111" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, paddingVertical: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2a2a2a" },
  dotActive: { backgroundColor: "#4ade80", width: 18, borderRadius: 3 },
  // Actions
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6 },
  actionsLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionBtn: { padding: 6 },
  emojiIcon: { fontSize: 24 },
  // Counts
  countsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingBottom: 4 },
  countText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  // View comments
  viewCommentsBtn: { paddingHorizontal: 14, paddingBottom: 6 },
  viewCommentsText: { color: "#6B7280", fontSize: 13 },
  // Comments
  commentsSection: { paddingHorizontal: 14, paddingTop: 4 },
  commentsList: { gap: 2 },
  noComments: { color: "#4B5563", fontSize: 13, paddingVertical: 10 },
  // Input
  inputSection: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10 },
  replyBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#1a1a1a", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6,
  },
  replyBannerText: { color: "#9CA3AF", fontSize: 12 },
  commentInputRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#1a1a1a", paddingTop: 8, gap: 10 },
  commentInput: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 4, minHeight: 32 },
  sendBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  sendBtnDisabled: { opacity: 0.3 },
  sendText: { color: "#4B5563", fontWeight: "700", fontSize: 14 },
  sendTextActive: { color: "#4ade80" },
});

// ─── MyFeed ───────────────────────────────────────────────────────────────────

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
    {
      enabled: !!userId && !userLoading,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 1,
      staleTime: 2 * 60 * 1000,
    }
  );

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore || isLoading) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await getAllPosts(userId, { page: nextPage, limit: 10 });
      const newPosts = response?.data?.data ?? [];

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        const formattedPosts: Post[] = newPosts.map((post: any) => ({
          _id: post.id,
          desc: post.description,
          title: post.title,
          author: post.author,
          files: post.files ?? [],
          vote: post.count?.likes ?? 0,
          total_comments: post.count?.comments ?? 0,
          total_reactions: post.count?.reactions ?? 0,
          createdAt: post.createdAt,
          isLikedByUser: post.isLikedByUser ?? false,
          isBookmarkedByUser: post.isBookmarkedByUser ?? false,
          userReaction: post.reactions?.userReaction ?? null,
          emojiCounts: post.reactions?.emojiCounts ?? {},
          comments: [],
        }));

        // Deduplicate — onEndReached can fire multiple times
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const unique = formattedPosts.filter(p => !existingIds.has(p._id));
          if (unique.length === 0) return prev;
          return [...prev, ...unique];
        });
        setPage(nextPage);
        if (newPosts.length < 10) setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, isLoading, page, userId]);

  useEffect(() => {
    if (!data) return;
    // Only process the react-query cache for page 1 (initial load / refresh).
    // Pagination is handled entirely inside loadMorePosts to avoid duplicates.
    if (page !== 1) return;

    const incoming: Post[] = (data?.data?.data ?? []).map((post: any) => ({
      _id: post.id,
      desc: post.description,
      title: post.title,
      author: post.author,
      files: post.files ?? [],
      vote: post.count?.likes ?? 0,
      total_comments: post.count?.comments ?? 0,
      total_reactions: post.count?.reactions ?? 0,
      createdAt: post.createdAt,
      isLikedByUser: post.isLikedByUser ?? false,
      isBookmarkedByUser: post.isBookmarkedByUser ?? false,
      userReaction: post.reactions?.userReaction ?? null,
      emojiCounts: post.reactions?.emojiCounts ?? {},
      comments: [],
    }));

    if (!initializedRef.current) {
      initializedRef.current = true;
      setPosts(incoming);
      setHasMore(incoming.length === 10);
    } else {
      // Refresh of page 1 — preserve local interaction state
      setPosts((prev) =>
        incoming.map((serverPost) => {
          const local = prev.find((p) => p._id === serverPost._id);
          if (!local) return serverPost;
          return {
            ...serverPost,
            isLikedByUser: local.isLikedByUser,
            vote: local.vote,
            isBookmarkedByUser: local.isBookmarkedByUser,
            userReaction: local.userReaction,
            total_reactions: local.total_reactions,
            total_comments: local.total_comments,
            comments: local.comments,
          };
        })
      );
    }
  }, [data]);

  const handleUpdate = (id: string, patch: Partial<Post>) => {
    setPosts((prev) => prev.map((p) => p._id === id ? { ...p, ...patch } : p));
    queryClient.setQueriesData(GET_ALL_POSTS, (oldData: any) => {
      const serverPosts = oldData?.data?.data;
      if (!Array.isArray(serverPosts)) return oldData;

      return {
        ...oldData,
        data: {
          ...oldData.data,
          data: serverPosts.map((post: any) => {
            if (post.id !== id) return post;

            return {
              ...post,
              count: {
                ...post.count,
                likes: patch.vote ?? post.count?.likes,
                comments: patch.total_comments ?? post.count?.comments,
                reactions: patch.total_reactions ?? post.count?.reactions,
              },
              isLikedByUser: patch.isLikedByUser ?? post.isLikedByUser,
              isBookmarkedByUser: patch.isBookmarkedByUser ?? post.isBookmarkedByUser,
              reactions: {
                ...(post.reactions ?? {}),
                userReaction: patch.userReaction !== undefined
                  ? patch.userReaction
                  : post.reactions?.userReaction,
              },
            };
          }),
        },
      };
    });
  };

  const renderFooter = () => {
    if (loadingMore) return <FeedSkeleton count={2} />;
    if (!hasMore && posts.length > 0) {
      return (
        <View style={styles.endOfFeed}>
          <View style={styles.endOfFeedLine} />
          <Text style={styles.endOfFeedText}>You're all caught up</Text>
          <View style={styles.endOfFeedLine} />
        </View>
      );
    }
    return null;
  };

  const keyExtractor = useCallback((item: Post) => item._id, []);
  
  const renderItem = useCallback(({ item }: { item: Post }) => (
    <PostCard post={item} userId={userId} onUpdate={handleUpdate} />
  ), [userId, handleUpdate]);

  if (userLoading || (isLoading && page === 1) || (!initializedRef.current && !isLoading)) {
    return <FeedSkeleton count={3} />;
  }

  if (posts.length === 0 && initializedRef.current && !isLoading) {
    return (
      <View style={styles.centered}>
        <Ionicons name="newspaper-outline" size={48} color="#374151" />
        <Text style={styles.emptyText}>No posts yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<PostStatusBar />}
      ListFooterComponent={renderFooter}
      onEndReached={loadMorePosts}
      onEndReachedThreshold={0.3}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={10}
      initialNumToRender={5}
      getItemLayout={undefined} // Let FlatList calculate automatically
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyText: { color: "#6B7280", fontSize: 14 },
  endOfFeed: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 24, paddingVertical: 28, gap: 12,
  },
  endOfFeedLine: { flex: 1, height: 1, backgroundColor: "#1a1a1a" },
  endOfFeedText: { color: "#374151", fontSize: 12, fontWeight: "500" },
  loadingFooter: { paddingVertical: 20, alignItems: "center" },
});

export default MyFeed;
