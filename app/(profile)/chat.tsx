import { Colors } from "@/constants/theme";
import { Conversation, Message } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import {
  markConversationRead,
  sendMessage,
  subscribeToMessages,
} from "@/services/messagingService";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "@/config/firebase";
import { toDate } from "@/constants/types";

const ChatScreen = () => {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, (e) => {
      const h = e.endCoordinates?.height || 0;
      setKbHeight(Math.max(0, h - insets.bottom));
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  // Load conversation info
  useEffect(() => {
    if (!conversationId) return;
    const unsub = db.collection("conversations").doc(conversationId).onSnapshot((doc) => {
      if (doc.exists) {
        const d = doc.data()!;
        setConv({
          id: doc.id,
          participantIds: d.participantIds,
          participants: d.participants,
          lastMessage: d.lastMessage,
          lastMessageAt: toDate(d.lastMessageAt),
          lastSenderId: d.lastSenderId,
          unreadCount: d.unreadCount || {},
          createdAt: toDate(d.createdAt),
        });
      }
    });
    return () => unsub();
  }, [conversationId]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) return;
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
    });
    return () => unsub();
  }, [conversationId]);

  // Mark as read
  useEffect(() => {
    if (conversationId && user?.uid) {
      markConversationRead(conversationId, user.uid);
    }
  }, [conversationId, user?.uid, messages.length]);

  const handleSend = async () => {
    if (!text.trim() || !user?.uid || !conversationId) return;
    const msg = text.trim();
    setText("");
    setIsSending(true);
    await sendMessage(
      conversationId,
      user.uid,
      profile?.displayName || user.displayName || "User",
      profile?.photoURL || user.photoURL || "",
      msg
    );
    setIsSending(false);
  };

  const getOtherParticipant = () => {
    if (!conv || !user?.uid) return { name: "", avatar: "", title: "" };
    const otherId = conv.participantIds.find((id) => id !== user.uid) || "";
    return conv.participants?.[otherId] || { name: "User", avatar: "", title: "" };
  };

  const other = getOtherParticipant();
  const getInitial = (name: string) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          item.senderAvatar ? (
            <Image source={{ uri: item.senderAvatar }} style={styles.msgAvatar} />
          ) : (
            <View style={[styles.msgAvatar, styles.msgAvatarFallback]}>
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                {getInitial(item.senderName)}
              </Text>
            </View>
          )
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: kbHeight }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")} style={{ padding: 4 }}>
          <Feather name="arrow-left" size={24} color={Colors.black} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => {
            const otherId = conv?.participantIds.find((id) => id !== user?.uid);
            if (otherId) router.push({ pathname: "/(profile)/public_profile", params: { userId: otherId } });
          }}
        >
          {other.avatar ? (
            <Image source={{ uri: other.avatar }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.msgAvatarFallback]}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {getInitial(other.name)}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{other.name}</Text>
            {other.title ? <Text style={styles.headerTitle}>{other.title}</Text> : null}
          </View>
        </TouchableOpacity>
        <View style={{ width: 28 }} />
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.black} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: "#999", fontSize: 15 }}>Say hello!</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || isSending}
        >
          <Feather name="send" size={20} color={text.trim() ? "#fff" : "#999"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 8,
  },
  headerUser: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eee" },
  headerName: { fontSize: 16, fontWeight: "600", color: "#111" },
  headerTitle: { fontSize: 12, color: "#888" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  messagesList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  msgRowMe: { flexDirection: "row-reverse" },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#eee", marginRight: 8 },
  msgAvatarFallback: { backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center" },
  bubble: { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleOther: { backgroundColor: "#f0f0f0", borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: Colors.black, borderBottomRightRadius: 4, marginLeft: 8 },
  bubbleText: { fontSize: 15, lineHeight: 20, color: "#111" },
  bubbleTextMe: { color: "#fff" },
  bubbleTime: { fontSize: 10, color: "#999", marginTop: 4, alignSelf: "flex-end" },
  bubbleTimeMe: { color: "rgba(255,255,255,0.6)" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#e0e0e0" },
});
