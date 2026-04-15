import { db } from "@/config/firebase";
import firebase from "firebase/compat/app";
import { createNotification } from "./notificationService";

// ─────────────────────────────────────────────────
// Follow a user
// ─────────────────────────────────────────────────
export const followUser = async (
  followerId: string,
  followingId: string,
  followerName?: string,
  followerAvatar?: string
): Promise<{ error: string | null }> => {
  if (followerId === followingId) {
    return { error: "Cannot follow yourself" };
  }

  try {
    const followId = `${followerId}_${followingId}`;
    const followRef = db.collection("follows").doc(followId);
    const followerRef = db.collection("users").doc(followerId);
    const followingRef = db.collection("users").doc(followingId);

    let isNewFollow = false;

    await db.runTransaction(async (transaction) => {
      const followDoc = await transaction.get(followRef);

      if (followDoc.exists) {
        throw new Error("Already following this user");
      }

      isNewFollow = true;

      // Create follow relationship
      transaction.set(followRef, {
        followerId,
        followingId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Update follower's following count
      transaction.update(followerRef, {
        following: firebase.firestore.FieldValue.increment(1),
      });

      // Update following's followers count
      transaction.update(followingRef, {
        followers: firebase.firestore.FieldValue.increment(1),
      });
    });

    // Create notification for the followed user
    if (isNewFollow && followerName) {
      await createNotification({
        recipientId: followingId,
        senderId: followerId,
        senderName: followerName,
        senderAvatar: followerAvatar || "",
        type: "follow",
      });
    }

    return { error: null };
  } catch (error: any) {
    console.error("Follow user error:", error);
    return { error: error.message || "Failed to follow user" };
  }
};

// ─────────────────────────────────────────────────
// Unfollow a user
// ─────────────────────────────────────────────────
export const unfollowUser = async (
  followerId: string,
  followingId: string
): Promise<{ error: string | null }> => {
  try {
    const followId = `${followerId}_${followingId}`;
    const followRef = db.collection("follows").doc(followId);
    const followerRef = db.collection("users").doc(followerId);
    const followingRef = db.collection("users").doc(followingId);

    await db.runTransaction(async (transaction) => {
      const followDoc = await transaction.get(followRef);

      if (!followDoc.exists) {
        throw new Error("Not following this user");
      }

      // Delete follow relationship
      transaction.delete(followRef);

      // Update follower's following count
      transaction.update(followerRef, {
        following: firebase.firestore.FieldValue.increment(-1),
      });

      // Update following's followers count
      transaction.update(followingRef, {
        followers: firebase.firestore.FieldValue.increment(-1),
      });
    });

    return { error: null };
  } catch (error: any) {
    console.error("Unfollow user error:", error);
    return { error: error.message || "Failed to unfollow user" };
  }
};

// ─────────────────────────────────────────────────
// Check if following
// ─────────────────────────────────────────────────
export const checkIfFollowing = async (
  followerId: string,
  followingId: string
): Promise<{ isFollowing: boolean; error: string | null }> => {
  try {
    const followId = `${followerId}_${followingId}`;
    const doc = await db.collection("follows").doc(followId).get();

    return { isFollowing: doc.exists, error: null };
  } catch (error: any) {
    return { isFollowing: false, error: error.message || "Failed to check follow status" };
  }
};

// ─────────────────────────────────────────────────
// Get following IDs (users this person follows)
// ─────────────────────────────────────────────────
export const getFollowingIds = async (
  userId: string
): Promise<{ ids: string[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("follows")
      .where("followerId", "==", userId)
      .get();

    const ids = snapshot.docs.map((doc) => doc.data().followingId);

    return { ids, error: null };
  } catch (error: any) {
    return { ids: [], error: error.message || "Failed to get following" };
  }
};

// ─────────────────────────────────────────────────
// Get follower IDs (users who follow this person)
// ─────────────────────────────────────────────────
export const getFollowerIds = async (
  userId: string
): Promise<{ ids: string[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("follows")
      .where("followingId", "==", userId)
      .get();

    const ids = snapshot.docs.map((doc) => doc.data().followerId);

    return { ids, error: null };
  } catch (error: any) {
    return { ids: [], error: error.message || "Failed to get followers" };
  }
};

// ─────────────────────────────────────────────────
// Subscribe to following (real-time)
// ─────────────────────────────────────────────────
export const subscribeToFollowing = (
  userId: string,
  callback: (followingIds: string[]) => void
): (() => void) => {
  return db
    .collection("follows")
    .where("followerId", "==", userId)
    .onSnapshot(
      (snapshot) => {
        const ids = snapshot.docs.map((doc) => doc.data().followingId);
        callback(ids);
      },
      (error) => {
        // Silently handle permission errors
        if (error?.code !== "permission-denied") {
          console.warn("Following subscription error:", error?.message);
        }
        callback([]);
      }
    );
};

// ─────────────────────────────────────────────────
// Subscribe to followers (real-time)
// ─────────────────────────────────────────────────
export const subscribeToFollowers = (
  userId: string,
  callback: (followerIds: string[]) => void
): (() => void) => {
  return db
    .collection("follows")
    .where("followingId", "==", userId)
    .onSnapshot(
      (snapshot) => {
        const ids = snapshot.docs.map((doc) => doc.data().followerId);
        callback(ids);
      },
      (error) => {
        // Silently handle permission errors
        if (error?.code !== "permission-denied") {
          console.warn("Followers subscription error:", error?.message);
        }
        callback([]);
      }
    );
};

// ─────────────────────────────────────────────────
// Following User Info
// ─────────────────────────────────────────────────
export interface FollowingUser {
  id: string;
  displayName: string;
  photoURL: string;
  title: string;
}

// ─────────────────────────────────────────────────
// Get following users with details
// ─────────────────────────────────────────────────
export const getFollowingUsers = async (
  userId: string
): Promise<{ users: FollowingUser[]; error: string | null }> => {
  try {
    // Get following IDs
    const { ids, error } = await getFollowingIds(userId);
    if (error) return { users: [], error };
    if (ids.length === 0) return { users: [], error: null };

    // Get user details for each following ID
    const users: FollowingUser[] = [];

    // Batch get users (Firestore limits to 10 per 'in' query)
    const batches = [];
    for (let i = 0; i < ids.length; i += 10) {
      batches.push(ids.slice(i, i + 10));
    }

    for (const batch of batches) {
      const snapshot = await db
        .collection("users")
        .where(firebase.firestore.FieldPath.documentId(), "in", batch)
        .get();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          displayName: data.displayName || "User",
          photoURL: data.photoURL || "",
          title: data.title || "",
        });
      });
    }

    return { users, error: null };
  } catch (error: any) {
    console.error("Error getting following users:", error);
    return { users: [], error: error.message || "Failed to get following users" };
  }
};
