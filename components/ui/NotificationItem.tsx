import { Notification } from "@/constants/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getMessage = () => {
    switch (notification.type) {
      case "like":
        return "liked your post";
      case "comment":
        return notification.commentText
          ? `commented: "${notification.commentText}"`
          : "commented on your post";
      case "reply":
        return notification.commentText
          ? `replied to your comment: "${notification.commentText}"`
          : "replied to your comment";
      case "follow":
        return "started following you";
      case "job_match":
        return `posted a job that matches your profile`;
      case "job_application":
        return notification.jobTitle
          ? `applied for ${notification.jobTitle}`
          : "applied for your job";
      default:
        return "";
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "like":
        return <Ionicons name="heart" size={16} color="#FF3B30" />;
      case "comment":
        return <Ionicons name="chatbubble" size={16} color="#007AFF" />;
      case "reply":
        return <Ionicons name="arrow-undo" size={16} color="#5856D6" />;
      case "follow":
        return <Ionicons name="person-add" size={16} color="#34C759" />;
      case "job_match":
        return <Ionicons name="briefcase" size={16} color="#FF9500" />;
      case "job_application":
        return <Ionicons name="document-text" size={16} color="#22C55E" />;
      default:
        return null;
    }
  };

  const isJobMatch = notification.type === "job_match";
  const isJobApplication = notification.type === "job_application";

  const handlePress = () => {
    if (onPress) {
      onPress();
    }

    // Navigate based on notification type
    if (notification.type === "follow") {
      router.push({
        pathname: "/(profile)/public_profile",
        params: { userId: notification.senderId },
      });
    } else if (notification.type === "job_application" && notification.postId) {
      // Navigate to applicants screen for recruiters
      router.push({
        pathname: "/(profile)/job_applicants",
        params: { postId: notification.postId, jobTitle: notification.jobTitle || "Job" },
      });
    } else if (notification.postId) {
      router.push({
        pathname: "/(profile)/post_detail",
        params: { postId: notification.postId },
      });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead && styles.unreadContainer,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar with icon badge */}
      <View style={styles.avatarContainer}>
        {notification.senderAvatar ? (
          <Image
            source={{ uri: notification.senderAvatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {getInitial(notification.senderName)}
            </Text>
          </View>
        )}
        <View style={styles.iconBadge}>{getIcon()}</View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.message} numberOfLines={2}>
          <Text style={styles.senderName}>
            {isJobMatch ? (notification.companyName || notification.senderName) : notification.senderName}
          </Text>
          {" "}
          {getMessage()}
        </Text>
        {isJobMatch && notification.jobTitle && (
          <Text style={styles.jobTitle} numberOfLines={1}>
            {notification.jobTitle}
          </Text>
        )}
        {isJobMatch && notification.matchReason && (
          <Text style={styles.matchReason} numberOfLines={1}>
            {notification.matchReason}
          </Text>
        )}
        {isJobApplication && notification.applicantMessage && (
          <Text style={styles.applicantMessage} numberOfLines={2}>
            {`"${notification.applicantMessage}"`}
          </Text>
        )}
        <Text style={styles.time}>{formatTimeAgo(notification.createdAt)}</Text>
      </View>

      {/* Post thumbnail (for like/comment) */}
      {notification.postThumbnail && (
        <Image
          source={{ uri: notification.postThumbnail }}
          style={styles.postThumbnail}
        />
      )}

      {/* Unread indicator */}
      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

export default NotificationItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  unreadContainer: {
    backgroundColor: "#f8f9ff",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ddd",
  },
  avatarFallback: {
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  iconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  senderName: {
    fontWeight: "600",
  },
  time: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  jobTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF9500",
    marginTop: 2,
  },
  matchReason: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
  applicantMessage: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
    lineHeight: 16,
  },
  postThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  unreadDot: {
    position: "absolute",
    left: 4,
    top: "50%",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginTop: -4,
  },
});
