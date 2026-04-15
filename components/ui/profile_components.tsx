//! ────────────────────────────────────────────────
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { LinkType, SocialLink } from "@/services/userService";
import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome5,
  Ionicons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

//! ────────────────────────────────────────────────
//! DEFAULT PROFILE DATA (fallback values)
const DEFAULT_PROFILE_DATA = {
  username: "@user",
  name: "User",
  title: "",
  location: "Add location",
  salary: "Add salary range",
  avatar: "",
  bio: "",
  badges: [],
  stats: [
    { count: "0", label: "followers" },
    { count: "0", label: "following" },
  ],
};

//! ────────────────────────────────────────────────
//! Profile Header
const ProfileHeader = () => {
  const { user, profile } = useAuth();
  const [textShown, setTextShown] = useState(false);
  const [lengthMore, setLengthMore] = useState(false);
  const [measured, setMeasured] = useState(false);

  // Build profile data from Firestore profile + Firebase user + defaults
  const PROFILE_DATA = {
    ...DEFAULT_PROFILE_DATA,
    name:
      profile?.displayName ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "User",
    username: user?.email ? `@${user.email.split("@")[0]}` : "@user",
    avatar: profile?.photoURL || user?.photoURL || "",
    title: profile?.title || "",
    location: profile?.location || "Add location",
    salary: profile?.salaryRange || "Add salary range",
    bio: profile?.bio || "",
    interests: profile?.interests || [],
    stats: [
      { count: String(profile?.followers || 0), label: "followers" },
      { count: String(profile?.following || 0), label: "following" },
    ],
  };

  // Build social links from the new links array - only show links that have values
  const userLinks: SocialLink[] = profile?.links || [];

  const toggleNumberOfLines = () => setTextShown(!textShown);

  const onTextLayout = (e: any) => {
    if (!measured) {
      setLengthMore(e.nativeEvent.lines.length > 2);
      setMeasured(true);
    }
  };

  const Badge = ({ label }: { label: string }) => (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );

  const StatItem = ({ count, label }: { count: string; label: string }) => (
    <View style={styles.statItem}>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const InterestChip = ({ label }: { label: string }) => (
    <View style={styles.interestChip}>
      <Text style={styles.interestChipText}>{label}</Text>
    </View>
  );
  const getInitial = (name: string) =>
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const handleShareProfile = async () => {
    try {
      const profileName = PROFILE_DATA.name;
      const profileTitle = PROFILE_DATA.title ? ` | ${PROFILE_DATA.title}` : "";
      const deepLink = `workcircle://profile/${user?.uid}`;
      await Share.share({
        message: `Check out ${profileName}'s profile on WorkCircle!${profileTitle}\n\n${deepLink}`,
      });
    } catch (error) {
      // User cancelled or share failed
    }
  };

  return (
    <View style={styles.profileHeader}>
      {/* Username Row */}
      <View style={styles.usernameRow}>
        <View style={{ width: 20 }} />
        <Text style={styles.username}>{PROFILE_DATA.username}</Text>

        <TouchableOpacity
          onPress={() => router.push("/(modal)/profile_opction")}
        >
          <Entypo name="dots-three-horizontal" size={20} color="black" />
        </TouchableOpacity>
      </View>

      {/* Avatar & Info */}
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {PROFILE_DATA.avatar ? (
            <Image
              source={{ uri: PROFILE_DATA.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {getInitial(PROFILE_DATA.name)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.name}>{PROFILE_DATA.name}</Text>
          {PROFILE_DATA.title ? (
            <Text style={[styles.title, { color: "#616F7B" }]}>
              {PROFILE_DATA.title}
            </Text>
          ) : (
            <TouchableOpacity
              style={{ flexDirection: "row" }}
              onPress={() =>
                router.push("/(profile)/edit_profile?openModal=title")
              }
            >
              <Ionicons name="add-outline" size={20} color={Colors.blue} />
              <Text style={[styles.title, { color: Colors.blue }]}>
                {"Add title"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.metaRow}>
            <SimpleLineIcons
              name="location-pin"
              size={16}
              color={Colors.black}
            />
            <Text style={styles.metaText}>{PROFILE_DATA.location}</Text>
          </View>

          <View style={styles.metaRow}>
            <Feather name="dollar-sign" size={16} color="black" />
            <Text style={styles.metaText}>{PROFILE_DATA.salary}</Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      {PROFILE_DATA.bio ? (
        <View>
          <Text
            style={styles.bio}
            numberOfLines={!measured || textShown ? undefined : 2}
            onTextLayout={onTextLayout}
          >
            {PROFILE_DATA.bio}
          </Text>

          {lengthMore && (
            <Text style={styles.moreText} onPress={toggleNumberOfLines}>
              {textShown ? "less" : "more"}
            </Text>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: "#D9D9D9",
            borderRadius: 10,
            borderStyle: "dashed",
            padding: 15,
            alignItems: "center",
          }}
          onPress={() => router.push("/(profile)/edit_profile?openModal=bio")}
        >
          <View style={{ flexDirection: "row", gap: 5 }}>
            <Ionicons name="add-outline" size={20} color={Colors.blue} />
            <Text style={[styles.title, { color: Colors.blue }]}>
              {"Add bio"}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Interests */}
      {PROFILE_DATA.interests.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.interestsContainer}
        >
          {PROFILE_DATA.interests.map((interest, i) => (
            <InterestChip key={i} label={interest} />
          ))}
        </ScrollView>
      )}

      {/* Badges */}
      {PROFILE_DATA.badges.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PROFILE_DATA.badges.map((badge, i) => (
            <Badge key={i} label={badge} />
          ))}
        </ScrollView>
      )}

      {/* Social Links - only show if user has links */}
      {userLinks.length > 0 && <SocialLinks links={userLinks} />}

      {/* Stats */}
      <View style={styles.statsRow}>
        {PROFILE_DATA.stats.map((stat, i) => (
          <StatItem key={i} {...stat} />
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => router.push("/(profile)/edit_profile")}
          style={styles.btnContatiner}
        >
          <Text style={styles.buttonText}>Edit profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnContatiner} onPress={handleShareProfile}>
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

//! ────────────────────────────────────────────────
//! Social Links Component
const SocialLinks = ({ links }: { links: SocialLink[] }) => {
  const openLink = async (url: string, type: LinkType) => {
    let finalUrl = url;

    // Format URL based on link type
    if (type === "email" && !url.startsWith("mailto:")) {
      finalUrl = `mailto:${url}`;
    } else if (type === "instagram" && !url.startsWith("http")) {
      finalUrl = `https://instagram.com/${url.replace("@", "")}`;
    } else if (type === "x" && !url.startsWith("http")) {
      finalUrl = `https://x.com/${url.replace("@", "")}`;
    } else if (type === "linkedin" && !url.startsWith("http")) {
      finalUrl = `https://linkedin.com/in/${url}`;
    } else if (type === "website" && !url.startsWith("http")) {
      finalUrl = `https://${url}`;
    }

    const supported = await Linking.canOpenURL(finalUrl);
    if (supported) await Linking.openURL(finalUrl);
  };

  const getIcon = (type: LinkType) => {
    switch (type) {
      case "email":
        return <Ionicons name="mail" size={22} color="#000" />;
      case "instagram":
        return <FontAwesome5 name="instagram" size={22} color="#000" />;
      case "x":
        return <AntDesign name="x" size={20} color="#000" />;
      case "linkedin":
        return <FontAwesome5 name="linkedin" size={22} color="#000" />;
      case "website":
        return <Feather name="arrow-up-right" size={22} color="#000" />;
      default:
        return <Feather name="link" size={22} color="#000" />;
    }
  };

  return (
    <View style={styles.socialRow}>
      {links.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.socialIconButton}
          onPress={() => openLink(item.value, item.type)}
        >
          {getIcon(item.type)}
        </TouchableOpacity>
      ))}
    </View>
  );
};

//! ────────────────────────────────────────────────
//! Styles
const styles = StyleSheet.create({
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },

  usernameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  username: {
    fontSize: 20,
    fontWeight: "500",
    color: "#090909",
  },

  topRow: {
    flexDirection: "row",
    marginBottom: 12,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },

  infoColumn: { flex: 1, paddingLeft: 16 },
  name: { fontSize: 20, fontWeight: "700" },
  title: { fontSize: 14, marginTop: 2 },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  metaText: { marginLeft: 6, fontSize: 15, fontWeight: "500" },

  bio: { fontSize: 15, lineHeight: 22, fontWeight: "500" },
  moreText: { color: "#89818A", fontWeight: "600", marginBottom: 10 },

  interestsContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  interestChip: {
    // backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  interestChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },

  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#f0f0f0",
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#22C55E", // green or random later
    justifyContent: "center",
    alignItems: "center",
  },

  avatarInitial: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  badgeText: { fontSize: 13, fontWeight: "500" },

  statsRow: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 24,
    alignItems: "center",
    alignContent: "center",
  },
  statItem: { flexDirection: "row", marginRight: 40 },
  statCount: { fontSize: 17, fontWeight: "700" },
  statLabel: { marginLeft: 5 },

  actionRow: { flexDirection: "row", gap: 12 },
  btnContatiner: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: { fontSize: 16, fontWeight: "600" },

  socialRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 16,
    marginBottom: 8,
  },

  socialIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProfileHeader;
