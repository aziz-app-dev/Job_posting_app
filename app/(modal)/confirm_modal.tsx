import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ModalType = "confirm" | "error" | "success" | "info";

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  onCancel: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isError?: boolean; // Legacy support
  type?: ModalType;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message = "Are you sure you want to do this?",
  onCancel,
  onConfirm,
  confirmText = "Yes",
  cancelText = "Cancel",
  isError = false,
  type,
}) => {
  // Determine modal type (legacy support for isError prop)
  const modalType: ModalType = type || (isError ? "error" : "confirm");

  const getIconAndColor = () => {
    switch (modalType) {
      case "success":
        return { icon: "checkmark-circle", color: "#22C55E" };
      case "error":
        return { icon: "close-circle", color: Colors.error };
      case "info":
        return { icon: "information-circle", color: "#007AFF" };
      default:
        return { icon: "help-circle", color: Colors.black };
    }
  };

  const { icon, color } = getIconAndColor();
  const showSingleButton = modalType === "error" || modalType === "success" || modalType === "info";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Icon */}
          {modalType !== "confirm" && (
            <View style={styles.iconContainer}>
              <Ionicons name={icon as any} size={48} color={color} />
            </View>
          )}

          <Text style={[styles.title, { color: modalType === "error" ? Colors.error : Colors.black }]}>
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttons}>
            {!showSingleButton && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#E5EAF1" }]}
                onPress={onCancel}
              >
                <Text style={[styles.buttonText, { color: Colors.black }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: modalType === "error" ? Colors.error : Colors.black,
                  flex: showSingleButton ? 1 : undefined,
                },
              ]}
              onPress={showSingleButton ? onCancel : onConfirm}
            >
              <Text style={[styles.buttonText, { color: "white" }]}>
                {showSingleButton ? "OK" : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: Colors.grey,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ConfirmationModal;
