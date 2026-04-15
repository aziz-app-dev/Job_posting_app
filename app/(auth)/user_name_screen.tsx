import MyBtn from "@/components/btn";
import AuthWebLayout, { useIsWebLayout } from "@/components/AuthWebLayout";
import MyInput from "@/components/input_field";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

const MIN_LENGTH = 4;
const MAX_LENGTH = 18;
const PROGRESS = 0.16;

const UserNameScreen = () => {
  const isWeb = useIsWebLayout();
  const { updateProfile } = useAuth();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: "", message: "" });

  const handleChange = (value: string) => {
    if (value.length <= MAX_LENGTH) setUserName(value);
  };

  const errorMessage = useMemo(() => {
    if (!userName) return "";
    if (userName.length < MIN_LENGTH) return `Minimum ${MIN_LENGTH} characters required`;
    if (userName.length === MAX_LENGTH) return `Maximum ${MAX_LENGTH} characters limit`;
    return "";
  }, [userName]);

  const isFormValid = useMemo(() => userName.length >= MIN_LENGTH, [userName]);

  const handleContinue = async () => {
    setLoading(true);
    const { error } = await updateUserProfile(userName);
    if (error) {
      setLoading(false);
      setErrorModal({ visible: true, title: "Error", message: error });
      return;
    }
    await updateProfile({ displayName: userName });
    setLoading(false);
    router.replace("/(auth)/age_screen");
  };

  return (
    <AuthWebLayout>
      <View style={isWeb ? webStyles.container : styles.container}>
        {/* Header - mobile only */}
        {!isWeb && (
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} />
            </Pressable>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Progress bar - web */}
        {isWeb && (
          <View style={webStyles.progressBar}>
            <View style={[webStyles.progressFill, { width: `${PROGRESS * 100}%` }]} />
          </View>
        )}

        <Text style={isWeb ? webStyles.title : styles.title}>Choose a username</Text>

        <View style={isWeb ? webStyles.fields : styles.fields}>
          <MyInput title="@username" placeholder="Pick a handle" value={userName} onChangeText={handleChange} />
          {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>

        <View style={isWeb ? webStyles.footer : styles.footer}>
          <MyBtn title="Continue" textColor="#FFFFFF" onPress={handleContinue} disabled={!isFormValid} loading={loading} />
        </View>
      </View>

      <ConfirmationModal visible={errorModal.visible} title={errorModal.title} message={errorModal.message} isError onCancel={() => setErrorModal({ ...errorModal, visible: false })} />
    </AuthWebLayout>
  );
};

export default UserNameScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, gap: 12 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#E5E5EA", borderRadius: 6, overflow: "hidden", marginLeft: 40, marginRight: 70 },
  progressFill: { height: "100%", backgroundColor: "black", borderRadius: 6 },
  title: { fontWeight: "600", fontSize: 28, marginBottom: 10, marginTop: 24, alignSelf: "center" },
  fields: { padding: 16, gap: 6 },
  errorText: { color: "black", fontSize: 16, marginTop: 4 },
  footer: { marginTop: "auto", paddingHorizontal: 18, paddingBottom: 24 },
});

const webStyles = StyleSheet.create({
  container: { gap: 12 },
  progressBar: { height: 6, backgroundColor: "#E5E5EA", borderRadius: 6, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", backgroundColor: "black", borderRadius: 6 },
  title: { fontSize: 32, fontWeight: "700", color: "#111", textAlign: "center" },
  fields: { gap: 8, marginTop: 8 },
  footer: { marginTop: 28 },
});
