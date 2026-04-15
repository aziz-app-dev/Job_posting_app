import { Colors } from "@/constants/theme";
import {
  APPLICATION_STATUS_CONFIG,
  ApplicationStatus,
  JobApplication,
} from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import {
  getJobApplications,
  updateApplicationStatus,
} from "@/services/jobApplicationService";
import { getOrCreateConversation } from "@/services/messagingService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

type FilterTab = "all" | ApplicationStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "applied", label: "New" },
  { key: "viewed", label: "Viewed" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "hired", label: "Hired" },
  { key: "rejected", label: "Rejected" },
];

const JobApplicantsScreen = () => {
  const { postId, jobTitle, jobImage, jobType, companyName, location } =
    useLocalSearchParams<{
      postId: string;
      jobTitle: string;
      jobImage?: string;
      jobType?: string;
      companyName?: string;
      location?: string;
    }>();
  const { user, profile } = useAuth();
  const { width: winWidth } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && winWidth >= 768;
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Interview scheduling modal
  const [interviewModal, setInterviewModal] = useState<{
    visible: boolean;
    applicationId: string;
    applicantName: string;
  }>({ visible: false, applicationId: "", applicantName: "" });
  const [interviewNote, setInterviewNote] = useState("");

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    type: "confirm" | "success" | "error" | "info";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ visible: false, type: "info", title: "", message: "" });

  useEffect(() => {
    loadApplications();
  }, [postId]);

  const loadApplications = async () => {
    if (!postId) return;
    setIsLoading(true);
    const { applications: apps } = await getJobApplications(postId);
    setApplications(apps);
    setIsLoading(false);
  };

  const handleStatusUpdate = async (
    applicationId: string,
    newStatus: ApplicationStatus,
    note?: string
  ) => {
    setUpdatingId(applicationId);
    const { error } = await updateApplicationStatus(
      applicationId,
      newStatus,
      note,
      profile?.displayName || user?.displayName || "Recruiter",
      profile?.photoURL || user?.photoURL || ""
    );
    if (error) {
      setConfirmModal({ visible: true, type: "error", title: "Error", message: error });
    } else {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      const config = APPLICATION_STATUS_CONFIG[newStatus];
      setConfirmModal({
        visible: true,
        type: "success",
        title: config.label,
        message: `Application status updated to ${config.label}`,
      });
    }
    setUpdatingId(null);
  };

  const handleScheduleInterview = () => {
    const { applicationId } = interviewModal;
    setInterviewModal({ ...interviewModal, visible: false });
    handleStatusUpdate(
      applicationId,
      "shortlisted",
      interviewNote ? `Interview: ${interviewNote}` : "Shortlisted for interview"
    );
    setInterviewNote("");
  };

  const handleMessage = async (applicantId: string, applicantName: string, applicantAvatar: string, applicantTitle: string) => {
    if (!user?.uid) return;
    const { conversationId } = await getOrCreateConversation(
      user.uid, profile?.displayName || "", profile?.photoURL || "", profile?.title || "",
      applicantId, applicantName, applicantAvatar, applicantTitle
    );
    if (conversationId) {
      router.push({ pathname: "/(profile)/chat", params: { conversationId } });
    }
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ visible: true, type: "confirm", title, message, onConfirm });
  };

  const filteredApps = activeFilter === "all"
    ? applications
    : applications.filter((a) => a.status === activeFilter);

  const getInitial = (name: string) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderApplicant = ({ item }: { item: JobApplication }) => {
    const config = APPLICATION_STATUS_CONFIG[item.status] || APPLICATION_STATUS_CONFIG.applied;
    const isUpdating = updatingId === item.id;

    return (
      <View style={styles.card}>
        {/* Header */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => router.push({ pathname: "/(profile)/public_profile", params: { userId: item.applicantId } })}
        >
          {item.applicantAvatar ? (
            <Image source={{ uri: item.applicantAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{getInitial(item.applicantName)}</Text>
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.applicantName}</Text>
            {item.applicantTitle && <Text style={styles.cardTitle}>{item.applicantTitle}</Text>}
            <Text style={styles.cardDate}>Applied {formatDate(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: config.color + "15" }]}>
          <Feather name={config.icon as any} size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>

        {/* Status History */}
        {item.statusHistory && item.statusHistory.length > 1 && (
          <View style={styles.timeline}>
            {item.statusHistory.map((entry, i) => {
              const c = APPLICATION_STATUS_CONFIG[entry.status];
              return (
                <View key={i} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: c?.color || "#999" }]} />
                  <Text style={styles.timelineText}>
                    {c?.label} {entry.note ? `— ${entry.note}` : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Message applicant */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleMessage(item.applicantId, item.applicantName, item.applicantAvatar, item.applicantTitle)}
          >
            <Feather name="message-circle" size={15} color="#007AFF" />
            <Text style={[styles.actionText, { color: "#007AFF" }]}>Message</Text>
          </TouchableOpacity>

          {/* Mark as Viewed */}
          {item.status === "applied" && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleStatusUpdate(item.id, "viewed")}
              disabled={isUpdating}
            >
              <Feather name="eye" size={15} color="#FF9500" />
              <Text style={[styles.actionText, { color: "#FF9500" }]}>Mark Viewed</Text>
            </TouchableOpacity>
          )}

          {/* Schedule Interview / Shortlist */}
          {(item.status === "applied" || item.status === "viewed") && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                setInterviewModal({ visible: true, applicationId: item.id, applicantName: item.applicantName })
              }
              disabled={isUpdating}
            >
              <Feather name="calendar" size={15} color="#22C55E" />
              <Text style={[styles.actionText, { color: "#22C55E" }]}>Interview</Text>
            </TouchableOpacity>
          )}

          {/* Hire */}
          {(item.status === "shortlisted" || item.status === "viewed") && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.hireBtn]}
              onPress={() =>
                confirmAction("Hire Applicant", `Are you sure you want to hire ${item.applicantName}?`, () => {
                  setConfirmModal({ ...confirmModal, visible: false });
                  handleStatusUpdate(item.id, "hired", "Hired!");
                })
              }
              disabled={isUpdating}
            >
              <Feather name="check-circle" size={15} color="#fff" />
              <Text style={[styles.actionText, { color: "#fff" }]}>Hire</Text>
            </TouchableOpacity>
          )}

          {/* Reject */}
          {item.status !== "rejected" && item.status !== "hired" && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                confirmAction("Reject Applicant", `Are you sure you want to reject ${item.applicantName}?`, () => {
                  setConfirmModal({ ...confirmModal, visible: false });
                  handleStatusUpdate(item.id, "rejected", "Application rejected");
                })
              }
              disabled={isUpdating}
            >
              <Feather name="x-circle" size={15} color="#FF3B30" />
              <Text style={[styles.actionText, { color: "#FF3B30" }]}>Reject</Text>
            </TouchableOpacity>
          )}

          {isUpdating && <ActivityIndicator size="small" color={Colors.black} />}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.black} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header — hidden on web (WebShell provides its own nav) */}
      {!isWeb && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
            <Feather name="arrow-left" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Applicants</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      {/* Job Info */}
      <View style={styles.jobInfo}>
        {jobImage ? (
          <Image source={{ uri: jobImage }} style={styles.jobImg} />
        ) : (
          <View style={[styles.jobImg, { justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0" }]}>
            <Ionicons name="briefcase" size={22} color="#999" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle} numberOfLines={1}>{jobTitle}</Text>
          {companyName && <Text style={styles.jobCompany}>{companyName}</Text>}
          <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
            {jobType && <View style={styles.tag}><Text style={styles.tagText}>{jobType}</Text></View>}
            {location && <View style={styles.tag}><Feather name="map-pin" size={10} color="#666" /><Text style={styles.tagText}>{location}</Text></View>}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {[
          { n: applications.length, l: "Total" },
          { n: applications.filter((a) => a.status === "applied").length, l: "New" },
          { n: applications.filter((a) => a.status === "shortlisted").length, l: "Shortlisted" },
          { n: applications.filter((a) => a.status === "hired").length, l: "Hired" },
        ].map((s, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={styles.statNum}>{s.n}</Text>
            <Text style={styles.statLabel}>{s.l}</Text>
          </View>
        ))}
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}>
        {FILTER_TABS.map((tab) => {
          const count = tab.key === "all" ? applications.length : applications.filter((a) => a.status === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabTextActive]}>
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {filteredApps.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={60} color="#ccc" />
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#555", marginTop: 12 }}>
            {activeFilter === "all" ? "No applications yet" : `No ${activeFilter} applications`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item.id}
          renderItem={renderApplicant}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Interview Scheduling Modal */}
      <Modal visible={interviewModal.visible} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setInterviewModal({ ...interviewModal, visible: false })}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Schedule Interview</Text>
            <Text style={styles.modalSubtitle}>
              Shortlist {interviewModal.applicantName} and add interview details
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Interview details (date, time, link...)"
              placeholderTextColor="#999"
              value={interviewNote}
              onChangeText={setInterviewNote}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setInterviewModal({ ...interviewModal, visible: false })}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleScheduleInterview}>
                <Feather name="calendar" size={16} color="#fff" />
                <Text style={styles.modalConfirmText}>Shortlist & Schedule</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmationModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false, onConfirm: undefined })}
        onConfirm={confirmModal.onConfirm}
      />
    </View>
  );
};

export default JobApplicantsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  jobInfo: { flexDirection: "row", padding: 16, backgroundColor: "#f8f9fa", borderBottomWidth: 1, borderBottomColor: "#f0f0f0", gap: 12 },
  jobImg: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#eee" },
  jobTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  jobCompany: { fontSize: 13, color: "#666", marginTop: 2 },
  tag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "#e0e0e0" },
  tagText: { fontSize: 11, color: "#666" },

  stats: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 2 },

  filterBar: { maxHeight: 54, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", paddingVertical: 10, flexGrow: 0 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f0f0f0", alignSelf: "center" },
  filterTabActive: { backgroundColor: Colors.black },
  filterTabText: { fontSize: 13, fontWeight: "500", color: "#666" },
  filterTabTextActive: { color: "#fff" },

  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#f0f0f0" },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#eee" },
  avatarFallback: { backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  avatarInitial: { color: "#fff", fontSize: 17, fontWeight: "700" },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 15, fontWeight: "600" },
  cardTitle: { fontSize: 13, color: "#666", marginTop: 1 },
  cardDate: { fontSize: 12, color: "#999", marginTop: 3 },

  statusBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginTop: 12 },
  statusText: { fontSize: 13, fontWeight: "600" },

  timeline: { marginTop: 10, marginLeft: 4, gap: 6 },
  timelineItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineText: { fontSize: 12, color: "#888" },

  msgBox: { marginTop: 12, backgroundColor: "#f8f9fa", padding: 12, borderRadius: 8 },
  msgLabel: { fontSize: 11, fontWeight: "600", color: "#999", marginBottom: 4 },
  msgText: { fontSize: 13, color: "#333", lineHeight: 18 },

  actions: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#f5f5f5" },
  hireBtn: { backgroundColor: "#22C55E" },
  actionText: { fontSize: 13, fontWeight: "600" },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", maxWidth: 420, backgroundColor: "#fff", borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, color: "#000" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: "#f0f0f0", alignItems: "center" },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: "#666" },
  modalConfirm: { flex: 2, flexDirection: "row", gap: 6, paddingVertical: 12, borderRadius: 8, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" },
  modalConfirmText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
