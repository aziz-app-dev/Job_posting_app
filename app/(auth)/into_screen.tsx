import AuthBtn from "@/components/auth_btn";
import AuthWebLayout, { useIsWebLayout } from "@/components/AuthWebLayout";
import {
  signInWithApple,
  signInWithGoogle,
  signInWithGoogleIdToken,
} from "@/services/authService";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

const IntoScreen = () => {
  const isWeb = useIsWebLayout();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const [, , googlePromptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  const handleGoogleSignIn = async () => {
    if (Platform.OS === "web") {
      setIsLoading(true);
      setLoadingProvider("google");
      const { user, error } = await signInWithGoogle();
      setIsLoading(false);
      setLoadingProvider(null);
      if (error) {
        setErrorModal({
          visible: true,
          title: "Google Sign-In Failed",
          message: error,
        });
        return;
      }
      if (user) {
        router.replace(
          user.displayName ? "/(tabs)" : "/(auth)/user_name_screen",
        );
      }
      return;
    }

    setIsLoading(true);
    setLoadingProvider("google");
    const result = await googlePromptAsync();

    if (result?.type !== "success") {
      setIsLoading(false);
      setLoadingProvider(null);
      if (result?.type === "error") {
        setErrorModal({
          visible: true,
          title: "Google Sign-In Failed",
          message: result.error?.description || "Authentication failed",
        });
      }
      return;
    }

    const idToken = result.authentication?.idToken;
    if (!idToken) {
      setIsLoading(false);
      setLoadingProvider(null);
      setErrorModal({
        visible: true,
        title: "Google Sign-In Failed",
        message: "No ID token received",
      });
      return;
    }

    const { user, error } = await signInWithGoogleIdToken(idToken);
    setIsLoading(false);
    setLoadingProvider(null);
    if (error) {
      setErrorModal({
        visible: true,
        title: "Google Sign-In Failed",
        message: error,
      });
      return;
    }
    if (user) {
      router.replace(user.displayName ? "/(tabs)" : "/(auth)/user_name_screen");
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setLoadingProvider("apple");
    const { user, error } = await signInWithApple();
    setIsLoading(false);
    setLoadingProvider(null);
    if (error) {
      setErrorModal({
        visible: true,
        title: "Apple Sign-In Failed",
        message: error,
      });
      return;
    }
    if (user) {
      router.replace(user.displayName ? "/(tabs)" : "/(auth)/user_name_screen");
    }
  };

  const content = (
    <View style={isWeb ? webStyles.content : styles.content}>
      <Image
        source={require("@/assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={isWeb ? webStyles.title : styles.title}>
        Welcome to WorkCircle
      </Text>
      <Text style={isWeb ? webStyles.subtitle : styles.subtitle}>
        Connect, share, and grow your professional network
      </Text>

      <View style={isWeb ? webStyles.buttons : styles.buttons}>
        <AuthBtn
          title="Continue with email"
          onPress={() => router.push("/(auth)/login_screen")}
          imgSource={require("@/assets/images/icons8-email-48.png")}
          disabled={isLoading}
        />
        <AuthBtn
          title="Continue with Google"
          onPress={handleGoogleSignIn}
          imgSource={require("@/assets/images/google-icon.png")}
          disabled={isLoading}
          loading={loadingProvider === "google"}
        />
        {(Platform.OS === "ios" || Platform.OS === "web") && (
          <AuthBtn
            title="Continue with Apple"
            onPress={handleAppleSignIn}
            imgSource={require("@/assets/images/apple.png")}
            disabled={isLoading}
            loading={loadingProvider === "apple"}
          />
        )}
      </View>

      <View style={styles.bottomRow}>
        <Text style={{ fontWeight: "400", fontSize: 16 }}>
          Don't have an account?
        </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/signup_screen")}>
          <Text style={{ fontWeight: "700", fontSize: 16, color: "#007AFF" }}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <AuthWebLayout>
      {/* Mobile background */}
      {!isWeb && (
        <>
          <Image
            source={require("@/assets/images/sp.png")}
            style={styles.bgImage}
          />
          <View style={styles.overlay} />
        </>
      )}

      {content}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Signing in...</Text>
          </View>
        </View>
      )}

      <ConfirmationModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        isError
        onCancel={() => setErrorModal({ ...errorModal, visible: false })}
      />
    </AuthWebLayout>
  );
};

export default IntoScreen;

const styles = StyleSheet.create({
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logo: { width: 120, height: 120, marginBottom: 10 },
  title: { fontWeight: "600", fontSize: 28, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#666", textAlign: "center" },
  buttons: { width: "100%", gap: 14, marginTop: 16 },
  bottomRow: { gap: 5, flexDirection: "row", marginTop: 16 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  loadingBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 16, fontWeight: "600", color: "#000" },
});

const webStyles = StyleSheet.create({
  content: { alignItems: "center", gap: 12 },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },
  buttons: { width: "100%", gap: 14, marginTop: 20 },
});
