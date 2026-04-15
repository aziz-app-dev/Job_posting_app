import MyBtn from "@/components/btn";
import { Colors } from "@/constants/theme";
import { LinkType, SocialLink } from "@/services/userService";
import {
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmationModal from "./confirm_modal";

type LinksSheetProps = {
  links: SocialLink[];
  onSave: (links: SocialLink[]) => void;
  onClose: () => void;
};

const LINK_CONFIG: Record<
  LinkType,
  { icon: React.ReactNode; label: string; placeholder: string }
> = {
  email: {
    icon: <MaterialCommunityIcons name="email-outline" size={22} color="#333" />,
    label: "Email",
    placeholder: "name@email.com",
  },
  instagram: {
    icon: <FontAwesome name="instagram" size={22} color="#333" />,
    label: "Instagram",
    placeholder: "instagram.com/username",
  },
  linkedin: {
    icon: <FontAwesome name="linkedin-square" size={22} color="#333" />,
    label: "LinkedIn",
    placeholder: "linkedin.com/in/username",
  },
  twitter: {
    icon: <FontAwesome name="twitter" size={22} color="#333" />,
    label: "Twitter/X",
    placeholder: "twitter.com/username",
  },
  website: {
    icon: <Feather name="arrow-up-right" size={22} color="#333" />,
    label: "Website",
    placeholder: "website.com",
  },
};

const AVAILABLE_LINK_TYPES: LinkType[] = [
  "email",
  "instagram",
  "linkedin",
  "twitter",
  "website",
];

export default function LinksSheet({
  links,
  onSave,
  onClose,
}: LinksSheetProps) {
  const [tempLinks, setTempLinks] = useState<SocialLink[]>(links);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [infoModal, setInfoModal] = useState({ visible: false, title: "", message: "" });

  const handleAddLink = (type: LinkType) => {
    // Check if this type already exists
    if (tempLinks.some((link) => link.type === type)) {
      setInfoModal({ visible: true, title: "Already Added", message: `You already have a ${LINK_CONFIG[type].label} link.` });
      return;
    }
    setTempLinks([...tempLinks, { type, value: "" }]);
    setEditingIndex(tempLinks.length);
    setEditValue("");
  };

  const handleEditLink = (index: number) => {
    setEditingIndex(index);
    setEditValue(tempLinks[index].value);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const updated = [...tempLinks];
      updated[editingIndex].value = editValue.trim();
      setTempLinks(updated);
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const handleDeleteLink = (index: number) => {
    const updated = tempLinks.filter((_, i) => i !== index);
    setTempLinks(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const handleDone = () => {
    // Filter out empty links before saving
    const validLinks = tempLinks.filter((link) => link.value.trim() !== "");
    onSave(validLinks);
    onClose();
  };

  const availableToAdd = AVAILABLE_LINK_TYPES.filter(
    (type) => !tempLinks.some((link) => link.type === type)
  );

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.bottomSheet}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add social links</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.subtitle}>
          Add links that showcase your work, recognition, personality and more!
        </Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {tempLinks.map((link, index) => (
            <View key={`${link.type}-${index}`} style={styles.linkRow}>
              <View style={styles.dragHandle}>
                <Feather name="more-vertical" size={16} color="#999" />
              </View>

              <View style={styles.linkIcon}>
                {LINK_CONFIG[link.type].icon}
              </View>

              {editingIndex === index ? (
                <TextInput
                  style={styles.linkInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder={LINK_CONFIG[link.type].placeholder}
                  placeholderTextColor="#999"
                  autoFocus
                  onBlur={handleSaveEdit}
                  onSubmitEditing={handleSaveEdit}
                  keyboardType={link.type === "email" ? "email-address" : "url"}
                  autoCapitalize="none"
                />
              ) : (
                <Text
                  style={[
                    styles.linkValue,
                    !link.value && styles.linkPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {link.value || LINK_CONFIG[link.type].placeholder}
                </Text>
              )}

              <View style={styles.linkActions}>
                <TouchableOpacity
                  onPress={() => handleEditLink(index)}
                  style={styles.actionButton}
                >
                  <Feather name="edit-2" size={18} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteLink(index)}
                  style={styles.actionButton}
                >
                  <Feather name="trash-2" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add a link section */}
          {availableToAdd.length > 0 && (
            <View style={styles.addSection}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  if (availableToAdd.length === 1) {
                    handleAddLink(availableToAdd[0]);
                  } else {
                    setShowLinkPicker(!showLinkPicker);
                  }
                }}
              >
                <Feather name="plus" size={20} color="#333" />
                <Text style={styles.addButtonText}>Add a link</Text>
              </TouchableOpacity>

              {/* Link type picker */}
              {showLinkPicker && (
                <View style={{ marginTop: 8, gap: 6 }}>
                  {availableToAdd.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: "#f9f9f9",
                        borderRadius: 8,
                      }}
                      onPress={() => {
                        setShowLinkPicker(false);
                        handleAddLink(type);
                      }}
                    >
                      {LINK_CONFIG[type].icon}
                      <Text style={{ fontSize: 15, color: "#333" }}>
                        {LINK_CONFIG[type].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <MyBtn title="Done" onPress={handleDone} textColor="white" />
        </View>
      </View>

      <ConfirmationModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        type="info"
        onCancel={() => setInfoModal({ ...infoModal, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    minHeight: 400,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#E5EAF1",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.black,
  },
  headerSpacer: {
    width: 32,
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
  linkValue: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    marginLeft: 12,
  },
  linkPlaceholder: {
    color: "#999",
  },
  linkInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    marginLeft: 12,
    paddingVertical: 0,
  },
  linkActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  addSection: {
    paddingTop: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  addButtonText: {
    fontSize: 15,
    color: "#333",
  },
  footer: {
    position: "absolute",
    bottom: 34,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
});
