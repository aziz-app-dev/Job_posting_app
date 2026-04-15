import MyBtn from "@/components/btn";
import MyInput from "@/components/input_field";
import { INTERESTS } from "@/constants/data";
import { Colors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

type TopicsSheetProps = {
  topics: string[];
  onSave: (topics: string[]) => void;
  onClose: () => void;
};

// const SUGGESTED_TOPICS = [
//   "Design",
//   "Development",
//   "Technology",
//   "Business",
//   "Marketing",
//   "Startup",
//   "Product",
//   "UX",
//   "UI",
//   "Mobile",
//   "Web",
//   "AI",
//   "Career",
//   "Tips",
// ];


export default function TopicsSheet({
  topics,
  onSave,
  onClose,
}: TopicsSheetProps) {
  const [tempTopics, setTempTopics] = useState<string[]>(topics);
  const [newTopic, setNewTopic] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true)
    );
    const subHide = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false)
    );

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const addTopic = () => {
    if (newTopic.trim() && !tempTopics.includes(newTopic.trim())) {
      setTempTopics([...tempTopics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const removeTopic = (t: string) => {
    setTempTopics(tempTopics.filter((item) => item !== t));
  };

  const toggleSuggestedTopic = (topic: string) => {
    if (tempTopics.includes(topic)) {
      setTempTopics(tempTopics.filter((t) => t !== topic));
    } else {
      setTempTopics([...tempTopics, topic]);
    }
  };

  const handleDone = () => {
    onSave(tempTopics);
    onClose();
  };

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[
        styles.bottomSheet,
        keyboardVisible && styles.bottomSheetKeyboard
      ]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Topics</Text>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputRow}>
              <MyInput
                onChangeText={setNewTopic}
                onSubmitEditing={addTopic}
                value={newTopic}
                title={""}
                placeholder="Add topic..."
                rightIcon={
                   <TouchableOpacity onPress={addTopic}>
                <Feather name="plus-circle" size={28} color={Colors.black} />
              </TouchableOpacity>
                }
              />
            </View>

            {tempTopics.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Selected topics</Text>
                <View style={styles.chipsRow}>
                  {tempTopics.map((t) => (
                    <View key={t} style={styles.chip}>
                      <Text style={styles.chipText}>{t}</Text>
                      <TouchableOpacity onPress={() => removeTopic(t)}>
                        <Feather
                          name="x"
                          size={16}
                          color="#555"
                          style={{ marginLeft: 6 }}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Suggested topics
            </Text>
            <View style={styles.chipsRow}>
              {INTERESTS.map((topic) => (
                <TouchableOpacity
                  key={topic}
                  style={[
                    styles.suggestedChip,
                    tempTopics.includes(topic) && styles.suggestedChipSelected,
                  ]}
                  onPress={() => toggleSuggestedTopic(topic)}
                >
                  <Text
                    style={[
                      styles.suggestedChipText,
                      tempTopics.includes(topic) &&
                        styles.suggestedChipTextSelected,
                    ]}
                  >
                    {topic}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        <View style={[styles.footer, keyboardVisible && styles.footerKeyboard]}>
          <MyBtn title="Done" onPress={handleDone} textColor="white" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

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
    maxHeight: "93%",
    minHeight: 400,
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
  scrollView: {
    flexGrow: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  inputRow: {
    // backgroundColor:"red",
     flexDirection: "row",
     marginTop:0,
     paddingTop:0,
    // alignItems: "center",
    // alignSelf: "center",
    // alignContent: "center",
    // justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
  },
  suggestedChip: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  suggestedChipSelected: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  suggestedChipText: {
    fontSize: 13,
    color: "#333",
  },
  suggestedChipTextSelected: {
    color: Colors.white,
  },
  footer: {
    position: "absolute",
    bottom: 34,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.white,
  },
  footerKeyboard: {
    bottom: 0,
  },
});
