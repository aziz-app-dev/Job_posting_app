import ModalShell from "@/components/ModalShell";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { usePost } from "@/context/PostContext";
import { deleteAccount } from "@/services/authService";
import { getBlockedByMeIds } from "@/services/blockService";
import { getUserApplications, getApplicationsCount } from "@/services/jobApplicationService";
import { getUserProfile, UserProfile } from "@/services/userService";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import ConfirmationModal from "./confirm_modal";

type ConfirmAction = "logout" | "delete" | "unblock";

interface BlockedUser {
  uid: string;
  displayName: string;
  photoURL: string;
}

const ProfileOptions = () => {
  const { user, profile, signOut, unblockUser } = useAuth();
  const { userPosts } = usePost();
  const username = user?.displayName || user?.email?.split("@")[0] || "user";
  const { width: winWidth } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && winWidth >= 768;

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<ConfirmAction>("logout");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState("");
  const [errorModal, setErrorModal] = useState({ visible: false, title: "", message: "" });

  // Blocked users state
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [unblockTargetId, setUnblockTargetId] = useState<string | null>(null);
  const [unblockTargetName, setUnblockTargetName] = useState("");

  // Stats
  const [myApplicationsCount, setMyApplicationsCount] = useState(0);
  const [totalApplicantsCount, setTotalApplicantsCount] = useState(0);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [user?.uid, userPosts]);

  const loadStats = async () => {
    if (!user?.uid) return;

    const { applications } = await getUserApplications(user.uid);
    setMyApplicationsCount(applications.length);

    const jobPosts = userPosts.filter(
      (p) => p.isJobPost || p.jobType || p.salaryMin || p.salaryMax
    );

    let totalApplicants = 0;
    for (const post of jobPosts) {
      const { count } = await getApplicationsCount(post.id);
      totalApplicants += count;
    }
    setTotalApplicantsCount(totalApplicants);
  };

  // Load blocked users
  const loadBlockedUsers = async () => {
    if (!user?.uid) return;
    setIsLoadingBlocked(true);

    const { ids, error } = await getBlockedByMeIds(user.uid);
    if (error || ids.length === 0) {
      setBlockedUsers([]);
      setIsLoadingBlocked(false);
      return;
    }

    // Fetch profile info for each blocked user
    const users: BlockedUser[] = [];
    for (const uid of ids) {
      const { profile: blockedProfile } = await getUserProfile(uid);
      users.push({
        uid,
        displayName: blockedProfile?.displayName || "Unknown User",
        photoURL: blockedProfile?.photoURL || "",
      });
    }

    setBlockedUsers(users);
    setIsLoadingBlocked(false);
  };

  const onClose = () => {
    router.back();
  };

  const openConfirm = (action: ConfirmAction) => {
    setConfirmActionType(action);
    setConfirmVisible(true);
  };

  const handleConfirm = async () => {
    setConfirmVisible(false);

    if (confirmActionType === "logout") {
      setProcessingText("Logging out...");
      setIsProcessing(true);
      const { error } = await signOut();
      if (error) {
        setIsProcessing(false);
        setErrorModal({ visible: true, title: "Error", message: error });
        return;
      }
      router.replace("/(auth)/into_screen");

    } else if (confirmActionType === "delete") {
      setProcessingText("Deleting account...");
      setIsProcessing(true);
      const { error } = await deleteAccount();
      if (error) {
        setIsProcessing(false);
        setErrorModal({ visible: true, title: "Error", message: error });
        return;
      }
      router.replace("/(auth)/into_screen");

    } else if (confirmActionType === "unblock" && unblockTargetId) {
      setProcessingText("Unblocking...");
      setIsProcessing(true);
      const { error } = await unblockUser(unblockTargetId);
      setIsProcessing(false);
      if (error) {
        setErrorModal({ visible: true, title: "Error", message: error });
      } else {
        // Remove from local list
        setBlockedUsers((prev) => prev.filter((u) => u.uid !== unblockTargetId));
        setUnblockTargetId(null);
      }
    }
  };

  const handleUnblockPress = (uid: string, name: string) => {
    setUnblockTargetId(uid);
    setUnblockTargetName(name);
    openConfirm("unblock");
  };

  const getConfirmTitle = () => {
    switch (confirmActionType) {
      case "logout": return "Logout";
      case "delete": return "Delete Account";
      case "unblock": return `Unblock ${unblockTargetName}`;
    }
  };

  const getConfirmMessage = () => {
    switch (confirmActionType) {
      case "logout": return "Are you sure you want to logout?";
      case "delete": return "This will permanently delete your account and all your data. This action cannot be undone.";
      case "unblock": return `Are you sure you want to unblock ${unblockTargetName}? They will be able to see your profile and posts again.`;
    }
  };

  const getConfirmText = () => {
    switch (confirmActionType) {
      case "logout": return "Logout";
      case "delete": return "Delete";
      case "unblock": return "Unblock";
    }
  };

  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const OptionRow = ({
    icon,
    label,
    danger,
    onPress,
    rightContent,
  }: {
    icon: React.ReactNode;
    label: string;
    danger?: boolean;
    onPress?: () => void;
    rightContent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.optionRow}
      onPress={() => {
        if (onPress) {
          onPress();
        } else {
          onClose();
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        {icon}
        <Text style={[styles.optionText, danger && { color: Colors.error }]}>
          {label}
        </Text>
      </View>
      {rightContent || <Feather name="chevron-right" size={18} color="#ccc" />}
    </TouchableOpacity>
  );

  // ── Blocked Users View ──
  if (showBlockedUsers) {
    return (
      <ModalShell onClose={onClose} width={480} height="65%">
      <View style={isWeb ? styles.webContainer : styles.overlay}>
        {!isWeb && <Pressable style={styles.backdrop} onPress={onClose} />}
        <View style={isWeb ? styles.webSheet : [styles.bottomSheet, { height: "60%" }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowBlockedUsers(false)}>
              <Feather name="arrow-left" size={22} color={Colors.black} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Blocked Users</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={Colors.black} />
            </Pressable>
          </View>

          {isLoadingBlocked ? (
            <View style={styles.centeredContainer}>
              <ActivityIndicator size="large" color={Colors.black} />
            </View>
          ) : blockedUsers.length === 0 ? (
            <View style={styles.centeredContainer}>
              <Feather name="users" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No blocked users</Text>
              <Text style={styles.emptySubText}>
                Users you block will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={blockedUsers}
              keyExtractor={(item) => item.uid}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.blockedUserRow}>
                  <View style={styles.blockedUserInfo}>
                    {item.photoURL ? (
                      <Image source={{ uri: item.photoURL }} style={styles.blockedUserAvatar} />
                    ) : (
                      <View style={[styles.blockedUserAvatar, styles.avatarFallback]}>
                        <Text style={styles.avatarInitial}>
                          {getInitial(item.displayName)}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.blockedUserName} numberOfLines={1}>
                      {item.displayName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.unblockButton}
                    onPress={() => handleUnblockPress(item.uid, item.displayName)}
                  >
                    <Text style={styles.unblockButtonText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>

        <ConfirmationModal
          visible={confirmVisible}
          title={getConfirmTitle()}
          message={getConfirmMessage()}
          confirmText={getConfirmText()}
          onCancel={() => setConfirmVisible(false)}
          onConfirm={handleConfirm}
        />

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.black} />
              <Text style={styles.loadingText}>{processingText}</Text>
            </View>
          </View>
        )}
      </View>
      </ModalShell>
    );
  }

  // ── Main Options View ──
  return (
    <ModalShell onClose={onClose} width={440} height="85%">
    <View style={isWeb ? styles.webContainer : styles.overlay}>
      {!isWeb && <Pressable style={styles.backdrop} onPress={onClose} />}

      <View style={isWeb ? styles.webSheet : styles.bottomSheet}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{username}</Text>
            <Text style={styles.headerSubTitle}>@{username}</Text>
          </View>
          <Pressable onPress={onClose}>
            <Feather name="x" size={22} color={Colors.black} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Profile Actions */}
          <View style={styles.section}>
            <OptionRow
              icon={<Feather name="user" size={20} color={Colors.black} />}
              label="View Profile"
              onPress={() => {
                onClose();
                router.push({
                  pathname: "/(profile)/public_profile",
                  params: { userId: user?.uid },
                });
              }}
            />
            <OptionRow
              icon={<Ionicons name="document-text-outline" size={20} color={Colors.black} />}
              label={`My Applications${myApplicationsCount > 0 ? ` (${myApplicationsCount})` : ""}`}
              onPress={() => {
                onClose();
                router.push("/(profile)/my_applications");
              }}
            />
            {totalApplicantsCount > 0 && (
              <OptionRow
                icon={<Ionicons name="people-outline" size={20} color={Colors.black} />}
                label={`Job Applicants (${totalApplicantsCount})`}
                onPress={() => {
                  onClose();
                  router.push("/(profile)/my_job_posts");
                }}
              />
            )}
            <OptionRow
              icon={<Feather name="users" size={20} color={Colors.black} />}
              label={`Following (${profile?.following || 0})`}
              onPress={() => {
                onClose();
                router.push("/(profile)/following");
              }}
            />
          </View>

          {/* Interaction Options */}
          <View style={styles.section}>
            <OptionRow
              icon={
                <MaterialCommunityIcons
                  name="bookmark-outline"
                  size={20}
                  color={Colors.black}
                />
              }
              label="Saved Posts"
              onPress={() => {
                onClose();
                router.push("/(tabs)/book_mark");
              }}
            />
            <OptionRow
              icon={<Feather name="message-circle" size={20} color={Colors.black} />}
              label="Messages"
              onPress={() => {
                onClose();
                router.push("/(profile)/conversations");
              }}
            />
            <OptionRow
              icon={<Feather name="compass" size={20} color={Colors.black} />}
              label="Discover"
              onPress={() => {
                onClose();
                router.push("/(profile)/discover");
              }}
            />
            <OptionRow
              icon={<Feather name="slash" size={20} color={Colors.black} />}
              label="Blocked Users"
              onPress={() => {
                setShowBlockedUsers(true);
                loadBlockedUsers();
              }}
            />
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <OptionRow
              icon={<Feather name="log-out" size={20} color={Colors.black} />}
              label="Logout"
              onPress={() => openConfirm("logout")}
              rightContent={null}
            />
            <OptionRow
              icon={<Feather name="trash-2" size={20} color={Colors.error} />}
              label="Delete Account"
              danger
              onPress={() => openConfirm("delete")}
              rightContent={null}
            />
          </View>
        </ScrollView>
      </View>

      <ConfirmationModal
        visible={confirmVisible}
        title={getConfirmTitle()}
        message={getConfirmMessage()}
        confirmText={getConfirmText()}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleConfirm}
      />

      <ConfirmationModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        isError
        onCancel={() => setErrorModal({ ...errorModal, visible: false })}
      />

      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.black} />
            <Text style={styles.loadingText}>{processingText}</Text>
          </View>
        </View>
      )}
    </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
  },
  webSheet: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: "65%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderColor: "#E5EAF1",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
  },
  headerSubTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.grey,
  },
  section: {
    backgroundColor: "#F6F6F5",
    marginHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderColor: "#E5EAF1",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.black,
  },

  // Blocked users
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#555",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 6,
  },
  blockedUserRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F6F6F5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  blockedUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  blockedUserAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eee",
  },
  avatarFallback: {
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  blockedUserName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.black,
    flex: 1,
  },
  unblockButton: {
    backgroundColor: Colors.black,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  loadingBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
  },
});

export default ProfileOptions;
