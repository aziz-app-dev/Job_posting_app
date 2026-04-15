import MyBtn from "@/components/btn";
import AuthWebLayout, { useIsWebLayout } from "@/components/AuthWebLayout";
import MyInput from "@/components/input_field";
import { COMMON_ROLES } from "@/constants/data";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

const PROGRESS = 0.8;

const ProfileIntoScreen = () => {
  const isWeb = useIsWebLayout();
  const { updateProfile } = useAuth();
  const [job, setJob] = useState("");
  const [about, setAbout] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: "", message: "" });

  const filteredJobs = COMMON_ROLES.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const isFormValid = job && about.trim().length > 0;

  const handleContinue = async () => {
    setLoading(true);
    try {
      await updateProfile({ title: job, bio: about });
      router.replace("/(auth)/inspiration_screen");
    } catch {
      setErrorModal({ visible: true, title: "Error", message: "Failed to save profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWebLayout>
      <View style={isWeb ? webStyles.container : styles.container}>
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

        {isWeb && (
          <View style={webStyles.progressBar}>
            <View style={[webStyles.progressFill, { width: `${PROGRESS * 100}%` }]} />
          </View>
        )}

        <Text style={isWeb ? webStyles.title : styles.title}>Tell us about yourself</Text>

        <View style={isWeb ? webStyles.fields : styles.mainContainer}>
          <Pressable style={styles.dropdown} onPress={() => setModalVisible(true)}>
            <Text style={{ color: job ? "#000" : "#999" }}>{job || "Select your job"}</Text>
            <Ionicons name="chevron-down" size={20} />
          </Pressable>

          <MyInput title="About" value={about} multiline numberOfLines={5} maxLength={300} placeholder="Tell us about yourself" onChangeText={setAbout} />
        </View>

        <View style={isWeb ? webStyles.footer : styles.footer}>
          <MyBtn title="Continue" textColor="#FFFFFF" onPress={handleContinue} disabled={!isFormValid} loading={loading} />
          <TouchableOpacity onPress={() => router.replace("/(auth)/inspiration_screen")}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Job Search Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Titles</Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} />
            </Pressable>
          </View>
          <MyInput title="" placeholder="Search jobs..." value={searchQuery} onChangeText={setSearchQuery} />
          <FlatList
            data={filteredJobs}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.jobItem} onPress={() => { setJob(item); setModalVisible(false); setSearchQuery(""); }}>
                <Text style={styles.itemTxt}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <ConfirmationModal visible={errorModal.visible} title={errorModal.title} message={errorModal.message} isError onCancel={() => setErrorModal({ ...errorModal, visible: false })} />
    </AuthWebLayout>
  );
};

export default ProfileIntoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, gap: 12 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#E5E5EA", borderRadius: 6, overflow: "hidden", marginLeft: 40, marginRight: 70 },
  progressFill: { height: "100%", backgroundColor: "black", borderRadius: 6 },
  mainContainer: { padding: 16, gap: 12 },
  title: { fontWeight: "600", fontSize: 28, marginBottom: 10, marginTop: 24, alignSelf: "center" },
  itemTxt: { fontWeight: "500", fontSize: 14 },
  dropdown: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#0F161E59", paddingHorizontal: 12, paddingVertical: 14, borderRadius: 8, marginTop: 16 },
  footer: { marginTop: "auto", paddingHorizontal: 18, paddingBottom: 24, gap: 20 },
  modalContainer: { flex: 1, backgroundColor: "#fff", paddingTop: 30, paddingHorizontal: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 },
  modalTitle: { fontSize: 16, fontWeight: "600", textAlign: "center", flex: 1 },
  jobItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  skipText: { color: "black", fontSize: 16, fontWeight: "700", alignSelf: "center" },
});

const webStyles = StyleSheet.create({
  container: { gap: 12 },
  progressBar: { height: 6, backgroundColor: "#E5E5EA", borderRadius: 6, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", backgroundColor: "black", borderRadius: 6 },
  title: { fontSize: 32, fontWeight: "700", color: "#111", textAlign: "center" },
  fields: { gap: 12, marginTop: 8 },
  footer: { marginTop: 28, gap: 20 },
});
