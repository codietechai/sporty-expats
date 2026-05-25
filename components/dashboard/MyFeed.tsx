import { GET_ALL_POSTS, getAllPosts } from "@/client/endpoints/posts/getAllPosts";
import { likePost } from "@/client/endpoints/posts/likePost";
import { reactToPost, bookmarkPost, addComment, getPostComments } from "@/client/endpoints/posts/postActions";
import { useUserDb } from "@/app/hooks/useUserDb";
import PostStatusBar from "@/components/dashboard/PostStatusBar";
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
    position: "absolute", bottom: 60, left: 0,
    backgroundColor: "#1f2937", borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: "#374151", zIndex: 101,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6, width: 220 },
  emojiBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 22 },
});

// ─── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment, depth = 0, onReply,
}: {
  comment: IComment; depth?: number; onReply: (parentId: string, username: string) => void;
}) {
  return (
    <View style={[ci.wrap, { marginLeft: depth * 16 }]}>
      <View style={ci.row}>
        <Image
          source={{ uri: comment.author?.imageUrl || DEFAULT_AVATAR }}
          style={ci.avatar}
        />
        <View style={ci.bubble}>
          <Text style={ci.name}>
            {comment.author?.firstName
              ? `${comment.author.firstName} ${comment.author.lastName ?? ""}`
              : comment.author?.username}
          </Text>
          <Text style={ci.text}>{comment.comment}</Text>
          <View style={ci.meta}>
            <Text style={ci.time}>{timeAgo(comment.createdAt)}</Text>
            <TouchableOpacity onPress={() => onReply(comment.id, comment.author?.username ?? "")}>
              <Text style={ci.replyBtn}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {comment.children?.map((child) => (
        <CommentItem key={child.id} comment={child} depth={depth + 1} onReply={onReply} />
      ))}
    </View>
  );
}

const ci = StyleSheet.create({
  wrap: { marginBottom: 10 },
  row: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  avatar: { width: 28, height: 28, borderRadius: 14, marginTop: 2 },
  bubble: {
    flex: 1, backgroundColor: "#1f2937", borderRadius: 10,
    padding: 10, gap: 4,
  },
  name: { color: "#2ecc71", fontSize: 12, fontWeight: "700" },
  text: { color: "#d1d5db", fontSize: 13, lineHeight: 18 },
  meta: { flexDirection: "row", gap: 12, marginTop: 2 },
  time: { color: "#6b7280", fontSize: 11 },
  replyBtn: { color: "#2ecc71", fontSize: 11, fontWeight: "600" },
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

  const handleLike = async () => {
    const nextLiked = !post.isLikedByUser;
    onUpdate(post._id, {
      isLikedByUser: nextLiked,
      vote: nextLiked ? post.vote + 1 : Math.max(post.vote - 1, 0),
    });
    try {
      const result = await likePost(post._id);
      if (typeof result?.liked === "boolean" && result.liked !== nextLiked) {
        onUpdate(post._id, {
          isLikedByUser: result.liked,
          vote: result.liked ? post.vote + 1 : Math.max(post.vote - 1, 0),
        });
      }
    } catch {
      // revert on failure
      onUpdate(post._id, {
        isLikedByUser: post.isLikedByUser,
        vote: post.vote,
      });
    }
  };

  const handleReact = async (emoji: string) => {
    setShowEmoji(false);
    const hadReaction = !!post.userReaction;
    const isRemovingReaction = post.userReaction === emoji;
    onUpdate(post._id, {
      userReaction: isRemovingReaction ? null : emoji,
      total_reactions: isRemovingReaction
        ? Math.max(post.total_reactions - 1, 0)
        : hadReaction
          ? post.total_reactions
          : post.total_reactions + 1,
    });
    try {
      const result = await reactToPost(post._id, emoji);
      if (result?.action === "removed") {
        onUpdate(post._id, {
          userReaction: null,
          total_reactions: Math.max(post.total_reactions - 1, 0),
        });
      } else if (result?.action === "added") {
        onUpdate(post._id, {
          userReaction: emoji,
          total_reactions: hadReaction ? post.total_reactions : post.total_reactions + 1,
        });
      } else if (result?.action === "updated") {
        onUpdate(post._id, {
          userReaction: emoji,
          total_reactions: post.total_reactions,
        });
      }
    } catch {
      onUpdate(post._id, { userReaction: post.userReaction, total_reactions: post.total_reactions });
    }
  };

  const handleBookmark = async () => {
    onUpdate(post._id, { isBookmarkedByUser: !post.isBookmarkedByUser });
    try {
      await bookmarkPost(post._id);
    } catch {
      onUpdate(post._id, { isBookmarkedByUser: post.isBookmarkedByUser });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post on Sporty Expats!\n\n${post.title ?? post.desc}`,
      });
    } catch { /* ignore */ }
  };

  // Reverted: original single-param getPostComments — route is /posts/:postId/comments
  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    if (comments.length > 0) return;
    setCommentsLoading(true);
    try {
      const data = await getPostComments(post._id);
      setComments(data?.data ?? []);
    } catch { /* ignore */ }
    finally { setCommentsLoading(false); }
  };

  const handleSubmitComment = async () => {
    if (!userId) { Alert.alert("Sign in required", "Please sign in to comment."); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(userId, post._id, commentText.trim(), replyTo?.id);
      setCommentText("");
      setReplyTo(null);
      onUpdate(post._id, { total_comments: post.total_comments + 1 });
      // Refresh comments after posting
      const data = await getPostComments(post._id);
      setComments(data?.data ?? []);
    } catch {
      Alert.alert("Error", "Could not post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (parentId: string, username: string) => {
    setReplyTo({ id: parentId, username });
    setShowComments(true);
  };

  return (
    <View style={pc.card}>
      {/* Author row */}
      <View style={pc.authorRow}>
        <Image source={{ uri: post.author?.imageUrl || DEFAULT_AVATAR }} style={pc.avatar} />
        <View style={pc.authorInfo}>
          <Text style={pc.authorName}>
            {post.author?.firstName
              ? `${post.author.firstName} ${post.author.lastName ?? ""}`
              : post.author?.username}
          </Text>
          <Text style={pc.time}>{timeAgo(post.createdAt)}</Text>
        </View>
        {/* Bookmark */}
        <TouchableOpacity onPress={handleBookmark} hitSlop={8}>
          <Ionicons
            name={post.isBookmarkedByUser ? "bookmark" : "bookmark-outline"}
            size={20}
            color={post.isBookmarkedByUser ? "#2ecc71" : "#6b7280"}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.title ? <Text style={pc.postTitle}>{post.title}</Text> : null}
      {post.desc ? <Text style={pc.postDesc}>{post.desc}</Text> : null}

      {/* Media */}
      {post.files.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={pc.mediaScroll}>
          {post.files.map((file, i) =>
            file.fileUrl?.startsWith("http") ? (
              <Image key={i} source={{ uri: file.fileUrl }} style={pc.mediaImage} />
            ) : null
          )}
        </ScrollView>
      )}

      {/* Counts row */}
      <View style={pc.countsRow}>
        <Text style={pc.countText}>{post.vote} likes</Text>
        <TouchableOpacity onPress={loadComments}>
          <Text style={pc.countText}>{post.total_comments} comments</Text>
        </TouchableOpacity>
        <Text style={pc.countText}>{post.total_reactions} reactions</Text>
      </View>

      {/* Actions bar */}
      <View style={pc.divider} />
      <View style={pc.actions}>
        {/* Like */}
        <TouchableOpacity style={pc.actionBtn} onPress={handleLike}>
          <Ionicons
            name={post.isLikedByUser ? "heart" : "heart-outline"}
            size={20}
            color={post.isLikedByUser ? "#EF4444" : "#9CA3AF"}
          />
          <Text style={[pc.actionLabel, post.isLikedByUser && { color: "#EF4444" }]}>Like</Text>
        </TouchableOpacity>

        {/* React */}
        <View style={{ position: "relative" }}>
          <TouchableOpacity style={pc.actionBtn} onPress={() => setShowEmoji((p) => !p)}>
            <Text style={pc.emojiIcon}>{post.userReaction ?? "😀"}</Text>
            <Text style={pc.actionLabel}>React</Text>
          </TouchableOpacity>
          {showEmoji && (
            <EmojiPicker onSelect={handleReact} onClose={() => setShowEmoji(false)} />
          )}
        </View>

        {/* Comment */}
        <TouchableOpacity style={pc.actionBtn} onPress={loadComments}>
          <Ionicons name="chatbubble-outline" size={20} color="#9CA3AF" />
          <Text style={pc.actionLabel}>Comment</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={pc.actionBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#9CA3AF" />
          <Text style={pc.actionLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Comments section */}
      {showComments && (
        <View style={pc.commentsSection}>
          <View style={pc.divider} />

          {/* Reply banner */}
          {replyTo && (
            <View style={pc.replyBanner}>
              <Text style={pc.replyBannerText}>Replying to @{replyTo.username}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close" size={14} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          )}

          {/* Comment input */}
          <View style={pc.commentInputRow}>
            <TextInput
              style={pc.commentInput}
              placeholder={replyTo ? `Reply to @${replyTo.username}…` : "Add a comment…"}
              placeholderTextColor="#6b7280"
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
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={16} color="#fff" />
              }
            </TouchableOpacity>
          </View>

          {/* Comments list */}
          {commentsLoading ? (
            <ActivityIndicator color="#2ecc71" style={{ marginTop: 12 }} />
          ) : comments.length === 0 ? (
            <Text style={pc.noComments}>No comments yet. Be the first!</Text>
          ) : (
            <View style={{ marginTop: 8 }}>
              {comments.map((c) => (
                <CommentItem key={c.id} comment={c} onReply={handleReply} />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.post._id === nextProps.post._id &&
    prevProps.post.total_reactions === nextProps.post.total_reactions &&
    prevProps.post.total_comments === nextProps.post.total_comments &&
    prevProps.post.isLikedByUser === nextProps.post.isLikedByUser &&
    prevProps.post.isBookmarkedByUser === nextProps.post.isBookmarkedByUser &&
    prevProps.post.userReaction === nextProps.post.userReaction &&
    prevProps.userId === nextProps.userId
  );
});

const pc = StyleSheet.create({
  card: {
    backgroundColor: "#111827", borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: "#1f2937",
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  authorInfo: { flex: 1 },
  authorName: { color: "#fff", fontWeight: "600", fontSize: 14 },
  time: { color: "#6B7280", fontSize: 12, marginTop: 1 },
  postTitle: { color: "#fff", fontWeight: "700", fontSize: 15, marginBottom: 4 },
  postDesc: { color: "#9CA3AF", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  mediaScroll: { marginBottom: 10 },
  mediaImage: { width: 220, height: 160, borderRadius: 10, marginRight: 8 },
  countsRow: { flexDirection: "row", gap: 12, paddingVertical: 6 },
  countText: { color: "#6b7280", fontSize: 12 },
  divider: { height: 1, backgroundColor: "#1f2937", marginVertical: 6 },
  actions: { flexDirection: "row", justifyContent: "space-between", paddingTop: 2 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 2 },
  actionLabel: { color: "#9CA3AF", fontSize: 12, fontWeight: "500" },
  emojiIcon: { fontSize: 18 },
  commentsSection: { marginTop: 4 },
  replyBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#1f2937", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    marginBottom: 6,
  },
  replyBannerText: { color: "#9ca3af", fontSize: 12 },
  commentInputRow: { flexDirection: "row", gap: 8, alignItems: "flex-end", marginBottom: 10 },
  commentInput: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, color: "#fff", fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#166534", alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  noComments: { color: "#6b7280", fontSize: 13, textAlign: "center", paddingVertical: 12 },
});

// ─── MyFeed ───────────────────────────────────────────────────────────────────

const MyFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const queryClient = useQueryClient();
  const { userDb, loading: userLoading } = useUserDb();
  const userId: string | undefined = userDb?.data?.data?.id ?? userDb?.data?.id ?? userDb?.id;
  const initializedRef = useRef(false);

  const { data, isLoading } = useQuery(
    [GET_ALL_POSTS, userId, page], 
    () => getAllPosts(userId, { page, limit: 10 }), 
    {
      enabled: !!userId,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes
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
        
        setPosts(prev => [...prev, ...formattedPosts]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, isLoading, page, userId]);

  useEffect(() => {
    if (!data) return;

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

    if (!initializedRef.current || page === 1) {
      // First load — use server data as-is (includes correct isLikedByUser etc.)
      initializedRef.current = true;
      setPosts(incoming);
      setHasMore(incoming.length === 10); // Assume more if we got full page
    } else {
      // Subsequent refetch — preserve the user's local interaction state
      // so optimistic like/reaction/bookmark updates aren't wiped.
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
  }, [data, page]);

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
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#2ecc71" />
      </View>
    );
  };

  const keyExtractor = useCallback((item: Post) => item._id, []);
  
  const renderItem = useCallback(({ item }: { item: Post }) => (
    <PostCard post={item} userId={userId} onUpdate={handleUpdate} />
  ), [userId, handleUpdate]);

  if (userLoading || (isLoading && page === 1)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (posts.length === 0 && !isLoading) {
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
  list: { paddingBottom: 20, gap: 12 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyText: { color: "#6B7280", fontSize: 14 },
  loadingFooter: { paddingVertical: 20, alignItems: "center" },
});

export default MyFeed;
