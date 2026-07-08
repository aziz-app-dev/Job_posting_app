import WebShell from "@/components/WebShell";
import { Stack } from "expo-router";
import { Platform, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileLayout() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= 768;

  const stack = (
    <Stack>
      <Stack.Screen name="edit_profile" options={{ headerShown: false }} />
      <Stack.Screen name="edit_links" options={{ headerShown: false }} />
      <Stack.Screen name="post_detail" options={{ headerShown: false }} />
      <Stack.Screen name="public_profile" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="job_applicants" options={{ headerShown: false }} />
      <Stack.Screen name="my_job_posts" options={{ headerShown: false }} />
      <Stack.Screen name="my_applications" options={{ headerShown: false }} />
      <Stack.Screen name="following" options={{ headerShown: false }} />
      <Stack.Screen name="conversations" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="discover" options={{ headerShown: false }} />
      <Stack.Screen name="company_profile" options={{ headerShown: false }} />
    </Stack>
  );

  if (isWeb) {
    return <WebShell>{stack}</WebShell>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top", "bottom"]}>
      {stack}
    </SafeAreaView>
  );
}
