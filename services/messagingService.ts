import { db } from "@/config/firebase";
import { Conversation, Message, toDate } from "@/constants/types";
import firebase from "firebase/compat/app";

// ─────────────────────────────────────────────────
// Get or Create Conversation
// ─────────────────────────────────────────────────
export const getOrCreateConversation = async (
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar: string,
  currentUserTitle: string,
  otherUserId: string,
  otherUserName: string,
  otherUserAvatar: string,
  otherUserTitle: string
): Promise<{ conversationId: string | null; error: string | null }> => {
  try {
    // Check if conversation already exists between these two users
    const snapshot = await db
      .collection("conversations")
      .where("participantIds", "array-contains", currentUserId)
      .get();

    const existing = snapshot.docs.find((doc) => {
      const data = doc.data();
      return data.participantIds.includes(otherUserId);
    });

    if (existing) {
      return { conversationId: existing.id, error: null };
    }

    // Create new conversation
    const now = firebase.firestore.FieldValue.serverTimestamp();
    const convRef = db.collection("conversations").doc();

    await convRef.set({
      id: convRef.id,
      participantIds: [currentUserId, otherUserId],
      participants: {
        [currentUserId]: { name: currentUserName, avatar: currentUserAvatar, title: currentUserTitle },
        [otherUserId]: { name: otherUserName, avatar: otherUserAvatar, title: otherUserTitle },
      },
      lastMessage: "",
      lastMessageAt: now,
      lastSenderId: "",
      unreadCount: { [currentUserId]: 0, [otherUserId]: 0 },
      createdAt: now,
    });

    return { conversationId: convRef.id, error: null };
  } catch (error: any) {
    return { conversationId: null, error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Send Message
// ─────────────────────────────────────────────────
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  text: string,
  imageUrl?: string
): Promise<{ messageId: string | null; error: string | null }> => {
  try {
    const now = firebase.firestore.FieldValue.serverTimestamp();

    // Add message
    const msgRef = db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .doc();

    await msgRef.set({
      id: msgRef.id,
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      text,
      imageUrl: imageUrl || null,
      readBy: [senderId],
      createdAt: now,
    });

    // Update conversation with last message
    const convRef = db.collection("conversations").doc(conversationId);
    const convDoc = await convRef.get();
    const convData = convDoc.data();

    // Increment unread for other participants
    const unreadUpdate: any = {};
    if (convData?.participantIds) {
      for (const pid of convData.participantIds) {
        if (pid !== senderId) {
          unreadUpdate[`unreadCount.${pid}`] = firebase.firestore.FieldValue.increment(1);
        }
      }
    }

    await convRef.update({
      lastMessage: text.length > 80 ? text.substring(0, 80) + "..." : text,
      lastMessageAt: now,
      lastSenderId: senderId,
      ...unreadUpdate,
    });

    return { messageId: msgRef.id, error: null };
  } catch (error: any) {
    return { messageId: null, error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Subscribe to Conversations
// ─────────────────────────────────────────────────
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): (() => void) => {
  return db
    .collection("conversations")
    .where("participantIds", "array-contains", userId)
    .orderBy("lastMessageAt", "desc")
    .onSnapshot(
      (snapshot) => {
        const convs: Conversation[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            participantIds: d.participantIds,
            participants: d.participants,
            lastMessage: d.lastMessage,
            lastMessageAt: toDate(d.lastMessageAt),
            lastSenderId: d.lastSenderId,
            unreadCount: d.unreadCount || {},
            createdAt: toDate(d.createdAt),
          };
        });
        callback(convs);
      },
      (error) => {
        if (error?.code !== "permission-denied") {
          console.warn("Conversations subscription error:", error?.message);
        }
        callback([]);
      }
    );
};

// ─────────────────────────────────────────────────
// Subscribe to Messages
// ─────────────────────────────────────────────────
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  return db
    .collection("conversations")
    .doc(conversationId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .onSnapshot(
      (snapshot) => {
        const msgs: Message[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            conversationId: d.conversationId,
            senderId: d.senderId,
            senderName: d.senderName,
            senderAvatar: d.senderAvatar,
            text: d.text,
            imageUrl: d.imageUrl,
            readBy: d.readBy || [],
            createdAt: toDate(d.createdAt),
          };
        });
        callback(msgs);
      },
      () => callback([])
    );
};

// ─────────────────────────────────────────────────
// Mark Conversation as Read
// ─────────────────────────────────────────────────
export const markConversationRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    await db.collection("conversations").doc(conversationId).update({
      [`unreadCount.${userId}`]: 0,
    });

    // Mark all messages as read
    const unreadMsgs = await db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .where("readBy", "not-in", [[userId]])
      .get();

    const batch = db.batch();
    unreadMsgs.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.readBy?.includes(userId)) {
        batch.update(doc.ref, {
          readBy: firebase.firestore.FieldValue.arrayUnion(userId),
        });
      }
    });
    await batch.commit();
  } catch {
    // Silent fail
  }
};

// ─────────────────────────────────────────────────
// Get Total Unread Count
// ─────────────────────────────────────────────────
export const getTotalUnreadCount = async (
  userId: string
): Promise<number> => {
  try {
    const snapshot = await db
      .collection("conversations")
      .where("participantIds", "array-contains", userId)
      .get();

    let total = 0;
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      total += data.unreadCount?.[userId] || 0;
    });
    return total;
  } catch {
    return 0;
  }
};
