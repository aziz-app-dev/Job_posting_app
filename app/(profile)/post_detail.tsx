import PostCard from "@/components/ui/post_card_component";
import { Colors } from "@/constants/theme";
import { Post } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { applyForJob, checkIfApplied } from "@/services/jobApplicationService";
import { getPostById } from "@/services/postService";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

const PostDetailScreen = () => {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user, profile } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application state
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({ visible: false, type: "info", title: "", message: "" });

  const showAlert = (type: "success" | "error" | "info", title: string, message: string) => {
    setAlertModal({ visible: true, type, title, message });
  };

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setError("Post not found");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { post: fetchedPost, error: fetchError } =
        await getPostById(postId);

      if (fetchError || !fetchedPost) {
        setError(fetchError || "Failed to load post");
      } else {
        setPost(fetchedPost);

        // Check if user has already applied
        if (user?.uid && fetchedPost.isJobPost) {
          const { hasApplied: applied } = await checkIfApplied(
            postId,
            user.uid,
          );
          setHasApplied(applied);
        }
      }
      setIsLoading(false);
    };

    loadPost();
  }, [postId, user?.uid]);

  // Convert Post from types.ts to the format expected by PostCard
  const convertToCardPost = (p: Post) => ({
    id: p.id,
    username: p.authorName,
    userAvatar: p.authorAvatar,
    image: p.mediaUrl || "",
    caption: p.caption,
    likes: p.likesCount,
    commentsCount: p.commentsCount,
    time: getRelativeTime(p.createdAt),
    location: p.location,
    topics: p.topics,
    mediaType: p.mediaType,
    thumbnailUrl: p.thumbnailUrl,
    // Job fields
    isJobPost: p.isJobPost,
    jobType: p.jobType,
    salaryMin: p.salaryMin,
    salaryMax: p.salaryMax,
    salaryCurrency: p.salaryCurrency,
    companyName: p.companyName,
    requirements: p.requirements,
    experienceLevel: p.experienceLevel,
    applicationUrl: p.applicationUrl,
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

  const handleApply = async () => {
    if (!user || !post || !profile) return;

    // Check if it's the user's own job post
    if (post.authorId === user.uid) {
      showAlert("error", "Error", "You cannot apply to your own job post");
      return;
    }

    setIsSubmitting(true);

    const { error: applyError } = await applyForJob(
      {
        postId: post.id,
        jobTitle: post.title || "Job Position",
        companyName: post.companyName || post.authorName,
        recruiterId: post.authorId,
        message: applicationMessage.trim() || undefined,
      },
      user.uid,
      profile.displayName || user.displayName || "User",
      profile.photoURL || user.photoURL || "",
      profile.title || "",
      user.email || undefined,
    );

    setIsSubmitting(false);

    if (applyError) {
      showAlert("error", "Error", applyError);
    } else {
      setHasApplied(true);
      setShowApplyModal(false);
      setApplicationMessage("");
      showAlert(
        "success",
        "Success",
        "Your application has been submitted! The recruiter will be notified.",
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color="#ccc" />
        <Text style={styles.errorText}>{error || "Post not found"}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnPost = user?.uid === post.authorId;

  // If it's a job post, show detailed job view
  if (post.isJobPost) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          >
            <Feather name="arrow-left" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.jobContent}>
          {/* Post Image */}
          {post.mediaUrl && (
            <Image source={{ uri: post.mediaUrl }} style={styles.postImage} />
          )}

          {/* Title */}
          {post.title && <Text style={styles.postTitle}>{post.title}</Text>}

          {/* Company Info */}
          {post.companyName && (
            <View style={styles.companyRow}>
              <Ionicons name="business" size={18} color="#666" />
              <Text style={styles.companyName}>{post.companyName}</Text>
            </View>
          )}

          {/* Location */}
          {post.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color="#666" />
              <Text style={styles.infoText}>{post.location}</Text>
            </View>
          )}

          {/* Company Website/URL */}
          {post.applicationUrl && (
            <TouchableOpacity
              style={styles.urlRow}
              onPress={() => Linking.openURL(post.applicationUrl!)}
            >
              <Ionicons name="link" size={18} color="#007AFF" />
              <Text style={styles.urlText} numberOfLines={1}>
                {post.applicationUrl}
              </Text>
              <Ionicons name="open-outline" size={16} color="#007AFF" />
            </TouchableOpacity>
          )}

          {/* Job Quick Info */}
          <View style={styles.quickInfoContainer}>
            {post.jobType && (
              <View style={styles.infoCard}>
                <Ionicons name="time-outline" size={22} color={Colors.black} />
                <Text style={styles.infoLabel}>Job Type</Text>
                <Text style={styles.infoValue}>{post.jobType}</Text>
              </View>
            )}
            {post.experienceLevel && (
              <View style={styles.infoCard}>
                <Ionicons
                  name="trending-up-outline"
                  size={22}
                  color={Colors.black}
                />
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue}>{post.experienceLevel}</Text>
              </View>
            )}
            {(post.salaryMin || post.salaryMax) && (
              <View style={styles.infoCard}>
                <Ionicons name="cash-outline" size={22} color={Colors.black} />
                <Text style={styles.infoLabel}>Salary</Text>
                <Text style={styles.infoValue}>
                  {post.salaryCurrency || "$"}
                  {post.salaryMin?.toLocaleString()}
                  {post.salaryMax
                    ? ` - ${post.salaryCurrency || "$"}${post.salaryMax.toLocaleString()}`
                    : "+"}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.description}>{post.caption}</Text>
          </View>

          {/* Requirements */}
          {post.requirements && post.requirements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              {post.requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Topics */}
          {post.topics && post.topics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Topics</Text>
              <View style={styles.topicsContainer}>
                {post.topics.map((topic, index) => (
                  <View key={index} style={styles.topicChip}>
                    <Text style={styles.topicText}>#{topic}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Posted By */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posted By</Text>
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() => {
                if (isOwnPost) {
                  router.push("/(tabs)/profile");
                } else {
                  router.push({
                    pathname: "/(profile)/public_profile",
                    params: { userId: post.authorId },
                  });
                }
              }}
            >
              {post.authorAvatar ? (
                <Image
                  source={{ uri: post.authorAvatar }}
                  style={styles.authorAvatar}
                />
              ) : (
                <View style={[styles.authorAvatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {post.authorName?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.authorName}>{post.authorName}</Text>
                {post.authorTitle && (
                  <Text style={styles.authorTitle}>{post.authorTitle}</Text>
                )}
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color="#999"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          </View>

          {/* Apply Button - Show only if not own post */}
          {!isOwnPost && (
            <TouchableOpacity
              style={[styles.applyButton, hasApplied && styles.appliedButton]}
              onPress={() => {
                if (!hasApplied) {
                  setShowApplyModal(true);
                }
              }}
              disabled={hasApplied}
            >
              {hasApplied ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  <Text style={[styles.applyButtonText, { color: "#22C55E" }]}>
                    Applied
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}

          {/* View Applicants - Show only for own post */}
          {isOwnPost && (
            <TouchableOpacity
              style={styles.viewApplicantsButton}
              onPress={() => {
                router.push({
                  pathname: "/(profile)/job_applicants",
                  params: { postId: post.id, jobTitle: post.title || "Job" },
                });
              }}
            >
              <Ionicons name="people" size={20} color={Colors.black} />
              <Text style={styles.viewApplicantsText}>View Applicants</Text>
            </TouchableOpacity>
          )}

          {/* External Application Link - if available and not own post */}
          {/* {!isOwnPost && post.applicationUrl && (
            <TouchableOpacity
              style={styles.externalApplyButton}
              onPress={() => Linking.openURL(post.applicationUrl!)}
            >
              <Ionicons name="open-outline" size={20} color={Colors.black} />
              <Text style={styles.externalApplyText}>Apply on Company Website</Text>
            </TouchableOpacity>
          )} */}
        </ScrollView>

        {/* Apply Modal */}
        <Modal
          visible={showApplyModal}
          transparent
          statusBarTranslucent
          animationType="slide"
          onRequestClose={() => setShowApplyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Apply for this Job</Text>
                <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalJobTitle}>
                {post.title || "Job Position"}
              </Text>
              <Text style={styles.modalCompany}>
                {post.companyName || post.authorName}
              </Text>

              <Text style={styles.inputLabel}>
                Message to Recruiter (Optional)
              </Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Introduce yourself and explain why you're a good fit..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={applicationMessage}
                onChangeText={setApplicationMessage}
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {applicationMessage.length}/500
              </Text>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
                onPress={handleApply}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      Submit Application
                    </Text>
                    <Ionicons name="send" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Alert Modal */}
        <ConfirmationModal
          visible={alertModal.visible}
          type={alertModal.type}
          title={alertModal.title}
          message={alertModal.message}
          onCancel={() => setAlertModal({ ...alertModal, visible: false })}
        />
      </View>
    );
  }

  // Regular post view
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Feather name="arrow-left" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Post */}
      <ScrollView contentContainerStyle={styles.content}>
        <PostCard
          post={convertToCardPost(post)}
          authorId={post.authorId}
          showFollowButton={true}
          commentsEnabled={post.commentsEnabled}
          hideViewJobButton={true}
        />
      </ScrollView>
    </View>
  );
};

export default PostDetailScreen;

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
  content: {
    paddingBottom: 20,
  },
  jobContent: {
    padding: 16,
    paddingBottom: 40,
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
  // Job detail styles
  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    marginBottom: 16,
  },
  postTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  infoText: {
    fontSize: 15,
    color: "#666",
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 14,
    color: "#007AFF",
  },
  quickInfoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  infoCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
    textAlign: "center",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#444",
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  requirementText: {
    flex: 1,
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  topicText: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: "500",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eee",
  },
  avatarFallback: {
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  authorTitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.black,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  appliedButton: {
    backgroundColor: "#f0fff4",
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  viewApplicantsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  viewApplicantsText: {
    color: Colors.black,
    fontSize: 17,
    fontWeight: "600",
  },
  externalApplyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  externalApplyText: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
  },
  modalJobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  modalCompany: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#333",
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 6,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.black,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
