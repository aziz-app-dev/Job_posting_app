import MyBtn from "@/components/btn";
import { GOOGLE_PLACES_API_KEY } from "@/config/keys";
import { Colors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from "react-native-google-places-autocomplete";

type LocationSheetProps = {
  currentValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
};

export default function LocationSheet({
  currentValue,
  onSave,
  onClose,
}: LocationSheetProps) {
  const [location, setLocation] = useState(currentValue);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const placesRef = useRef<GooglePlacesAutocompleteRef>(null);

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

  // Set initial value in autocomplete input
  useEffect(() => {
    if (currentValue && placesRef.current) {
      placesRef.current.setAddressText(currentValue);
    }
  }, [currentValue]);

  const handleDone = () => {
    onSave(location);
    onClose();
  };

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View
        style={[
          styles.bottomSheet,
          keyboardVisible && styles.bottomSheetKeyboard,
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Location</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.hint}>
            Search for your city or location
          </Text>

          <GooglePlacesAutocomplete
            ref={placesRef}
            placeholder="Search for a location..."
            onPress={(data) => {
              const description = data.description;
              setLocation(description);
            }}
            textInputProps={{
              onChangeText: (text) => {
                setLocation(text);
              },
            }}
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: "en",
              types: "(cities)",
            }}
            fetchDetails={false}
            enablePoweredByContainer={false}
            debounce={300}
            minLength={2}
            styles={{
              container: {
                flex: 0,
                zIndex: 1,
              },
              textInputContainer: {
                backgroundColor: "#F5F5F5",
                borderRadius: 12,
                paddingHorizontal: 12,
              },
              textInput: {
                height: 48,
                color: Colors.black,
                fontSize: 16,
                backgroundColor: "transparent",
              },
              listView: {
                backgroundColor: Colors.white,
                borderRadius: 12,
                marginTop: 8,
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                borderWidth: 1,
                borderColor: "#E5EAF1",
              },
              row: {
                backgroundColor: Colors.white,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
              },
              separator: {
                height: 1,
                backgroundColor: "#F0F0F0",
              },
              description: {
                fontSize: 15,
                color: Colors.black,
              },
              predefinedPlacesDescription: {
                color: "#666",
              },
            }}
            renderLeftButton={() => (
              <View style={styles.searchIcon}>
                <Feather name="map-pin" size={20} color="#777" />
              </View>
            )}
            renderRow={(data) => (
              <View style={styles.resultRow}>
                <Feather name="map-pin" size={18} color="#666" />
                <Text style={styles.resultText}>{data.description}</Text>
              </View>
            )}
          />

          {location && (
            <View style={styles.selectedContainer}>
              <Text style={styles.selectedLabel}>Selected location:</Text>
              <View style={styles.selectedValue}>
                <Feather name="check-circle" size={18} color="#22C55E" />
                <Text style={styles.selectedText}>{location}</Text>
              </View>
            </View>
          )}
        </View>

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
    maxHeight: "90%",
    height: "70%",
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  hint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  searchIcon: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultText: {
    fontSize: 15,
    color: Colors.black,
    flex: 1,
  },
  selectedContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  selectedLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  selectedValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.black,
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 34,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  footerKeyboard: {
    bottom: 0,
  },
});
