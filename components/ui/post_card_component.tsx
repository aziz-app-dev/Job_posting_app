import FollowButton from "@/components/FollowButton";
import { Post } from "@/constants/data";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { getCollectionsContainingPost } from "@/services/collectionService";
import { checkIfLiked, likePost, unlikePost } from "@/services/postService";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  post: Post;
  authorId?: string;
  showFollowButton?: boolean;
  commentsEnabled?: boolean;
  hideViewJobButton?: boolean;
}

const MAX_LINES = 3; // max lines before showing "More"

const PostCard: React.FC<Props> = ({
  post,
  authorId,
  showFollowButton = true,
  commentsEnabled = true,
  hideViewJobButton = false,
}) => {
  const { user } = useAuth();
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isCaptionLong, setIsCaptionLong] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);

  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

  // Check if current user has liked this post
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user?.uid || !post.id) return;
      const { isLiked: liked } = await checkIfLiked(post.id, user.uid);
      setIsLiked(liked);
    };
    checkLikeStatus();
  }, [post.id, user?.uid]);

  // Check if post is bookmarked (in any collection)
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!user?.uid || !post.id) return;
      const { collectionIds } = await getCollectionsContainingPost(user.uid, post.id);
      setIsBookmarked(collectionIds.length > 0);
    };
    checkBookmarkStatus();
  }, [post.id, user?.uid]);

  const handleLike = async () => {
    if (!user?.uid || !post.id) return;

    // Optimistic update
    if (isLiked) {
      setLikesCount((prev) => Math.max(0, prev - 1));
      setIsLiked(false);
      // Call Firebase
      await unlikePost(post.id, user.uid);
    } else {
      setLikesCount((prev) => prev + 1);
      setIsLiked(true);
      // Call Firebase with user info for notification
      await likePost(
        post.id,
        user.uid,
        user.displayName || "Someone",
        user.photoURL || "",
      );
    }
  };

  const handleTextLayout = (e: any) => {
    if (!measured) {
      setMeasured(true);
      const { lines } = e.nativeEvent;
      if (lines.length > MAX_LINES) {
        setIsCaptionLong(true);
      }
    }
  };

  // Navigate to author's profile
  const handleAuthorPress = () => {
    if (!authorId) return;
    // Don't navigate if it's the current user's own post
    if (user?.uid === authorId) {
      router.push("/(tabs)/profile");
    } else {
      router.push({
        pathname: "/(profile)/public_profile",
        params: { userId: authorId },
      });
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={handleAuthorPress}
          activeOpacity={0.7}
        >
          {post.userAvatar ? (
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {getInitial(post.username)}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.username}>{post.username}</Text>
            {post.location && (
              <View style={styles.timeLocationRow}>
                <Text style={styles.time}>{post.time || "1w"} • </Text>
                <Text style={styles.location}>{post.location}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {showFollowButton && authorId && (
            <FollowButton userId={authorId} size="small" />
          )}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(modal)/opction_modal",
                params: {
                  postId: post.id,
                  authorId: authorId || "",
                  authorName: post.username || "",
                  postImage: post.image || "",
                  postCaption: post.caption || "",
                },
              })
            }
          >
            <Feather name="more-horizontal" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Image/Video - Clickable */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          if (post.mediaType === "video") {
            router.push({
              pathname: "/(modal)/video_viewer_modal",
              params: { postId: post.id, videoUrl: post.image },
            });
          } else {
            router.push({
              pathname: "/(modal)/image_viewer_modal",
              params: { imageUrl: post.image },
            });
          }
        }}
      >
        <View style={styles.mediaContainer}>
          {/* Show thumbnail for videos, or the image itself */}
          <Image
            source={{
              uri:
                post.mediaType === "video" && post.thumbnailUrl
                  ? post.thumbnailUrl
                  : post.image,
            }}
            style={styles.postImage}
          />
          {/* Play icon overlay for videos */}
          {post.mediaType === "video" && (
            <View style={styles.playIconOverlay}>
              <View style={styles.playIconCircle}>
                <Feather
                  name="play"
                  size={30}
                  color="#fff"
                  style={{ marginLeft: 3 }}
                />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Job Badge
      {post.isJobPost && (
        <View style={styles.jobBadgeContainer}>
          <View style={styles.jobBadge}>
            <Ionicons name="briefcase" size={14} color="#fff" />
            <Text style={styles.jobBadgeText}>Job Opportunity</Text>
          </View>
        </View>
      )} */}

      {/* Caption */}
      <View style={{ marginHorizontal: 10, marginTop: 4 }}>
        <Text
          style={styles.caption}
          numberOfLines={!measured || showFullCaption ? undefined : MAX_LINES}
          onTextLayout={handleTextLayout}
        >
          {post.caption}
        </Text>

        {/* More / Show Less Button */}
        {isCaptionLong && (
          <TouchableOpacity
            onPress={() => setShowFullCaption(!showFullCaption)}
          >
            <Text style={styles.moreText}>
              {showFullCaption ? "Show Less" : "More"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Topics */}
        {post.topics && post.topics.length > 0 && (
          <View style={styles.topicsContainer}>
            {post.topics.map((topic, index) => (
              <TouchableOpacity key={index} style={styles.topicChip}>
                <Text style={styles.topicText}>#{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.jobInfoRow}>
          {post.jobType && (
            <View style={styles.jobInfoItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.jobInfoText}>{post.jobType}</Text>
            </View>
          )}
          {(post.salaryMin || post.salaryMax) && (
            <View style={styles.jobInfoItem}>
              <Ionicons name="cash-outline" size={16} color="#666" />
              <Text style={styles.jobInfoText}>
                {post.salaryCurrency || "$"}
                {post.salaryMin}
                {post.salaryMax
                  ? ` - ${post.salaryCurrency || "$"}${post.salaryMax}`
                  : "+"}
              </Text>
            </View>
          )}
        </View>
        {/* View Job Post Button */}
        {!hideViewJobButton && (post.jobType || post.salaryMin || post.salaryMax || post.applicationUrl) && (
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              router.push({
                pathname: "/(profile)/post_detail",
                params: { postId: post.id },
              });
            }}
          >
            <Text style={styles.applyButtonText}>View Job Post</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        )}
        {/* Stats Row - Likes and Comments with icons */}
        <View style={styles.actions}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={handleLike}>
              {isLiked ? (
                <AntDesign name="heart" size={18} color="#FF3B30" />
              ) : (
                <Feather name="heart" size={18} color="#666" />
              )}
              <Text style={[styles.statText, isLiked && styles.statTextLiked]}>
                {likesCount > 0 ? likesCount.toLocaleString() : "0"}
              </Text>
            </TouchableOpacity>

            {commentsEnabled && (
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => {
                  router.push({
                    pathname: "/(modal)/comments_modal",
                    params: { postId: post.id },
                  });
                }}
              >
                <Feather name="message-circle" size={18} color="#666" />
                <Text style={styles.statText}>{post.commentsCount || 0}</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/(modal)/bookmark_feature_modal",
                params: { postId: post.id, postImageUrl: post.image },
              });
            }}
          >
            {isBookmarked ? (
              <Ionicons name="bookmark" size={18} color="#000" />
            ) : (
              <Feather name="bookmark" size={18} color="#666" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: "grey",
  },
  avatarFallback: {
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  username: {
    fontWeight: "600",
    fontSize: 14,
  },
  location: {
    fontSize: 12,
    color: "#555",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  followBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#efefef",
  },
  followText: {
    fontWeight: "600",
    fontSize: 13,
  },
  postImage: {
    width: "100%",
    height: 420,
    backgroundColor: "#eee",
  }, // Stats Row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    // marginTop: 12,
    // paddingVertical: 8,
  },
  actions: {
    marginTop: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    alignContent: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  leftActions: {
    flexDirection: "row",
  },
  icon: {
    marginRight: 16,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  moreText: {
    color: "#555",
    fontWeight: "600",
    marginTop: 2,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  topicChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  time: {
    marginTop: 4,
    fontSize: 12,
    color: "#888",
  },
  timeLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  mediaContainer: {
    position: "relative",
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  playIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  statTextLiked: {
    color: "#FF3B30",
  },
  // Job Details Inline
  jobDetailsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  jobInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginVertical: 8,
  },
  jobInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  jobInfoText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  jobRequirements: {
    marginTop: 4,
    gap: 6,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  requirementText: {
    fontSize: 13,
    color: "#444",
    flex: 1,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.black,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 6,
    gap: 6,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Job post styles
  jobBadgeContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  jobBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9500",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  jobBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
