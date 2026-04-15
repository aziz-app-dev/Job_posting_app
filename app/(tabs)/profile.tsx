import ProfileSetupCards from "@/components/profile_setup_comeponent";
import ProfileHeader from "@/components/ui/profile_components";
import { Draft, Post } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { usePost } from "@/context/PostContext";
import { getApplicationsCount } from "@/services/jobApplicationService";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

const ProfileScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= 768;
  const { user, profile } = useAuth();
  const { drafts, isLoadingDrafts, userPosts, isLoadingUserPosts, removePost, removeDraft } = usePost();
  const [activeTab, setActiveTab] = useState<"posts" | "drafts">("posts");

  // Delete confirmation state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "post" | "draft" } | null>(null);

  // Applicant counts for job posts
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});

  // Load applicant counts for job posts
  useEffect(() => {
    if (userPosts.length > 0) {
      loadApplicantCounts();
    }
  }, [userPosts]);

  const loadApplicantCounts = async () => {
    const jobPosts = userPosts.filter(
      (p) => p.isJobPost || p.jobType || p.salaryMin || p.salaryMax
    );

    const counts: Record<string, number> = {};
    for (const post of jobPosts) {
      const { count } = await getApplicationsCount(post.id);
      counts[post.id] = count;
    }
    setApplicantCounts(counts);
  };

  // Check if profile is complete (has displayName AND photoURL)
  const isProfileComplete =
    (!!profile?.displayName || !!user?.displayName) &&
    (!!profile?.photoURL || !!user?.photoURL);

  // Navigate to add post screen with draft data
  const handleDraftPress = (draft: Draft) => {
    router.push({
      pathname: "/(tabs)/add",
      params: { draftId: draft.id },
    });
  };

  // Handle edit post - navigate to add screen with post data
  const handleEditPost = (post: Post) => {
    router.push({
      pathname: "/(tabs)/add",
      params: { postId: post.id },
    });
  };

  // Show delete confirmation
  const handleDeletePress = (id: string, type: "post" | "draft") => {
    setItemToDelete({ id, type });
    setDeleteModalVisible(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "post") {
      await removePost(itemToDelete.id);
    } else {
      await removeDraft(itemToDelete.id);
    }

    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handle post media press
  const handlePostMediaPress = (post: Post) => {
    if (!post.mediaUrl) return;
    if (post.mediaType === "video") {
      router.push({
        pathname: "/(modal)/video_viewer_modal",
        params: { postId: post.id, videoUrl: post.mediaUrl },
      });
    } else {
      router.push({
        pathname: "/(modal)/image_viewer_modal",
        params: { imageUrl: post.mediaUrl },
      });
    }
  };

  // Check if post is a job post
  const isJobPost = (post: Post) => post.isJobPost || post.jobType || post.salaryMin || post.salaryMax;

  // Render a single post card
  const renderPostCard = (post: Post) => {
    const applicantCount = applicantCounts[post.id];

    return (
      <View key={post.id} style={styles.postCard}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handlePostMediaPress(post)}
          disabled={!post.mediaUrl}
          style={styles.postImageContainer}
        >
          {post.mediaUrl ? (
            <>
              <Image
                source={{ uri: post.mediaType === "video" && post.thumbnailUrl ? post.thumbnailUrl : post.mediaUrl }}
                style={styles.postImage}
              />
              {/* Play icon overlay for videos */}
              {post.mediaType === "video" && (
                <View style={styles.videoPlayOverlay}>
                  <Feather name="play" size={20} color="#fff" style={{ marginLeft: 2 }} />
                </View>
              )}
            </>
          ) : (
            <View style={[styles.postImage, styles.postImagePlaceholder]}>
              <Feather name="file-text" size={24} color="#999" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.postContent}>
          {/* Time and Visibility at top */}
          <View style={styles.postMeta}>
            <Text style={styles.postMetaText}>
              {formatTimeAgo(post.createdAt)}
            </Text>
            <View style={styles.postVisibilityBadge}>
              <Feather
                name={
                  post.visibility === "Public"
                    ? "globe"
                    : post.visibility === "Followers only"
                    ? "users"
                    : "lock"
                }
                size={12}
                color="#666"
              />
              <Text style={styles.postVisibilityText}>{post.visibility}</Text>
            </View>
          </View>
          {/* Caption in middle */}
          <Text style={styles.postCaption} numberOfLines={2}>
            {post.caption || "No caption"}
          </Text>
          {/* Stats at bottom */}
          <View style={styles.postStats}>
            <View style={styles.postStat}>
              <Feather name="heart" size={14} color="#888" />
              <Text style={styles.postStatText}>{post.likesCount}</Text>
            </View>
            <View style={styles.postStat}>
              <Feather name="message-circle" size={14} color="#888" />
              <Text style={styles.postStatText}>{post.commentsCount}</Text>
            </View>
            {/* Applicant count for job posts */}
            {isJobPost(post) && applicantCount !== undefined && (
              <TouchableOpacity
                style={styles.applicantStat}
                onPress={() => {
                  router.push({
                    pathname: "/(profile)/job_applicants",
                    params: { postId: post.id, jobTitle: post.title || post.caption || "Job" },
                  });
                }}
              >
                <Ionicons name="people" size={14} color="#22C55E" />
                <Text style={styles.applicantStatText}>
                  {applicantCount} {applicantCount === 1 ? "applicant" : "applicants"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditPost(post)}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeletePress(post.id, "post")}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={18} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render a single draft card
  const renderDraftCard = (draft: Draft) => (
    <View key={draft.id} style={styles.draftCard}>
      <TouchableOpacity
        style={styles.draftTouchable}
        onPress={() => handleDraftPress(draft)}
        activeOpacity={0.7}
      >
        {draft.localMediaUri ? (
          <Image source={{ uri: draft.localMediaUri }} style={styles.draftImage} />
        ) : (
          <View style={[styles.draftImage, styles.draftImagePlaceholder]}>
            <Feather name="file-text" size={24} color="#999" />
          </View>
        )}
        <View style={styles.draftContent}>
          {/* Time and Visibility at top */}
          <View style={styles.draftMetaRow}>
            <Text style={styles.draftMetaText}>
              {formatTimeAgo(draft.updatedAt)}
            </Text>
            <View style={styles.draftVisibilityBadge}>
              <Feather
                name={
                  draft.visibility === "Public"
                    ? "globe"
                    : draft.visibility === "Followers only"
                    ? "users"
                    : "lock"
                }
                size={12}
                color="#666"
              />
              <Text style={styles.draftVisibilityText}>{draft.visibility}</Text>
            </View>
          </View>
          {/* Caption below */}
          <Text style={styles.draftCaption} numberOfLines={2}>
            {draft.caption || "No caption"}
          </Text>
        </View>
         {/* Delete button */}
      <TouchableOpacity
        style={styles.draftDeleteButton}
        onPress={() => handleDeletePress(draft.id, "draft")}
        activeOpacity={0.7}
      >
        <Feather name="trash-2" size={18} color="#e74c3c" />
      </TouchableOpacity>
      </TouchableOpacity>

    </View>
  );

  return (
    <>
    <ScrollView style={[styles.container, isWeb && styles.webContainer]} showsVerticalScrollIndicator={false}>
      {/* Header of user profile */}
      <ProfileHeader />

      {isProfileComplete ? (
        <>
          {/* Tabs – Posts and Drafts */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "posts" && styles.activeTabItem,
              ]}
              onPress={() => setActiveTab("posts")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "posts" && styles.activeTabLabel,
                ]}
              >
                Posts
              </Text>
              {activeTab === "posts" && <View style={styles.tabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === "drafts" && styles.activeTabItem,
              ]}
              onPress={() => setActiveTab("drafts")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === "drafts" && styles.activeTabLabel,
                ]}
              >
                Drafts
              </Text>
              {activeTab === "drafts" && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.contentArea}>
            {activeTab === "posts" ? (
              isLoadingUserPosts ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color="#000" />
                </View>
              ) : userPosts.length > 0 ? (
                <View style={styles.postsContainer}>
                  {userPosts.map(renderPostCard)}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="post-outline"
                    size={60}
                    color="#ccc"
                  />
                  <Text style={styles.emptyText}>No posts yet</Text>
                  <Text style={styles.emptySubText}>
                    {"When you create posts, they'll appear here"}
                  </Text>
                </View>
              )
            ) : isLoadingDrafts ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color="#000" />
              </View>
            ) : drafts.length > 0 ? (
              <View style={styles.draftsContainer}>
                {drafts.map(renderDraftCard)}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="file-document-edit-outline"
                  size={60}
                  color="#ccc"
                />
                <Text style={styles.emptyText}>No drafts</Text>
                <Text style={styles.emptySubText}>
                  Your unfinished posts will show here
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        /* Show Get Started cards when profile is incomplete */
        <View style={styles.setupContainer}>
          <ProfileSetupCards />
        </View>
      )}
    </ScrollView>

    {/* Delete Confirmation Modal */}
    <ConfirmationModal
      visible={deleteModalVisible}
      title={itemToDelete?.type === "post" ? "Delete Post" : "Delete Draft"}
      message={itemToDelete?.type === "post"
        ? "Are you sure you want to delete this post? This action cannot be undone."
        : "Are you sure you want to delete this draft? This action cannot be undone."}
      onCancel={handleCancelDelete}
      onConfirm={handleConfirmDelete}
      confirmText="Delete"
      cancelText="Cancel"
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  webContainer: { paddingHorizontal: 40 },

  // ── Setup Cards Container ──
  setupContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  // ── Tabs ──
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  activeTabItem: {},
  tabLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#777",
  },
  activeTabLabel: {
    color: "#000",
    fontWeight: "700",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 3,
    backgroundColor: "#000",
    borderRadius: 2,
  },

  // ── Content ──
  contentArea: {
    flex: 1,
    minHeight: 300,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 120,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },

  // ── Posts ──
  postsContainer: {
    padding: 16,
  },
  postCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  postImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  postImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  postImageContainer: {
    position: "relative",
  },
  videoPlayOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
  },
  postContent: {
    flex: 1,
    marginLeft: 12,
  },
  postCaption: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  postMetaText: {
    fontSize: 12,
    color: "#888",
    marginRight: 8,
  },
  postVisibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postVisibilityText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  postStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  postStatText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },

  // ── Applicant Stats ──
  applicantStat: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: "#22C55E15",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  applicantStatText: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600",
    marginLeft: 4,
  },

  // ── Drafts ──
  draftsContainer: {
    padding: 16,
  },
  draftCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  draftTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  draftDeleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginLeft: 8,
  },
  draftImage: {
    width: 65,
    height: 65,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  draftImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  draftContent: {
    flex: 1,
    marginLeft: 12,
  },
  draftCaption: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  draftMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  draftMetaText: {
    fontSize: 12,
    color: "#888",
    marginRight: 8,
  },
  draftVisibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  draftVisibilityText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  draftMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
});

export default ProfileScreen;
