// components/VisibilitySheet.tsx
import MyBtn from "@/components/btn";
import { Colors } from "@/constants/theme";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type VisibilityOption = "Public" | "Followers only" | "Private";
type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

type VisibilitySheetProps = {
  current: VisibilityOption;
  onSelect: (value: VisibilityOption) => void;
  onClose?: () => void; // optional — can use router.back() if not provided
};

export default function VisibilitySheet({
  current,
  onSelect,
  onClose,
}: VisibilitySheetProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const options: {
    value: VisibilityOption;
    label: string;
    sub: string;
    iconName: MaterialIconName;
  }[] = [
    {
      value: "Public",
      label: "Public",
      sub: "Anyone on the platform can see",
      iconName: "public",
    },
    {
      value: "Followers only",
      label: "Followers only",
      sub: "Only people who follow you",
      iconName: "groups",
    },
    {
      value: "Private",
      label: "Private",
      sub: "Only you can see this post",
      iconName: "block-flipped",
    },
  ];

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Who can see this post</Text>
          {/* <Feather name="x" size={24} color="#000" onPress={handleClose} /> */}
        </View>

        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                current === option.value && styles.selectedRow,
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.row}>
               <MaterialIcons name={option.iconName} size={24} color="black" />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>{option.label}</Text>
                  <Text style={styles.optionSub}>{option.sub}</Text>
                </View>
              </View>

              {current === option.value && (
                <Feather name="check" size={22} color={Colors.black} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <MyBtn
            title="Done"
            textColor="white"
            onPress={handleClose}
            // Assuming MyBtn accepts containerStyle or similar props if needed
          />
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
    backgroundColor: "rgba(0,0,0,0.4)", // ← matched CommentsBottomSheet
  },

  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 350,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    marginBottom: 15,
    borderColor: "#E5EAF1", // same as comments
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },

  optionsContainer: {
    paddingHorizontal: 4,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingRight: 30,
    overflow: "visible",
    borderRadius: 8,
    borderBottomColor: "#E5EAF1",
    borderBottomWidth: 1,
    marginHorizontal: 14,
  },

  selectedRow: {
    backgroundColor: "#F8F9FA", // light gray highlight
  },

  optionTextContainer: {
    flex: 1,
  },

  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
  },

  optionSub: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
  },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderColor: "#E5EAF1",
    backgroundColor: Colors.white,
  },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
});
