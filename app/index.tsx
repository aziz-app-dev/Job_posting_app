import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SPLASH_DURATION = 2500; // 2.5 seconds to ensure auth is restored

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Minimum splash duration
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only navigate when:
    // 1. Minimum splash time has elapsed
    // 2. Auth state is determined (not loading)
    // 3. Haven't navigated yet
    if (minTimeElapsed && !isLoading && !hasNavigated.current) {
      hasNavigated.current = true;

      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/into_screen");
      }
    }
  }, [minTimeElapsed, isLoading, isAuthenticated]);

  // Always show splash screen
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View style={styles.mainContiner}>
        <View style={styles.content}>
          <Text style={styles.title}>WorkCircle</Text>
        </View>
      </View>
      <StatusBar backgroundColor={Colors.splashBg} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContiner: {
    flex: 1,
    backgroundColor: Colors.splashBg,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontWeight: "400",
    fontSize: 48,
  },
});

export default Index;
