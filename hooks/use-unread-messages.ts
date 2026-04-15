import { useAuth } from "@/context/AuthContext";
import { subscribeToConversations } from "@/services/messagingService";
import { useEffect, useState } from "react";

/**
 * Returns the total number of unread messages across all the current
 * user's conversations. Updates in real-time via Firestore.
 */
export function useUnreadMessages(): number {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setTotal(0);
      return;
    }
    const unsub = subscribeToConversations(user.uid, (convs) => {
      const count = convs.reduce(
        (sum, c) => sum + (c.unreadCount?.[user.uid] || 0),
        0
      );
      setTotal(count);
    });
    return () => unsub();
  }, [user?.uid]);

  return total;
}
