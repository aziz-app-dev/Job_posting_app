import ModalShell from "@/components/ModalShell";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { hideUserPosts } from "@/services/hideService";
import { reportPost, ReportReason } from "@/services/reportService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmationModal from "./confirm_modal";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

const OptionsBottomSheet = () => {
  const { postId, authorId, authorName, postCaption } =
    useLocalSearchParams<{
      postId: string;
      authorId: string;
      authorName: string;
      postImage: string;
      postCaption: string;
    }>();

  const { user, blockUser } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "confirm" as "confirm" | "error" | "success" | "info",
    onConfirm: undefined as (() => void) | undefined,
  });

  const onClose = () => {
    router.back();
  };

  const showModal = (
    title: string,
    message: string,
    type: "confirm" | "error" | "success" | "info" = "info",
    onConfirm?: () => void
  ) => {
    setConfirmModal({ visible: true, title, message, type, onConfirm });
  };

  const hideModal = () => {
    setConfirmModal({ ...confirmModal, visible: false, onConfirm: undefined });
  };

  // ── Share Post ──
  const handleShare = async () => {
    try {
      const deepLink = `workcircle://post/${postId}`;
      const caption = postCaption
        ? `\n\n"${postCaption.slice(0, 100)}${postCaption.length > 100 ? "..." : ""}"`
        : "";
      await Share.share({
        message: `Check out this post by ${authorName || "someone"} on WorkCircle!${caption}\n\n${deepLink}`,
      });
    } catch {
      // User cancelled
    }
    onClose();
  };

  // ── Not Interested ──
  const handleNotInterested = async () => {
    if (!user?.uid || !authorId) return;
    setIsProcessing(true);
    const { error } = await hideUserPosts(user.uid, authorId);
    setIsProcessing(false);

    if (error) {
      showModal("Error", error, "error");
    } else {
      showModal(
        "Done",
        `You won't see posts from ${authorName || "this user"} anymore.`,
        "success"
      );
    }
  };

  // ── Block User ──
  const handleBlock = () => {
    if (!authorId || user?.uid === authorId) {
      onClose();
      return;
    }

    showModal(
      `Block @${authorName || "user"}?`,
      "They won't be able to see your posts, and you won't see theirs. They won't be notified.",
      "confirm",
      async () => {
        hideModal();
        setIsProcessing(true);
        const { error } = await blockUser(authorId);
        setIsProcessing(false);
        if (error) {
          showModal("Error", error, "error");
        } else {
          showModal("Blocked", `@${authorName || "User"} has been blocked.`, "success");
        }
      }
    );
  };

  // ── Report ──
  const handleSubmitReport = async () => {
    if (!selectedReason || !user?.uid || !postId) return;

    setIsSubmitting(true);
    const { error } = await reportPost(
      user.uid,
      postId,
      authorId || "",
      selectedReason,
      reportDetails
    );
    setIsSubmitting(false);

    if (error) {
      showModal("Error", "Failed to submit report. Please try again.", "error");
    } else {
      showModal("Report Submitted", "Thank you. We'll review this post shortly.", "success");
    }
  };

  const handleModalDismiss = () => {
    const wasSuccessOrInfo =
      confirmModal.type === "success" || confirmModal.type === "info";
    hideModal();
    if (wasSuccessOrInfo) {
      onClose();
    }
  };

  const OptionRow = ({
    icon,
    label,
    danger,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    danger?: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.optionRow} onPress={onPress}>
      <View style={styles.optionLeft}>
        {icon}
        <Text style={[styles.optionText, danger && { color: Colors.error }]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // ── Report View ──
  if (showReport) {
    return (
      <ModalShell onClose={onClose} width={480} height="70%">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.bottomSheet, { height: "65%" }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowReport(false)}>
              <Feather name="arrow-left" size={22} color={Colors.black} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report Post</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={Colors.black} />
            </Pressable>
          </View>

          <View style={styles.reportContent}>
            <Text style={styles.reportSubtitle}>
              Why are you reporting this post?
            </Text>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.value && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <View
                  style={[
                    styles.radioCircle,
                    selectedReason === reason.value && styles.radioCircleSelected,
                  ]}
                />
                <Text style={styles.reasonText}>{reason.label}</Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.detailsInput}
              placeholder="Additional details (optional)"
              placeholderTextColor="#999"
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitReport}
              disabled={!selectedReason || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ConfirmationModal
          visible={confirmModal.visible}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onCancel={handleModalDismiss}
          onConfirm={confirmModal.onConfirm}
        />
      </View>
      </ModalShell>
    );
  }

  // ── Main Options View ──
  return (
    <ModalShell onClose={onClose} width={440} height="auto">
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.bottomSheet}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Options</Text>
            <Text style={styles.headerSubTitle}>workcircle.com</Text>
          </View>
          <Pressable onPress={onClose}>
            <Feather name="x" size={22} color={Colors.black} />
          </Pressable>
        </View>

        <View style={styles.optionsGroup}>
          <OptionRow
            icon={<Feather name="share" size={20} color={Colors.black} />}
            label="Share post"
            onPress={handleShare}
          />

          {user?.uid !== authorId && (
            <OptionRow
              icon={
                <Ionicons name="eye-off-outline" size={20} color={Colors.black} />
              }
              label="Not interested"
              onPress={handleNotInterested}
            />
          )}

          {user?.uid !== authorId && (
            <OptionRow
              icon={<Feather name="slash" size={20} color={Colors.error} />}
              label={`Block @${authorName || "user"}`}
              danger
              onPress={handleBlock}
            />
          )}
        </View>

        {user?.uid !== authorId && (
          <View style={styles.optionsGroupSecond}>
            <OptionRow
              icon={<Feather name="flag" size={20} color={Colors.error} />}
              label="Report"
              danger
              onPress={() => setShowReport(true)}
            />
          </View>
        )}
      </View>

      {/* Processing loader */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.black} />
          </View>
        </View>
      )}

      <ConfirmationModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onCancel={handleModalDismiss}
        onConfirm={confirmModal.onConfirm}
        confirmText={confirmModal.title.startsWith("Block") ? "Block" : "Yes"}
      />
    </View>
    </ModalShell>
  );
};

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
    backgroundColor: "#F6F6F5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#E5EAF1",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.black,
  },
  headerSubTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.grey,
  },
  optionsGroup: {
    backgroundColor: "white",
    margin: 20,
    marginBottom: 10,
    borderRadius: 10,
  },
  optionsGroupSecond: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 10,
  },
  optionRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderColor: "#E5EAF1",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.black,
  },
  reportContent: {
    padding: 20,
  },
  reportSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    gap: 12,
  },
  reasonOptionSelected: {
    backgroundColor: "#f0f0f0",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  radioCircleSelected: {
    borderColor: Colors.black,
    backgroundColor: Colors.black,
  },
  reasonText: {
    fontSize: 15,
    color: "#333",
  },
  detailsInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    marginTop: 12,
    color: "#000",
  },
  submitButton: {
    backgroundColor: Colors.black,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  loadingBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
});

export default OptionsBottomSheet;
