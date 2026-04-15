import { db } from "@/config/firebase";
import firebase from "firebase/compat/app";

// ─────────────────────────────────────────────────
// Block a user
// ─────────────────────────────────────────────────
export const blockUser = async (
  blockerId: string,
  blockedId: string
): Promise<{ error: string | null }> => {
  if (blockerId === blockedId) {
    return { error: "Cannot block yourself" };
  }

  try {
    const blockId = `${blockerId}_${blockedId}`;
    const blockRef = db.collection("blocks").doc(blockId);

    const existingBlock = await blockRef.get();
    if (existingBlock.exists) {
      return { error: "User is already blocked" };
    }

    await blockRef.set({
      blockerId,
      blockedId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Also unfollow each other if following
    const followId1 = `${blockerId}_${blockedId}`;
    const followId2 = `${blockedId}_${blockerId}`;

    const batch = db.batch();

    // Remove mutual follows
    const follow1Ref = db.collection("follows").doc(followId1);
    const follow2Ref = db.collection("follows").doc(followId2);

    const [follow1, follow2] = await Promise.all([
      follow1Ref.get(),
      follow2Ref.get(),
    ]);

    if (follow1.exists) {
      batch.delete(follow1Ref);
      batch.update(db.collection("users").doc(blockerId), {
        following: firebase.firestore.FieldValue.increment(-1),
      });
      batch.update(db.collection("users").doc(blockedId), {
        followers: firebase.firestore.FieldValue.increment(-1),
      });
    }

    if (follow2.exists) {
      batch.delete(follow2Ref);
      batch.update(db.collection("users").doc(blockedId), {
        following: firebase.firestore.FieldValue.increment(-1),
      });
      batch.update(db.collection("users").doc(blockerId), {
        followers: firebase.firestore.FieldValue.increment(-1),
      });
    }

    await batch.commit();

    return { error: null };
  } catch (error: any) {
    console.error("Block user error:", error);
    return { error: error.message || "Failed to block user" };
  }
};

// ─────────────────────────────────────────────────
// Unblock a user
// ─────────────────────────────────────────────────
export const unblockUser = async (
  blockerId: string,
  blockedId: string
): Promise<{ error: string | null }> => {
  try {
    const blockId = `${blockerId}_${blockedId}`;
    const blockRef = db.collection("blocks").doc(blockId);

    const existingBlock = await blockRef.get();
    if (!existingBlock.exists) {
      return { error: "User is not blocked" };
    }

    await blockRef.delete();

    return { error: null };
  } catch (error: any) {
    console.error("Unblock user error:", error);
    return { error: error.message || "Failed to unblock user" };
  }
};

// ─────────────────────────────────────────────────
// Check if blocked (either direction for mutual block)
// ─────────────────────────────────────────────────
export const checkIfBlocked = async (
  userId1: string,
  userId2: string
): Promise<{ isBlocked: boolean; error: string | null }> => {
  try {
    const blockId1 = `${userId1}_${userId2}`;
    const blockId2 = `${userId2}_${userId1}`;

    const [block1, block2] = await Promise.all([
      db.collection("blocks").doc(blockId1).get(),
      db.collection("blocks").doc(blockId2).get(),
    ]);

    return { isBlocked: block1.exists || block2.exists, error: null };
  } catch (error: any) {
    return { isBlocked: false, error: error.message || "Failed to check block status" };
  }
};

// ─────────────────────────────────────────────────
// Get users I blocked
// ─────────────────────────────────────────────────
export const getBlockedByMeIds = async (
  userId: string
): Promise<{ ids: string[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("blocks")
      .where("blockerId", "==", userId)
      .get();

    const ids = snapshot.docs.map((doc) => doc.data().blockedId);

    return { ids, error: null };
  } catch (error: any) {
    return { ids: [], error: error.message || "Failed to get blocked users" };
  }
};

// ─────────────────────────────────────────────────
// Get users who blocked me
// ─────────────────────────────────────────────────
export const getBlockedMeIds = async (
  userId: string
): Promise<{ ids: string[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("blocks")
      .where("blockedId", "==", userId)
      .get();

    const ids = snapshot.docs.map((doc) => doc.data().blockerId);

    return { ids, error: null };
  } catch (error: any) {
    return { ids: [], error: error.message || "Failed to get blockers" };
  }
};

// ─────────────────────────────────────────────────
// Get all block relations (mutual block - users I blocked + users who blocked me)
// ─────────────────────────────────────────────────
export const getAllBlockedUserIds = async (
  userId: string
): Promise<{ blockedIds: string[]; error: string | null }> => {
  try {
    const [blockedByMe, blockedMe] = await Promise.all([
      getBlockedByMeIds(userId),
      getBlockedMeIds(userId),
    ]);

    if (blockedByMe.error) {
      return { blockedIds: [], error: blockedByMe.error };
    }
    if (blockedMe.error) {
      return { blockedIds: [], error: blockedMe.error };
    }

    // Combine and deduplicate
    const allBlockedIds = [...new Set([...blockedByMe.ids, ...blockedMe.ids])];

    return { blockedIds: allBlockedIds, error: null };
  } catch (error: any) {
    return { blockedIds: [], error: error.message || "Failed to get block relations" };
  }
};

// ─────────────────────────────────────────────────
// Subscribe to all block relations (real-time)
// ─────────────────────────────────────────────────
export const subscribeToBlockRelations = (
  userId: string,
  callback: (blockedIds: string[]) => void
): (() => void) => {
  let blockedByMe: string[] = [];
  let blockedMe: string[] = [];

  const updateCallback = () => {
    const allBlockedIds = [...new Set([...blockedByMe, ...blockedMe])];
    callback(allBlockedIds);
  };

  // Subscribe to users I blocked
  const unsub1 = db
    .collection("blocks")
    .where("blockerId", "==", userId)
    .onSnapshot(
      (snapshot) => {
        blockedByMe = snapshot.docs.map((doc) => doc.data().blockedId);
        updateCallback();
      },
      (error) => {
        // Silently handle permission errors
        if (error?.code !== "permission-denied") {
          console.warn("Blocked by me subscription error:", error?.message);
        }
      }
    );

  // Subscribe to users who blocked me
  const unsub2 = db
    .collection("blocks")
    .where("blockedId", "==", userId)
    .onSnapshot(
      (snapshot) => {
        blockedMe = snapshot.docs.map((doc) => doc.data().blockerId);
        updateCallback();
      },
      (error) => {
        // Silently handle permission errors
        if (error?.code !== "permission-denied") {
          console.warn("Blocked me subscription error:", error?.message);
        }
      }
    );

  return () => {
    unsub1();
    unsub2();
  };
};
