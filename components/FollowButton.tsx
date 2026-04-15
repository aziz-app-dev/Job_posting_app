import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface FollowButtonProps {
  userId: string;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  onFollowChange?: (isFollowing: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  size = "medium",
  style,
  onFollowChange,
}) => {
  const { user, isFollowing, followUser, unfollowUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const following = isFollowing(userId);

  // Don't show button for own profile
  if (user?.uid === userId) {
    return null;
  }

  const handlePress = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (following) {
        const { error } = await unfollowUser(userId);
        if (!error) {
          onFollowChange?.(false);
        }
      } else {
        const { error } = await followUser(userId);
        if (!error) {
          onFollowChange?.(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          button: styles.buttonSmall,
          text: styles.textSmall,
        };
      case "large":
        return {
          button: styles.buttonLarge,
          text: styles.textLarge,
        };
      default:
        return {
          button: styles.buttonMedium,
          text: styles.textMedium,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyles.button,
        following ? styles.buttonFollowing : styles.buttonFollow,
        style,
      ]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={following ? Colors.black : "#fff"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            sizeStyles.text,
            following ? styles.textFollowing : styles.textFollow,
          ]}
        >
          {following ? "Following" : "Follow"}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonFollow: {
    backgroundColor: Colors.black,
  },
  buttonFollowing: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 70,
  },
  buttonMedium: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 90,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    minWidth: 120,
  },
  text: {
    fontWeight: "600",
  },
  textFollow: {
    color: "#fff",
  },
  textFollowing: {
    color: Colors.black,
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
});

export default FollowButton;
