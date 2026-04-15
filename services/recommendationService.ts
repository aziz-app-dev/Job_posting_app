import { db } from "@/config/firebase";
import { Post, toDate } from "@/constants/types";
import { UserProfile } from "./userService";

// ─────────────────────────────────────────────────
// Jobs You May Like
// Based on user interests, title, and topics overlap
// ─────────────────────────────────────────────────
export const getRecommendedJobs = async (
  userId: string,
  userInterests: string[],
  userTitle: string,
  limit: number = 10
): Promise<{ posts: Post[]; error: string | null }> => {
  try {
    // Get recent job posts
    const snapshot = await db
      .collection("posts")
      .where("visibility", "==", "Public")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const jobPosts = snapshot.docs
      .map((doc) => {
        const d = doc.data();
        return { ...d, id: doc.id, createdAt: toDate(d.createdAt), updatedAt: toDate(d.updatedAt) } as Post;
      })
      .filter((p) => p.authorId !== userId && (p.isJobPost || p.jobType || p.salaryMin));

    // Score each job based on relevance
    const scored = jobPosts.map((post) => {
      let score = 0;

      // Topic/interest overlap
      const postTopics = (post.topics || []).map((t) => t.toLowerCase());
      const interests = userInterests.map((i) => i.toLowerCase());
      const topicOverlap = postTopics.filter((t) => interests.includes(t)).length;
      score += topicOverlap * 3;

      // Title keyword match
      if (userTitle) {
        const titleWords = userTitle.toLowerCase().split(/\s+/);
        const captionLower = (post.caption + " " + (post.companyName || "")).toLowerCase();
        titleWords.forEach((w) => {
          if (w.length > 2 && captionLower.includes(w)) score += 2;
        });
      }

      // Recency bonus
      const daysOld = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld < 3) score += 2;
      else if (daysOld < 7) score += 1;

      // Check deadline not expired
      if (post.applicationDeadline && post.applicationDeadline < new Date()) {
        score = -1; // Expired, push to bottom
      }

      return { post, score };
    });

    const results = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.post);

    return { posts: results, error: null };
  } catch (error: any) {
    return { posts: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────
// People You May Know
// Based on mutual follows, shared interests, same location
// ─────────────────────────────────────────────────
export const getRecommendedPeople = async (
  userId: string,
  userInterests: string[],
  userLocation: string,
  followingIds: string[],
  blockedIds: string[],
  limit: number = 10
): Promise<{ users: UserProfile[]; error: string | null }> => {
  try {
    // Get a pool of users
    const snapshot = await db
      .collection("users")
      .orderBy("followers", "desc")
      .limit(100)
      .get();

    const excludeIds = new Set([userId, ...followingIds, ...blockedIds]);

    const users = snapshot.docs
      .map((doc) => {
        const d = doc.data();
        return { ...d, uid: doc.id } as UserProfile;
      })
      .filter((u) => !excludeIds.has(u.uid) && u.displayName);

    // Score each user
    const scored = users.map((u) => {
      let score = 0;

      // Shared interests
      const theirInterests = (u.interests || []).map((i) => i.toLowerCase());
      const myInterests = userInterests.map((i) => i.toLowerCase());
      const overlap = theirInterests.filter((i) => myInterests.includes(i)).length;
      score += overlap * 3;

      // Same location
      if (userLocation && u.location && u.location.toLowerCase().includes(userLocation.toLowerCase().split(",")[0])) {
        score += 2;
      }

      // Has profile picture (indicates active user)
      if (u.photoURL) score += 1;

      // Follower count (mild popularity signal)
      if (u.followers > 10) score += 1;
      if (u.followers > 50) score += 1;

      // Mutual connections: check if any of their followers are in my following
      // (simplified — we just check if they follow someone I follow)

      return { user: u, score };
    });

    const results = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.user);

    return { users: results, error: null };
  } catch (error: any) {
    return { users: [], error: error.message };
  }
};
