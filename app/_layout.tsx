// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
// import { Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import "react-native-reanimated";

// import { useColorScheme } from "@/hooks/use-color-scheme";
// import { SafeAreaView } from "react-native-safe-area-context";

// export const unstable_settings = {
//   anchor: "(tabs)",
// };

// export default function RootLayout() {
//   const colorScheme = useColorScheme();

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//         <Stack>
//           <Stack.Screen name="splash" options={{ headerShown: false }} />
//           <Stack.Screen
//             name="(auth)/into_screen"
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="(auth)/signup_screen"
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="(auth)/login_screen"
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="(auth)/user_name_screen"
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="(auth)/age_screen"
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="(auth)/img_screen"
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="(auth)/profile_into_screen"
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="(auth)/inspiration_screen"
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen
//             name="(auth)/user_welcome_Screen"
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//           <Stack.Screen
//             name="modal"
//             options={{ presentation: "modal", title: "Modal" }}
//           />
//           <Stack.Screen
//             name="(modal)/bookmark_feature_modal"
//            options={{ presentation: "transparentModal", headerShown: false, animation: "fade" }}
//           />
//           <Stack.Screen
//             name="(modal)/comments_modal"
//            options={{ presentation: "transparentModal", headerShown: false, animation: "fade" }}
//           />
//           <Stack.Screen
//             name="(modal)/opction_modal"
//            options={{ presentation: "transparentModal", headerShown: false, animation: "fade" }}
//           />
//         </Stack>
//         <StatusBar style="auto" />
//       </ThemeProvider>
//     </SafeAreaView>
//   );
// }

import ToastContainer from "@/components/ui/ToastContainer";
import { AuthProvider } from "@/context/AuthContext";
import { CollectionProvider } from "@/context/CollectionContext";
import { FeedProvider } from "@/context/FeedContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PostProvider } from "@/context/PostContext";
import { ToastProvider } from "@/context/ToastContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMessageNotifications } from "@/hooks/use-message-notifications";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Linking from "expo-linking";
import { router as expoRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { startForegroundScheduler, stopForegroundScheduler } from "@/services/postScheduler";

export const unstable_settings = { initialRouteName: "index" };

function useDeepLinkHandler() {
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      // Handle workcircle://post/<postId> (native) or ?post=<postId> (web)
      const postMatch = url.match(/workcircle:\/\/post\/(.+)/) || url.match(/[?&]post=([^&]+)/);
      if (postMatch && postMatch[1]) {
        expoRouter.push({
          pathname: "/(profile)/post_detail",
          params: { postId: postMatch[1] },
        });
        return;
      }
      // Handle workcircle://profile/<userId> (native) or ?profile=<userId> (web)
      const profileMatch = url.match(/workcircle:\/\/profile\/(.+)/) || url.match(/[?&]profile=([^&]+)/);
      if (profileMatch && profileMatch[1]) {
        expoRouter.push({
          pathname: "/(profile)/public_profile",
          params: { userId: profileMatch[1] },
        });
      }
    };

    // Handle deep link when app is already open
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Handle deep link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);
}

function MessageNotificationListener() {
  useMessageNotifications();
  return null;
}

function SchedulerInitializer() {
  useEffect(() => {
    startForegroundScheduler();
    return () => stopForegroundScheduler();
  }, []);
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useDeepLinkHandler();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <PostProvider>
              <FeedProvider>
                <CollectionProvider>
                  <ThemeProvider
                    value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                  >
                    <Stack>
                      <Stack.Screen
                        name="index"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="(auth)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="(profile)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="(search)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="(modal)"
                        options={{
                          headerShown: false,
                          presentation: "transparentModal",
                          animation: "fade",
                        }}
                      />
                    </Stack>
                    <SchedulerInitializer />
                    <MessageNotificationListener />
                    <ToastContainer />
                    <StatusBar style="auto" />
                  </ThemeProvider>
                </CollectionProvider>
              </FeedProvider>
            </PostProvider>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
