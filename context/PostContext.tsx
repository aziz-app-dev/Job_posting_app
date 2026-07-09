import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CreateDraftInput, CreatePostInput, Draft, Post, PostVisibility } from "@/constants/types";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { createPost, deletePost, getPostsByUser, updatePost, getPostById } from "@/services/postService";
import { deleteDraft, getDrafts, saveDraft, subscribeToDrafts, updateDraft } from "@/services/draftService";
import { uploadMediaToCloudinary, generateVideoThumbnail } from "@/services/cloundinary_services";
import { schedulePost as schedulePostService, cancelScheduledPost, uploadDraftMedia } from "@/services/postScheduler";

// ─────────────────────────────────────────────────
// Context Types
// ─────────────────────────────────────────────────
interface PostContextType {
  // Upload state
  isUploading: boolean;
  uploadProgress: number;

  // Draft state
  drafts: Draft[];
  isLoadingDrafts: boolean;

  // User posts state
  userPosts: Post[];
  isLoadingUserPosts: boolean;

  // Actions
  publishPost: (
    input: CreatePostInput,
    localMediaUri?: string | null,
    mediaType?: "image" | "video" | null
  ) => Promise<{ postId?: string; error: string | null }>;

  saveToDrafts: (input: CreateDraftInput) => Promise<{ draftId?: string; error: string | null }>;
  updateExistingDraft: (draftId: string, input: Partial<Draft>) => Promise<{ error: string | null }>;
  removeDraft: (draftId: string) => Promise<{ error: string | null }>;
  removePost: (postId: string) => Promise<{ error: string | null }>;
  editPost: (postId: string, input: Partial<Post>, localMediaUri?: string | null, mediaType?: "image" | "video" | null) => Promise<{ error: string | null }>;
  getPost: (postId: string) => Promise<{ post: Post | null; error: string | null }>;
  publishFromDraft: (draft: Draft) => Promise<{ postId?: string; error: string | null }>;

  loadDrafts: () => Promise<void>;

  schedulePost: (input: CreateDraftInput, scheduledAt: Date) => Promise<{ draftId?: string; error: string | null }>;
  cancelSchedule: (draftId: string) => Promise<{ error: string | null }>;
}

// ─────────────────────────────────────────────────
// Context Creation
// ─────────────────────────────────────────────────
const PostContext = createContext<PostContextType | undefined>(undefined);

// ─────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────
export const PostProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, profile } = useAuth();
  const { showProgress, updateToast, hideToast, showSuccess, showError } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingUserPosts, setIsLoadingUserPosts] = useState(false);

  // Subscribe to drafts for real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setDrafts([]);
      return;
    }

    setIsLoadingDrafts(true);

    // Use real-time subscription for automatic updates
    const unsubscribe = subscribeToDrafts(user.uid, (fetchedDrafts) => {
      setDrafts(fetchedDrafts);
      setIsLoadingDrafts(false);
    });

    // Cleanup subscription on unmount or user change
    return () => unsubscribe();
  }, [user?.uid]);

  // Load user's posts
  useEffect(() => {
    if (!user?.uid) {
      setUserPosts([]);
      return;
    }

    const loadUserPosts = async () => {
      setIsLoadingUserPosts(true);
      const { posts, error } = await getPostsByUser(user.uid);
      if (!error) {
        setUserPosts(posts);
      }
      // Silently handle errors - permission errors are expected when not authenticated
      setIsLoadingUserPosts(false);
    };

    loadUserPosts();
  }, [user?.uid]);

  // Load user's drafts
  const loadDrafts = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoadingDrafts(true);
    const { drafts: fetchedDrafts, error } = await getDrafts(user.uid);

    if (!error) {
      setDrafts(fetchedDrafts);
    } else if (!error.includes("permission")) {
      // Only show error for non-permission issues
      showError("Failed to load drafts");
    }
    setIsLoadingDrafts(false);
  }, [user?.uid, showError]);

  // Publish a new post
  const publishPost = useCallback(async (
    input: CreatePostInput,
    localMediaUri?: string | null,
    mediaType?: "image" | "video" | null
  ): Promise<{ postId?: string; error: string | null }> => {
    if (!user?.uid || !profile) {
      return { error: "Please sign in to create a post" };
    }

    setIsUploading(true);
    setUploadProgress(0);

    let toastId: string | null = null;
    let mediaUrl: string | null = null;
    let thumbnailUrl: string | null = null;

    try {
      // Upload media if present
      if (localMediaUri) {
        toastId = showProgress("Uploading media...");

        // Generate and upload thumbnail for videos (silently in background)
        if (mediaType === "video") {
          const { uri: thumbnailUri } = await generateVideoThumbnail(localMediaUri);

          if (thumbnailUri) {
            // Upload thumbnail to Cloudinary
            const { url: thumbUrl } = await uploadMediaToCloudinary(
              thumbnailUri,
              "image"
            );
            thumbnailUrl = thumbUrl;
          }
        }

        const { url, error: uploadError } = await uploadMediaToCloudinary(
          localMediaUri,
          mediaType || "image",
          (progress) => {
            const cappedProgress = Math.min(progress, 100);
            setUploadProgress(cappedProgress);
            if (toastId) {
              updateToast(toastId, {
                progress: cappedProgress,
                message: cappedProgress >= 100 ? "Processing..." : "Uploading media..."
              });
            }
          }
        );

        if (uploadError || !url) {
          if (toastId) hideToast(toastId);
          showError("Failed to upload media");
          setIsUploading(false);
          return { error: uploadError || "Upload failed" };
        }

        mediaUrl = url;

        if (toastId) {
          updateToast(toastId, {
            message: "Creating post...",
            progress: 100
          });
        }
      } else {
        toastId = showProgress("Creating post...");
        if (toastId) updateToast(toastId, { progress: 50 });
      }

      // Create the post
      const { postId, error } = await createPost(
        user.uid,
        profile.displayName || user.email?.split("@")[0] || "User",
        profile.photoURL || "",
        profile.title || "",
        {
          ...input,
          mediaUrl,
          mediaType: mediaUrl ? mediaType : null,
          thumbnailUrl,
        }
      );

      if (toastId) hideToast(toastId);

      if (error) {
        showError("Failed to create post");
        setIsUploading(false);
        return { error };
      }

      showSuccess("Post created successfully!");
      setIsUploading(false);
      setUploadProgress(0);

      // Refresh user posts after successful publish
      const { posts } = await getPostsByUser(user.uid);
      setUserPosts(posts);

      return { postId, error: null };
    } catch (err: any) {
      if (toastId) hideToast(toastId);
      showError("Something went wrong");
      setIsUploading(false);
      return { error: err.message || "Failed to create post" };
    }
  }, [user, profile, showProgress, updateToast, hideToast, showSuccess, showError]);

  // Save to drafts
  const saveToDrafts = useCallback(async (
    input: CreateDraftInput
  ): Promise<{ draftId?: string; error: string | null }> => {
    if (!user?.uid) {
      return { error: "Please sign in to save draft" };
    }

    const { draftId, error } = await saveDraft(user.uid, input);

    if (!error) {
      showSuccess("Draft saved");
      // No need to manually reload - subscription handles updates automatically
    } else {
      showError("Failed to save draft");
    }

    return { draftId, error };
  }, [user?.uid, showSuccess, showError]);

  // Update existing draft
  const updateExistingDraft = useCallback(async (
    draftId: string,
    input: Partial<Draft>
  ): Promise<{ error: string | null }> => {
    const { error } = await updateDraft(draftId, input);
    // No need to manually reload - subscription handles updates automatically
    return { error };
  }, []);

  // Remove draft
  const removeDraft = useCallback(async (
    draftId: string
  ): Promise<{ error: string | null }> => {
    const { error } = await deleteDraft(draftId);

    if (!error) {
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      showSuccess("Draft deleted");
    } else {
      showError("Failed to delete draft");
    }

    return { error };
  }, [showSuccess, showError]);

  // Remove post
  const removePost = useCallback(async (
    postId: string
  ): Promise<{ error: string | null }> => {
    const { error } = await deletePost(postId);

    if (!error) {
      setUserPosts((prev) => prev.filter((p) => p.id !== postId));
      showSuccess("Post deleted");
    } else {
      showError("Failed to delete post");
    }

    return { error };
  }, [showSuccess, showError]);

  // Edit post
  const editPost = useCallback(async (
    postId: string,
    input: Partial<Post>,
    localMediaUri?: string | null,
    mediaType?: "image" | "video" | null
  ): Promise<{ error: string | null }> => {
    if (!user?.uid) {
      return { error: "Please sign in to edit post" };
    }

    let toastId: string | null = null;
    let mediaUrl: string | null = input.mediaUrl || null;
    let thumbnailUrl: string | null = input.thumbnailUrl || null;

    try {
      // Upload new media if provided and different from existing
      if (localMediaUri && !localMediaUri.startsWith("http")) {
        toastId = showProgress("Uploading media...");

        // Generate and upload thumbnail for videos (silently in background)
        if (mediaType === "video") {
          const { uri: thumbnailUri } = await generateVideoThumbnail(localMediaUri);

          if (thumbnailUri) {
            // Upload thumbnail to Cloudinary
            const { url: thumbUrl } = await uploadMediaToCloudinary(
              thumbnailUri,
              "image"
            );
            thumbnailUrl = thumbUrl;
          }
        }

        const { url, error: uploadError } = await uploadMediaToCloudinary(
          localMediaUri,
          mediaType || "image",
          (progress) => {
            const cappedProgress = Math.min(progress, 100);
            if (toastId) {
              updateToast(toastId, {
                progress: cappedProgress,
                message: cappedProgress >= 100 ? "Processing..." : "Uploading media..."
              });
            }
          }
        );

        if (uploadError || !url) {
          if (toastId) hideToast(toastId);
          showError("Failed to upload media");
          return { error: uploadError || "Upload failed" };
        }

        mediaUrl = url;

        if (toastId) {
          updateToast(toastId, {
            message: "Updating post...",
            progress: 100
          });
        }
      } else {
        toastId = showProgress("Updating post...");
        if (toastId) updateToast(toastId, { progress: 50 });
      }

      // Update the post
      const { error } = await updatePost(postId, {
        ...input,
        mediaUrl,
        mediaType: mediaUrl ? mediaType : null,
        thumbnailUrl,
      });

      if (toastId) hideToast(toastId);

      if (error) {
        showError("Failed to update post");
        return { error };
      }

      showSuccess("Post updated successfully!");

      // Refresh user posts
      const { posts } = await getPostsByUser(user.uid);
      setUserPosts(posts);

      return { error: null };
    } catch (err: any) {
      if (toastId) hideToast(toastId);
      showError("Something went wrong");
      return { error: err.message || "Failed to update post" };
    }
  }, [user, showProgress, updateToast, hideToast, showSuccess, showError]);

  // Get post by ID
  const getPost = useCallback(async (
    postId: string
  ): Promise<{ post: Post | null; error: string | null }> => {
    // First check local userPosts
    const localPost = userPosts.find((p) => p.id === postId);
    if (localPost) {
      return { post: localPost, error: null };
    }

    // If not found locally, fetch from server
    return await getPostById(postId);
  }, [userPosts]);

  // Publish from draft
  const publishFromDraft = useCallback(async (
    draft: Draft
  ): Promise<{ postId?: string; error: string | null }> => {
    const result = await publishPost(
      {
        caption: draft.caption,
        title: draft.title,
        url: draft.url,
        location: draft.location,
        topics: draft.topics,
        visibility: draft.visibility,
        commentsEnabled: draft.commentsEnabled,
      },
      draft.localMediaUri,
      draft.mediaType
    );

    if (!result.error) {
      // Delete the draft after successful publish
      // Subscription will automatically update the drafts list
      await deleteDraft(draft.id);
    }

    return result;
  }, [publishPost]);

  const schedulePost = useCallback(async (
    input: CreateDraftInput,
    scheduledAt: Date
  ): Promise<{ draftId?: string; error: string | null }> => {
    if (!user?.uid) return { error: "Not authenticated" };

    if (input.localMediaUri) {
      showProgress("Uploading media for scheduled post...");
    }

    let remoteMediaUrl: string | null = null;

    const { draftId, error: draftError } = await saveToDrafts({
      ...input,
      scheduledAt,
    });

    if (draftError || !draftId) {
      return { error: draftError || "Failed to save draft" };
    }

    if (input.localMediaUri) {
      const { url, error: uploadError } = await uploadDraftMedia({
        id: draftId,
        authorId: user.uid,
        caption: input.caption || "",
        localMediaUri: input.localMediaUri,
        mediaType: input.mediaType || null,
        title: input.title || "",
        url: input.url || "",
        location: input.location || "",
        topics: input.topics || [],
        visibility: input.visibility || "Public",
        commentsEnabled: input.commentsEnabled ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledAt,
      });
      if (uploadError) {
        showError("Media upload failed, but draft saved");
      } else if (url) {
        remoteMediaUrl = url;
        await updateDraft(draftId, { remoteMediaUrl: url } as any);
      }
    }

    const { error: scheduleError } = await schedulePostService(draftId, scheduledAt);
    if (scheduleError) {
      showError("Post scheduled but notification may not fire");
    } else {
      showSuccess("Post scheduled!");
    }

    return { draftId, error: null };
  }, [user, saveToDrafts, showProgress, showSuccess, showError, updateDraft]);

  const cancelSchedule = useCallback(async (
    draftId: string
  ): Promise<{ error: string | null }> => {
    const { error } = await cancelScheduledPost(draftId);
    if (!error) {
      await updateDraft(draftId, { scheduledAt: null as any });
      showSuccess("Schedule cancelled");
    }
    return { error };
  }, [showSuccess, updateDraft]);

  return (
    <PostContext.Provider
      value={{
        isUploading,
        uploadProgress,
        drafts,
        isLoadingDrafts,
        userPosts,
        isLoadingUserPosts,
        publishPost,
        saveToDrafts,
        updateExistingDraft,
        removeDraft,
        removePost,
        editPost,
        getPost,
        publishFromDraft,
        loadDrafts,
        schedulePost,
        cancelSchedule,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

// ─────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────
export const usePost = (): PostContextType => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error("usePost must be used within a PostProvider");
  }
  return context;
};

export default PostContext;
