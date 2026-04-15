import { Colors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type SalarySheetProps = {
  currentValue: string;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
};

export const SALARY_OPTIONS = [
  "Prefer not to say",
  "$0 - $50,000",
  "$50,000 - $75,000",
  "$75,000 - $100,000",
  "$100,000 - $150,000",
  "$150,000 - $200,000",
  "$200,000+",
];

export default function SalarySheet({
  currentValue,
  options,
  onSelect,
  onClose,
}: SalarySheetProps) {
  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Salary Range</Text>
        </View>

        <ScrollView style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionRow,
                currentValue === option && styles.selectedRow,
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  currentValue === option && styles.selectedText,
                ]}
              >
                {option}
              </Text>
              {currentValue === option && (
                <Feather name="check" size={20} color={Colors.black} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    maxHeight: "60%",
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
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  selectedRow: {
    backgroundColor: "#F8F9FA",
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedText: {
    fontWeight: "600",
    color: Colors.black,
  },
});
