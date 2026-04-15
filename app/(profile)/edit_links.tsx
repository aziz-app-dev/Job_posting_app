import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { LinkType, SocialLink } from "@/services/userService";
import {
  AntDesign,
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

// All link types to display
const ALL_LINK_TYPES: LinkType[] = [
  "email",
  "instagram",
  "linkedin",
  "x",
  "website",
];

const LINK_CONFIG: Record<
  LinkType,
  { icon: React.ReactNode; label: string; placeholder: string }
> = {
  email: {
    icon: (
      <MaterialCommunityIcons name="email-outline" size={22} color="#333" />
    ),
    label: "Email",
    placeholder: "name@email.com",
  },
  instagram: {
    icon: <FontAwesome name="instagram" size={22} color="#333" />,
    label: "Instagram",
    placeholder: "instagram.com/",
  },
  linkedin: {
    icon: <FontAwesome name="linkedin-square" size={22} color="#333" />,
    label: "LinkedIn",
    placeholder: "linkedin.com/in/",
  },
  x: {
    icon: <AntDesign name="x" size={22} color="#333" />,
    label: "X",
    placeholder: "x.com/",
  },
  website: {
    icon: <Feather name="arrow-up-right" size={22} color="#333" />,
    label: "Website",
    placeholder: "website.com",
  },
};

const goBack = () => {
  if (router.canGoBack()) router.back();
  else router.replace("/(tabs)");
};

export default function EditLinksScreen() {
  const { profile, updateProfile } = useAuth();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= 768;

  // Initialize with all link types, using existing values from profile
  const getInitialLinks = (): Record<LinkType, string> => {
    const initial: Record<LinkType, string> = {
      email: "",
      instagram: "",
      linkedin: "",
      x: "",
      website: "",
    };

    // Fill in existing values from profile
    profile?.links?.forEach((link) => {
      initial[link.type] = link.value;
    });

    return initial;
  };

  const [linkValues, setLinkValues] =
    useState<Record<LinkType, string>>(getInitialLinks);
  const [errorModal, setErrorModal] = useState({ visible: false, title: "", message: "" });

  const handleValueChange = (type: LinkType, value: string) => {
    setLinkValues((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleClearLink = (type: LinkType) => {
    setLinkValues((prev) => ({
      ...prev,
      [type]: "",
    }));
  };

  const handleSave = async () => {
    // Convert to SocialLink array, only including non-empty links
    const validLinks: SocialLink[] = ALL_LINK_TYPES.filter(
      (type) => linkValues[type].trim() !== ""
    ).map((type) => ({
      type,
      value: linkValues[type].trim(),
    }));

    const { error } = await updateProfile({ links: validLinks });

    if (error) {
      setErrorModal({ visible: true, title: "Error", message: error });
    } else {
      goBack();
    }
  };

  return (
    <View style={styles.container}>
      {isWeb && (
        <View style={styles.webHeader}>
          <TouchableOpacity onPress={goBack} style={styles.webBackButton}>
            <Feather name="arrow-left" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.webHeaderTitle}>Add Social Links</Text>
          <View style={{ width: 32 }} />
        </View>
      )}
      <Text style={styles.subtitle}>
        Add links that showcase your work, recognition, personality and more!
      </Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {ALL_LINK_TYPES.map((type) => (
          <View key={type} style={styles.linkRow}>
            <View style={styles.dragHandle}>
              <MaterialCommunityIcons name="dots-grid" size={20} color="#999" />
            </View>

            <View style={styles.linkIcon}>{LINK_CONFIG[type].icon}</View>

            <TextInput
              style={styles.linkInput}
              value={linkValues[type]}
              onChangeText={(value) => handleValueChange(type, value)}
              placeholder={LINK_CONFIG[type].placeholder}
              placeholderTextColor="#999"
              keyboardType={type === "email" ? "email-address" : "url"}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.linkActions}>
              <TouchableOpacity
                onPress={() => handleClearLink(type)}
                style={styles.actionButton}
              >
                <Feather name="trash-2" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ConfirmationModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        isError
        onCancel={() => setErrorModal({ ...errorModal, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    // marginBottom: "13%",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dragHandle: {
    marginRight: 8,
  },
  linkIcon: {
    width: 32,
    alignItems: "center",
  },
  linkInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    marginLeft: 12,
    paddingVertical: 8,
  },
  linkActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E5EAF1",
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
