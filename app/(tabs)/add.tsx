import MyInput from "@/components/input_field";
import { Colors } from "@/constants/theme";
import { ExperienceLevel, JobType, PostVisibility } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { usePost } from "@/context/PostContext";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import CommentsToggleSheet from "../(modal)/comments_toggle_modal";
import ConfirmationModal from "../(modal)/confirm_modal";
import LocationSheet from "../(modal)/location_modal";
import TitleRoleSheet from "../(modal)/title_modal";
import TopicsSheet from "../(modal)/topics_modal";
import UrlSheet from "../(modal)/url_modal";
import VisibilitySheet from "../(modal)/visibilty_modal";

const JOB_TYPES: JobType[] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
  "Remote",
];
const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "Entry",
  "Mid",
  "Senior",
  "Lead",
  "Executive",
];

const MAX_CHARS = 300;

type MediaItem = {
  uri: string;
  type: "image" | "video";
};

export default function AddPostScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= 768;
  const { draftId, postId } = useLocalSearchParams<{
    draftId?: string;
    postId?: string;
  }>();
  const { profile } = useAuth();
  const {
    publishPost,
    saveToDrafts,
    isUploading,
    drafts,
    removeDraft,
    editPost,
    getPost,
  } = usePost();

  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState(profile?.title || "");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [commentsOn, setCommentsOn] = useState(true);
  const [visibility, setVisibility] = useState<PostVisibility>("Public");
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [originalMediaUrl, setOriginalMediaUrl] = useState<string | null>(null);

  // Job post state
  const [isJobPost, setIsJobPost] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [jobType, setJobType] = useState<JobType>("Full-time");
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("Entry");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("$");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");

  // Modal visibility states
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showJobTypeModal, setShowJobTypeModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  // Alert modal state
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({ visible: false, type: "info", title: "", message: "" });

  const showAlert = (type: "success" | "error" | "info", title: string, message: string) => {
    setAlertModal({ visible: true, type, title, message });
  };

  // Load draft data when draftId is provided
  useEffect(() => {
    if (draftId) {
      const draft = drafts.find((d) => d.id === draftId);
      if (draft) {
        setCaption(draft.caption || "");
        setTitle(draft.title || profile?.title || "");
        setUrl(draft.url || "");
        setLocation(draft.location || "");
        setTopics(draft.topics || []);
        setCommentsOn(draft.commentsEnabled);
        setVisibility(draft.visibility);
        setCurrentDraftId(draft.id);
        if (draft.localMediaUri) {
          setMedia({
            uri: draft.localMediaUri,
            type: draft.mediaType || "image",
          });
        }
      }
    }
  }, [draftId, drafts]);

  // Load post data when postId is provided (editing existing post)
  useEffect(() => {
    if (postId) {
      const loadPost = async () => {
        const { post, error } = await getPost(postId);
        if (post && !error) {
          setCaption(post.caption || "");
          setTitle(post.title || profile?.title || "");
          setUrl(post.url || "");
          setLocation(post.location || "");
          setTopics(post.topics || []);
          setCommentsOn(post.commentsEnabled);
          setVisibility(post.visibility);
          setCurrentPostId(post.id);
          setIsEditingPost(true);
          setOriginalMediaUrl(post.mediaUrl || null);
          if (post.mediaUrl) {
            setMedia({
              uri: post.mediaUrl,
              type: post.mediaType || "image",
            });
          }
          // Load job post data if exists
          if (post.isJobPost) {
            setIsJobPost(true);
            setCompanyName(post.companyName || "");
            setJobType(post.jobType || "Full-time");
            setExperienceLevel(post.experienceLevel || "Entry");
            setSalaryMin(post.salaryMin?.toString() || "");
            setSalaryMax(post.salaryMax?.toString() || "");
            setSalaryCurrency(post.salaryCurrency || "$");
            setRequirements(post.requirements || []);
            if (post.applicationUrl) {
              setUrl(post.applicationUrl);
            }
          }
        }
      };
      loadPost();
    }
  }, [postId, getPost]);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setAlertModal({ visible: true, type: "error", title: "Permission Required", message: "Permission to access media library is required!" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "image",
      });
    }
  };

  const removeMedia = () => {
    setMedia(null);
  };

  const addRequirement = () => {
    if (
      newRequirement.trim() &&
      !requirements.includes(newRequirement.trim())
    ) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (isUploading) return;

    // Validate job post
    if (isJobPost && !companyName.trim()) {
      showAlert("error", "Error", "Please enter a company name for the job post");
      return;
    }

    const jobPostPayload = isJobPost
      ? {
          isJobPost: true,
          companyName: companyName.trim(),
          jobType,
          experienceLevel,
          salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
          salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
          salaryCurrency,
          requirements,
          applicationUrl: url.trim() || undefined,
        }
      : {
          isJobPost: false,
        };

    // Check if we're editing an existing post
    if (isEditingPost && currentPostId) {
      const mediaChanged = media?.uri !== originalMediaUrl;
      const localMediaUri = mediaChanged ? media?.uri : null;

      const { error } = await editPost(
        currentPostId,
        {
          caption,
          title,
          url,
          location,
          topics,
          visibility,
          commentsEnabled: commentsOn,
          mediaUrl: mediaChanged ? null : originalMediaUrl,
          ...jobPostPayload,
        },
        localMediaUri,
        media?.type || null,
      );

      if (!error) {
        resetForm();
        router.back();
      } else {
        showAlert("error", "Error", error);
      }
    } else {
      // Creating new post
      const { postId: newPostId, error } = await publishPost(
        {
          caption,
          title,
          url,
          location,
          topics,
          visibility,
          commentsEnabled: commentsOn,
          ...jobPostPayload,
        },
        media?.uri || null,
        media?.type || null,
      );

      if (!error && newPostId) {
        if (currentDraftId) {
          await removeDraft(currentDraftId);
        }
        resetForm();
        router.back();
      } else if (error) {
        showAlert("error", "Error", error);
      }
    }
  };

  const resetForm = () => {
    setCaption("");
    setMedia(null);
    setTopics([]);
    setUrl("");
    setLocation("");
    setCurrentDraftId(null);
    setCurrentPostId(null);
    setIsEditingPost(false);
    setOriginalMediaUrl(null);
    setIsJobPost(false);
    setCompanyName("");
    setJobType("Full-time");
    setExperienceLevel("Entry");
    setSalaryMin("");
    setSalaryMax("");
    setSalaryCurrency("$");
    setRequirements([]);
    setNewRequirement("");
  };

  const handleSaveDraft = async () => {
    if (isUploading) return;

    const { error } = await saveToDrafts({
      caption,
      localMediaUri: media?.uri || null,
      mediaType: media?.type || null,
      title,
      url,
      location,
      topics,
      visibility,
      commentsEnabled: commentsOn,
    });

    if (!error) {
      resetForm();
      router.back();
    }
  };

  const getVisibilityLabel = () => {
    if (visibility === "Followers only") return "Followers";
    return visibility;
  };

  return (
    <View style={[styles.container, isWeb && styles.webContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 60 }} />

        <Text style={styles.headerTitle}>
          {isEditingPost
            ? "Edit post"
            : currentDraftId
              ? "Edit draft"
              : isJobPost
                ? "Post a Job"
                : "New post"}
        </Text>

        <View style={styles.headerRight}>
          {!isEditingPost && (caption.trim().length > 0 || media) && (
            <TouchableOpacity
              style={styles.saveDraftBtn}
              onPress={handleSaveDraft}
              disabled={isUploading}
            >
              <Text style={styles.saveDraftText}>Save</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.postBtn,
              (caption.trim().length === 0 ||
                isUploading ||
                (isJobPost && !companyName.trim())) && { opacity: 0.6 },
            ]}
            disabled={
              caption.trim().length === 0 ||
              isUploading ||
              (isJobPost && !companyName.trim())
            }
            onPress={handlePost}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postText}>
                {isEditingPost ? "Update" : "Post"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Media Preview */}
        <TouchableOpacity
          style={styles.mediaBox}
          onPress={pickMedia}
          activeOpacity={0.8}
        >
          {media ? (
            <>
              <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
              <TouchableOpacity
                style={styles.removeMediaBtn}
                onPress={removeMedia}
              >
                <Ionicons name="close-circle" size={28} color="#fff" />
              </TouchableOpacity>
              {media.type === "video" && (
                <View style={styles.videoOverlay}>
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={40} color="#fff" />
                  </View>
                  <View style={styles.videoIndicator}>
                    <Ionicons name="videocam" size={16} color="#fff" />
                    <Text style={styles.videoIndicatorText}>Video</Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.mediaPlaceholder}>
              <Ionicons name="add-circle-outline" size={50} color="#bbb" />
              <Text style={styles.mediaPlaceholderText}>
                {isJobPost
                  ? "Add company logo or job image"
                  : "Add photo or video"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Caption / Job Description */}
        <View
          style={{
            borderBottomColor: "#D9D9D9",
            borderBottomWidth: 1,
            marginBottom: 3,
          }}
        >
          <MyInput
            title={""}
            placeholder={
              isJobPost
                ? "Describe the job opportunity..."
                : "What do you want to say?"
            }
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
            fontSize={14}
            borderWidth={0}
          />
          <Text style={styles.counter}>
            {caption.length}/{MAX_CHARS}
          </Text>
        </View>

        {/* Job Post Toggle Row */}
        <TouchableOpacity
          style={[styles.row, isJobPost && styles.rowSelected]}
          onPress={() => setIsJobPost(!isJobPost)}
        >
          <Ionicons
            name="briefcase-outline"
            size={24}
            color={isJobPost ? Colors.black : "#555"}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              style={[styles.rowLabel, isJobPost && { color: Colors.black }]}
            >
              Job Post
            </Text>
            <Text style={styles.rowSub}>
              {isJobPost ? "This is a job listing" : "Make this a job listing"}
            </Text>
          </View>
          <View
            style={[
              styles.toggleIndicator,
              isJobPost && styles.toggleIndicatorActive,
            ]}
          >
            {isJobPost && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </TouchableOpacity>

        {/* Job Fields - shown when isJobPost is true */}
        {isJobPost && (
          <View style={styles.jobFieldsContainer}>
            {/* Company Name */}
            <View style={styles.jobField}>
              <Text style={styles.jobFieldLabel}>Company Name *</Text>
              <TextInput
                style={styles.jobInput}
                placeholder="e.g., Google, Microsoft"
                value={companyName}
                onChangeText={setCompanyName}
                placeholderTextColor="#999"
              />
            </View>

            {/* Job Type */}
            <TouchableOpacity
              style={styles.jobSelectField}
              onPress={() => setShowJobTypeModal(true)}
            >
              <Text style={styles.jobFieldLabel}>Job Type</Text>
              <View style={styles.jobSelectValue}>
                <Text style={styles.jobSelectText}>{jobType}</Text>
                <Feather name="chevron-down" size={16} color="#666" />
              </View>
            </TouchableOpacity>

            {/* Experience Level */}
            <TouchableOpacity
              style={styles.jobSelectField}
              onPress={() => setShowExperienceModal(true)}
            >
              <Text style={styles.jobFieldLabel}>Experience Level</Text>
              <View style={styles.jobSelectValue}>
                <Text style={styles.jobSelectText}>{experienceLevel}</Text>
                <Feather name="chevron-down" size={16} color="#666" />
              </View>
            </TouchableOpacity>

            {/* Salary Range */}
            <View style={styles.jobField}>
              <Text style={styles.jobFieldLabel}>Salary Range (Optional)</Text>
              <View style={styles.salaryRow}>
                <TextInput
                  style={[styles.jobInput, styles.salaryInput]}
                  placeholder="Min"
                  value={salaryMin}
                  onChangeText={setSalaryMin}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <Text style={styles.salaryDash}>-</Text>
                <TextInput
                  style={[styles.jobInput, styles.salaryInput]}
                  placeholder="Max"
                  value={salaryMax}
                  onChangeText={setSalaryMax}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Requirements */}
            <View style={styles.jobField}>
              <Text style={styles.jobFieldLabel}>Requirements</Text>
              <View style={styles.requirementInputRow}>
                <TextInput
                  style={[styles.jobInput, { flex: 1 }]}
                  placeholder="e.g., 3+ years React experience"
                  value={newRequirement}
                  onChangeText={setNewRequirement}
                  placeholderTextColor="#999"
                  onSubmitEditing={addRequirement}
                />
                <TouchableOpacity
                  style={styles.addReqBtn}
                  onPress={addRequirement}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              {requirements.length > 0 && (
                <View style={styles.requirementsList}>
                  {requirements.map((req, index) => (
                    <View key={index} style={styles.requirementChip}>
                      <Text style={styles.requirementChipText}>{req}</Text>
                      <TouchableOpacity
                        onPress={() => removeRequirement(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#FF3B30"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Regular Fields */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowTopicsModal(true)}
        >
          <Ionicons name="pricetag-outline" size={24} color="#555" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.rowLabel}>Include topic(s)*</Text>
            <Text style={styles.rowSub}>How can people find this?</Text>
            {topics.length > 0 && (
              <View style={styles.chipsRow}>
                {topics.map((t) => (
                  <View key={t} style={styles.chip}>
                    <Text style={styles.chipText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Feather name="chevron-right" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowTitleModal(true)}
        >
          <Ionicons name="person-circle-outline" size={28} color="#555" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.rowLabel}>
              {isJobPost ? "Job Title" : "Title"}
            </Text>
          </View>
          <Text style={styles.rowValue}>{title || "Add"}</Text>
          <Feather name="chevron-right" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowUrlModal(true)}
        >
          <Ionicons name="link-outline" size={24} color="#555" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.rowLabel}>
              {isJobPost ? "Application URL" : "URL"}
            </Text>
          </View>
          <Text style={styles.rowValue}>{url || "Add"}</Text>
          <Feather name="chevron-right" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowLocationModal(true)}
        >
          <Ionicons name="location-outline" size={24} color="#555" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.rowLabel}>
              {isJobPost ? "Job Location" : "Add location"}
            </Text>
          </View>
          <Text style={styles.rowValue}>{location || "None"}</Text>
          <Feather name="chevron-right" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowCommentsModal(true)}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#555" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.rowLabel}>Comments</Text>
          </View>
          <Text style={styles.rowValue}>{commentsOn ? "On" : "Off"}</Text>
          <Feather name="chevron-right" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowVisibilityModal(true)}
        >
          <Ionicons name="eye-outline" size={24} color="#555" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.rowLabel}>Visibility</Text>
          </View>
          <Text style={styles.rowValue}>{getVisibilityLabel()}</Text>
          <Feather name="chevron-right" size={18} color="#999" />
        </TouchableOpacity>
      </ScrollView>

      {/* Topics Modal */}
      <Modal
        visible={showTopicsModal}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowTopicsModal(false)}
      >
        <TopicsSheet
          topics={topics}
          onSave={setTopics}
          onClose={() => setShowTopicsModal(false)}
        />
      </Modal>

      {/* Title Modal */}
      <Modal
        visible={showTitleModal}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowTitleModal(false)}
      >
        <TitleRoleSheet
          currentValue={title}
          onSelect={setTitle}
          onClose={() => setShowTitleModal(false)}
        />
      </Modal>

      {/* URL Modal */}
      <Modal
        visible={showUrlModal}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowUrlModal(false)}
      >
        <UrlSheet
          currentValue={url}
          onSave={setUrl}
          onClose={() => setShowUrlModal(false)}
        />
      </Modal>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <LocationSheet
          currentValue={location}
          onSave={setLocation}
          onClose={() => setShowLocationModal(false)}
        />
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <CommentsToggleSheet
          current={commentsOn}
          onSelect={setCommentsOn}
          onClose={() => setShowCommentsModal(false)}
        />
      </Modal>

      {/* Visibility Modal */}
      <Modal
        visible={showVisibilityModal}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowVisibilityModal(false)}
      >
        <VisibilitySheet
          current={visibility}
          onSelect={setVisibility}
          onClose={() => setShowVisibilityModal(false)}
        />
      </Modal>

      {/* Job Type Modal */}
      <Modal
        visible={showJobTypeModal}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowJobTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Job Type</Text>
            {JOB_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.modalOption,
                  jobType === type && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setJobType(type);
                  setShowJobTypeModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    jobType === type && styles.modalOptionTextSelected,
                  ]}
                >
                  {type}
                </Text>
                {jobType === type && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Experience Level Modal */}
      <Modal
        visible={showExperienceModal}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowExperienceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Experience Level</Text>
            {EXPERIENCE_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.modalOption,
                  experienceLevel === level && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setExperienceLevel(level);
                  setShowExperienceModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    experienceLevel === level && styles.modalOptionTextSelected,
                  ]}
                >
                  {level}
                </Text>
                {experienceLevel === level && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Alert Modal */}
      <ConfirmationModal
        visible={alertModal.visible}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onCancel={() => setAlertModal({ ...alertModal, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  webContainer: { paddingHorizontal: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveDraftBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saveDraftText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 14,
  },
  postBtn: {
    backgroundColor: Colors.black,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 50,
    alignItems: "center",
  },
  postText: { color: "#fff", fontWeight: "600" },

  content: { padding: 16 },

  mediaBox: {
    height: 250,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  mediaPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  mediaPlaceholderText: {
    marginTop: 10,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  removeMediaBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 14,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 5,
  },
  videoIndicator: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  videoIndicatorText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },

  counter: {
    textAlign: "right",
    fontSize: 12,
    fontWeight: "500",
    color: "#616F7B",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
    gap: 10,
  },
  rowLabel: { fontSize: 14, color: "black", fontWeight: "500" },
  rowSub: { fontSize: 12, color: "#777", marginTop: 2 },
  rowValue: { fontSize: 13, color: "#777" },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: { fontSize: 12 },

  // Job Post Toggle
  rowSelected: {
    backgroundColor: Colors.splashBg,
    borderRadius: 10,
    marginHorizontal: -10,
    paddingHorizontal: 10,
  },
  toggleIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleIndicatorActive: {
    backgroundColor: Colors.black,
  },

  // Job Fields
  jobFieldsContainer: {
    // backgroundColor: "#f8f9fa",
    // borderRadius: 12,
    paddingTop: 16,
    marginBottom: 12,
  },
  jobField: {
    marginBottom: 16,
  },
  jobFieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 8,
  },
  jobInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  jobSelectField: {
    marginBottom: 16,
  },
  jobSelectValue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  jobSelectText: {
    fontSize: 15,
    color: "#333",
  },
  salaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  salaryInput: {
    flex: 1,
  },
  salaryDash: {
    fontSize: 16,
    color: "#999",
  },
  requirementInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addReqBtn: {
    backgroundColor: Colors.black,
    borderRadius: 10,
    padding: 12,
  },
  requirementsList: {
    marginTop: 12,
    gap: 8,
  },
  requirementChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  requirementChipText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  modalOptionSelected: {
    backgroundColor: "#f0f8ff",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalOptionTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
