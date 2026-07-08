import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { PrivacyOption, VisibilityOption } from "@/services/userService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";
import LocationSheet from "../(modal)/location_modal";
import AccountPrivacySheet from "../(modal)/privacy_modal";
import SalarySheet, { SALARY_OPTIONS } from "../(modal)/salary_modal";
import TitleRoleSheet from "../(modal)/title_modal";
import TopicsSheet from "../(modal)/topics_modal";
import FieldVisibilitySheet from "../(modal)/visibility_modal";

const goBack = () => {
  if (router.canGoBack()) router.back();
  else router.replace("/(tabs)");
};

const EditProfileScreen: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { openModal } = useLocalSearchParams<{ openModal?: string }>();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= 768;
  const bioInputRef = useRef<TextInput>(null);

  // Local state for editable fields (initialized from profile)
  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || ""
  );
  const [title, setTitle] = useState(profile?.title || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [salary, setSalary] = useState(profile?.salaryRange || "");
  const [interests, setInterests] = useState<string[]>(
    profile?.interests || []
  );
  const [privacy, setPrivacy] = useState<PrivacyOption>(
    profile?.privacy || "Public"
  );
  const [locationVisibility, setLocationVisibility] =
    useState<VisibilityOption>(profile?.locationVisibility || "Everyone");
  const [salaryVisibility, setSalaryVisibility] = useState<VisibilityOption>(
    profile?.salaryVisibility || "Everyone"
  );

  // Modal visibility states
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showLocationVisibilityModal, setShowLocationVisibilityModal] =
    useState(false);
  const [showSalaryVisibilityModal, setShowSalaryVisibilityModal] =
    useState(false);

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({ visible: false, type: "info", title: "", message: "" });

  const showAlert = (type: "success" | "error" | "info", title: string, message: string) => {
    setAlertModal({ visible: true, type, title, message });
  };

  // Get links count from profile (links are edited on separate page)
  const linksCount = profile?.links?.length || 0;

  // Auto-open modal based on navigation param
  useEffect(() => {
    if (openModal === "title") {
      setShowTitleModal(true);
    } else if (openModal === "bio") {
      // Focus the bio input after a short delay to ensure it's rendered
      setTimeout(() => {
        bioInputRef.current?.focus();
      }, 300);
    }
  }, [openModal]);

  const username = user?.email ? `@${user.email.split("@")[0]}` : "@user";
  const avatarUrl = profile?.photoURL || user?.photoURL || "";

  const handleSave = async () => {
    const { error } = await updateProfile({
      displayName,
      title,
      bio,
      location,
      locationVisibility,
      salaryRange: salary,
      salaryVisibility,
      interests,
      privacy,
    });

    if (error) {
      showAlert("error", "Error", error);
    } else {
      showAlert("success", "Success", "Profile updated successfully");
    }
  };

  const handleAlertClose = () => {
    const wasSuccess = alertModal.type === "success";
    setAlertModal({ ...alertModal, visible: false });
    if (wasSuccess) {
      goBack();
    }
  };

  const handleImageEdit = () => {
    router.push("/(auth)/img_screen?fromEdit=true");
  };

  return (
    <View style={styles.container}>
      <View style={styles.webHeader}>
        <TouchableOpacity onPress={goBack} style={styles.webBackButton}>
          <Feather name="arrow-left" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.webHeaderTitle}>Edit Profile</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Image */}
        <View style={styles.imageContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Feather name="user" size={40} color="#999" />
            </View>
          )}
          <TouchableOpacity style={styles.editIcon} onPress={handleImageEdit}>
            <Feather name="edit-2" size={14} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Username (read-only) */}
        <View style={styles.row}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.valueWrapper}>
            <Text style={styles.valueText}>{username}</Text>
          </View>
        </View>

        {/* Name */}
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <View style={styles.valueWrapper}>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Title */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowTitleModal(true)}
        >
          <Text style={styles.label}>Title</Text>
          <View style={styles.touchableWrapper}>
            <Text
              style={[styles.valueText, !title && styles.placeholder]}
              numberOfLines={1}
            >
              {title || "Add title"}
            </Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </View>
        </TouchableOpacity>

        {/* About */}
        <View style={styles.aboutRow}>
          <Text style={styles.label}>About</Text>
          <View style={styles.aboutWrapper}>
            <TextInput
              ref={bioInputRef}
              style={styles.aboutInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.fieldWithVisibility}>
          <TouchableOpacity
            style={styles.fieldMain}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={styles.label}>Location</Text>
            <View style={styles.touchableWrapper}>
              <Text
                style={[styles.valueText, !location && styles.placeholder]}
                numberOfLines={1}
              >
                {location || "Add location"}
              </Text>
              <View
                style={{ flexDirection: "row", gap: 5, alignItems: "center" }}
              >
                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={() => setShowLocationVisibilityModal(true)}
                >
                  <Ionicons
                    name={
                      locationVisibility === "Everyone"
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                <Feather name="chevron-right" size={20} color="#999" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Salary */}
        <View style={styles.fieldWithVisibility}>
          <TouchableOpacity
            style={styles.fieldMain}
            onPress={() => setShowSalaryModal(true)}
          >
            <Text style={styles.label}>Salary</Text>
            <View style={styles.touchableWrapper}>
              <Text
                style={[styles.valueText, !salary && styles.placeholder]}
                numberOfLines={1}
              >
                {salary || "Add salary range"}
              </Text>
              <View
                style={{ flexDirection: "row", gap: 5, alignItems: "center" }}
              >
                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={() => setShowSalaryVisibilityModal(true)}
                >
                  <Ionicons
                    name={
                      salaryVisibility === "Everyone"
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                <Feather name="chevron-right" size={20} color="#999" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Interests */}
        <TouchableOpacity
          style={styles.interestRow}
          onPress={() => setShowInterestsModal(true)}
        >
          <Text style={styles.label}>Interest</Text>
          <View style={styles.interestWrapper}>
            <View style={styles.chipsContainer}>
              {interests.length > 0 ? (
                interests.map((interest, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{interest}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.placeholder}>Add interests</Text>
              )}
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color="#999"
              style={styles.chevron}
            />
          </View>
        </TouchableOpacity>

        {/* Links */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/(profile)/edit_links")}
        >
          <Text style={styles.label}>Links</Text>
          <View style={styles.touchableWrapper}>
            <Text
              style={[styles.valueText, linksCount === 0 && styles.placeholder]}
            >
              {linksCount > 0
                ? `${linksCount} link${linksCount > 1 ? "s" : ""}`
                : "Add links"}
            </Text>
            <Feather name="chevron-right" size={20} color="#999" />
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Profile Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Profile Information</Text>
          <Text style={styles.sectionSubText}>
            Who can see your account and content
          </Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowPrivacyModal(true)}
          >
            <Text style={styles.privacyLabel}>Account privacy</Text>
            <View style={styles.privacyValueRow}>
              <Text style={styles.valueText}>{privacy}</Text>
              <Feather name="chevron-right" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Title Modal */}
      <Modal
        visible={showTitleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTitleModal(false)}
      >
        <TitleRoleSheet
          currentValue={title}
          onSelect={(value) => {
            setTitle(value);
            setShowTitleModal(false);
          }}
          onClose={() => setShowTitleModal(false)}
        />
      </Modal>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <LocationSheet
          currentValue={location}
          onSave={setLocation}
          onClose={() => setShowLocationModal(false)}
        />
      </Modal>

      {/* Interests Modal */}
      <Modal
        visible={showInterestsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInterestsModal(false)}
      >
        <TopicsSheet
          topics={interests}
          onSave={setInterests}
          onClose={() => setShowInterestsModal(false)}
        />
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <AccountPrivacySheet
          current={privacy}
          onSelect={(value) => {
            setPrivacy(value);
            setShowPrivacyModal(false);
          }}
          onClose={() => setShowPrivacyModal(false)}
        />
      </Modal>

      {/* Salary Modal */}
      <Modal
        visible={showSalaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSalaryModal(false)}
      >
        <SalarySheet
          currentValue={salary}
          options={SALARY_OPTIONS}
          onSelect={(value) => {
            setSalary(value);
            setShowSalaryModal(false);
          }}
          onClose={() => setShowSalaryModal(false)}
        />
      </Modal>

      {/* Location Visibility Modal */}
      <Modal
        visible={showLocationVisibilityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationVisibilityModal(false)}
      >
        <FieldVisibilitySheet
          title="Location visibility"
          current={locationVisibility}
          onSelect={(value) => {
            setLocationVisibility(value);
            setShowLocationVisibilityModal(false);
          }}
          onClose={() => setShowLocationVisibilityModal(false)}
        />
      </Modal>

      {/* Salary Visibility Modal */}
      <Modal
        visible={showSalaryVisibilityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSalaryVisibilityModal(false)}
      >
        <FieldVisibilitySheet
          title="Salary visibility"
          current={salaryVisibility}
          onSelect={(value) => {
            setSalaryVisibility(value);
            setShowSalaryVisibilityModal(false);
          }}
          onClose={() => setShowSalaryVisibilityModal(false)}
        />
      </Modal>

      {/* Alert Modal */}
      <ConfirmationModal
        visible={alertModal.visible}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onCancel={handleAlertClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  webBackButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  webHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  imageContainer: {
    alignSelf: "center",
    marginVertical: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },

  // Two-column row layout
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  label: {
    width: 80,
    fontSize: 14,
    color: "#666",
  },
  valueWrapper: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingVertical: 8,
  },
  valueText: {
    fontSize: 16,
    color: "#000",
  },
  input: {
    fontSize: 16,
    color: "#000",
    padding: 0,
  },
  placeholder: {
    color: "#999",
    fontSize: 16,
  },
  touchableWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingVertical: 8,
    gap: 8,
  },

  // Field with visibility toggle
  fieldWithVisibility: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  visibilityButton: {
    padding: 8,
    marginLeft: 4,
  },

  // About field (multiline)
  aboutRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  aboutWrapper: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingVertical: 8,
  },
  aboutInput: {
    fontSize: 16,
    color: "#000",
    padding: 0,
    minHeight: 60,
    lineHeight: 22,
  },

  // Interests row
  interestRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  interestWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingVertical: 8,
  },
  chipsContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  chipText: {
    fontSize: 14,
    color: "#333",
  },
  chevron: {
    marginLeft: 8,
    marginTop: 8,
  },

  // Divider and Section
  divider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginVertical: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  sectionSubText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },

  // Privacy row (no border under label)
  privacyLabel: {
    fontSize: 14,
    color: "#666",
  },
  privacyValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Save button
  saveButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  saveButton: {
    backgroundColor: Colors.black,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default EditProfileScreen;
