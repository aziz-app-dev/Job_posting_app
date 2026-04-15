import MyBtn from "@/components/btn";
import AuthWebLayout, { useIsWebLayout } from "@/components/AuthWebLayout";
import MyInput from "@/components/input_field";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

const PROGRESS = 0.32;

const AgeScreen = () => {
  const isWeb = useIsWebLayout();
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [webDateStr, setWebDateStr] = useState("");

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleWebDateChange = (text: string) => {
    setWebDateStr(text);
    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) setDate(parsed);
  };

  const formattedDate = date
    ? date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <AuthWebLayout>
      <View style={isWeb ? webStyles.container : styles.container}>
        {/* Header - mobile */}
        {!isWeb && (
          <View style={styles.header}>
            <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
            </View>
          </View>
        )}

        {isWeb && (
          <View style={webStyles.progressBar}>
            <View style={[webStyles.progressFill, { width: `${PROGRESS * 100}%` }]} />
          </View>
        )}

        <Text style={isWeb ? webStyles.title : styles.title}>When's your birthday?</Text>

        {Platform.OS === "web" ? (
          <View style={{ gap: 8, marginTop: 8 }}>
            <Text style={{ fontSize: 16, color: "#0F161E80" }}>Birth date</Text>
            <TextInput
              style={webStyles.dateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={webDateStr}
              onChangeText={handleWebDateChange}
            />
            {date && <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>Selected: {formattedDate}</Text>}
          </View>
        ) : (
          <View style={styles.mainContainer}>
            <MyInput title="Birth date" placeholder="Select your birthday" value={formattedDate} editable={false} pointerEvents="none" onChangeText={() => {}} />
            {showPicker && (
              <DateTimePicker
                value={date ?? new Date(2000, 0, 1)}
                mode="date"
                maximumDate={new Date()}
                onChange={onChange}
                {...(Platform.OS === "ios" ? { display: "spinner" } : {})}
              />
            )}
          </View>
        )}

        <View style={isWeb ? webStyles.footer : styles.footer}>
          <MyBtn title="Continue" textColor="#FFFFFF" onPress={() => router.replace("/(auth)/img_screen")} disabled={!date} />
        </View>
      </View>
    </AuthWebLayout>
  );
};

export default AgeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 50, gap: 12 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#E5E5EA", borderRadius: 6, overflow: "hidden", marginLeft: 40, marginRight: 70 },
  progressFill: { height: "100%", backgroundColor: "black", borderRadius: 6 },
  mainContainer: { padding: 16, gap: 10 },
  title: { fontWeight: "600", fontSize: 28, marginBottom: 10, marginTop: 24, alignSelf: "center" },
  footer: { marginTop: "auto", paddingHorizontal: 18, paddingBottom: 24 },
});

const webStyles = StyleSheet.create({
  container: { gap: 12 },
  progressBar: { height: 6, backgroundColor: "#E5E5EA", borderRadius: 6, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", backgroundColor: "black", borderRadius: 6 },
  title: { fontSize: 32, fontWeight: "700", color: "#111", textAlign: "center" },
  dateInput: { borderWidth: 1, borderColor: "#0F161E59", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 14, fontSize: 16, outlineStyle: "none" as any },
  footer: { marginTop: 28 },
});
