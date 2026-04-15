import FollowButton from "@/components/FollowButton";
import { Colors } from "@/constants/theme";
import { Post } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { getRecommendedJobs, getRecommendedPeople } from "@/services/recommendationService";
import { UserProfile } from "@/services/userService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const DiscoverScreen = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= 768;
  const { user, profile, followingIds, blockedUserIds } = useAuth();
  const [jobs, setJobs] = useState<Post[]>([]);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [user?.uid]);

  const loadRecommendations = async () => {
    if (!user?.uid) return;

    // Load jobs
    setIsLoadingJobs(true);
    const { posts } = await getRecommendedJobs(
      user.uid,
      profile?.interests || [],
      profile?.title || "",
      10
    );
    setJobs(posts);
    setIsLoadingJobs(false);

    // Load people
    setIsLoadingPeople(true);
    const { users } = await getRecommendedPeople(
      user.uid,
      profile?.interests || [],
      profile?.location || "",
      followingIds,
      blockedUserIds,
      10
    );
    setPeople(users);
    setIsLoadingPeople(false);
  };

  const getInitial = (name: string) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const formatDeadline = (date?: Date) => {
    if (!date) return null;
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Last day!";
    if (diffDays <= 7) return `${diffDays}d left`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderJobCard = ({ item }: { item: Post }) => {
    const deadline = formatDeadline(item.applicationDeadline);
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => router.push({ pathname: "/(profile)/post_detail", params: { postId: item.id } })}
        activeOpacity={0.7}
      >
        {item.mediaUrl ? (
          <Image source={{ uri: item.thumbnailUrl || item.mediaUrl }} style={styles.jobImage} />
        ) : (
          <View style={[styles.jobImage, styles.jobImagePlaceholder]}>
            <Ionicons name="briefcase" size={24} color="#999" />
          </View>
        )}
        <View style={styles.jobContent}>
          <Text style={styles.jobTitle} numberOfLines={2}>{item.caption || item.title}</Text>
          {item.companyName && <Text style={styles.jobCompany}>{item.companyName}</Text>}
          <View style={styles.jobMeta}>
            {item.jobType && (
              <View style={styles.jobTag}>
                <Text style={styles.jobTagText}>{item.jobType}</Text>
              </View>
            )}
            {item.location && (
              <View style={styles.jobTag}>
                <Feather name="map-pin" size={10} color="#666" />
                <Text style={styles.jobTagText}>{item.location}</Text>
              </View>
            )}
          </View>
          {(item.salaryMin || item.salaryMax) && (
            <Text style={styles.jobSalary}>
              {item.salaryCurrency || "$"}{item.salaryMin}{item.salaryMax ? ` - ${item.salaryCurrency || "$"}${item.salaryMax}` : "+"}
            </Text>
          )}
          {deadline && (
            <Text style={[styles.deadline, deadline === "Expired" && { color: "#FF3B30" }]}>
              {deadline}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPersonCard = ({ item }: { item: UserProfile }) => (
    <View style={styles.personCard}>
      <TouchableOpacity
        style={styles.personInfo}
        onPress={() => router.push({ pathname: "/(profile)/public_profile", params: { userId: item.uid } })}
      >
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.personAvatar} />
        ) : (
          <View style={[styles.personAvatar, styles.personAvatarFallback]}>
            <Text style={styles.personInitial}>{getInitial(item.displayName)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.personName} numberOfLines={1}>{item.displayName}</Text>
          {item.title && <Text style={styles.personTitle} numberOfLines={1}>{item.title}</Text>}
          {item.interests && item.interests.length > 0 && (
            <Text style={styles.personInterests} numberOfLines={1}>
              {item.interests.slice(0, 3).join(" · ")}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <FollowButton userId={item.uid} size="small" />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        {!isWeb && (
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
            <Feather name="arrow-left" size={24} color={Colors.black} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Jobs You May Like */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="briefcase-outline" size={20} color={Colors.black} />
          <Text style={styles.sectionTitle}>Jobs You May Like</Text>
        </View>

        {isLoadingJobs ? (
          <ActivityIndicator size="large" color={Colors.black} style={{ paddingVertical: 40 }} />
        ) : jobs.length > 0 ? (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            renderItem={renderJobCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No job recommendations yet</Text>
            <Text style={styles.emptySubtext}>Add interests to your profile for better matches</Text>
          </View>
        )}
      </View>

      {/* People You May Know */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="users" size={20} color={Colors.black} />
          <Text style={styles.sectionTitle}>People You May Know</Text>
        </View>

        {isLoadingPeople ? (
          <ActivityIndicator size="large" color={Colors.black} style={{ paddingVertical: 40 }} />
        ) : people.length > 0 ? (
          <View style={{ paddingHorizontal: 16 }}>
            {people.map((p) => (
              <View key={p.uid}>{renderPersonCard({ item: p })}</View>
            ))}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <Text style={styles.emptySubtext}>Follow more people to improve suggestions</Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default DiscoverScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  emptySection: { alignItems: "center", paddingVertical: 30 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#555" },
  emptySubtext: { fontSize: 13, color: "#999", marginTop: 4 },

  // Job cards
  jobCard: {
    width: 260,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  jobImage: { width: "100%", height: 120, backgroundColor: "#eee" },
  jobImagePlaceholder: { justifyContent: "center", alignItems: "center" },
  jobContent: { padding: 12, gap: 4 },
  jobTitle: { fontSize: 14, fontWeight: "600", color: "#111" },
  jobCompany: { fontSize: 13, color: "#666" },
  jobMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  jobTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jobTagText: { fontSize: 11, color: "#666" },
  jobSalary: { fontSize: 13, fontWeight: "600", color: "#22C55E", marginTop: 2 },
  deadline: { fontSize: 12, color: "#FF9500", fontWeight: "500", marginTop: 2 },

  // People cards
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  personInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, marginRight: 12 },
  personAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#eee" },
  personAvatarFallback: { backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  personInitial: { color: "#fff", fontSize: 16, fontWeight: "700" },
  personName: { fontSize: 15, fontWeight: "600", color: "#111" },
  personTitle: { fontSize: 13, color: "#666", marginTop: 1 },
  personInterests: { fontSize: 12, color: "#999", marginTop: 2 },
});
