import { db } from "@/config/firebase";
import { JobPreferences, JobType, ExperienceLevel } from "@/constants/types";

// Social link type
export type LinkType = "email" | "instagram" | "linkedin" | "x" | "website";
export type SocialLink = { type: LinkType; value: string };

// Privacy option type
export type PrivacyOption = "Public" | "Followers" | "Private";

// Visibility option for specific fields
export type VisibilityOption = "Everyone" | "Only me";

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio: string;
  title: string;
  location: string;
  locationVisibility: VisibilityOption;
  salaryRange: string;
  salaryVisibility: VisibilityOption;
  followers: number;
  following: number;
  interests: string[];
  links: SocialLink[];
  privacy: PrivacyOption;
  socialLinks: {
    instagram?: string;
    x?: string;
    linkedin?: string;
  };
  // Job preferences for matching
  jobPreferences?: JobPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Default profile values
const defaultProfile: Partial<UserProfile> = {
  bio: "",
  title: "",
  location: "",
  locationVisibility: "Everyone",
  salaryRange: "",
  salaryVisibility: "Everyone",
  followers: 0,
  following: 0,
  interests: [],
  links: [],
  privacy: "Public",
  socialLinks: {},
  jobPreferences: {
    openToWork: false,
    skills: [],
    desiredJobTypes: [],
    desiredLocations: [],
    experienceLevel: "Entry",
  },
};

// Create user profile in Firestore (called after signup)
export const createUserProfile = async (
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<{ error: string | null }> => {
  try {
    const userRef = db.collection("users").doc(uid);
    const doc = await userRef.get();

    // Only create if doesn't exist
    if (!doc.exists) {
      await userRef.set({
        ...defaultProfile,
        uid,
        email,
        displayName: displayName || "",
        photoURL: photoURL || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to create profile" };
  }
};

// Get user profile from Firestore
export const getUserProfile = async (
  uid: string
): Promise<{ profile: UserProfile | null; error: string | null }> => {
  try {
    const doc = await db.collection("users").doc(uid).get();

    if (doc.exists) {
      return { profile: doc.data() as UserProfile, error: null };
    }

    return { profile: null, error: "Profile not found" };
  } catch (error: any) {
    return { profile: null, error: error.message || "Failed to get profile" };
  }
};

// Update user profile in Firestore
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<{ error: string | null }> => {
  try {
    await db
      .collection("users")
      .doc(uid)
      .update({
        ...updates,
        updatedAt: new Date(),
      });

    return { error: null };
  } catch (error: any) {
    return { error: error.message || "Failed to update profile" };
  }
};

// Subscribe to user profile changes (real-time updates)
export const subscribeToUserProfile = (
  uid: string,
  callback: (profile: UserProfile | null) => void
) => {
  return db
    .collection("users")
    .doc(uid)
    .onSnapshot(
      (doc) => {
        if (doc.exists) {
          callback(doc.data() as UserProfile);
        } else {
          callback(null);
        }
      },
      (error) => {
        // Silently handle permission errors (user not authenticated yet)
        if (error?.code !== "permission-denied") {
          console.warn("Profile subscription error:", error?.message);
        }
        callback(null);
      }
    );
};
