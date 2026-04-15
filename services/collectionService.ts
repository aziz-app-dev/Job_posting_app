import { db } from "@/config/firebase";
import { Collection, CreateCollectionInput, toDate } from "@/constants/types";
import firebase from "firebase/compat/app";

// ─────────────────────────────────────────────────
// Create a new collection
// ─────────────────────────────────────────────────
export const createCollection = async (
  userId: string,
  input: CreateCollectionInput
): Promise<{ collectionId?: string; error: string | null }> => {
  try {
    const collectionRef = db.collection("collections").doc();
    const now = firebase.firestore.FieldValue.serverTimestamp();

    const collectionData = {
      id: collectionRef.id,
      userId,
      name: input.name,
      description: input.description || "",
      postIds: [],
      coverImageUrl: null,
      createdAt: now,
      updatedAt: now,
    };

    await collectionRef.set(collectionData);

    return { collectionId: collectionRef.id, error: null };
  } catch (error: any) {
    console.error("Create collection error:", error);
    return { error: error.message || "Failed to create collection" };
  }
};

// ─────────────────────────────────────────────────
// Get all collections for a user
// ─────────────────────────────────────────────────
export const getCollections = async (
  userId: string
): Promise<{ collections: Collection[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("collections")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .get();

    const collections: Collection[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Collection;
    });

    return { collections, error: null };
  } catch (error: any) {
    console.error("Get collections error:", error);
    return { collections: [], error: error.message || "Failed to get collections" };
  }
};

// ─────────────────────────────────────────────────
// Subscribe to collections (real-time)
// ─────────────────────────────────────────────────
export const subscribeToCollections = (
  userId: string,
  callback: (collections: Collection[]) => void
): (() => void) => {
  return db
    .collection("collections")
    .where("userId", "==", userId)
    .orderBy("updatedAt", "desc")
    .onSnapshot(
      (snapshot) => {
        const collections: Collection[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as Collection;
        });
        callback(collections);
      },
      (error) => {
        // Silently handle permission errors
        if (error?.code !== "permission-denied") {
          console.warn("Collections subscription error:", error?.message);
        }
        callback([]);
      }
    );
};

// ─────────────────────────────────────────────────
// Add post to collection
// ─────────────────────────────────────────────────
export const addPostToCollection = async (
  collectionId: string,
  postId: string,
  postImageUrl?: string | null
): Promise<{ error: string | null }> => {
  try {
    const collectionRef = db.collection("collections").doc(collectionId);

    const updateData: any = {
      postIds: firebase.firestore.FieldValue.arrayUnion(postId),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Update cover image if this is the first post or no cover exists
    const collectionDoc = await collectionRef.get();
    if (collectionDoc.exists) {
      const data = collectionDoc.data();
      if (!data?.coverImageUrl && postImageUrl) {
        updateData.coverImageUrl = postImageUrl;
      }
    }

    await collectionRef.update(updateData);

    return { error: null };
  } catch (error: any) {
    console.error("Add post to collection error:", error);
    return { error: error.message || "Failed to add post to collection" };
  }
};

// ─────────────────────────────────────────────────
// Remove post from collection
// ─────────────────────────────────────────────────
export const removePostFromCollection = async (
  collectionId: string,
  postId: string
): Promise<{ error: string | null }> => {
  try {
    await db
      .collection("collections")
      .doc(collectionId)
      .update({
        postIds: firebase.firestore.FieldValue.arrayRemove(postId),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

    return { error: null };
  } catch (error: any) {
    console.error("Remove post from collection error:", error);
    return { error: error.message || "Failed to remove post from collection" };
  }
};

// ─────────────────────────────────────────────────
// Delete collection
// ─────────────────────────────────────────────────
export const deleteCollection = async (
  collectionId: string
): Promise<{ error: string | null }> => {
  try {
    await db.collection("collections").doc(collectionId).delete();
    return { error: null };
  } catch (error: any) {
    console.error("Delete collection error:", error);
    return { error: error.message || "Failed to delete collection" };
  }
};

// ─────────────────────────────────────────────────
// Update collection
// ─────────────────────────────────────────────────
export const updateCollection = async (
  collectionId: string,
  updates: Partial<Pick<Collection, "name" | "description">>
): Promise<{ error: string | null }> => {
  try {
    await db
      .collection("collections")
      .doc(collectionId)
      .update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

    return { error: null };
  } catch (error: any) {
    console.error("Update collection error:", error);
    return { error: error.message || "Failed to update collection" };
  }
};

// ─────────────────────────────────────────────────
// Check if post is in any collection
// ─────────────────────────────────────────────────
export const getCollectionsContainingPost = async (
  userId: string,
  postId: string
): Promise<{ collectionIds: string[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("collections")
      .where("userId", "==", userId)
      .where("postIds", "array-contains", postId)
      .get();

    const collectionIds = snapshot.docs.map((doc) => doc.id);
    return { collectionIds, error: null };
  } catch (error: any) {
    console.error("Get collections containing post error:", error);
    return { collectionIds: [], error: error.message || "Failed to check collections" };
  }
};
