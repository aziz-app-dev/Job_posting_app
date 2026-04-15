import { Post } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/context/CollectionContext";
import { checkIfLiked, getPostById, likePost, unlikePost } from "@/services/postService";
import { AntDesign, Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Conditionally import expo-video (native only)
let useVideoPlayer: any = null;
let VideoView: any = null;
if (Platform.OS !== "web") {
  const expoVideo = require("expo-video");
  useVideoPlayer = expoVideo.useVideoPlayer;
  VideoView = expoVideo.VideoView;
}
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const VideoViewerModal = () => {
  const { postId, videoUrl } = useLocalSearchParams<{ postId: string; videoUrl: string }>();
  const { user } = useAuth();
  const { collections } = useCollection();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);

  // Create video player (native only)
  const player = Platform.OS !== "web" && useVideoPlayer
    ? useVideoPlayer(videoUrl || "", (p: any) => {
        p.loop = true;
        p.muted = isMuted;
      })
    : null;

  // Auto-play when player is ready
  useEffect(() => {
    if (Platform.OS !== "web" && player && videoUrl) {
      player.play();
      setIsPaused(false);
    }
  }, [player, videoUrl]);

  // Check if already saved in any collection
  const isSaved = post ? collections.some(c => c.postIds.includes(post.id)) : false;

  // Load post data
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setIsLoading(false);
        return;
      }
      const { post: fetchedPost } = await getPostById(postId);
      if (fetchedPost) {
        setPost(fetchedPost);
        setLikesCount(fetchedPost.likesCount || 0);
      }
      setIsLoading(false);
    };
    loadPost();
  }, [postId]);

  // Check like status
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user?.uid || !postId) return;
      const { isLiked: liked } = await checkIfLiked(postId, user.uid);
      setIsLiked(liked);
    };
    checkLikeStatus();
  }, [postId, user?.uid]);

  // Update muted state
  useEffect(() => {
    if (Platform.OS === "web" && webVideoRef.current) {
      webVideoRef.current.muted = isMuted;
    } else if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  const handleClose = () => {
    if (Platform.OS === "web" && webVideoRef.current) {
      webVideoRef.current.pause();
    } else if (player) {
      player.pause();
    }
    router.back();
  };

  const handleLike = async () => {
    if (!user?.uid || !postId) return;

    if (isLiked) {
      setLikesCount(prev => Math.max(0, prev - 1));
      setIsLiked(false);
      await unlikePost(postId, user.uid);
    } else {
      setLikesCount(prev => prev + 1);
      setIsLiked(true);
      await likePost(
        postId,
        user.uid,
        user.displayName || "Someone",
        user.photoURL || ""
      );
    }
  };

  const handleComment = () => {
    router.push({
      pathname: "/(modal)/comments_modal",
      params: { postId },
    });
  };

  const handleBookmark = () => {
    router.push({
      pathname: "/(modal)/bookmark_feature_modal",
      params: { postId, postImageUrl: videoUrl },
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this video by ${post?.authorName}!`,
        url: videoUrl || undefined,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleAuthorPress = () => {
    if (!post) return;
    if (user?.uid === post.authorId) {
      router.push("/(tabs)/profile");
    } else {
      router.push({
        pathname: "/(profile)/public_profile",
        params: { userId: post.authorId },
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const togglePlayPause = () => {
    if (Platform.OS === "web" && webVideoRef.current) {
      if (isPaused) {
        webVideoRef.current.play();
      } else {
        webVideoRef.current.pause();
      }
      setIsPaused(!isPaused);
    } else if (player) {
      if (isPaused) {
        player.play();
      } else {
        player.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <AntDesign name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video</Text>
        <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
          <Feather name={isMuted ? "volume-x" : "volume-2"} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Video */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={togglePlayPause}
        style={styles.videoContainer}
      >
        {Platform.OS === "web" ? (
          <video
            ref={(ref: any) => {
              webVideoRef.current = ref;
              if (ref) {
                ref.loop = true;
                ref.autoplay = true;
                ref.muted = isMuted;
              }
            }}
            src={videoUrl}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, objectFit: "contain" as any }}
          />
        ) : VideoView ? (
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
          />
        ) : null}

        {/* Pause indicator */}
        {isPaused && (
          <View style={styles.pauseIndicator}>
            <Feather name="play" size={50} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Right side actions */}
      <View style={[styles.actionsContainer, { bottom: 120 + insets.bottom }]}>
        {/* Like */}
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          {isLiked ? (
            <AntDesign name="heart" size={28} color="#FF3B30" />
          ) : (
            <Feather name="heart" size={24} color="#fff" />
          )}
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <Feather name="message-circle" size={28} color="#fff" />
          <Text style={styles.actionText}>{post?.commentsCount || 0}</Text>
        </TouchableOpacity>

        {/* Bookmark */}
        <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
          {isSaved ? (
            <Feather name="bookmark" size={28} color="#22C55E" />
          ) : (
            <Feather name="bookmark" size={28} color="#fff" />
          )}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Feather name="send" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      {post && (
        <View style={[styles.bottomInfo, { bottom: 20 + insets.bottom }]}>
          {/* Author info */}
          <TouchableOpacity style={styles.authorRow} onPress={handleAuthorPress}>
            {post.authorAvatar ? (
              <Image source={{ uri: post.authorAvatar }} style={styles.authorAvatar} />
            ) : (
              <View style={[styles.authorAvatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{getInitial(post.authorName)}</Text>
              </View>
            )}
            <Text style={styles.authorName}>{post.authorName}</Text>
            {post.authorTitle && (
              <Text style={styles.authorTitle}>• {post.authorTitle}</Text>
            )}
          </TouchableOpacity>

          {/* Caption */}
          {post.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              {post.caption}
            </Text>
          )}

          {/* Topics */}
          {post.topics && post.topics.length > 0 && (
            <View style={styles.topicsRow}>
              {post.topics.slice(0, 3).map((topic, index) => (
                <Text key={index} style={styles.topicText}>#{topic}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default VideoViewerModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pauseIndicator: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionsContainer: {
    position: "absolute",
    right: 12,
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  bottomInfo: {
    position: "absolute",
    left: 12,
    right: 70,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#fff",
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
  authorName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  authorTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginLeft: 6,
  },
  caption: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
});
