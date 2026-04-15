import { useAuth } from "@/context/AuthContext";
import { Feather, Octicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const BREAKPOINT = 768;

const NAV_ITEMS = [
  { path: "/(tabs)/", title: "Home", icon: "home-fill", family: "Octicons" as const },
  { path: "/(tabs)/add", title: "Create Post", icon: "diff-added", family: "Octicons" as const },
  { path: "/(profile)/conversations", title: "Messages", icon: "message-circle", family: "Feather" as const },
  { path: "/(profile)/discover", title: "Discover", icon: "compass", family: "Feather" as const },
  { path: "/(tabs)/book_mark", title: "Bookmarks", icon: "bookmark", family: "Feather" as const },
  { path: "/(tabs)/profile", title: "Profile", icon: "user", family: "Feather" as const },
];

/**
 * Wraps non-tab screens (profile, search, notifications, etc.) with the
 * same sidebar + centered content layout used on the main tabs.
 * On mobile it just renders children as-is.
 */
const WebShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= BREAKPOINT;
  const { user } = useAuth();

  if (!isWeb) return <>{children}</>;

  const getInitial = (name: string) => name?.trim()?.charAt(0)?.toUpperCase() || "?";
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <Pressable onPress={() => router.push("/(tabs)")}>
          <Text style={styles.brand}>WorkCircle</Text>
        </Pressable>

        <View style={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.family === "Octicons" ? Octicons : Feather;
            return (
              <Pressable
                key={item.path}
                onPress={() => router.push(item.path as any)}
                style={styles.navItem}
              >
                <Icon name={item.icon as any} size={20} color="#666" />
                <Text style={styles.navItemText}>{item.title}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.userSection} onPress={() => router.push("/(tabs)/profile")}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, styles.userAvatarFallback]}>
              <Text style={styles.userInitial}>{getInitial(displayName)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email || ""}</Text>
          </View>
        </Pressable>
      </View>

      {/* Center content */}
      <View style={styles.centerArea}>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </View>
  );
};

export default WebShell;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f3f2ef",
  },
  sidebar: {
    width: 230,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  navList: { flex: 1, gap: 2 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  navItemText: { fontSize: 15, fontWeight: "500", color: "#666" },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 4,
  },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eee" },
  userAvatarFallback: { backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  userInitial: { color: "#fff", fontSize: 14, fontWeight: "700" },
  userName: { fontSize: 13, fontWeight: "600", color: "#111" },
  userEmail: { fontSize: 11, color: "#888" },
  centerArea: {
    flex: 1,
    alignItems: "center",
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 700,
    backgroundColor: "#fff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e0e0e0",
  },
});
