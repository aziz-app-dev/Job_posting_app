import MyBtn from "@/components/btn";
import AuthWebLayout, { useIsWebLayout } from "@/components/AuthWebLayout";
import MyInput from "@/components/input_field";
import { Colors } from "@/constants/theme";
import { signUp } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUpScreen = () => {
  const isWeb = useIsWebLayout();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: "", message: "" });

  const handleSignUp = async () => {
    setLoading(true);
    const { user, error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setErrorModal({ visible: true, title: "Sign Up Failed", message: error });
      return;
    }
    if (user) router.replace("/(auth)/user_name_screen");
  };

  const emailError = email.length > 0 && !EMAIL_REGEX.test(email) ? "Enter a valid email address" : "";
  const passwordError = password.length > 0 && password.length < 8 ? "Must have at least 8 characters" : "";
  const confirmPasswordError = confirmPassword.length > 0 && confirmPassword !== password ? "Passwords do not match" : "";
  const isFormValid = useMemo(() => EMAIL_REGEX.test(email) && password.length >= 8 && confirmPassword === password && acceptedTerms, [email, password, confirmPassword, acceptedTerms]);

  const content = (
    <View style={isWeb ? webStyles.content : styles.content}>
      <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
      <Text style={isWeb ? webStyles.title : styles.title}>Create an account</Text>
      {isWeb && <Text style={webStyles.subtitle}>Join WorkCircle today</Text>}

      <View style={isWeb ? webStyles.fields : styles.fields}>
        <MyInput title="Email" placeholder="your@email.com" value={email} keyboardType="email-address" onChangeText={setEmail} />
        {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

        <MyInput title="Password" placeholder="********" value={password} secureTextEntry={!showPassword} onChangeText={setPassword}
          rightIcon={<Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} onPress={() => setShowPassword(!showPassword)} />}
        />
        {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

        <MyInput title="Confirm Password" placeholder="********" value={confirmPassword} secureTextEntry={!showConfirmPassword} onChangeText={setConfirmPassword}
          rightIcon={<Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={22} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
        />
        {!!confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}

        <View style={styles.termsRow}>
          <Checkbox value={acceptedTerms} onValueChange={setAcceptedTerms} color={acceptedTerms ? "#34C759" : undefined} />
          <Text style={styles.termsText}>
            I accept WorkCircle's <Text style={styles.link}>Terms of Use</Text> and <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </View>

      <View style={isWeb ? webStyles.footer : styles.footer}>
        <MyBtn title="Get started" textColor="#FFFFFF" onPress={handleSignUp} disabled={!isFormValid} loading={loading} />
        <Text style={styles.bottomTxt}>
          Already have an account? <Text style={styles.link} onPress={() => router.push("/(auth)/login_screen")}>Log in</Text>
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
      <ScrollView style={styles.scroll} contentContainerStyle={isWeb ? undefined : styles.scrollContent}>
        {content}
      </ScrollView>
      <ConfirmationModal visible={errorModal.visible} title={errorModal.title} message={errorModal.message} isError onCancel={() => setErrorModal({ ...errorModal, visible: false })} />
    </AuthWebLayout>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  bgImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", resizeMode: "cover" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.82)" },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 16 },
  logo: { width: 100, height: 100, alignSelf: "center", marginBottom: 10, marginTop: 20 },
  title: { fontWeight: "600", fontSize: 28, marginBottom: 10, alignSelf: "center" },
  fields: { gap: 6 },
  errorText: { color: Colors.rose, fontSize: 16, marginTop: -4, marginBottom: 6 },
  termsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  termsText: { fontSize: 14, flex: 1 },
  link: { fontWeight: "600", color: "#007AFF", fontSize: 15 },
  footer: { marginTop: "auto", paddingBottom: 24, gap: 15 },
  bottomTxt: { fontSize: 16, textAlign: "center" },
});

const webStyles = StyleSheet.create({
  content: { gap: 12 },
  title: { fontSize: 32, fontWeight: "700", color: "#111", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 8 },
  fields: { gap: 8, marginTop: 8 },
  footer: { gap: 20, marginTop: 24 },
});
