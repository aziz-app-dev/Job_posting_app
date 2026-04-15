import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { subscribeToAuthChanges, logOut, getCurrentUser } from "@/services/authService";
import { subscribeToUserProfile, updateUserProfile, UserProfile, createUserProfile } from "@/services/userService";
import { subscribeToFollowing, subscribeToFollowers, followUser as followUserService, unfollowUser as unfollowUserService } from "@/services/followService";
import { subscribeToBlockRelations, blockUser as blockUserService, unblockUser as unblockUserService } from "@/services/blockService";
import { subscribeToHiddenUsers } from "@/services/hideService";
import firebase from "firebase/compat/app";

type User = firebase.User;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  refreshProfile: () => void;

  // Social state
  followingIds: string[];
  followerIds: string[];
  blockedUserIds: string[];
  hiddenUserIds: string[];

  // Social actions
  followUser: (userId: string) => Promise<{ error: string | null }>;
  unfollowUser: (userId: string) => Promise<{ error: string | null }>;
  blockUser: (userId: string) => Promise<{ error: string | null }>;
  unblockUser: (userId: string) => Promise<{ error: string | null }>;
  isFollowing: (userId: string) => boolean;
  isBlocked: (userId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followerIds, setFollowerIds] = useState<string[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [hiddenUserIds, setHiddenUserIds] = useState<string[]>([]);

  const profileUnsubscribe = useRef<(() => void) | null>(null);
  const followingUnsubscribe = useRef<(() => void) | null>(null);
  const followersUnsubscribe = useRef<(() => void) | null>(null);
  const blocksUnsubscribe = useRef<(() => void) | null>(null);
  const hiddenUnsubscribe = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasReceivedUser = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (!isMounted) return;

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (firebaseUser) {
        // User is logged in
        hasReceivedUser.current = true;
        setUser(firebaseUser);

        // Unsubscribe from previous profile if any
        if (profileUnsubscribe.current) {
          profileUnsubscribe.current();
        }

        // Ensure profile exists in Firestore
        await createUserProfile(
          firebaseUser.uid,
          firebaseUser.email || "",
          firebaseUser.displayName || "",
          firebaseUser.photoURL || ""
        );

        // Subscribe to Firestore profile
        profileUnsubscribe.current = subscribeToUserProfile(
          firebaseUser.uid,
          (userProfile) => {
            if (isMounted) {
              setProfile(userProfile);
              setIsLoading(false);
            }
          }
        );

        // Subscribe to following
        followingUnsubscribe.current = subscribeToFollowing(
          firebaseUser.uid,
          (ids) => {
            if (isMounted) setFollowingIds(ids);
          }
        );

        // Subscribe to followers
        followersUnsubscribe.current = subscribeToFollowers(
          firebaseUser.uid,
          (ids) => {
            if (isMounted) setFollowerIds(ids);
          }
        );

        // Subscribe to block relations
        blocksUnsubscribe.current = subscribeToBlockRelations(
          firebaseUser.uid,
          (ids) => {
            if (isMounted) setBlockedUserIds(ids);
          }
        );

        // Subscribe to hidden users ("not interested")
        hiddenUnsubscribe.current = subscribeToHiddenUsers(
          firebaseUser.uid,
          (ids) => {
            if (isMounted) setHiddenUserIds(ids);
          }
        );
      } else if (hasReceivedUser.current) {
        // User logged out (was logged in before)
        setUser(null);
        setProfile(null);
        setFollowingIds([]);
        setFollowerIds([]);
        setBlockedUserIds([]);
        setHiddenUserIds([]);
        setIsLoading(false);

        if (profileUnsubscribe.current) {
          profileUnsubscribe.current();
          profileUnsubscribe.current = null;
        }
        if (followingUnsubscribe.current) {
          followingUnsubscribe.current();
          followingUnsubscribe.current = null;
        }
        if (followersUnsubscribe.current) {
          followersUnsubscribe.current();
          followersUnsubscribe.current = null;
        }
        if (blocksUnsubscribe.current) {
          blocksUnsubscribe.current();
          blocksUnsubscribe.current = null;
        }
        if (hiddenUnsubscribe.current) {
          hiddenUnsubscribe.current();
          hiddenUnsubscribe.current = null;
        }
      } else {
        // First null - wait for Firebase to restore session
        // Firebase might fire null first before restoring the persisted user
        timeoutRef.current = setTimeout(() => {
          if (isMounted && !hasReceivedUser.current) {
            // Still no user after waiting - not authenticated
            setUser(null);
            setProfile(null);
            setIsLoading(false);
          }
        }, 2000); // 2 second timeout for session restoration
      }
    });

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (profileUnsubscribe.current) profileUnsubscribe.current();
      if (followingUnsubscribe.current) followingUnsubscribe.current();
      if (followersUnsubscribe.current) followersUnsubscribe.current();
      if (blocksUnsubscribe.current) blocksUnsubscribe.current();
      if (hiddenUnsubscribe.current) hiddenUnsubscribe.current();
    };
  }, []);

  const signOut = async () => {
    const result = await logOut();
    return result;
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: "No user logged in" };
    return updateUserProfile(user.uid, updates);
  };

  const refreshProfile = () => {
    if (user && profileUnsubscribe.current) {
      // Re-subscribe to trigger a fresh read
      profileUnsubscribe.current();
      profileUnsubscribe.current = subscribeToUserProfile(user.uid, setProfile);
    }
  };

  // Social actions
  const followUser = useCallback(async (userId: string) => {
    if (!user) return { error: "Not authenticated" };
    return followUserService(
      user.uid,
      userId,
      user.displayName || "Someone",
      user.photoURL || ""
    );
  }, [user]);

  const unfollowUser = useCallback(async (userId: string) => {
    if (!user) return { error: "Not authenticated" };
    return unfollowUserService(user.uid, userId);
  }, [user]);

  const blockUser = useCallback(async (userId: string) => {
    if (!user) return { error: "Not authenticated" };
    return blockUserService(user.uid, userId);
  }, [user]);

  const unblockUser = useCallback(async (userId: string) => {
    if (!user) return { error: "Not authenticated" };
    return unblockUserService(user.uid, userId);
  }, [user]);

  const isFollowing = useCallback((userId: string) => {
    return followingIds.includes(userId);
  }, [followingIds]);

  const isBlocked = useCallback((userId: string) => {
    return blockedUserIds.includes(userId);
  }, [blockedUserIds]);

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    updateProfile,
    refreshProfile,
    followingIds,
    followerIds,
    blockedUserIds,
    hiddenUserIds,
    followUser,
    unfollowUser,
    blockUser,
    unblockUser,
    isFollowing,
    isBlocked,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
