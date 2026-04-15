import { db } from "@/config/firebase";
import firebase from "firebase/compat/app";

// ─────────────────────────────────────────────────
// Hide a user's posts ("Not interested")
// ─────────────────────────────────────────────────
export const hideUserPosts = async (
  userId: string,
  hiddenUserId: string
): Promise<{ error: string | null }> => {
  if (userId === hiddenUserId) {
    return { error: "Cannot hide your own posts" };
  }

  try {
    const hideId = `${userId}_${hiddenUserId}`;
    await db.collection("hiddenUsers").doc(hideId).set({
      userId,
      hiddenUserId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return { error: null };
  } catch (error: any) {
    console.error("Hide user error:", error);
    return { error: error.message || "Failed to hide user" };
  }
};

// ─────────────────────────────────────────────────
// Unhide a user's posts
// ─────────────────────────────────────────────────
export const unhideUserPosts = async (
  userId: string,
  hiddenUserId: string
): Promise<{ error: string | null }> => {
  try {
    const hideId = `${userId}_${hiddenUserId}`;
    await db.collection("hiddenUsers").doc(hideId).delete();
    return { error: null };
  } catch (error: any) {
    console.error("Unhide user error:", error);
    return { error: error.message || "Failed to unhide user" };
  }
};

// ─────────────────────────────────────────────────
// Subscribe to hidden users (real-time)
// ─────────────────────────────────────────────────
export const subscribeToHiddenUsers = (
  userId: string,
  callback: (hiddenIds: string[]) => void
): (() => void) => {
  return db
    .collection("hiddenUsers")
    .where("userId", "==", userId)
    .onSnapshot(
      (snapshot) => {
        const ids = snapshot.docs.map((doc) => doc.data().hiddenUserId);
        callback(ids);
      },
      (error) => {
        if (error?.code !== "permission-denied") {
          console.warn("Hidden users subscription error:", error?.message);
        }
        callback([]);
      }
    );
};
