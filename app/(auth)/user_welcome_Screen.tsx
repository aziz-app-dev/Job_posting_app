import AuthWebLayout, { useIsWebLayout } from "@/components/AuthWebLayout";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

const WelcomeScreen = () => {
  const isWeb = useIsWebLayout();
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthWebLayout>
      <View style={isWeb ? webStyles.container : styles.container}>
        <View style={styles.content}>
          <Text style={isWeb ? webStyles.title : styles.title}>Welcome {displayName}</Text>
          {isWeb && (
            <Text style={webStyles.subtitle}>Setting up your workspace...</Text>
          )}
        </View>
      </View>
    </AuthWebLayout>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.splashBg, padding: 20 },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontWeight: "500", fontSize: 40 },
});

const webStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontWeight: "700", fontSize: 42, color: "#111", textAlign: "center" },
  subtitle: { fontSize: 18, color: "#666", marginTop: 12, textAlign: "center" },
});
