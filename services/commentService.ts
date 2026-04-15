import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { createNotification } from "./notificationService";

const db = firebase.firestore();

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  likesCount: number;
  parentId: string | null;
  repliesCount: number;
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentInput {
  text: string;
}

// Add a comment to a post
export const addComment = async (
  postId: string,
  authorId: string,
  authorName: string,
  authorAvatar: string,
  text: string
): Promise<{ commentId: string | null; error: string | null }> => {
  try {
    const commentRef = db.collection("posts").doc(postId).collection("comments").doc();
    const postRef = db.collection("posts").doc(postId);
    const now = firebase.firestore.FieldValue.serverTimestamp();

    // Get post data for notification
    const postDoc = await postRef.get();
    const postData = postDoc.data();

    await commentRef.set({
      postId,
      authorId,
      authorName,
      authorAvatar,
      text,
      likesCount: 0,
      parentId: null,
      repliesCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Increment comments count on post
    await postRef.update({
      commentsCount: firebase.firestore.FieldValue.increment(1),
    });

    // Create notification if commenter is not the post author
    if (postData && postData.authorId !== authorId) {
      await createNotification({
        recipientId: postData.authorId,
        senderId: authorId,
        senderName: authorName,
        senderAvatar: authorAvatar,
        type: "comment",
        postId: postId,
        postThumbnail: postData.thumbnailUrl || postData.mediaUrl || null,
        commentText: text.length > 50 ? text.substring(0, 50) + "..." : text,
      });
    }

    return { commentId: commentRef.id, error: null };
  } catch (error: any) {
    console.error("Add comment error:", error);
    return { commentId: null, error: error.message };
  }
};

// Add a reply to a comment
export const addReply = async (
  postId: string,
  parentCommentId: string,
  authorId: string,
  authorName: string,
  authorAvatar: string,
  text: string
): Promise<{ replyId: string | null; error: string | null }> => {
  try {
    const replyRef = db.collection("posts").doc(postId).collection("comments").doc();
    const parentCommentRef = db.collection("posts").doc(postId).collection("comments").doc(parentCommentId);
    const postRef = db.collection("posts").doc(postId);
    const now = firebase.firestore.FieldValue.serverTimestamp();

    // Get parent comment data for notification
    const parentCommentDoc = await parentCommentRef.get();
    const parentCommentData = parentCommentDoc.data();

    // Get post data for thumbnail
    const postDoc = await postRef.get();
    const postData = postDoc.data();

    await replyRef.set({
      postId,
      authorId,
      authorName,
      authorAvatar,
      text,
      likesCount: 0,
      parentId: parentCommentId,
      repliesCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Increment replies count on parent comment
    await parentCommentRef.update({
      repliesCount: firebase.firestore.FieldValue.increment(1),
    });

    // Increment comments count on post
    await postRef.update({
      commentsCount: firebase.firestore.FieldValue.increment(1),
    });

    // Create notification if replier is not the comment author
    if (parentCommentData && parentCommentData.authorId !== authorId) {
      await createNotification({
        recipientId: parentCommentData.authorId,
        senderId: authorId,
        senderName: authorName,
        senderAvatar: authorAvatar,
        type: "reply",
        postId: postId,
        postThumbnail: postData?.thumbnailUrl || postData?.mediaUrl || null,
        commentId: parentCommentId,
        commentText: text.length > 50 ? text.substring(0, 50) + "..." : text,
      });
    }

    return { replyId: replyRef.id, error: null };
  } catch (error: any) {
    console.error("Add reply error:", error);
    return { replyId: null, error: error.message };
  }
};

// Delete a comment
export const deleteComment = async (
  postId: string,
  commentId: string
): Promise<{ error: string | null }> => {
  try {
    await db.collection("posts").doc(postId).collection("comments").doc(commentId).delete();

    // Decrement comments count on post
    await db.collection("posts").doc(postId).update({
      commentsCount: firebase.firestore.FieldValue.increment(-1),
    });

    return { error: null };
  } catch (error: any) {
    console.error("Delete comment error:", error);
    return { error: error.message };
  }
};

// Like a comment
export const likeComment = async (
  postId: string,
  commentId: string,
  userId: string
): Promise<{ error: string | null }> => {
  try {
    const likeRef = db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .collection("likes")
      .doc(userId);

    const likeDoc = await likeRef.get();
    if (likeDoc.exists) {
      return { error: "Already liked" };
    }

    await likeRef.set({
      userId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .update({
        likesCount: firebase.firestore.FieldValue.increment(1),
      });

    return { error: null };
  } catch (error: any) {
    console.error("Like comment error:", error);
    return { error: error.message };
  }
};

// Unlike a comment
export const unlikeComment = async (
  postId: string,
  commentId: string,
  userId: string
): Promise<{ error: string | null }> => {
  try {
    await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .collection("likes")
      .doc(userId)
      .delete();

    await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .update({
        likesCount: firebase.firestore.FieldValue.increment(-1),
      });

    return { error: null };
  } catch (error: any) {
    console.error("Unlike comment error:", error);
    return { error: error.message };
  }
};

// Check if user liked a comment
export const hasUserLikedComment = async (
  postId: string,
  commentId: string,
  userId: string
): Promise<boolean> => {
  try {
    const likeDoc = await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId)
      .collection("likes")
      .doc(userId)
      .get();
    return likeDoc.exists;
  } catch (error) {
    console.error("Check comment like error:", error);
    return false;
  }
};

// Subscribe to comments for a post (real-time)
export const subscribeToComments = (
  postId: string,
  callback: (comments: Comment[]) => void
): (() => void) => {
  return db
    .collection("posts")
    .doc(postId)
    .collection("comments")
    .orderBy("createdAt", "asc")
    .onSnapshot(
      (snapshot) => {
        const allComments: Comment[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            postId: data.postId,
            authorId: data.authorId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar,
            text: data.text,
            likesCount: data.likesCount || 0,
            parentId: data.parentId || null,
            repliesCount: data.repliesCount || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
        });

        // Organize comments: parent comments with their replies nested
        const parentComments = allComments.filter((c) => !c.parentId);
        const replies = allComments.filter((c) => c.parentId);

        const commentsWithReplies = parentComments.map((parent) => ({
          ...parent,
          replies: replies.filter((r) => r.parentId === parent.id),
        }));

        // Sort parent comments by newest first
        commentsWithReplies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        callback(commentsWithReplies);
      },
      (error) => {
        console.error("Comments subscription error:", error);
        callback([]);
      }
    );
};

// Get comments count for a post
export const getCommentsCount = async (postId: string): Promise<number> => {
  try {
    const snapshot = await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .get();
    return snapshot.size;
  } catch (error) {
    console.error("Get comments count error:", error);
    return 0;
  }
};
