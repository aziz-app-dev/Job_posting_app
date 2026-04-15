import { Colors } from "@/constants/theme";
import { Conversation } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { subscribeToConversations } from "@/services/messagingService";
import { Feather } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const ConversationsScreen = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= 768;
  const pathname = usePathname();
  const isFromTab = pathname?.includes("/messages");
  const hideBack = isWeb || isFromTab;
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const getOtherParticipant = (conv: Conversation) => {
    const otherId = conv.participantIds.find((id) => id !== user?.uid) || "";
    return conv.participants?.[otherId] || { name: "User", avatar: "", title: "" };
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getInitial = (name: string) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const renderItem = ({ item }: { item: Conversation }) => {
    const other = getOtherParticipant(item);
    const unread = item.unreadCount?.[user?.uid || ""] || 0;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          router.push({
            pathname: "/(profile)/chat",
            params: { conversationId: item.id },
          })
        }
        activeOpacity={0.7}
      >
        {other.avatar ? (
          <Image source={{ uri: other.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{getInitial(other.name)}</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.name, unread > 0 && styles.nameBold]} numberOfLines={1}>
              {other.name}
            </Text>
            <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text
              style={[styles.lastMessage, unread > 0 && styles.lastMessageBold]}
              numberOfLines={1}
            >
              {item.lastSenderId === user?.uid ? "You: " : ""}
              {item.lastMessage || "Start a conversation"}
            </Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {!hideBack && (
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
            <Feather name="arrow-left" size={24} color={Colors.black} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.black} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <Feather name="message-circle" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Start a conversation from someone's profile
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

export default ConversationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#555", marginTop: 16 },
  emptyText: { fontSize: 14, color: "#999", marginTop: 6, textAlign: "center" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#eee" },
  avatarFallback: { backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  avatarInitial: { color: "#fff", fontSize: 18, fontWeight: "700" },
  content: { flex: 1, marginLeft: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "500", color: "#111", flex: 1 },
  nameBold: { fontWeight: "700" },
  time: { fontSize: 12, color: "#999", marginLeft: 8 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  lastMessage: { fontSize: 13, color: "#888", flex: 1 },
  lastMessageBold: { color: "#333", fontWeight: "600" },
  badge: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
