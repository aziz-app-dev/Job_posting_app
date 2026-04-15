import MyBtn from "@/components/btn";
import AuthWebLayout, { useIsWebLayout } from "@/components/AuthWebLayout";
import { INTERESTS } from "@/constants/data";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

const PROGRESS = 0.95;

const InterestsScreen = () => {
  const isWeb = useIsWebLayout();
  const { updateProfile } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: "", message: "" });

  const toggleInterest = (item: string) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      await updateProfile({ interests: selected });
      router.replace("/(auth)/user_welcome_Screen");
    } catch {
      setErrorModal({ visible: true, title: "Error", message: "Failed to save interests. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWebLayout>
      <View style={isWeb ? webStyles.container : styles.container}>
        {!isWeb && (
          <View style={styles.header}>
            <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
            </View>
          </View>
        )}

        {isWeb && (
          <View style={webStyles.progressBar}>
            <View style={[webStyles.progressFill, { width: `${PROGRESS * 100}%` }]} />
          </View>
        )}

        <Text style={isWeb ? webStyles.title : styles.title}>What are your career interests?</Text>
        <Text style={isWeb ? webStyles.subTitle : styles.subTitle}>Pick at least 3 to personalize your journey</Text>

        <ScrollView contentContainerStyle={styles.chipContainer} style={isWeb ? { maxHeight: 300 } : undefined}>
          {INTERESTS.map((item) => {
            const isSelected = selected.includes(item);
            return (
              <Pressable
                key={item}
                onPress={() => toggleInterest(item)}
                style={[styles.chip, { backgroundColor: isSelected ? "#000" : "white" }]}
              >
                <Text style={[styles.chipText, { color: isSelected ? "#fff" : "#000" }]}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={isWeb ? webStyles.footer : styles.footer}>
          <MyBtn title="Continue" textColor="#FFFFFF" onPress={handleContinue} disabled={selected.length < 3} loading={loading} />
          <Pressable onPress={() => router.replace("/(auth)/user_welcome_Screen")}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </View>

      <ConfirmationModal visible={errorModal.visible} title={errorModal.title} message={errorModal.message} isError onCancel={() => setErrorModal({ ...errorModal, visible: false })} />
    </AuthWebLayout>
  );
};

export default InterestsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#E5E5EA", borderRadius: 6, overflow: "hidden", marginLeft: 40, marginRight: 70 },
  progressFill: { height: "100%", backgroundColor: "black", borderRadius: 6 },
  title: { fontSize: 28, fontWeight: "600", marginTop: 24, alignSelf: "center" },
  subTitle: { fontSize: 16, marginTop: 5, marginBottom: 10, fontWeight: "400", alignSelf: "flex-start" },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 100 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 25, borderWidth: 1, borderColor: "#7676801F", justifyContent: "center", alignItems: "center", margin: 4 },
  chipText: { fontSize: 16, fontWeight: "400" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, gap: 20, backgroundColor: "#FFFFFF" },
  skipText: { color: "black", fontSize: 16, fontWeight: "700", alignSelf: "center" },
});

const webStyles = StyleSheet.create({
  container: { gap: 8 },
  progressBar: { height: 6, backgroundColor: "#E5E5EA", borderRadius: 6, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", backgroundColor: "black", borderRadius: 6 },
  title: { fontSize: 28, fontWeight: "700", color: "#111", textAlign: "center" },
  subTitle: { fontSize: 15, color: "#666", textAlign: "center" },
  footer: { marginTop: 20, gap: 16 },
});
