import { db } from "@/config/firebase";
import { CreateNotificationInput, Notification, toDate } from "@/constants/types";
import firebase from "firebase/compat/app";

// ─────────────────────────────────────────────────
// Create a notification
// ─────────────────────────────────────────────────
export const createNotification = async (
  input: CreateNotificationInput
): Promise<{ notificationId?: string; error: string | null }> => {
  // Don't create notification if sender is the recipient
  if (input.senderId === input.recipientId) {
    return { error: null };
  }

  try {
    const notificationRef = db.collection("notifications").doc();
    const now = firebase.firestore.FieldValue.serverTimestamp();

    const notificationData = {
      id: notificationRef.id,
      recipientId: input.recipientId,
      senderId: input.senderId,
      senderName: input.senderName,
      senderAvatar: input.senderAvatar,
      type: input.type,
      postId: input.postId || null,
      postThumbnail: input.postThumbnail || null,
      commentId: input.commentId || null,
      commentText: input.commentText || null,
      // Job match specific fields
      jobTitle: input.jobTitle || null,
      companyName: input.companyName || null,
      matchReason: input.matchReason || null,
      isRead: false,
      createdAt: now,
    };

    await notificationRef.set(notificationData);

    return { notificationId: notificationRef.id, error: null };
  } catch (error: any) {
    console.error("Create notification error:", error);
    return { error: error.message || "Failed to create notification" };
  }
};

// ─────────────────────────────────────────────────
// Mark a notification as read
// ─────────────────────────────────────────────────
export const markNotificationAsRead = async (
  notificationId: string
): Promise<{ error: string | null }> => {
  try {
    await db.collection("notifications").doc(notificationId).update({
      isRead: true,
    });

    return { error: null };
  } catch (error: any) {
    console.error("Mark notification as read error:", error);
    return { error: error.message || "Failed to mark notification as read" };
  }
};

// ─────────────────────────────────────────────────
// Mark all notifications as read for a user
// ─────────────────────────────────────────────────
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<{ error: string | null }> => {
  try {
    const snapshot = await db
      .collection("notifications")
      .where("recipientId", "==", userId)
      .where("isRead", "==", false)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();

    return { error: null };
  } catch (error: any) {
    console.error("Mark all notifications as read error:", error);
    return { error: error.message || "Failed to mark all notifications as read" };
  }
};

// ─────────────────────────────────────────────────
// Delete a notification
// ─────────────────────────────────────────────────
export const deleteNotification = async (
  notificationId: string
): Promise<{ error: string | null }> => {
  try {
    await db.collection("notifications").doc(notificationId).delete();

    return { error: null };
  } catch (error: any) {
    console.error("Delete notification error:", error);
    return { error: error.message || "Failed to delete notification" };
  }
};

// ─────────────────────────────────────────────────
// Subscribe to notifications (real-time)
// ─────────────────────────────────────────────────
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  return db
    .collection("notifications")
    .where("recipientId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(50)
    .onSnapshot(
      (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            recipientId: data.recipientId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            type: data.type,
            postId: data.postId,
            postThumbnail: data.postThumbnail,
            commentId: data.commentId,
            commentText: data.commentText,
            // Job match specific fields
            jobTitle: data.jobTitle,
            companyName: data.companyName,
            matchReason: data.matchReason,
            isRead: data.isRead,
            createdAt: toDate(data.createdAt),
          };
        });
        callback(notifications);
      },
      (error) => {
        // Silently handle permission errors
        if (error?.code !== "permission-denied") {
          console.warn("Notifications subscription error:", error?.message);
        }
        callback([]);
      }
    );
};

// ─────────────────────────────────────────────────
// Get unread notification count (real-time)
// ─────────────────────────────────────────────────
export const subscribeToUnreadCount = (
  userId: string,
  callback: (count: number) => void
): (() => void) => {
  return db
    .collection("notifications")
    .where("recipientId", "==", userId)
    .where("isRead", "==", false)
    .onSnapshot(
      (snapshot) => {
        callback(snapshot.size);
      },
      (error) => {
        // Silently handle permission errors
        if (error?.code !== "permission-denied") {
          console.warn("Unread count subscription error:", error?.message);
        }
        callback(0);
      }
    );
};
