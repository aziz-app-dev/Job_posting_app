import { db } from "@/config/firebase";
import { CreateDraftInput, Draft, toDate } from "@/constants/types";
import firebase from "firebase/compat/app";

// ─────────────────────────────────────────────────
// Save a draft
// ─────────────────────────────────────────────────
export const saveDraft = async (
  authorId: string,
  input: CreateDraftInput
): Promise<{ draftId?: string; error: string | null }> => {
  try {
    const draftRef = db.collection("drafts").doc();
    const now = firebase.firestore.FieldValue.serverTimestamp();

    const draftData = {
      id: draftRef.id,
      authorId,
      caption: input.caption || "",
      localMediaUri: input.localMediaUri || null,
      mediaType: input.mediaType || null,
      title: input.title || "",
      url: input.url || "",
      location: input.location || "",
      topics: input.topics || [],
      visibility: input.visibility || "Public",
      commentsEnabled: input.commentsEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    };

    await draftRef.set(draftData);

    return { draftId: draftRef.id, error: null };
  } catch (error: any) {
    console.error("Save draft error:", error);
    return { error: error.message || "Failed to save draft" };
  }
};

// ─────────────────────────────────────────────────
// Get drafts for user
// ─────────────────────────────────────────────────
export const getDrafts = async (
  userId: string
): Promise<{ drafts: Draft[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("drafts")
      .where("authorId", "==", userId)
      .orderBy("updatedAt", "desc")
      .get();

    const drafts: Draft[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Draft;
    });

    return { drafts, error: null };
  } catch (error: any) {
    // Silently handle permission errors
    if (error?.code === "permission-denied") {
      return { drafts: [], error: error.message };
    }
    // Check if error is about missing index
    if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
      console.warn("Firestore index required for 'drafts' collection");
    }
    return { drafts: [], error: error.message || "Failed to get drafts" };
  }
};

// ─────────────────────────────────────────────────
// Get draft by ID
// ─────────────────────────────────────────────────
export const getDraftById = async (
  draftId: string
): Promise<{ draft: Draft | null; error: string | null }> => {
  try {
    const doc = await db.collection("drafts").doc(draftId).get();

    if (!doc.exists) {
      return { draft: null, error: "Draft not found" };
    }

    const data = doc.data()!;
    const draft: Draft = {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Draft;

    return { draft, error: null };
  } catch (error: any) {
    return { draft: null, error: error.message || "Failed to get draft" };
  }
};

// ─────────────────────────────────────────────────
// Update draft
// ─────────────────────────────────────────────────
export const updateDraft = async (
  draftId: string,
  updates: Partial<Draft>
): Promise<{ error: string | null }> => {
  try {
    await db
      .collection("drafts")
      .doc(draftId)
      .update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to update draft" };
  }
};

// ─────────────────────────────────────────────────
// Delete draft
// ─────────────────────────────────────────────────
export const deleteDraft = async (
  draftId: string
): Promise<{ error: string | null }> => {
  try {
    await db.collection("drafts").doc(draftId).delete();
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to delete draft" };
  }
};

// ─────────────────────────────────────────────────
// Subscribe to drafts (real-time)
// ─────────────────────────────────────────────────
export const subscribeToDrafts = (
  userId: string,
  callback: (drafts: Draft[]) => void
): (() => void) => {
  return db
    .collection("drafts")
    .where("authorId", "==", userId)
    .orderBy("updatedAt", "desc")
    .onSnapshot(
      (snapshot) => {
        const drafts: Draft[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as Draft;
        });
        callback(drafts);
      },
      (error) => {
        // Silently handle permission errors
        if (error?.code === "permission-denied") {
          callback([]);
          return;
        }
        // Check if error is about missing index
        if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
          console.warn(
            "Firestore index required for 'drafts' collection. " +
            "Fields: authorId (Ascending), updatedAt (Descending)"
          );
        } else {
          console.warn("Drafts subscription error:", error?.message);
        }
        callback([]);
      }
    );
};
