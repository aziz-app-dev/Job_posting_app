import FollowButton from "@/components/FollowButton";
import PostCard from "@/components/ui/post_card_component";
import { Colors } from "@/constants/theme";
import { Post } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { checkIfFollowing } from "@/services/followService";
import { getPostsByUser, getPublicPostsByUser } from "@/services/postService";
import { getUserProfile, UserProfile } from "@/services/userService";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PublicProfileScreen = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollower, setIsFollower] = useState(false);
  const [canViewPosts, setCanViewPosts] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = user?.uid === userId;

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setError("User not found");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { profile: fetchedProfile, error: fetchError } = await getUserProfile(userId);

      if (fetchError || !fetchedProfile) {
        setError(fetchError || "Failed to load profile");
        setIsLoading(false);
        return;
      }

      // Check if current user follows this profile (for "Followers only" privacy)
      let isUserFollowing = false;
      if (user?.uid && !isOwnProfile) {
        const { isFollowing } = await checkIfFollowing(user.uid, userId);
        isUserFollowing = isFollowing;
        setIsFollower(isFollowing);
      }

      // Check privacy settings
      if (fetchedProfile.privacy === "Private" && !isOwnProfile) {
        setError("This profile is private");
        setIsLoading(false);
        return;
      }

      // Determine if user can view posts based on privacy
      const canView =
        isOwnProfile ||
        fetchedProfile.privacy === "Public" ||
        (fetchedProfile.privacy === "Followers" && isUserFollowing);

      setCanViewPosts(canView);
      setProfile(fetchedProfile);
      setIsLoading(false);

      // Load posts based on access level
      setIsLoadingPosts(true);
      if (canView) {
        // If user can view (own profile, public, or follower), show all public posts
        // For followers, we could also show "Followers only" posts
        if (isOwnProfile || (fetchedProfile.privacy === "Followers" && isUserFollowing)) {
          // Show all posts including "Followers only"
          const { posts: fetchedPosts } = await getPostsByUser(userId, 50);
          // Filter out Private posts for non-owners
          const visiblePosts = isOwnProfile
            ? fetchedPosts
            : fetchedPosts.filter(p => p.visibility !== "Private");
          setPosts(visiblePosts);
        } else {
          // Show only public posts
          const { posts: fetchedPosts } = await getPublicPostsByUser(userId, 50);
          setPosts(fetchedPosts);
        }
      }
      setIsLoadingPosts(false);
    };

    loadProfile();
  }, [userId, isOwnProfile, user?.uid]);

  // Get initials for avatar fallback
  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

  // Convert Post to the format expected by PostCard
  const convertToCardPost = (p: Post) => ({
    id: p.id,
    username: p.authorName,
    userAvatar: p.authorAvatar,
    image: p.mediaUrl || "",
    caption: p.caption,
    likes: p.likesCount,
    comments: p.commentsCount,
    time: getRelativeTime(p.createdAt),
    location: p.location,
    topics: p.topics,
    mediaType: p.mediaType,
    thumbnailUrl: p.thumbnailUrl,
  });

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1d";
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    return `${Math.floor(diffDays / 30)}mo`;
  };

  // Open social link
  const openLink = (type: string, value: string) => {
    let url = value;
    if (type === "instagram" && !value.startsWith("http")) {
      url = `https://instagram.com/${value.replace("@", "")}`;
    } else if (type === "x" && !value.startsWith("http")) {
      url = `https://x.com/${value.replace("@", "")}`;
    } else if (type === "linkedin" && !value.startsWith("http")) {
      url = `https://linkedin.com/in/${value}`;
    } else if (type === "email") {
      url = `mailto:${value}`;
    }
    Linking.openURL(url).catch(() => {});
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="lock" size={48} color="#ccc" />
        <Text style={styles.errorText}>{error || "Profile not found"}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.displayName}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          {/* Avatar */}
          {profile.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {getInitial(profile.displayName)}
              </Text>
            </View>
          )}

          {/* Name and Title */}
          <Text style={styles.displayName}>{profile.displayName}</Text>
          {profile.title && <Text style={styles.title}>{profile.title}</Text>}

          {/* Bio */}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* Location */}
          {profile.location && profile.locationVisibility === "Everyone" && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={14} color="#666" />
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.followers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.following || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Follow + Message Buttons */}
          {!isOwnProfile && userId && (
            <View style={styles.followBtnContainer}>
              <FollowButton userId={userId} size="large" />
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={async () => {
                  const { getOrCreateConversation } = require("@/services/messagingService");
                  const { conversationId } = await getOrCreateConversation(
                    user?.uid || "", user?.displayName || "", user?.photoURL || "", "",
                    userId, profile.displayName, profile.photoURL || "", profile.title || ""
                  );
                  if (conversationId) {
                    router.push({ pathname: "/(profile)/chat", params: { conversationId } });
                  }
                }}
              >
                <Feather name="message-circle" size={18} color={Colors.black} />
                <Text style={styles.messageBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Social Links */}
          {profile.links && profile.links.length > 0 && (
            <View style={styles.linksRow}>
              {profile.links.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.linkBtn}
                  onPress={() => openLink(link.type, link.value)}
                >
                  <Feather
                    name={
                      link.type === "email"
                        ? "mail"
                        : link.type === "instagram"
                        ? "instagram"
                        : link.type === "linkedin"
                        ? "linkedin"
                        : link.type === "x"
                        ? "twitter"
                        : "link"
                    }
                    size={18}
                    color="#666"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>

          {!canViewPosts ? (
            <View style={styles.restrictedPosts}>
              <Feather name="lock" size={48} color="#ccc" />
              <Text style={styles.restrictedTitle}>Posts are private</Text>
              <Text style={styles.restrictedText}>
                Follow this user to see their posts
              </Text>
            </View>
          ) : isLoadingPosts ? (
            <View style={styles.postsLoading}>
              <ActivityIndicator size="large" color={Colors.black} />
            </View>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={convertToCardPost(post)}
                authorId={post.authorId}
                showFollowButton={false}
                commentsEnabled={post.commentsEnabled}
              />
            ))
          ) : (
            <View style={styles.emptyPosts}>
              <MaterialCommunityIcons name="post-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No public posts yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default PublicProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  backBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.black,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  avatarFallback: {
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.black,
    marginTop: 12,
  },
  title: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
  },
  statLabel: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e0e0e0",
  },
  followBtnContainer: {
    marginTop: 20,
    width: "100%",
    gap: 10,
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  messageBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.black,
  },
  linksRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  linkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  interestChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 13,
    color: "#555",
  },
  postsSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postsLoading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyPosts: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    marginTop: 12,
  },
  restrictedPosts: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  restrictedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginTop: 12,
  },
  restrictedText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});
