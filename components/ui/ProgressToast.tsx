import { Toast } from "@/constants/types";
import { Colors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ProgressToastProps {
  toast: Toast;
  onDismiss: () => void;
}

const ProgressToast: React.FC<ProgressToastProps> = ({ toast, onDismiss }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Progress bar animation
  useEffect(() => {
    if (toast.type === "progress" && toast.progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: toast.progress / 100,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [toast.progress]);

  const getIconName = (): keyof typeof Feather.glyphMap => {
    switch (toast.type) {
      case "success":
        return "check-circle";
      case "error":
        return "alert-circle";
      case "info":
        return "info";
      case "progress":
        return "upload-cloud";
      default:
        return "info";
    }
  };

  const getIconColor = (): string => {
    switch (toast.type) {
      case "success":
        return "#22C55E";
      case "error":
        return "#EF4444";
      case "info":
        return "#3B82F6";
      case "progress":
        return Colors.black;
      default:
        return Colors.black;
    }
  };

  const getProgressBarColor = (): string => {
    if (toast.progress !== undefined && toast.progress >= 100) {
      return "#22C55E";
    }
    return Colors.black;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name={getIconName()} size={22} color={getIconColor()} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>

          {toast.type === "progress" && toast.progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: getProgressBarColor(),
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(toast.progress)}%
              </Text>
            </View>
          )}
        </View>

        {toast.dismissible && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    overflow: "hidden",
    marginRight: 10,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    width: 36,
    textAlign: "right",
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default ProgressToast;
