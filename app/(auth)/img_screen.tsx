import MyBtn from "@/components/btn";
import AuthWebLayout, { useIsWebLayout } from "@/components/AuthWebLayout";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/services/authService";
import { uploadImageToCloudinary } from "@/services/cloundinary_services";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

const PROGRESS = 0.48;

const ImgScreen = () => {
  const isWeb = useIsWebLayout();
  const { updateProfile } = useAuth();
  const { fromEdit } = useLocalSearchParams<{ fromEdit?: string }>();
  const isFromEdit = fromEdit === "true";
  const [imageUri, setImageUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: "", message: "" });

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setErrorModal({ visible: true, title: "Permission Required", message: "Permission to access gallery is required!" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleContinue = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const cloudinaryUrl = await uploadImageToCloudinary(imageUri);
      if (cloudinaryUrl) {
        await updateUserProfile(undefined, cloudinaryUrl);
        await updateProfile({ photoURL: cloudinaryUrl });
      }
      if (isFromEdit) {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/profile_into_screen");
      }
    } catch {
      setErrorModal({ visible: true, title: "Error", message: "Failed to upload image. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace("/(auth)/profile_into_screen");
  };

  return (
    <AuthWebLayout>
      <View style={isWeb ? webStyles.container : styles.container}>
        {!isWeb && (
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} />
            </Pressable>
            {!isFromEdit && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
              </View>
            )}
          </View>
        )}

        {isWeb && !isFromEdit && (
          <View style={webStyles.progressBar}>
            <View style={[webStyles.progressFill, { width: `${PROGRESS * 100}%` }]} />
          </View>
        )}

        <Text style={isWeb ? webStyles.title : styles.title}>Add a photo</Text>

        <View style={{ alignItems: "center", gap: 12 }}>
          <Pressable style={[styles.imgContainer, { padding: !imageUri ? 50 : 0 }]} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: 160, height: 160, borderRadius: 40 }} />
            ) : (
              <Ionicons name="image-outline" size={80} />
            )}
          </Pressable>

          {imageUri && (
            <Pressable onPress={pickImage}>
              <View style={styles.cropBtn}>
                <Ionicons name="crop-outline" size={20} />
                <Text>Edit</Text>
              </View>
            </Pressable>
          )}
        </View>

        <View style={isWeb ? webStyles.footer : styles.footer}>
          <MyBtn title="Continue" textColor="#FFFFFF" onPress={handleContinue} loading={loading} disabled={!imageUri && isFromEdit} />
          {!isFromEdit && (
            <Pressable onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ConfirmationModal visible={errorModal.visible} title={errorModal.title} message={errorModal.message} isError onCancel={() => setErrorModal({ ...errorModal, visible: false })} />
    </AuthWebLayout>
  );
};

export default ImgScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, gap: 12 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#E5E5EA", borderRadius: 6, overflow: "hidden", marginLeft: 40, marginRight: 70 },
  progressFill: { height: "100%", backgroundColor: "black", borderRadius: 6 },
  title: { fontWeight: "600", fontSize: 28, marginBottom: 10, marginTop: 24, alignSelf: "center" },
  imgContainer: { marginTop: 40, padding: 20, backgroundColor: "#F2F2F7", borderRadius: 40, alignItems: "center", justifyContent: "center" },
  cropBtn: { flexDirection: "row", borderRadius: 25, borderColor: "#3C3C434A", borderWidth: 1, paddingHorizontal: 15, paddingVertical: 5, marginTop: 10, gap: 5 },
  skipText: { color: "black", fontSize: 16, fontWeight: "700", alignSelf: "center" },
  footer: { marginTop: "auto", paddingHorizontal: 18, paddingBottom: 24, gap: 30 },
});

const webStyles = StyleSheet.create({
  container: { gap: 12 },
  progressBar: { height: 6, backgroundColor: "#E5E5EA", borderRadius: 6, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", backgroundColor: "black", borderRadius: 6 },
  title: { fontSize: 32, fontWeight: "700", color: "#111", textAlign: "center" },
  footer: { marginTop: 32, gap: 20 },
});
