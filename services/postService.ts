import { db } from "@/config/firebase";
import { CreatePostInput, Post, toDate } from "@/constants/types";
import firebase from "firebase/compat/app";
import { createNotification } from "./notificationService";
import { notifyMatchedUsers } from "./jobMatchingService";

// ─────────────────────────────────────────────────
// Create a new post
// ─────────────────────────────────────────────────
export const createPost = async (
  authorId: string,
  authorName: string,
  authorAvatar: string,
  authorTitle: string,
  input: CreatePostInput
): Promise<{ postId?: string; error: string | null }> => {
  try {
    const postRef = db.collection("posts").doc();
    const now = firebase.firestore.FieldValue.serverTimestamp();

    const postData = {
      id: postRef.id,
      authorId,
      authorName,
      authorAvatar,
      authorTitle,
      caption: input.caption || "",
      mediaUrl: input.mediaUrl || null,
      mediaType: input.mediaType || null,
      thumbnailUrl: input.thumbnailUrl || null,
      title: input.title || "",
      url: input.url || "",
      location: input.location || "",
      topics: input.topics || [],
      visibility: input.visibility || "Public",
      commentsEnabled: input.commentsEnabled ?? true,
      // Job-specific fields
      isJobPost: input.isJobPost || false,
      jobType: input.jobType || null,
      salaryMin: input.salaryMin || null,
      salaryMax: input.salaryMax || null,
      salaryCurrency: input.salaryCurrency || null,
      companyName: input.companyName || null,
      requirements: input.requirements || [],
      experienceLevel: input.experienceLevel || null,
      applicationUrl: input.applicationUrl || null,
      applicationDeadline: input.applicationDeadline || null,
      likesCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await postRef.set(postData);

    // If this is a job post, notify matched users
    if (input.isJobPost && input.visibility === "Public") {
      // Create a Post object for matching (with dates)
      const jobPost: Post = {
        ...postData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Post;

      // Notify matched users asynchronously (don't block post creation)
      notifyMatchedUsers(jobPost, authorName, authorAvatar).then(({ notifiedCount }) => {
        if (notifiedCount > 0) {
          console.log(`Job post matched and notified ${notifiedCount} users`);
        }
      });
    }

    return { postId: postRef.id, error: null };
  } catch (error: any) {
    console.error("Create post error:", error);
    return { error: error.message || "Failed to create post" };
  }
};

// ─────────────────────────────────────────────────
// Get post by ID
// ─────────────────────────────────────────────────
export const getPostById = async (
  postId: string
): Promise<{ post: Post | null; error: string | null }> => {
  try {
    const doc = await db.collection("posts").doc(postId).get();

    if (!doc.exists) {
      return { post: null, error: "Post not found" };
    }

    const data = doc.data()!;
    const post: Post = {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Post;

    return { post, error: null };
  } catch (error: any) {
    return { post: null, error: error.message || "Failed to get post" };
  }
};

// ─────────────────────────────────────────────────
// Get posts by user
// ─────────────────────────────────────────────────
export const getPostsByUser = async (
  userId: string,
  limit = 20
): Promise<{ posts: Post[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("posts")
      .where("authorId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const posts: Post[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Post;
    });

    return { posts, error: null };
  } catch (error: any) {
    return { posts: [], error: error.message || "Failed to get posts" };
  }
};

// ─────────────────────────────────────────────────
// Get public posts by user (for public profile)
// ─────────────────────────────────────────────────
export const getPublicPostsByUser = async (
  userId: string,
  limit = 20
): Promise<{ posts: Post[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("posts")
      .where("authorId", "==", userId)
      .where("visibility", "==", "Public")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const posts: Post[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Post;
    });

    return { posts, error: null };
  } catch (error: any) {
    return { posts: [], error: error.message || "Failed to get public posts" };
  }
};

// ─────────────────────────────────────────────────
// Get video posts (Reels/Shorts)
// ─────────────────────────────────────────────────
export const getVideoPosts = async (
  limit = 20
): Promise<{ posts: Post[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("posts")
      .where("mediaType", "==", "video")
      .where("visibility", "==", "Public")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const posts: Post[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Post;
    });

    return { posts, error: null };
  } catch (error: any) {
    return { posts: [], error: error.message || "Failed to get video posts" };
  }
};

// ─────────────────────────────────────────────────
// Update post
// ─────────────────────────────────────────────────
export const updatePost = async (
  postId: string,
  updates: Partial<Post>
): Promise<{ error: string | null }> => {
  try {
    await db
      .collection("posts")
      .doc(postId)
      .update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to update post" };
  }
};

// ─────────────────────────────────────────────────
// Delete post
// ─────────────────────────────────────────────────
export const deletePost = async (
  postId: string
): Promise<{ error: string | null }> => {
  try {
    await db.collection("posts").doc(postId).delete();
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to delete post" };
  }
};

// ─────────────────────────────────────────────────
// Like a post
// ─────────────────────────────────────────────────
export const likePost = async (
  postId: string,
  userId: string,
  userName: string,
  userAvatar: string
): Promise<{ error: string | null }> => {
  try {
    const likeRef = db.collection("posts").doc(postId).collection("likes").doc(userId);
    const postRef = db.collection("posts").doc(postId);

    let isNewLike = false;
    let postData: any = null;

    await db.runTransaction(async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
      const postDoc = await transaction.get(postRef);

      if (!likeDoc.exists) {
        isNewLike = true;
        postData = postDoc.data();

        transaction.set(likeRef, {
          userId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        transaction.update(postRef, {
          likesCount: firebase.firestore.FieldValue.increment(1),
        });
      }
    });

    // Create notification if it was a new like and user is not the post author
    if (isNewLike && postData && postData.authorId !== userId) {
      await createNotification({
        recipientId: postData.authorId,
        senderId: userId,
        senderName: userName,
        senderAvatar: userAvatar,
        type: "like",
        postId: postId,
        postThumbnail: postData.thumbnailUrl || postData.mediaUrl || null,
      });
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to like post" };
  }
};

// ─────────────────────────────────────────────────
// Unlike a post
// ─────────────────────────────────────────────────
export const unlikePost = async (
  postId: string,
  userId: string
): Promise<{ error: string | null }> => {
  try {
    const likeRef = db.collection("posts").doc(postId).collection("likes").doc(userId);
    const postRef = db.collection("posts").doc(postId);

    await db.runTransaction(async (transaction) => {
      const likeDoc = await transaction.get(likeRef);

      if (likeDoc.exists) {
        transaction.delete(likeRef);
        transaction.update(postRef, {
          likesCount: firebase.firestore.FieldValue.increment(-1),
        });
      }
    });

    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to unlike post" };
  }
};

// ─────────────────────────────────────────────────
// Check if user liked a post
// ─────────────────────────────────────────────────
export const checkIfLiked = async (
  postId: string,
  userId: string
): Promise<{ isLiked: boolean; error: string | null }> => {
  try {
    const likeDoc = await db
      .collection("posts")
      .doc(postId)
      .collection("likes")
      .doc(userId)
      .get();

    return { isLiked: likeDoc.exists, error: null };
  } catch (error: any) {
    return { isLiked: false, error: error.message || "Failed to check like" };
  }
};

// ─────────────────────────────────────────────────
// Subscribe to feed (real-time)
// ─────────────────────────────────────────────────
export const subscribeToFeed = (
  userId: string,
  followingIds: string[],
  blockedUserIds: string[],
  callback: (posts: Post[]) => void
): (() => void) => {
  // Get all users we can see posts from (following + self)
  const visibleUserIds = [...followingIds, userId];

  // Remove blocked users
  const filteredUserIds = visibleUserIds.filter(
    (id) => !blockedUserIds.includes(id)
  );

  // We need multiple queries to handle the feed properly
  const unsubscribers: (() => void)[] = [];
  let publicPosts: Post[] = [];
  let followingPosts: Post[] = [];

  // Query 1: Public posts from non-blocked users (limited to recent)
  const publicQuery = db
    .collection("posts")
    .where("visibility", "==", "Public")
    .orderBy("createdAt", "desc")
    .limit(50);

  const unsubPublic = publicQuery.onSnapshot(
    (snapshot) => {
      publicPosts = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as Post;
        })
        .filter((post) => !blockedUserIds.includes(post.authorId));

      mergeFeed();
    },
    (error) => {
      // Silently handle permission errors
      if (error?.code !== "permission-denied") {
        console.warn("Public feed error:", error?.message);
      }
    }
  );
  unsubscribers.push(unsubPublic);

  // Query 2: Posts from following (including "Followers only")
  if (filteredUserIds.length > 0) {
    // Firestore "in" query limited to 10 items, so we chunk
    const chunks = chunkArray(filteredUserIds, 10);

    chunks.forEach((chunk) => {
      const followingQuery = db
        .collection("posts")
        .where("authorId", "in", chunk)
        .orderBy("createdAt", "desc")
        .limit(30);

      const unsubFollowing = followingQuery.onSnapshot(
        (snapshot) => {
          const chunkPosts = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt),
            } as Post;
          });

          // Filter: can see all own posts, followers-only from following, public from anyone
          followingPosts = chunkPosts.filter((post) => {
            if (post.authorId === userId) return true;
            if (post.visibility === "Private") return false;
            if (post.visibility === "Followers only") {
              return followingIds.includes(post.authorId);
            }
            return true;
          });

          mergeFeed();
        },
        (error) => {
          // Silently handle permission errors
          if (error?.code !== "permission-denied") {
            console.warn("Following feed error:", error?.message);
          }
        }
      );
      unsubscribers.push(unsubFollowing);
    });
  }

  // Merge and deduplicate posts
  const mergeFeed = () => {
    const allPosts = [...publicPosts, ...followingPosts];
    const uniquePosts = Array.from(
      new Map(allPosts.map((p) => [p.id, p])).values()
    );
    const sortedPosts = uniquePosts.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    callback(sortedPosts);
  };

  // Return cleanup function
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
};

// ─────────────────────────────────────────────────
// Helper: chunk array
// ─────────────────────────────────────────────────
const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// ─────────────────────────────────────────────────
// Subscribe to single post (real-time)
// ─────────────────────────────────────────────────
export const subscribeToPost = (
  postId: string,
  callback: (post: Post | null) => void
): (() => void) => {
  return db
    .collection("posts")
    .doc(postId)
    .onSnapshot(
      (doc) => {
        if (doc.exists) {
          const data = doc.data()!;
          callback({
            ...data,
            id: doc.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as Post);
        } else {
          callback(null);
        }
      },
      (error) => {
        // Silently handle permission errors
        if (error?.code !== "permission-denied") {
          console.warn("Post subscription error:", error?.message);
        }
        callback(null);
      }
    );
};
