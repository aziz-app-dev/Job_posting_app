import { Colors } from "@/constants/theme";
import { Post } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { usePost } from "@/context/PostContext";
import { getApplicationsCount } from "@/services/jobApplicationService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const IMAGE_SIZE = (width - 48) / 3;

interface JobPostWithCount extends Post {
  applicantCount: number;
}

const MyJobPostsScreen = () => {
  const { user } = useAuth();
  const { userPosts, isLoadingUserPosts } = usePost();
  const [jobPosts, setJobPosts] = useState<JobPostWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJobPosts();
  }, [userPosts]);

  const loadJobPosts = async () => {
    if (!user?.uid) return;
    setIsLoading(true);

    // Filter job posts
    const filteredJobPosts = userPosts.filter(
      (p) => p.isJobPost || p.jobType || p.salaryMin || p.salaryMax
    );

    // Get applicant count for each job post
    const postsWithCounts: JobPostWithCount[] = [];

    for (const post of filteredJobPosts) {
      const { count } = await getApplicationsCount(post.id);
      postsWithCounts.push({
        ...post,
        applicantCount: count,
      });
    }

    setJobPosts(postsWithCounts);
    setIsLoading(false);
  };

  const renderJobPost = ({ item }: { item: JobPostWithCount }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => {
        router.push({
          pathname: "/(profile)/job_applicants",
          params: {
            postId: item.id,
            jobTitle: item.title || "Job Post",
            jobImage: item.mediaUrl || "",
            jobType: item.jobType || "",
            companyName: item.companyName || "",
            location: item.location || "",
          },
        });
      }}
      activeOpacity={0.7}
    >
      {item.mediaUrl ? (
        <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />
      ) : (
        <View style={[styles.postImage, styles.noImageContainer]}>
          <Ionicons name="briefcase-outline" size={24} color="#999" />
        </View>
      )}

      {/* Applicant count badge */}
      <View style={styles.countBadge}>
        <Ionicons name="people" size={12} color="#fff" />
        <Text style={styles.countText}>{item.applicantCount}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading || isLoadingUserPosts) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
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
        <Text style={styles.headerTitle}>Job Applicants</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Job Posts Grid */}
      {jobPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No job posts yet</Text>
          <Text style={styles.emptySubtext}>
            Your job posts will appear here with applicant counts
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobPosts}
          renderItem={renderJobPost}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default MyJobPostsScreen;

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
  gridContent: {
    padding: 16,
    paddingBottom: 40,
  },
  gridItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  noImageContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e9e9e9",
  },
  countBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  countText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
