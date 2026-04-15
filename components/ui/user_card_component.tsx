import FollowButton from "@/components/FollowButton";
import { UserProfile } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  user: UserProfile;
  showFollowButton?: boolean;
}

const UserCard: React.FC<Props> = ({ user, showFollowButton = true }) => {
  const { user: currentUser } = useAuth();

  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const handlePress = () => {
    if (currentUser?.uid === user.uid) {
      router.push("/(tabs)/profile");
    } else {
      router.push({
        pathname: "/(profile)/public_profile",
        params: { userId: user.uid },
      });
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {getInitial(user.displayName)}
            </Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {user.displayName || "Unknown User"}
          </Text>
          {user.title && (
            <Text style={styles.title} numberOfLines={1}>
              {user.title}
            </Text>
          )}
          {user.location && (
            <Text style={styles.location} numberOfLines={1}>
              {user.location}
            </Text>
          )}
          <Text style={styles.stats}>
            {user.followers || 0} followers
          </Text>
        </View>
      </View>

      {showFollowButton && (
        <FollowButton userId={user.uid} size="small" />
      )}
    </TouchableOpacity>
  );
};

export default UserCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "grey",
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
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  title: {
    fontSize: 14,
    color: "#444",
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  stats: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
});
