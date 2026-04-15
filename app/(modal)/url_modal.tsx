import MyBtn from "@/components/btn";
import MyInput from "@/components/input_field";
import { Colors } from "@/constants/theme";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type UrlSheetProps = {
  currentValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
};

export default function UrlSheet({
  currentValue,
  onSave,
  onClose,
}: UrlSheetProps) {
  const [url, setUrl] = useState(currentValue);
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

  const handleDone = () => {
    onSave(url);
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
          <Text style={styles.headerTitle}>URL</Text>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.body}>
            <MyInput
              title=""
              placeholder="https://..."
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.helperText}>
              Add a link to your website, portfolio, or any relevant content
            </Text>
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.footer}>
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
    minHeight: 200,
    paddingBottom: 34,
  },
  bottomSheetKeyboard: {
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
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  helperText: {
    fontSize: 13,
    color: "#777",
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
});
