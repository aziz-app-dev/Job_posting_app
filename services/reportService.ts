import { db } from "@/config/firebase";
import firebase from "firebase/compat/app";

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "misinformation"
  | "other";

// ─────────────────────────────────────────────────
// Report a post
// ─────────────────────────────────────────────────
export const reportPost = async (
  reporterId: string,
  postId: string,
  postAuthorId: string,
  reason: ReportReason,
  details?: string
): Promise<{ error: string | null }> => {
  try {
    const reportRef = db.collection("reports").doc();

    await reportRef.set({
      id: reportRef.id,
      reporterId,
      postId,
      postAuthorId,
      reason,
      details: details || "",
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return { error: null };
  } catch (error: any) {
    console.error("Report post error:", error);
    return { error: error.message || "Failed to report post" };
  }
};

// ─────────────────────────────────────────────────
// Report a user
// ─────────────────────────────────────────────────
export const reportUser = async (
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
  details?: string
): Promise<{ error: string | null }> => {
  try {
    const reportRef = db.collection("reports").doc();

    await reportRef.set({
      id: reportRef.id,
      reporterId,
      reportedUserId,
      reason,
      details: details || "",
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return { error: null };
  } catch (error: any) {
    console.error("Report user error:", error);
    return { error: error.message || "Failed to report user" };
  }
};
