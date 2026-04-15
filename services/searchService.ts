import { db } from "@/config/firebase";
import { Post, toDate } from "@/constants/types";
import { UserProfile } from "./userService";

export interface SearchResults {
  posts: Post[];
  people: UserProfile[];
  interests: string[];
  titles: { title: string; count: number; users: UserProfile[] }[];
}

// Search posts by query (searches in caption, title, topics)
export const searchPosts = async (
  query: string,
  limit = 30
): Promise<{ posts: Post[]; error: string | null }> => {
  try {
    if (!query.trim()) {
      return { posts: [], error: null };
    }

    const queryLower = query.toLowerCase();

    // Get all public posts and filter client-side
    // (Firestore doesn't support full-text search natively)
    const snapshot = await db
      .collection("posts")
      .where("visibility", "==", "Public")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const posts: Post[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Post;
      })
      .filter((post) => {
        const captionMatch = post.caption?.toLowerCase().includes(queryLower);
        const titleMatch = post.title?.toLowerCase().includes(queryLower);
        const topicsMatch = post.topics?.some((t) =>
          t.toLowerCase().includes(queryLower)
        );
        const authorMatch = post.authorName?.toLowerCase().includes(queryLower);
        return captionMatch || titleMatch || topicsMatch || authorMatch;
      })
      .slice(0, limit);

    return { posts, error: null };
  } catch (error: any) {
    return { posts: [], error: error.message || "Failed to search posts" };
  }
};

// Search people by name, username, or title
export const searchPeople = async (
  query: string,
  limit = 30
): Promise<{ people: UserProfile[]; error: string | null }> => {
  try {
    if (!query.trim()) {
      return { people: [], error: null };
    }

    const queryLower = query.toLowerCase();

    // Get users and filter client-side
    const snapshot = await db
      .collection("users")
      .where("privacy", "!=", "Private")
      .limit(100)
      .get();

    const people: UserProfile[] = snapshot.docs
      .map((doc) => doc.data() as UserProfile)
      .filter((user) => {
        const nameMatch = user.displayName?.toLowerCase().includes(queryLower);
        const titleMatch = user.title?.toLowerCase().includes(queryLower);
        const bioMatch = user.bio?.toLowerCase().includes(queryLower);
        return nameMatch || titleMatch || bioMatch;
      })
      .slice(0, limit);

    return { people, error: null };
  } catch (error: any) {
    return { people: [], error: error.message || "Failed to search people" };
  }
};

// Search by interests/topics
export const searchByInterests = async (
  query: string,
  limit = 30
): Promise<{
  interests: string[];
  posts: Post[];
  error: string | null;
}> => {
  try {
    if (!query.trim()) {
      return { interests: [], posts: [], error: null };
    }

    const queryLower = query.toLowerCase();

    // Get posts with topics that match
    const snapshot = await db
      .collection("posts")
      .where("visibility", "==", "Public")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const allTopics = new Set<string>();
    const matchingPosts: Post[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const post = {
        ...data,
        id: doc.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Post;

      // Collect all matching topics
      post.topics?.forEach((topic) => {
        if (topic.toLowerCase().includes(queryLower)) {
          allTopics.add(topic);
          matchingPosts.push(post);
        }
      });
    });

    // Remove duplicates from posts
    const uniquePosts = Array.from(
      new Map(matchingPosts.map((p) => [p.id, p])).values()
    ).slice(0, limit);

    return {
      interests: Array.from(allTopics),
      posts: uniquePosts,
      error: null,
    };
  } catch (error: any) {
    return {
      interests: [],
      posts: [],
      error: error.message || "Failed to search interests",
    };
  }
};

// Search by job titles
export const searchByTitles = async (
  query: string,
  limit = 30
): Promise<{
  titles: { title: string; users: UserProfile[] }[];
  error: string | null;
}> => {
  try {
    if (!query.trim()) {
      return { titles: [], error: null };
    }

    const queryLower = query.toLowerCase();

    // Get users with matching titles
    const snapshot = await db
      .collection("users")
      .where("privacy", "!=", "Private")
      .limit(100)
      .get();

    const titleMap = new Map<string, UserProfile[]>();

    snapshot.docs.forEach((doc) => {
      const user = doc.data() as UserProfile;
      if (user.title && user.title.toLowerCase().includes(queryLower)) {
        const existing = titleMap.get(user.title) || [];
        existing.push(user);
        titleMap.set(user.title, existing);
      }
    });

    const titles = Array.from(titleMap.entries())
      .map(([title, users]) => ({ title, users }))
      .sort((a, b) => b.users.length - a.users.length)
      .slice(0, limit);

    return { titles, error: null };
  } catch (error: any) {
    return { titles: [], error: error.message || "Failed to search titles" };
  }
};

// Combined search - get all results at once
export const searchAll = async (
  query: string
): Promise<{ results: SearchResults; error: string | null }> => {
  try {
    const [postsResult, peopleResult, interestsResult, titlesResult] =
      await Promise.all([
        searchPosts(query, 20),
        searchPeople(query, 20),
        searchByInterests(query, 20),
        searchByTitles(query, 20),
      ]);

    return {
      results: {
        posts: postsResult.posts,
        people: peopleResult.people,
        interests: interestsResult.interests,
        titles: titlesResult.titles.map((t) => ({
          ...t,
          count: t.users.length,
        })),
      },
      error: null,
    };
  } catch (error: any) {
    return {
      results: { posts: [], people: [], interests: [], titles: [] },
      error: error.message || "Search failed",
    };
  }
};
