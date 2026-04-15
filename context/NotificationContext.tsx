import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { Notification } from "@/constants/types";
import {
  subscribeToNotifications,
  subscribeToUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/services/notificationService";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<{ error: string | null }>;
  markAllAsRead: () => Promise<{ error: string | null }>;
  clearNotification: (notificationId: string) => Promise<{ error: string | null }>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const notificationsUnsubscribe = useRef<(() => void) | null>(null);
  const unreadCountUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to notifications
    notificationsUnsubscribe.current = subscribeToNotifications(
      user.uid,
      (notifs) => {
        setNotifications(notifs);
        setIsLoading(false);
      }
    );

    // Subscribe to unread count
    unreadCountUnsubscribe.current = subscribeToUnreadCount(
      user.uid,
      (count) => {
        setUnreadCount(count);
      }
    );

    return () => {
      if (notificationsUnsubscribe.current) {
        notificationsUnsubscribe.current();
        notificationsUnsubscribe.current = null;
      }
      if (unreadCountUnsubscribe.current) {
        unreadCountUnsubscribe.current();
        unreadCountUnsubscribe.current = null;
      }
    };
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    return markNotificationAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return { error: "Not authenticated" };
    return markAllNotificationsAsRead(user.uid);
  }, [user]);

  const clearNotification = useCallback(async (notificationId: string) => {
    return deleteNotification(notificationId);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export default NotificationContext;
