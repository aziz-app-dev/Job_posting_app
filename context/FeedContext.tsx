import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Post } from "@/constants/types";
import { useAuth } from "./AuthContext";
import { subscribeToFeed } from "@/services/postService";

// ─────────────────────────────────────────────────
// Context Types
// ─────────────────────────────────────────────────
interface FeedContextType {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  refreshFeed: () => void;
}

// ─────────────────────────────────────────────────
// Context Creation
// ─────────────────────────────────────────────────
const FeedContext = createContext<FeedContextType | undefined>(undefined);

// ─────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────
export const FeedProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, followingIds, blockedUserIds, hiddenUserIds, isAuthenticated } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if this is the initial load
  const isInitialLoad = useRef(true);

  // Subscribe to feed when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      setPosts([]);
      setIsLoading(false);
      isInitialLoad.current = true;
      return;
    }

    // Only show loading on initial load, not on followingIds/blockedUserIds changes
    if (isInitialLoad.current) {
      setIsLoading(true);
    }
    setError(null);

    // Subscribe to real-time feed
    const unsubscribe = subscribeToFeed(
      user.uid,
      followingIds,
      blockedUserIds,
      (feedPosts) => {
        // Also filter out posts from hidden users ("not interested")
        const filteredPosts = feedPosts.filter(
          (post) => !hiddenUserIds.includes(post.authorId)
        );
        setPosts(filteredPosts);
        setIsLoading(false);
        setIsRefreshing(false);
        isInitialLoad.current = false;
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user?.uid, followingIds, blockedUserIds, hiddenUserIds]);

  // Refresh feed (triggers re-subscription by updating state)
  const refreshFeed = useCallback(() => {
    setIsRefreshing(true);
    // The feed will automatically update due to real-time subscription
    // This just shows the refreshing state briefly
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  return (
    <FeedContext.Provider
      value={{
        posts,
        isLoading,
        isRefreshing,
        error,
        refreshFeed,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

// ─────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────
export const useFeed = (): FeedContextType => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error("useFeed must be used within a FeedProvider");
  }
  return context;
};

export default FeedContext;
