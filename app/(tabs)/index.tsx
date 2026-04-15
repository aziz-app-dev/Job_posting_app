import ProfileSetupCards from "@/components/profile_setup_comeponent";
import PostCard from "@/components/ui/post_card_component";
import { Post as DataPost } from "@/constants/data";
import { Post } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { useFeed } from "@/context/FeedContext";
import { useNotifications } from "@/context/NotificationContext";
import { getRecommendedJobs } from "@/services/recommendationService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const BREAKPOINT = 1100;

const HomeScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const { posts, isLoading, isRefreshing, refreshFeed } = useFeed();
  const { unreadCount } = useNotifications();
  const { width } = useWindowDimensions();
  const showSidebar = Platform.OS === "web" && width >= BREAKPOINT;

  const [suggestedJobs, setSuggestedJobs] = useState<Post[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const isProfileIncomplete = !user?.displayName || !user?.photoURL;

  // Load suggested jobs for web sidebar
  useEffect(() => {
    if (showSidebar && user?.uid) {
      loadSuggestedJobs();
    }
  }, [showSidebar, user?.uid]);

  const loadSuggestedJobs = async () => {
    if (!user?.uid) return;
    setIsLoadingJobs(true);
    const { posts: jobs } = await getRecommendedJobs(
      user.uid,
      profile?.interests || [],
      profile?.title || "",
      5,
    );
    setSuggestedJobs(jobs);
    setIsLoadingJobs(false);
  };

  const renderHeader = () => (
    <View style={styles.appBar}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {getInitial(displayName)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.title}>For You</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(search)/search_screen")}
        >
          <Ionicons name="search-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(profile)/notifications")}
        >
          <View>
            <Ionicons name="notifications-outline" size={24} color="black" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

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

  const mapPostToCardFormat = (post: Post): DataPost => ({
    id: post.id,
    username: post.authorName,
    userAvatar: post.authorAvatar,
    image: post.mediaUrl || "",
    caption: post.caption,
    likes: post.likesCount,
    time: formatTimeAgo(post.createdAt),
    location: post.location,
    topics: post.topics,
    mediaType: post.mediaType,
    thumbnailUrl: post.thumbnailUrl,
    isJobPost: post.isJobPost,
    jobType: post.jobType,
    salaryMin: post.salaryMin,
    salaryMax: post.salaryMax,
    salaryCurrency: post.salaryCurrency,
    companyName: post.companyName,
    requirements: post.requirements,
    experienceLevel: post.experienceLevel,
    applicationUrl: post.applicationUrl,
  });

  const feedContent = (
    <View style={{ flex: 1 }}>
      {renderHeader()}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList<Post>
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={mapPostToCardFormat(item)}
              authorId={item.authorId}
              commentsEnabled={item.commentsEnabled}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            isProfileIncomplete ? <ProfileSetupCards /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>
                Follow people to see their posts here
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshFeed}
              tintColor="#000"
            />
          }
        />
      )}
    </View>
  );

  // ── Web with sidebar ──
  if (showSidebar) {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webInner}>
          {/* Feed */}
          <View style={styles.webFeed}>{feedContent}</View>

          {/* Right sidebar — Suggested Jobs */}
          <ScrollView
            style={styles.webSidebar}
            showsVerticalScrollIndicator={false}
          >
            {/* Suggested Jobs */}
            <View style={styles.sidebarCard}>
              <View style={styles.sidebarCardHeader}>
                <Ionicons name="briefcase-outline" size={18} color="#111" />
                <Text style={styles.sidebarCardTitle}>Jobs For You</Text>
              </View>

              {isLoadingJobs ? (
                <ActivityIndicator
                  size="small"
                  color="#000"
                  style={{ paddingVertical: 20 }}
                />
              ) : suggestedJobs.length > 0 ? (
                suggestedJobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    style={styles.jobItem}
                    onPress={() =>
                      router.push({
                        pathname: "/(profile)/post_detail",
                        params: { postId: job.id },
                      })
                    }
                  >
                    <View style={styles.jobItemLeft}>
                      {job.mediaUrl ? (
                        <Image
                          source={{ uri: job.thumbnailUrl || job.mediaUrl }}
                          style={styles.jobItemImg}
                        />
                      ) : (
                        <View
                          style={[
                            styles.jobItemImg,
                            {
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor: "#f0f0f0",
                            },
                          ]}
                        >
                          <Ionicons name="briefcase" size={16} color="#999" />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.jobItemTitle} numberOfLines={2}>
                          {job.caption || job.title}
                        </Text>
                        {job.companyName && (
                          <Text style={styles.jobItemCompany}>
                            {job.companyName}
                          </Text>
                        )}
                        <View
                          style={{ flexDirection: "row", gap: 6, marginTop: 3 }}
                        >
                          {job.jobType && (
                            <Text style={styles.jobItemTag}>{job.jobType}</Text>
                          )}
                          {(job.salaryMin || job.salaryMax) && (
                            <Text style={styles.jobItemSalary}>
                              {job.salaryCurrency || "$"}
                              {job.salaryMin}
                              {job.salaryMax ? `-${job.salaryMax}` : "+"}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.sidebarEmpty}>
                  Add interests to your profile to get job suggestions
                </Text>
              )}

              <TouchableOpacity
                style={styles.sidebarSeeAll}
                onPress={() => router.push("/(profile)/discover")}
              >
                <Text style={styles.sidebarSeeAllText}>
                  See all recommendations
                </Text>
                <Feather name="arrow-right" size={14} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* Quick Links */}
            <View style={styles.sidebarCard}>
              <View style={styles.sidebarCardHeader}>
                <Feather name="zap" size={18} color="#111" />
                <Text style={styles.sidebarCardTitle}>Quick Links</Text>
              </View>
              <TouchableOpacity
                style={styles.quickLink}
                onPress={() => router.push("/(profile)/discover")}
              >
                <Feather name="compass" size={16} color="#555" />
                <Text style={styles.quickLinkText}>Discover People & Jobs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLink}
                onPress={() => router.push("/(profile)/conversations")}
              >
                <Feather name="message-circle" size={16} color="#555" />
                <Text style={styles.quickLinkText}>Messages</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLink}
                onPress={() => router.push("/(profile)/notifications")}
              >
                <Ionicons name="notifications-outline" size={16} color="#555" />
                <Text style={styles.quickLinkText}>Notifications</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>WorkCircle © 2026</Text>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── Mobile ──
  return <View style={styles.container}>{feedContent}</View>;
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    marginBottom: 1,
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: "grey",
  },
  avatarFallback: {
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "bold" },
  actions: { flexDirection: "row" },
  iconButton: { marginLeft: 15 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: { fontSize: 14, color: "#666", textAlign: "center" },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 15,
    height: 15,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  notificationBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // ── Web layout ──
  webContainer: { flex: 1, alignItems: "center", backgroundColor: "#f2f2f2" },
  webInner: {
    flexDirection: "row",
    flex: 1,
    width: "100%",
    maxWidth: 1140,
    paddingHorizontal: 24,
    alignSelf: "center",
  },
  webFeed: {
    flex: 3,
    backgroundColor: "#fff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e8e8e8",
  },
  webSidebar: { flex: 1, paddingLeft: 16, paddingTop: 12, maxWidth: 280 },

  sidebarCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  sidebarCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sidebarCardTitle: { fontSize: 14, fontWeight: "700", color: "#111" },
  sidebarEmpty: { fontSize: 13, color: "#999", paddingVertical: 10 },

  jobItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  jobItemLeft: { flexDirection: "row", gap: 8 },
  jobItemImg: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  jobItemTitle: { fontSize: 12, fontWeight: "600", color: "#111" },
  jobItemCompany: { fontSize: 11, color: "#666", marginTop: 1 },
  jobItemTag: { fontSize: 10, color: "#007AFF", fontWeight: "500" },
  jobItemSalary: { fontSize: 10, color: "#22C55E", fontWeight: "600" },

  sidebarSeeAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  sidebarSeeAllText: { fontSize: 13, fontWeight: "600", color: "#007AFF" },

  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  quickLinkText: { fontSize: 13, color: "#333", fontWeight: "500" },

  footerText: {
    fontSize: 12,
    color: "#bbb",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
});
