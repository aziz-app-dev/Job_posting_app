import { Colors } from "@/constants/theme";
import { Collection, Post } from "@/constants/types";
import { useCollection } from "@/context/CollectionContext";
import { getPostById } from "@/services/postService";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmationModal from "../(modal)/confirm_modal";

const BookMarkScreen = () => {
  const { collections, isLoadingCollections, deleteCollectionAction, removePostFromCollectionAction } = useCollection();
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionPosts, setCollectionPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Delete confirmation
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "collection" | "post"; id: string } | null>(null);

  // Load posts when a collection is selected
  useEffect(() => {
    if (selectedCollection) {
      loadCollectionPosts(selectedCollection);
    }
  }, [selectedCollection]);

  const loadCollectionPosts = async (collection: Collection) => {
    setIsLoadingPosts(true);
    const posts: Post[] = [];

    for (const postId of collection.postIds) {
      const { post } = await getPostById(postId);
      if (post) {
        posts.push(post);
      }
    }

    setCollectionPosts(posts);
    setIsLoadingPosts(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedCollection) {
      // Find the updated collection from the list
      const updatedCollection = collections.find(c => c.id === selectedCollection.id);
      if (updatedCollection) {
        await loadCollectionPosts(updatedCollection);
        setSelectedCollection(updatedCollection);
      }
    }
    setRefreshing(false);
  }, [selectedCollection, collections]);

  const handleDeletePress = (type: "collection" | "post", id: string) => {
    setItemToDelete({ type, id });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "collection") {
      await deleteCollectionAction(itemToDelete.id);
      setSelectedCollection(null);
    } else if (itemToDelete.type === "post" && selectedCollection) {
      await removePostFromCollectionAction(selectedCollection.id, itemToDelete.id);
      // Refresh the posts list
      setCollectionPosts(prev => prev.filter(p => p.id !== itemToDelete.id));
    }

    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  // Render collection item
  const renderCollectionItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={styles.collectionCard}
      onPress={() => setSelectedCollection(item)}
      activeOpacity={0.7}
    >
      {item.coverImageUrl ? (
        <Image source={{ uri: item.coverImageUrl }} style={styles.collectionCover} />
      ) : (
        <View style={[styles.collectionCover, styles.collectionCoverPlaceholder]}>
          <Feather name="bookmark" size={32} color="#999" />
        </View>
      )}
      <View style={styles.collectionOverlay}>
        <Text style={styles.collectionName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.collectionPostCount}>
          {item.postIds.length} {item.postIds.length === 1 ? "post" : "posts"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Navigate to post detail
  const handlePostPress = (postId: string) => {
    router.push({
      pathname: "/(profile)/post_detail",
      params: { postId },
    });
  };

  // Render post item
  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => handlePostPress(item.id)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.mediaUrl || "" }} style={styles.postImage} />
      <View style={styles.postContent}>
        <Text style={styles.postCaption} numberOfLines={2}>
          {item.caption || "No caption"}
        </Text>
        <Text style={styles.postAuthor}>{item.authorName}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={(e) => {
          e.stopPropagation();
          handleDeletePress("post", item.id);
        }}
      >
        <Feather name="x" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Collection detail view
  if (selectedCollection) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedCollection(null)}
          >
            <Feather name="arrow-left" size={24} color={Colors.black} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{selectedCollection.name}</Text>
            {selectedCollection.description ? (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {selectedCollection.description}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.deleteCollectionBtn}
            onPress={() => handleDeletePress("collection", selectedCollection.id)}
          >
            <Feather name="trash-2" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        {/* Posts list */}
        {isLoadingPosts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.black} />
          </View>
        ) : collectionPosts.length > 0 ? (
          <FlatList
            key="posts-list"
            data={collectionPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderPostItem}
            contentContainerStyle={styles.postsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bookmark-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No posts saved</Text>
            <Text style={styles.emptySubText}>
              Posts you save to this collection will appear here
            </Text>
          </View>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          visible={deleteModalVisible}
          title={itemToDelete?.type === "collection" ? "Delete Collection" : "Remove Post"}
          message={itemToDelete?.type === "collection"
            ? "Are you sure you want to delete this collection? All saved posts will be removed."
            : "Are you sure you want to remove this post from the collection?"}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </View>
    );
  }

  // Collections list view
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Book Marks</Text>
      </View>

      {/* Collections */}
      {isLoadingCollections ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.black} />
        </View>
      ) : collections.length > 0 ? (
        <FlatList
          key="collections-grid"
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={renderCollectionItem}
          numColumns={2}
          contentContainerStyle={styles.collectionsGrid}
          columnWrapperStyle={styles.collectionsRow}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.emptyScrollContainer}>
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bookmark-plus-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No collections yet</Text>
            <Text style={styles.emptySubText}>
              Save posts to collections to easily find them later
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push("/(modal)/bookmark_feature_modal")}
            >
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Create Collection</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default BookMarkScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
 
    justifyContent:"center",
    width:"100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.black,
    
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.black,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  deleteCollectionBtn: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyScrollContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.black,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
    gap: 8,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Collections grid
  collectionsGrid: {
    padding: 12,
  },
  collectionsRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  collectionCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  collectionCover: {
    width: "100%",
    height: "100%",
  },
  collectionCoverPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8e8e8",
  },
  collectionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
  },
  collectionName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  collectionPostCount: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },

  // Posts list
  postsList: {
    padding: 16,
  },
  postCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  postImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#e8e8e8",
  },
  postContent: {
    flex: 1,
    marginLeft: 12,
  },
  postCaption: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  postAuthor: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
});
