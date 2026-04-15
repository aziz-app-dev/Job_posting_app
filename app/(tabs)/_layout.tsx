import { Tabs, usePathname, router } from "expo-router";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { Feather, Octicons } from "@expo/vector-icons";

const BREAKPOINT = 768;

const NAV_ITEMS = [
  { name: "index", title: "Home", icon: "home-fill", family: "Octicons" as const },
  { name: "add", title: "Create Post", icon: "diff-added", family: "Octicons" as const },
  { name: "book_mark", title: "Bookmarks", icon: "bookmark", family: "Feather" as const },
  { name: "profile", title: "Profile", icon: "user", family: "Feather" as const },
];

function SideNavItem({
  title, icon, family, isActive, onPress, badge,
}: {
  title: string; icon: string; family: "Octicons" | "Feather"; isActive: boolean; onPress: () => void; badge?: number;
}) {
  const Icon = family === "Octicons" ? Octicons : Feather;
  return (
    <Pressable onPress={onPress} style={[webStyles.navItem, isActive && webStyles.navItemActive]}>
      <Icon name={icon as any} size={20} color={isActive ? "#000" : "#666"} />
      <Text style={[webStyles.navItemText, isActive && webStyles.navItemTextActive]}>{title}</Text>
      {badge && badge > 0 ? (
        <View style={webStyles.navBadge}>
          <Text style={webStyles.navBadgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= BREAKPOINT;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const pathname = usePathname();
  const unreadMessages = useUnreadMessages();

  const getInitial = (name: string) => name?.trim()?.charAt(0)?.toUpperCase() || "?";
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";

  if (isWeb) {
    return (
      <View style={webStyles.container}>
        {/* ── Left Sidebar ── */}
        <View style={webStyles.sidebar}>
          <Text style={webStyles.brand}>WorkCircle</Text>

          <View style={webStyles.navList}>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.name === "index"
                  ? pathname === "/" || pathname === "/index"
                  : pathname.includes(item.name);
              return (
                <SideNavItem
                  key={item.name}
                  title={item.title}
                  icon={item.icon}
                  family={item.family}
                  isActive={isActive}
                  onPress={() => router.push(`/(tabs)/${item.name === "index" ? "" : item.name}` as any)}
                />
              );
            })}

            {/* Extra sidebar links (not tabs) */}
            <View style={webStyles.divider} />
            <SideNavItem title="Messages" icon="message-circle" family="Feather"
              isActive={pathname.includes("conversations")}
              onPress={() => router.push("/(profile)/conversations")}
              badge={unreadMessages} />
            <SideNavItem title="Discover" icon="compass" family="Feather"
              isActive={pathname.includes("discover")}
              onPress={() => router.push("/(profile)/discover")} />
          </View>

          {/* User at bottom */}
          <Pressable style={webStyles.userSection} onPress={() => router.push("/(tabs)/profile")}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={webStyles.userAvatar} />
            ) : (
              <View style={[webStyles.userAvatar, webStyles.userAvatarFallback]}>
                <Text style={webStyles.userInitial}>{getInitial(displayName)}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={webStyles.userName} numberOfLines={1}>{displayName}</Text>
              <Text style={webStyles.userEmail} numberOfLines={1}>{user?.email || ""}</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Center: feed area centered in remaining space ── */}
        <View style={webStyles.centerArea}>
          <View style={webStyles.feedContainer}>
            <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
              <Tabs.Screen name="index" />
              <Tabs.Screen name="add" />
              <Tabs.Screen name="book_mark" />
              <Tabs.Screen name="messages" />
              <Tabs.Screen name="profile" />
            </Tabs>
          </View>
        </View>
      </View>
    );
  }

  // ── MOBILE ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: Colors.black,
          tabBarStyle: {
            backgroundColor: "white",
            borderTopWidth: 0,
            height: 65 + insets.bottom,
            paddingTop: 7,
            paddingBottom: insets.bottom,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Octicons name="home-fill" size={24} color={color} /> }} />
        <Tabs.Screen name="add" options={{ title: "Add", tabBarIcon: ({ color }) => <Octicons name="diff-added" size={24} color={color} /> }} />
        <Tabs.Screen name="book_mark" options={{ title: "Bookmark", tabBarIcon: ({ color }) => <Feather name="bookmark" size={24} color={color} /> }} />
        <Tabs.Screen name="messages" options={{
          title: "Messages",
          tabBarIcon: ({ color }) => <Feather name="message-circle" size={24} color={color} />,
          tabBarBadge: unreadMessages > 0 ? (unreadMessages > 99 ? "99+" : unreadMessages) : undefined,
          tabBarBadgeStyle: { backgroundColor: "#FF3B30", color: "#fff", fontSize: 11 },
        }} />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: () =>
              user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={{ width: 30, height: 30, borderRadius: 15 }} />
              ) : (
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}>{getInitial(displayName)}</Text>
                </View>
              ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f3f2ef",
  },

  // ── Left Sidebar ──
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
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 8 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  navItemActive: { backgroundColor: "#f0f0f0" },
  navItemText: { fontSize: 15, fontWeight: "500", color: "#666", flex: 1 },
  navItemTextActive: { fontWeight: "700", color: "#000" },
  navBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  navBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // User
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

  // ── Center area ──
  centerArea: {
    flex: 1,
    alignItems: "center",
  },
  feedContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 900,
    backgroundColor: "#f3f2ef",
  },
});
