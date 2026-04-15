import ModalShell from "@/components/ModalShell";
import MyBtn from "@/components/btn";
import { Colors } from "@/constants/theme";
import { useCollection } from "@/context/CollectionContext";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const BookmarkModal: React.FC = () => {
  const { postId, postImageUrl } = useLocalSearchParams<{ postId?: string; postImageUrl?: string }>();
  const { collections, isLoadingCollections, createCollectionAndSavePost, savePostToCollection, isPostInCollection } = useCollection();

  const [isAddVisible, setAddVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCollectionIds, setSavedCollectionIds] = useState<string[]>([]);

  // Check which collections already have this post
  useEffect(() => {
    if (postId) {
      const checkSavedCollections = async () => {
        const ids = await isPostInCollection(postId);
        setSavedCollectionIds(ids);
      };
      checkSavedCollections();
    }
  }, [postId, isPostInCollection]);

  const handleClose = () => {
    router.back();
  };

  // Keyboard listeners
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Handle saving to existing collection
  const handleSaveToCollection = async (collectionId: string) => {
    if (!postId || isSaving) return;

    // Check if already saved
    if (savedCollectionIds.includes(collectionId)) {
      handleClose();
      return;
    }

    setIsSaving(true);
    const { error } = await savePostToCollection(collectionId, postId, postImageUrl);
    setIsSaving(false);

    if (!error) {
      setSavedCollectionIds((prev) => [...prev, collectionId]);
      handleClose();
    }
  };

  // Handle creating new collection and saving post
  const handleDone = async () => {
    if (isAddVisible) {
      if (!name.trim()) {
        return;
      }

      if (!postId) {
        // Just create collection without saving post
        handleClose();
        return;
      }

      setIsSaving(true);
      const { error } = await createCollectionAndSavePost(
        { name: name.trim(), description: description.trim() },
        postId,
        postImageUrl
      );
      setIsSaving(false);

      if (!error) {
        setName("");
        setDescription("");
        setAddVisible(false);
        handleClose();
      }
    } else {
      handleClose();
    }
  };

  const isPostSavedInCollection = (collectionId: string) => {
    return savedCollectionIds.includes(collectionId);
  };

  return (
    <ModalShell onClose={handleClose} width={480} height="70%">
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      {/* Bottom Sheet Container */}
      <View style={[styles.bottomSheet, keyboardVisible && styles.bottomSheetKeyboard]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isAddVisible ? "New collection" : "Save to collection"}
          </Text>
        </View>

        {/* Body */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.bodyContainer}
            keyboardShouldPersistTaps="handled"
          >
            {!isAddVisible ? (
              <>
                {/* Create new collection button */}
                <TouchableOpacity
                  style={styles.addCollectionBtn}
                  onPress={() => setAddVisible(true)}
                >
                  <View style={styles.plusIcon}>
                    <Feather name="plus" size={18} color="#ffffff" />
                  </View>
                  <Text style={styles.addCollectionText}>Create a collection</Text>
                </TouchableOpacity>

                {/* Existing collections */}
                {isLoadingCollections ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#000" />
                  </View>
                ) : collections.length > 0 ? (
                  <View style={styles.collectionsContainer}>
                    <Text style={styles.sectionTitle}>Your collections</Text>
                    {collections.map((collection) => (
                      <TouchableOpacity
                        key={collection.id}
                        style={styles.collectionItem}
                        onPress={() => handleSaveToCollection(collection.id)}
                        disabled={isSaving}
                      >
                        {collection.coverImageUrl ? (
                          <Image
                            source={{ uri: collection.coverImageUrl }}
                            style={styles.collectionImage}
                          />
                        ) : (
                          <View style={[styles.collectionImage, styles.collectionImagePlaceholder]}>
                            <Feather name="bookmark" size={20} color="#999" />
                          </View>
                        )}
                        <View style={styles.collectionInfo}>
                          <Text style={styles.collectionName}>{collection.name}</Text>
                          <Text style={styles.collectionCount}>
                            {collection.postIds.length} {collection.postIds.length === 1 ? "post" : "posts"}
                          </Text>
                        </View>
                        {isPostSavedInCollection(collection.id) ? (
                          <View style={styles.savedBadge}>
                            <Feather name="check" size={16} color="#22C55E" />
                          </View>
                        ) : (
                          <Feather name="chevron-right" size={20} color="#999" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.formContainer}>
                {/* Name Input */}
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder='Like "Salary Negotiation"'
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />

                {/* Description Input */}
                <Text style={styles.inputLabel}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What ties these posts together?"
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Footer */}
        <View style={styles.footer}>
          {isAddVisible ? (
            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setAddVisible(false);
                  setName("");
                  setDescription("");
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <MyBtn
                  onPress={handleDone}
                  textColor="white"
                  title={isSaving ? "Saving..." : "Create & Save"}
                  disabled={!name.trim() || isSaving}
                />
              </View>
            </View>
          ) : (
            <MyBtn onPress={handleClose} textColor="white" title="Done" />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
    </ModalShell>
  );
};

export default BookmarkModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 450,
    maxHeight: "80%",
    paddingBottom: 34,
  },
  bottomSheetKeyboard: {
    maxHeight: "100%",
    paddingBottom: 0,
  },
  header: {
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#E5EAF1",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.black,
  },
  bodyContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  addCollectionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
  },
  plusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0e0d0d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addCollectionText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.black,
  },
  collectionsContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  collectionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  collectionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  collectionImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  collectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  collectionName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.black,
  },
  collectionCount: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  savedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.black,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  footerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
});
