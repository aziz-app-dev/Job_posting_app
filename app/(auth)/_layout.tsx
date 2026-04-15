import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthLayout() {
  const colorScheme = useColorScheme();

  const content = (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="into_screen" />
        <Stack.Screen name="signup_screen" />
        <Stack.Screen name="login_screen" />
        <Stack.Screen name="user_name_screen" />
        <Stack.Screen name="age_screen" />
        <Stack.Screen name="img_screen" />
        <Stack.Screen name="profile_into_screen" />
        <Stack.Screen name="inspiration_screen" />
        <Stack.Screen name="user_welcome_Screen" />
      </Stack>
    </ThemeProvider>
  );

  // On web, no SafeAreaView needed
  if (Platform.OS === "web") {
    return content;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {content}
    </SafeAreaView>
  );
}
