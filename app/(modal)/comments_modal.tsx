import ModalShell from "@/components/ModalShell";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import {
  Comment,
  addComment,
  addReply,
  deleteComment,
  likeComment,
  subscribeToComments,
  unlikeComment,
} from "@/services/commentService";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ConfirmationModal from "./confirm_modal";

const CommentsBottomSheet = () => {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user, profile } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type: "success" | "error" | "info" | "confirm";
    title: string;
    message: string;
  }>({ visible: false, type: "info", title: "", message: "" });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean;
    commentId: string | null;
  }>({ visible: false, commentId: null });

  const showAlert = (type: "success" | "error" | "info", title: string, message: string) => {
    setAlertModal({ visible: true, type, title, message });
  };

  const onClose = () => router.back();

  // Subscribe to comments
  useEffect(() => {
    if (!postId) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToComments(postId, (fetchedComments) => {
      setComments(fetchedComments);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  // Keyboard listeners
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const toggleLike = async (commentId: string) => {
    if (!user || !postId) return;

    const isLiked = likedComments.has(commentId);

    // Optimistic update
    setLikedComments((prev) => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    // Call API
    if (isLiked) {
      await unlikeComment(postId, commentId, user.uid);
    } else {
      await likeComment(postId, commentId, user.uid);
    }
  };

  const handleAddComment = async () => {
    if (!text.trim() || !user || !postId || isSubmitting) return;

    setIsSubmitting(true);

    let result;
    if (replyingTo) {
      // Adding a reply
      result = await addReply(
        postId,
        replyingTo.id,
        user.uid,
        profile?.displayName || user.displayName || "User",
        profile?.photoURL || user.photoURL || "",
        text.trim(),
      );
    } else {
      // Adding a comment
      result = await addComment(
        postId,
        user.uid,
        profile?.displayName || user.displayName || "User",
        profile?.photoURL || user.photoURL || "",
        text.trim(),
      );
    }

    if (result.error) {
      showAlert("error", "Error", result.error);
    } else {
      setText("");
      setReplyingTo(null);
      Keyboard.dismiss();
    }
    setIsSubmitting(false);
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setText("");
  };

  const handleDeleteComment = (commentId: string) => {
    if (!postId) return;
    setDeleteConfirm({ visible: true, commentId });
  };

  const confirmDelete = async () => {
    if (!postId || !deleteConfirm.commentId) return;
    await deleteComment(postId, deleteConfirm.commentId);
    setDeleteConfirm({ visible: false, commentId: null });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const renderReply = (reply: Comment) => {
    const isOwner = user?.uid === reply.authorId;
    const isLiked = likedComments.has(reply.id);

    return (
      <View key={reply.id} style={styles.replyRow}>
        {reply.authorAvatar ? (
          <Image
            source={{ uri: reply.authorAvatar }}
            style={styles.replyAvatar}
          />
        ) : (
          <View style={[styles.replyAvatar, styles.avatarFallback]}>
            <Text style={styles.replyAvatarInitial}>
              {getInitial(reply.authorName)}
            </Text>
          </View>
        )}

        <View style={styles.commentBody}>
          <Text style={styles.username}>{reply.authorName}</Text>
          <Text style={styles.commentText}>{reply.text}</Text>

          <View style={styles.actions}>
            <Text style={styles.time}>{formatTimeAgo(reply.createdAt)}</Text>
            {reply.likesCount > 0 && (
              <Text style={styles.likesCount}>{reply.likesCount} likes</Text>
            )}
            {/* {isOwner && (
              <TouchableOpacity onPress={() => handleDeleteComment(reply.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            )} */}
            {isOwner && (
              <TouchableOpacity onPress={() => handleDeleteComment(reply.id)}>
                <Feather name="trash-2" size={16} color="#E53935" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {!isOwner && (
          <TouchableOpacity onPress={() => toggleLike(reply.id)}>
            {isLiked ? (
              <AntDesign name="heart" size={12} color="#E53935" />
            ) : (
              <Feather name="heart" size={12} color="#888" />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: Comment }) => {
    const isOwner = user?.uid === item.authorId;
    const isLiked = likedComments.has(item.id);

    return (
      <View>
        <View style={styles.commentRow}>
          {item.authorAvatar ? (
            <Image source={{ uri: item.authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {getInitial(item.authorName)}
              </Text>
            </View>
          )}

          <View style={styles.commentBody}>
            <Text style={styles.username}>{item.authorName}</Text>
            <Text style={styles.commentText}>{item.text}</Text>

            <View style={styles.actions}>
              <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
              {item.likesCount > 0 && (
                <Text style={styles.likesCount}>{item.likesCount} likes</Text>
              )}
              <TouchableOpacity onPress={() => handleReply(item)}>
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>
              {/* {isOwner && (
                <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              )} */}
              {isOwner && (
                <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                  <Feather name="trash-2" size={16} color="#E53935" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {!isOwner && (
            <TouchableOpacity onPress={() => toggleLike(item.id)}>
              {isLiked ? (
                <AntDesign name="heart" size={14} color="#E53935" />
              ) : (
                <Feather name="heart" size={14} color="#888" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Render replies */}
        {item.replies && item.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {item.replies.map(renderReply)}
          </View>
        )}
      </View>
    );
  };

  return (
    <ModalShell onClose={onClose} width={560} height="80%">
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, keyboardVisible && styles.sheetKeyboard]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <FlatList
              ref={flatListRef}
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No comments yet</Text>
                  <Text style={styles.emptySubtext}>
                    Be the first to comment!
                  </Text>
                </View>
              }
            />
          </TouchableWithoutFeedback>
        )}

        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingToBar}>
              <Text style={styles.replyingToText}>
                Replying to{" "}
                <Text style={styles.replyingToName}>
                  {replyingTo.authorName}
                </Text>
              </Text>
              <TouchableOpacity onPress={cancelReply}>
                <Feather name="x" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputBar}>
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.inputAvatar}
              />
            ) : (
              <View style={[styles.inputAvatar, styles.avatarFallback]}>
                <Text style={styles.inputAvatarInitial}>
                  {getInitial(profile?.displayName || user?.displayName || "U")}
                </Text>
              </View>
            )}
            <TextInput
              ref={inputRef}
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.authorName}...`
                  : "Add a comment..."
              }
              value={text}
              onChangeText={setText}
              style={styles.input}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              onPress={handleAddComment}
              disabled={isSubmitting || !text.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Feather
                  name="send"
                  size={20}
                  color={text.trim() ? "#000" : "#ccc"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Alert Modal */}
        <ConfirmationModal
          visible={alertModal.visible}
          type={alertModal.type}
          title={alertModal.title}
          message={alertModal.message}
          onCancel={() => setAlertModal({ ...alertModal, visible: false })}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          visible={deleteConfirm.visible}
          type="confirm"
          title="Delete Comment"
          message="Are you sure you want to delete this comment?"
          confirmText="Delete"
          onCancel={() => setDeleteConfirm({ visible: false, commentId: null })}
          onConfirm={confirmDelete}
        />
      </View>
    </KeyboardAvoidingView>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    maxHeight: "80%",
    minHeight: 400,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  sheetKeyboard: {
    maxHeight: "100%",
    paddingBottom: 0,
  },
  header: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#E5EAF1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontWeight: "700", fontSize: 16, color: Colors.black },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
  },
  commentRow: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "grey",
  },
  avatarFallback: {
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  commentBody: { flex: 1 },
  username: { fontWeight: "600", fontSize: 13 },
  commentText: { marginTop: 4, fontSize: 14, lineHeight: 20 },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 6,
  },
  time: { fontSize: 12, color: "#888" },
  likesCount: { fontSize: 12, color: "#888", fontWeight: "500" },
  deleteText: { fontSize: 12, color: "#E53935", fontWeight: "600" },
  replyText: { fontSize: 12, color: "#666", fontWeight: "600" },
  repliesContainer: {
    marginLeft: 48,
    borderLeftWidth: 1,
    borderLeftColor: "#E5EAF1",
  },
  replyRow: {
    flexDirection: "row",
    padding: 12,
    paddingLeft: 16,
    gap: 10,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "grey",
  },
  replyAvatarInitial: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  inputContainer: {
    borderTopWidth: 0.5,
    borderColor: "#ddd",
  },
  replyingToBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
  },
  replyingToText: {
    fontSize: 13,
    color: "#666",
  },
  replyingToName: {
    fontWeight: "600",
    color: "#333",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "grey",
  },
  inputAvatarInitial: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});

export default CommentsBottomSheet;
