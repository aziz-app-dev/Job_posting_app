import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MyBtn from "./btn";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.54;

const ProfileSetupCards = () => {
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Dynamic cards based on user profile completion (from Firestore)
  const cards = [
    {
      id: "photo",
      title: "Add a profile picture",
      subtitle: "First impressions matter",
      completed: !!profile?.photoURL || !!user?.photoURL,
      path: require("@/assets/images/1.png"),
      route: "/(auth)/img_screen",
    },
    {
      id: "name",
      title: "Set your display name",
      subtitle: "Let people know who you are",
      completed: !!profile?.displayName || !!user?.displayName,
      path: require("@/assets/images/2.png"),
      route: "/(auth)/user_name_screen",
    },
    {
      id: "bio",
      title: "Tell us about yourself",
      subtitle: "Share what you're passionate about",
      completed: !!profile?.bio,
      path: require("@/assets/images/3.png"),
      route: "/(tabs)/profile",
    },
  ];

  const completedCount = cards.filter((c) => c.completed).length;

  // Don't show if dismissed or all completed
  if (dismissed || completedCount === cards.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepText}>
          {completedCount} of {cards.length}
        </Text>
        <TouchableOpacity onPress={() => setDismissed(true)}>
          <Feather name="x" size={20} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Let's get set up</Text>
      <Text style={styles.subtitle}>
        Complete your profile to unlock opportunities and help you connect with
        your community
      </Text>

      {/* Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {cards.map((item) => (
          <View key={item.id} style={styles.card}>
            {item.completed && (
              <View style={styles.checkBadge}>
                <Feather name="check" size={14} color="#FFF" />
              </View>
            )}

            {/* Card Body */}
            <View style={styles.cardContent}>
              <View>
                <View style={styles.illustration}>
                  <Image style={{height:150, width:150}} source={item.path} resizeMode="contain" />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>

              {/* Footer */}
              <MyBtn
                title={item.completed ? "Completed" : "Get started"}
                onPress={() => {
                  if (!item.completed) {
                    router.push(item.route as any);
                  }
                }}
                disabled={item.completed}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ProfileSetupCards;

/* ----------------------------------
   STYLES
----------------------------------- */
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF7E8",
    borderRadius: 20,
    padding: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  stepText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
    marginTop: 2,
  },

  subtitle: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
    marginBottom: 20,
    lineHeight: 20,
  },

  scrollContainer: {
    paddingRight: 10,
  },

  card: {
    width: CARD_WIDTH,
    height: 320, // 👈 IMPORTANT: fixed card height
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginRight: 20,
    position: "relative",
  },

  cardContent: {
    flex: 1,
    justifyContent: "space-between", // 👈 pushes button to bottom
  },

  checkBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  illustration: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginVertical: 6,
  },
});
