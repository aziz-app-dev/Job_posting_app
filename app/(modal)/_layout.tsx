import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";

export default function ModalLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="bookmark_feature_modal" />
        <Stack.Screen name="comments_modal" />
        <Stack.Screen name="comments_toggle_modal" />
        <Stack.Screen name="location_modal" />
        <Stack.Screen name="opction_modal" />
        <Stack.Screen name="title_modal" />
        <Stack.Screen name="sheet_modal" />
        <Stack.Screen name="topics_modal" />
        <Stack.Screen name="url_modal" />
        <Stack.Screen name="visibilty_modal" />
        <Stack.Screen name="profile_opction" />
        <Stack.Screen name="confirm_modal" />
        <Stack.Screen name="image_viewer_modal" />
        <Stack.Screen name="video_viewer_modal" />
      </Stack>
    </ThemeProvider>
  );
}
