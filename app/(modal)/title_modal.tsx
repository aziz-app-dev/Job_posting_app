// components/TitleRoleSheet.tsx
import MyBtn from "@/components/btn";
import MyInput from "@/components/input_field";
import { COMMON_ROLES } from "@/constants/data";
import { Colors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type TitleRoleSheetProps = {
  currentValue: string;
  onSelect: (selected: string) => void;
  onClose: () => void;
};



export default function TitleRoleSheet({
  currentValue,
  onSelect,
  onClose,
}: TitleRoleSheetProps) {
  const [search, setSearch] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Keyboard handling (same pattern as your BookmarkModal)
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true)
    );
    const subHide = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false)
    );

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return COMMON_ROLES;
    const lower = search.toLowerCase();
    return COMMON_ROLES.filter((role) => role.toLowerCase().includes(lower));
  }, [search]);

  const handleSelect = (role: string) => {
    onSelect(role);
    onClose();
  };

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={[
        styles.bottomSheet,
        keyboardVisible && styles.bottomSheetKeyboard
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select title / role</Text>
        </View>

        {/* Body */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Search input at the top */}
            <View style={styles.searchContainer}>
              <MyInput
                onChangeText={setSearch}
                value={search}
                placeholder="Search roles..."
                autoCapitalize="none"
                title={""}
              />
            </View>

            {/* Scrollable list */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
            >
              {filteredRoles.length === 0 ? (
                <Text style={styles.noResults}>No roles found</Text>
              ) : (
                filteredRoles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleRow,
                      role === currentValue && styles.selectedRow,
                    ]}
                    onPress={() => handleSelect(role)}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        role === currentValue && styles.selectedText,
                      ]}
                    >
                      {role}
                    </Text>
                    {role === currentValue && (
                      <Feather name="check" size={20} color={Colors.black} />
                    )}
                  </TouchableOpacity>
                ))
              )}

              {/* Optional: custom / add new role row */}
              {search.trim() &&
                !COMMON_ROLES.some(
                  (r) => r.toLowerCase() === search.toLowerCase()
                ) && (
                  <TouchableOpacity
                    style={styles.roleRow}
                    onPress={() => handleSelect(search.trim())}
                  >
                    <Text style={[styles.roleText, { fontStyle: "italic" }]}>
                      Use custom: {search.trim()}
                    </Text>
                  </TouchableOpacity>
                )}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>

        {/* Fixed footer button */}
        <View style={[styles.footer, keyboardVisible && styles.footerKeyboard]}>
          <MyBtn onPress={onClose} title="Done" textColor="white" />
        </View>
      </View>
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
    maxHeight: "95%",
    minHeight: "95%",
    paddingBottom: 34,
  },
  bottomSheetKeyboard: {
    maxHeight: "100%",
    paddingBottom: 0,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    alignContent: "center",
    justifyContent: "center",
    // marginHorizontal: 20,
    // marginVertical: 16,
    paddingHorizontal: 14,
    // paddingVertical: 10,
    // backgroundColor: "#F5F5F5",
    // borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  selectedRow: {
    backgroundColor: "#F8F9FA",
    borderRadius:6
  },
  roleText: {
    fontSize: 16,
    color: Colors.black,
  },
  selectedText: {
    fontWeight: "600",
  },
  noResults: {
    textAlign: "center",
    color: "#999",
    fontSize: 15,
    paddingVertical: 30,
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
  footerKeyboard: {
    bottom: 0,
  },
});
