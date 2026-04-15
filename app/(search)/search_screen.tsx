import PostCard from "@/components/ui/post_card_component";
import UserCard from "@/components/ui/user_card_component";
import { Post as DataPost } from "@/constants/data";
import { Post } from "@/constants/types";
import { UserProfile } from "@/services/userService";
import {
  searchAll,
  searchByInterests,
  searchByTitles,
  searchPeople,
  searchPosts,
  SearchResults,
} from "@/services/searchService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterType = "all" | "posts" | "people" | "interests" | "titles";

interface FilterTab {
  key: FilterType;
  label: string;
}

const FILTER_TABS: FilterTab[] = [
  { key: "all", label: "All" },
  { key: "posts", label: "Posts" },
  { key: "people", label: "People" },
  { key: "interests", label: "Interests" },
  { key: "titles", label: "Titles" },
];

const SearchScreen = () => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Results state
  const [allResults, setAllResults] = useState<SearchResults>({
    posts: [],
    people: [],
    interests: [],
    titles: [],
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [interests, setInterests] = useState<{ topics: string[]; posts: Post[] }>({
    topics: [],
    posts: [],
  });
  const [titles, setTitles] = useState<{ title: string; users: UserProfile[] }[]>([]);

  // Format time ago helper
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

  // Map post to PostCard format
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
  });

  // Search based on active filter
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setHasSearched(true);

    try {
      switch (activeFilter) {
        case "all": {
          const { results } = await searchAll(query);
          setAllResults(results);
          break;
        }
        case "posts": {
          const { posts: searchedPosts } = await searchPosts(query);
          setPosts(searchedPosts);
          break;
        }
        case "people": {
          const { people: searchedPeople } = await searchPeople(query);
          setPeople(searchedPeople);
          break;
        }
        case "interests": {
          const { interests: topics, posts: interestPosts } = await searchByInterests(query);
          setInterests({ topics, posts: interestPosts });
          break;
        }
        case "titles": {
          const { titles: searchedTitles } = await searchByTitles(query);
          setTitles(searchedTitles);
          break;
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [query, activeFilter]);

  // Execute search with specific filter
  const executeSearch = useCallback(async (searchFilter: FilterType) => {
    if (!query.trim()) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setHasSearched(true);

    try {
      switch (searchFilter) {
        case "all": {
          const { results } = await searchAll(query);
          setAllResults(results);
          break;
        }
        case "posts": {
          const { posts: searchedPosts } = await searchPosts(query);
          setPosts(searchedPosts);
          break;
        }
        case "people": {
          const { people: searchedPeople } = await searchPeople(query);
          setPeople(searchedPeople);
          break;
        }
        case "interests": {
          const { interests: topics, posts: interestPosts } = await searchByInterests(query);
          setInterests({ topics, posts: interestPosts });
          break;
        }
        case "titles": {
          const { titles: searchedTitles } = await searchByTitles(query);
          setTitles(searchedTitles);
          break;
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  // Re-search when filter changes
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    if (query.trim() && hasSearched) {
      executeSearch(filter);
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
    setAllResults({ posts: [], people: [], interests: [], titles: [] });
    setPosts([]);
    setPeople([]);
    setInterests({ topics: [], posts: [] });
    setTitles([]);
  };

  // Render empty state
  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>Search WorkCircle</Text>
          <Text style={styles.emptySubtext}>
            Find posts, people, interests, and job titles
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="sad-outline" size={60} color="#ccc" />
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptySubtext}>
          Try different keywords or filters
        </Text>
      </View>
    );
  };

  // Render "All" results
  const renderAllResults = () => {
    const { posts, people, interests, titles } = allResults;
    const hasResults =
      posts.length > 0 ||
      people.length > 0 ||
      interests.length > 0 ||
      titles.length > 0;

    if (!hasResults) return renderEmptyState();

    return (
      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* People Section */}
        {people.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>People</Text>
              <TouchableOpacity onPress={() => setActiveFilter("people")}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {people.slice(0, 3).map((user) => (
              <UserCard key={user.uid} user={user} />
            ))}
          </View>
        )}

        {/* Interests Section */}
        {interests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <TouchableOpacity onPress={() => setActiveFilter("interests")}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.interestChips}>
              {interests.slice(0, 6).map((interest, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.interestChip}
                  onPress={() => {
                    setQuery(interest);
                    setActiveFilter("interests");
                  }}
                >
                  <Text style={styles.interestChipText}>#{interest}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Titles Section */}
        {titles.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Job Titles</Text>
              <TouchableOpacity onPress={() => setActiveFilter("titles")}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {titles.slice(0, 3).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.titleCard}
                onPress={() => {
                  setQuery(item.title);
                  setActiveFilter("titles");
                }}
              >
                <View style={styles.titleIcon}>
                  <Feather name="briefcase" size={20} color="#666" />
                </View>
                <View style={styles.titleInfo}>
                  <Text style={styles.titleText}>{item.title}</Text>
                  <Text style={styles.titleCount}>
                    {item.count} {item.count === 1 ? "person" : "people"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Posts Section */}
        {posts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Posts</Text>
              <TouchableOpacity onPress={() => setActiveFilter("posts")}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {posts.slice(0, 3).map((post) => (
              <PostCard
                key={post.id}
                post={mapPostToCardFormat(post)}
                authorId={post.authorId}
                commentsEnabled={post.commentsEnabled}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  // Render Posts results
  const renderPostsResults = () => {
    if (posts.length === 0) return renderEmptyState();

    return (
      <FlatList
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
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    );
  };

  // Render People results
  const renderPeopleResults = () => {
    if (people.length === 0) return renderEmptyState();

    return (
      <FlatList
        data={people}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => <UserCard user={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    );
  };

  // Render Interests results
  const renderInterestsResults = () => {
    if (interests.topics.length === 0 && interests.posts.length === 0) {
      return renderEmptyState();
    }

    return (
      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Topics */}
        {interests.topics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Matching Topics</Text>
            <View style={styles.interestChips}>
              {interests.topics.map((topic, index) => (
                <TouchableOpacity key={index} style={styles.interestChip}>
                  <Text style={styles.interestChipText}>#{topic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Related Posts */}
        {interests.posts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Posts</Text>
            {interests.posts.map((post) => (
              <PostCard
                key={post.id}
                post={mapPostToCardFormat(post)}
                authorId={post.authorId}
                commentsEnabled={post.commentsEnabled}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  // Render Titles results
  const renderTitlesResults = () => {
    if (titles.length === 0) return renderEmptyState();

    return (
      <FlatList
        data={titles}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.titleSection}>
            <View style={styles.titleSectionHeader}>
              <Feather name="briefcase" size={18} color="#666" />
              <Text style={styles.titleSectionTitle}>{item.title}</Text>
              <Text style={styles.titleSectionCount}>
                ({item.users.length})
              </Text>
            </View>
            {item.users.map((user) => (
              <UserCard key={user.uid} user={user} />
            ))}
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    );
  };

  // Render results based on active filter
  const renderResults = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    switch (activeFilter) {
      case "all":
        return renderAllResults();
      case "posts":
        return renderPostsResults();
      case "people":
        return renderPeopleResults();
      case "interests":
        return renderInterestsResults();
      case "titles":
        return renderTitlesResults();
      default:
        return renderEmptyState();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                activeFilter === tab.key && styles.filterTabActive,
              ]}
              onPress={() => handleFilterChange(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      <View style={styles.resultsWrapper}>{renderResults()}</View>
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: "#000",
  },
  filtersContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  filtersContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: "#000",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterTabTextActive: {
    color: "#fff",
  },
  resultsWrapper: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
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
  },
  section: {
    marginTop: 12,
    backgroundColor: "#fff",
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  interestChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  interestChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  interestChipText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  titleCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleInfo: {
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
  },
  titleCount: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  titleSection: {
    backgroundColor: "#fff",
    marginTop: 12,
    paddingTop: 12,
  },
  titleSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    gap: 8,
  },
  titleSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  titleSectionCount: {
    fontSize: 14,
    color: "#666",
  },
});
