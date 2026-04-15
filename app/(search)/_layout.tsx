import WebShell from "@/components/WebShell";
import { Stack } from "expo-router";
import { Platform, useWindowDimensions } from "react-native";

export default function SearchLayout() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= 768;

  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="search_screen" />
    </Stack>
  );

  if (isWeb) {
    return <WebShell>{stack}</WebShell>;
  }

  return stack;
}
