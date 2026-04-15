import PostCard from "@/components/ui/post_card_component";
import { Post as DataPost } from "@/constants/data";
import { Colors } from "@/constants/theme";
import { Company, Post } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import {
  checkIfFollowingCompany,
  followCompany,
  getCompany,
  getCompanyAnalytics,
  unfollowCompany,
} from "@/services/companyService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "@/config/firebase";
import { toDate } from "@/constants/types";

const CompanyProfileScreen = () => {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [analytics, setAnalytics] = useState({ totalPosts: 0, totalApplications: 0, totalViews: 0 });
  const isOwner = company?.adminIds?.includes(user?.uid || "");

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) return;
    setIsLoading(true);

    const { company: c } = await getCompany(companyId);
    if (c) {
      setCompany(c);

      // Check follow status
      if (user?.uid) {
        const following = await checkIfFollowingCompany(user.uid, companyId);
        setIsFollowing(following);
      }

      // Load company posts
      const snapshot = await db
        .collection("posts")
        .where("companyId", "==", companyId)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      const companyPosts = snapshot.docs.map((doc) => {
        const d = doc.data();
        return { ...d, id: doc.id, createdAt: toDate(d.createdAt), updatedAt: toDate(d.updatedAt) } as Post;
      });
      setPosts(companyPosts);

      // Load analytics for owners
      if (c.adminIds?.includes(user?.uid || "")) {
        const a = await getCompanyAnalytics(companyId);
        setAnalytics(a);
      }
    }
    setIsLoading(false);
  };

  const handleFollow = async () => {
    if (!user?.uid || !companyId) return;
    if (isFollowing) {
      await unfollowCompany(user.uid, companyId);
      setIsFollowing(false);
      if (company) setCompany({ ...company, followersCount: Math.max(0, company.followersCount - 1) });
    } else {
      await followCompany(user.uid, companyId);
      setIsFollowing(true);
      if (company) setCompany({ ...company, followersCount: company.followersCount + 1 });
    }
  };

  const convertToCardPost = (p: Post): DataPost => ({
    id: p.id, username: p.authorName, userAvatar: p.authorAvatar,
    image: p.mediaUrl || "", caption: p.caption, likes: p.likesCount,
    time: "", location: p.location, topics: p.topics,
    mediaType: p.mediaType, thumbnailUrl: p.thumbnailUrl,
    isJobPost: p.isJobPost, jobType: p.jobType, salaryMin: p.salaryMin,
    salaryMax: p.salaryMax, salaryCurrency: p.salaryCurrency,
    companyName: p.companyName, applicationUrl: p.applicationUrl,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#666", fontSize: 16 }}>Company not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{company.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Cover + Logo */}
      <View style={styles.coverSection}>
        {company.coverImage ? (
          <Image source={{ uri: company.coverImage }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, { backgroundColor: "#22C55E" }]} />
        )}
        <View style={styles.logoContainer}>
          {company.logo ? (
            <Image source={{ uri: company.logo }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoFallback]}>
              <Ionicons name="business" size={30} color="#fff" />
            </View>
          )}
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.companyName}>{company.name}</Text>
        {company.industry && <Text style={styles.industry}>{company.industry}</Text>}
        {company.description && <Text style={styles.description}>{company.description}</Text>}

        <View style={styles.metaRow}>
          {company.location && (
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={14} color="#666" />
              <Text style={styles.metaText}>{company.location}</Text>
            </View>
          )}
          {company.size && (
            <View style={styles.metaItem}>
              <Feather name="users" size={14} color="#666" />
              <Text style={styles.metaText}>{company.size} employees</Text>
            </View>
          )}
          {company.website && (
            <View style={styles.metaItem}>
              <Feather name="globe" size={14} color="#666" />
              <Text style={styles.metaText}>{company.website}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{company.followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{company.postsCount || posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Follow / Edit */}
        {!isOwner ? (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={handleFollow}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        ) : (
          /* Analytics for owner */
          <View style={styles.analyticsRow}>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticNum}>{analytics.totalApplications}</Text>
              <Text style={styles.analyticLabel}>Applications</Text>
            </View>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticNum}>{analytics.totalViews}</Text>
              <Text style={styles.analyticLabel}>Engagement</Text>
            </View>
          </View>
        )}
      </View>

      {/* Posts */}
      <View style={styles.postsSection}>
        <Text style={styles.sectionTitle}>Posts</Text>
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={convertToCardPost(post)}
              authorId={post.authorId}
              showFollowButton={false}
            />
          ))
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ color: "#999" }}>No posts yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default CompanyProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  backBtn: { marginTop: 16, backgroundColor: Colors.black, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  coverSection: { position: "relative" },
  cover: { width: "100%", height: 140, backgroundColor: "#eee" },
  logoContainer: { position: "absolute", bottom: -30, left: 20 },
  logo: { width: 70, height: 70, borderRadius: 16, backgroundColor: "#eee", borderWidth: 3, borderColor: "#fff" },
  logoFallback: { backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  info: { paddingHorizontal: 20, paddingTop: 40 },
  companyName: { fontSize: 22, fontWeight: "700", color: "#111" },
  industry: { fontSize: 14, color: "#666", marginTop: 2 },
  description: { fontSize: 14, color: "#444", lineHeight: 20, marginTop: 10 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, color: "#666" },
  statsRow: { flexDirection: "row", marginTop: 16, gap: 30 },
  stat: { alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 13, color: "#888" },
  followBtn: {
    backgroundColor: Colors.black, paddingVertical: 10, borderRadius: 8,
    alignItems: "center", marginTop: 16,
  },
  followBtnActive: { backgroundColor: "#f0f0f0" },
  followBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  followBtnTextActive: { color: "#111" },
  analyticsRow: { flexDirection: "row", gap: 20, marginTop: 16, backgroundColor: "#f9f9f9", padding: 16, borderRadius: 12 },
  analyticItem: { flex: 1, alignItems: "center" },
  analyticNum: { fontSize: 20, fontWeight: "700", color: "#22C55E" },
  analyticLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  postsSection: { paddingTop: 20, borderTopWidth: 1, borderTopColor: "#f0f0f0", marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", paddingHorizontal: 20, marginBottom: 12 },
});
