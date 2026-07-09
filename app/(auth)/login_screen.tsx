import MyBtn from "@/components/btn";
import AuthWebLayout, { useIsWebLayout } from "@/components/AuthWebLayout";
import MyInput from "@/components/input_field";
import { Colors } from "@/constants/theme";
import { signIn } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = () => {
  const isWeb = useIsWebLayout();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: "", message: "" });

  const handleLogin = async () => {
    console.log("[LoginScreen] handleLogin tapped. email:", email, "passwordLen:", password.length);
    setSubmitted(true);
    if (!EMAIL_REGEX.test(email) || password.length < 8) {
      console.log("[LoginScreen] Validation failed");
      return;
    }

    setLoading(true);
    console.log("[LoginScreen] Calling signIn...");
    const { user, error } = await signIn(email, password);
    console.log("[LoginScreen] signIn result — user:", user?.uid || null, "error:", error);
    setLoading(false);

    if (error) {
      setErrorModal({ visible: true, title: "Login Failed", message: error });
      return;
    }
    if (user) {
      console.log("[LoginScreen] Navigating to /(tabs)");
      router.replace("/(tabs)");
    }
  };

  const emailError = submitted && !EMAIL_REGEX.test(email) ? "Enter a valid email address" : "";
  const passwordError = submitted && password.length < 8 ? "Must have at least 8 characters" : "";
  const isFormValid = useMemo(() => EMAIL_REGEX.test(email) && password.length >= 8, [email, password]);

  const content = (
    <View style={isWeb ? webStyles.content : styles.content}>
      <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
      <Text style={isWeb ? webStyles.title : styles.title}>Good to see you again!</Text>
      {isWeb && <Text style={webStyles.subtitle}>Sign in to your WorkCircle account</Text>}

      <View style={isWeb ? webStyles.fields : styles.fields}>
        <MyInput title="Email" placeholder="your@email.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
        {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

        <MyInput
          title="Password" placeholder="********" value={password} secureTextEntry={!showPassword} onChangeText={setPassword}
          rightIcon={<Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} onPress={() => setShowPassword(!showPassword)} />}
        />
        {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
      </View>

      <View style={isWeb ? webStyles.footer : styles.footer}>
        <MyBtn title="Log in" textColor="#FFFFFF" onPress={handleLogin} disabled={!isFormValid} loading={loading} />
        <Text style={styles.bottomTxt}>
          Don't have an account?{" "}
          <Text style={styles.link} onPress={() => router.push("/(auth)/signup_screen")}>Sign up</Text>
        </Text>
      </View>
    </View>
  );

  return (
    <AuthWebLayout>
      {!isWeb && (
        <>
          <Image source={require("@/assets/images/sp.png")} style={styles.bgImage} />
          <View style={styles.overlay} />
        </>
      )}
      {content}
      <ConfirmationModal visible={errorModal.visible} title={errorModal.title} message={errorModal.message} isError onCancel={() => setErrorModal({ ...errorModal, visible: false })} />
    </AuthWebLayout>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  bgImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", resizeMode: "cover" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.82)" },
  content: { flex: 1, padding: 16, justifyContent: "center" },
  logo: { width: 100, height: 100, alignSelf: "center", marginBottom: 20 },
  title: { fontWeight: "600", fontSize: 28, marginBottom: 10, alignSelf: "center" },
  fields: { gap: 6 },
  errorText: { color: Colors.rose, fontSize: 16, marginTop: -4, marginBottom: 6 },
  bottomTxt: { fontSize: 16, textAlign: "center" },
  link: { fontWeight: "600", color: "#007AFF", fontSize: 16 },
  footer: { paddingTop: 24, gap: 25 },
});

const webStyles = StyleSheet.create({
  content: { gap: 12 },
  title: { fontSize: 32, fontWeight: "700", color: "#111", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 8 },
  fields: { gap: 8, marginTop: 8 },
  footer: { gap: 20, marginTop: 28 },
});
