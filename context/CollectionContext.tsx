import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Collection, CreateCollectionInput, Post } from "@/constants/types";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import {
  createCollection,
  addPostToCollection,
  removePostFromCollection,
  deleteCollection,
  subscribeToCollections,
  getCollectionsContainingPost,
} from "@/services/collectionService";
import { getPostById } from "@/services/postService";

// ─────────────────────────────────────────────────
// Context Types
// ─────────────────────────────────────────────────
interface CollectionContextType {
  collections: Collection[];
  isLoadingCollections: boolean;

  // Actions
  createNewCollection: (input: CreateCollectionInput) => Promise<{ collectionId?: string; error: string | null }>;
  savePostToCollection: (collectionId: string, postId: string, postImageUrl?: string | null) => Promise<{ error: string | null }>;
  removePostFromCollectionAction: (collectionId: string, postId: string) => Promise<{ error: string | null }>;
  deleteCollectionAction: (collectionId: string) => Promise<{ error: string | null }>;
  isPostInCollection: (postId: string) => Promise<string[]>;
  getPostsForCollection: (collectionId: string) => Promise<Post[]>;

  // Create collection and save post in one action
  createCollectionAndSavePost: (input: CreateCollectionInput, postId: string, postImageUrl?: string | null) => Promise<{ collectionId?: string; error: string | null }>;
}

// ─────────────────────────────────────────────────
// Context Creation
// ─────────────────────────────────────────────────
const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

// ─────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────
export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  // Subscribe to collections for real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setCollections([]);
      return;
    }

    setIsLoadingCollections(true);

    const unsubscribe = subscribeToCollections(user.uid, (fetchedCollections) => {
      setCollections(fetchedCollections);
      setIsLoadingCollections(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Create a new collection
  const createNewCollection = useCallback(async (
    input: CreateCollectionInput
  ): Promise<{ collectionId?: string; error: string | null }> => {
    if (!user?.uid) {
      return { error: "Please sign in to create a collection" };
    }

    const { collectionId, error } = await createCollection(user.uid, input);

    if (!error) {
      showSuccess("Collection created");
    } else {
      showError("Failed to create collection");
    }

    return { collectionId, error };
  }, [user?.uid, showSuccess, showError]);

  // Save post to collection
  const savePostToCollection = useCallback(async (
    collectionId: string,
    postId: string,
    postImageUrl?: string | null
  ): Promise<{ error: string | null }> => {
    const { error } = await addPostToCollection(collectionId, postId, postImageUrl);

    if (!error) {
      showSuccess("Saved to collection");
    } else {
      showError("Failed to save post");
    }

    return { error };
  }, [showSuccess, showError]);

  // Remove post from collection
  const removePostFromCollectionAction = useCallback(async (
    collectionId: string,
    postId: string
  ): Promise<{ error: string | null }> => {
    const { error } = await removePostFromCollection(collectionId, postId);

    if (!error) {
      showSuccess("Removed from collection");
    } else {
      showError("Failed to remove post");
    }

    return { error };
  }, [showSuccess, showError]);

  // Delete collection
  const deleteCollectionAction = useCallback(async (
    collectionId: string
  ): Promise<{ error: string | null }> => {
    const { error } = await deleteCollection(collectionId);

    if (!error) {
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
      showSuccess("Collection deleted");
    } else {
      showError("Failed to delete collection");
    }

    return { error };
  }, [showSuccess, showError]);

  // Check if post is in any collection
  const isPostInCollection = useCallback(async (postId: string): Promise<string[]> => {
    if (!user?.uid) return [];

    const { collectionIds } = await getCollectionsContainingPost(user.uid, postId);
    return collectionIds;
  }, [user?.uid]);

  // Get posts for a collection
  const getPostsForCollection = useCallback(async (collectionId: string): Promise<Post[]> => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return [];

    const posts: Post[] = [];
    for (const postId of collection.postIds) {
      const { post } = await getPostById(postId);
      if (post) {
        posts.push(post);
      }
    }

    return posts;
  }, [collections]);

  // Create collection and save post in one action
  const createCollectionAndSavePost = useCallback(async (
    input: CreateCollectionInput,
    postId: string,
    postImageUrl?: string | null
  ): Promise<{ collectionId?: string; error: string | null }> => {
    if (!user?.uid) {
      return { error: "Please sign in to create a collection" };
    }

    // First create the collection
    const { collectionId, error: createError } = await createCollection(user.uid, input);

    if (createError || !collectionId) {
      showError("Failed to create collection");
      return { error: createError || "Failed to create collection" };
    }

    // Then save the post to it
    const { error: saveError } = await addPostToCollection(collectionId, postId, postImageUrl);

    if (saveError) {
      showError("Collection created but failed to save post");
      return { collectionId, error: saveError };
    }

    showSuccess("Saved to new collection");
    return { collectionId, error: null };
  }, [user?.uid, showSuccess, showError]);

  return (
    <CollectionContext.Provider
      value={{
        collections,
        isLoadingCollections,
        createNewCollection,
        savePostToCollection,
        removePostFromCollectionAction,
        deleteCollectionAction,
        isPostInCollection,
        getPostsForCollection,
        createCollectionAndSavePost,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
};

// ─────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────
export const useCollection = (): CollectionContextType => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error("useCollection must be used within a CollectionProvider");
  }
  return context;
};

export default CollectionContext;
