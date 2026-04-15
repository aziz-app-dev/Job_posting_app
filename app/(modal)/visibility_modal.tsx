import { Colors } from "@/constants/theme";
import { VisibilityOption } from "@/services/userService";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FieldVisibilitySheetProps = {
  title: string;
  current: VisibilityOption;
  onSelect: (value: VisibilityOption) => void;
  onClose: () => void;
};

const VISIBILITY_OPTIONS: {
  value: VisibilityOption;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "Everyone",
    label: "Everyone",
    description: "Visible to all users",
    icon: "eye-outline",
  },
  {
    value: "Only me",
    label: "Only me",
    description: "Only you can see this",
    icon: "eye-off-outline",
  },
];

export default function FieldVisibilitySheet({
  title,
  current,
  onSelect,
  onClose,
}: FieldVisibilitySheetProps) {
  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {VISIBILITY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                current === option.value && styles.selectedRow,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <View style={styles.optionContent}>
                <Ionicons name={option.icon} size={24} color="#333" />
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      current === option.value && styles.selectedText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
              </View>
              {current === option.value && (
                <Feather name="check" size={20} color={Colors.black} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
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
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#E5EAF1",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.black,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedRow: {
    backgroundColor: "#F8F9FA",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  optionDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  selectedText: {
    fontWeight: "600",
    color: Colors.black,
  },
});
