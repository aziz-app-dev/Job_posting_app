import { db, auth } from "@/config/firebase";
import firebase from "firebase/compat/app";
import { createPost } from "./postService";
import { deleteDraft, getDraftById } from "./draftService";
import { uploadMediaToCloudinary } from "./cloundinary_services";
import type { Draft } from "@/constants/types";

const SCHEDULED_COLLECTION = "scheduled_posts";
const FOREGROUND_INTERVAL_MS = 60_000;

let foregroundInterval: ReturnType<typeof setInterval> | null = null;

export function startForegroundScheduler() {
  if (foregroundInterval) return;
  foregroundInterval = setInterval(async () => {
    try {
      await publishDueScheduledPosts();
    } catch {}
  }, FOREGROUND_INTERVAL_MS);
}

export function stopForegroundScheduler() {
  if (foregroundInterval) {
    clearInterval(foregroundInterval);
    foregroundInterval = null;
  }
}

export async function schedulePost(draftId: string, publishAt: Date): Promise<{ error: string | null }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return { error: "Not authenticated" };

    await db.collection(SCHEDULED_COLLECTION).doc(draftId).set({
      draftId,
      authorId: currentUser.uid,
      publishAt: firebase.firestore.Timestamp.fromDate(publishAt),
      status: "scheduled",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to schedule post" };
  }
}

export async function cancelScheduledPost(draftId: string): Promise<{ error: string | null }> {
  try {
    const doc = await db.collection(SCHEDULED_COLLECTION).doc(draftId).get();
    if (doc.exists) {
      await db.collection(SCHEDULED_COLLECTION).doc(draftId).delete();
    }
    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to cancel scheduled post" };
  }
}

export async function uploadDraftMedia(draft: Draft): Promise<{ url: string | null; error: string | null }> {
  if (!draft.localMediaUri) return { url: null, error: null };
  try {
    const { url, error } = await uploadMediaToCloudinary(draft.localMediaUri, draft.mediaType || "image");
    if (error || !url) return { url: null, error: error || "Upload failed" };
    return { url, error: null };
  } catch (error: any) {
    return { url: null, error: error.message || "Upload failed" };
  }
}

export async function publishScheduledPost(draftId: string): Promise<{ error: string | null }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return { error: "Not authenticated" };

    const { draft, error: draftError } = await getDraftById(draftId);
    if (draftError || !draft) return { error: draftError || "Draft not found" };

    let mediaUrl: string | null = (draft as any).remoteMediaUrl || null;
    if (!mediaUrl && draft.localMediaUri) {
      const { url } = await uploadDraftMedia(draft);
      mediaUrl = url;
    }

    const { error: postError } = await createPost(
      currentUser.uid,
      draft.authorId,
      "",
      "",
      {
        caption: draft.caption,
        mediaUrl,
        mediaType: mediaUrl ? draft.mediaType : null,
        title: draft.title,
        url: draft.url,
        location: draft.location,
        topics: draft.topics,
        visibility: draft.visibility,
        commentsEnabled: draft.commentsEnabled,
      }
    );

    if (postError) return { error: postError };

    await deleteDraft(draftId);
    await db.collection(SCHEDULED_COLLECTION).doc(draftId).delete();

    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to publish scheduled post" };
  }
}

export async function publishDueScheduledPosts(): Promise<void> {
  try {
    const now = firebase.firestore.Timestamp.now();
    const snapshot = await db
      .collection(SCHEDULED_COLLECTION)
      .where("status", "==", "scheduled")
      .where("publishAt", "<=", now)
      .get();

    const results = snapshot.docs.map(async (doc) => {
      await publishScheduledPost(doc.id);
    });

    await Promise.allSettled(results);
  } catch (error) {
    console.log("[postScheduler] publishDueScheduledPosts error:", error);
  }
}
