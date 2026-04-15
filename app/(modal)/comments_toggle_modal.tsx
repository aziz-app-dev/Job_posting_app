import MyBtn from "@/components/btn";
import { Colors } from "@/constants/theme";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type CommentsToggleSheetProps = {
  current: boolean;
  onSelect: (value: boolean) => void;
  onClose: () => void;
};

export default function CommentsToggleSheet({
  current,
  onSelect,
  onClose,
}: CommentsToggleSheetProps) {
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.topSheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Who can comment</Text>
        </View>

        <View style={styles.body}>
          <TouchableOpacity
            style={[styles.optionRow, current === true && styles.selectedRow]}
            onPress={() => onSelect(true)}
          >
            <View style={styles.row}>
               <Feather name="eye" size={24} color="black" />
              <View>
                <Text style={styles.optionText}>On</Text>
                <Text style={styles.optionSub}>
                  Anyone can comment on this post
                </Text>
              </View>
            </View>
            {current === true && (
              <Feather name="check" size={22} color={Colors.black} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionRow, current === false && styles.selectedRow]}
            onPress={() => onSelect(false)}
          >
            <View style={styles.row}>
              <MaterialIcons name="block" size={24} color="black" />
              <View>
                <Text style={styles.optionText}>Off</Text>
                <Text style={styles.optionSub}>Comments are disabled</Text>
              </View>
            </View>
            {current === false && (
              <Feather name="check" size={22} color={Colors.black} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <MyBtn title="Done" textColor="white" onPress={onClose} />
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

  topSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "38%",
    paddingBottom: 34,
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
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  optionRow: {
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
    borderRadius: 6,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.black,
  },
  optionSub: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
});
