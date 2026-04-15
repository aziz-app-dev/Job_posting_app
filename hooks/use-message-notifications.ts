import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { subscribeToConversations } from "@/services/messagingService";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

/**
 * Listens to all conversations the current user is part of.
 * When a new message arrives from someone else AND the user is not
 * already viewing that chat, shows an in-app toast with tap-to-open.
 *
 * Works on the free Firebase plan (no Cloud Functions / push tokens).
 * Only fires while the app is in the foreground.
 *
 * For OS-level push notifications when the app is closed,
 * install `expo-notifications` and add a Cloud Function trigger later.
 */
export function useMessageNotifications() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();

  const lastSeenRef = useRef<Record<string, number>>({});
  const initializedRef = useRef(false);
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!user?.uid) {
      lastSeenRef.current = {};
      initializedRef.current = false;
      return;
    }

    const unsub = subscribeToConversations(user.uid, (convs) => {
      // First pass — record current state, don't notify
      if (!initializedRef.current) {
        for (const c of convs) {
          lastSeenRef.current[c.id] = c.lastMessageAt?.getTime() || 0;
        }
        initializedRef.current = true;
        return;
      }

      for (const c of convs) {
        const ts = c.lastMessageAt?.getTime() || 0;
        const prev = lastSeenRef.current[c.id] || 0;

        const isNew = ts > prev;
        const fromOther = c.lastSenderId && c.lastSenderId !== user.uid;
        const inThisChat = pathRef.current?.includes("/chat") &&
          pathRef.current?.includes(c.id);

        if (isNew && fromOther && !inThisChat) {
          const otherId = c.participantIds.find((id) => id !== user.uid) || "";
          const sender = c.participants?.[otherId];
          const senderName = sender?.name || "New message";
          const preview = c.lastMessage || "Sent you a message";

          showToast({
            type: "info",
            message: `${senderName}: ${preview}`,
            duration: 5000,
            dismissible: true,
          });
        }

        lastSeenRef.current[c.id] = ts;
      }
    });

    return () => {
      unsub();
      initializedRef.current = false;
    };
  }, [user?.uid, profile?.uid, showToast]);
}
