import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log("[firebase] Initializing with config:", {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : "MISSING",
  authDomain: firebaseConfig.authDomain || "MISSING",
  projectId: firebaseConfig.projectId || "MISSING",
  appId: firebaseConfig.appId || "MISSING",
  platform: Platform.OS,
});

// Initialize Firebase (check if already initialized)
let app: firebase.app.App;
let auth: firebase.auth.Auth;

if (!firebase.apps.length) {
  console.log("[firebase] No existing apps — calling initializeApp");
  app = firebase.initializeApp(firebaseConfig);
  if (Platform.OS !== "web") {
    console.log("[firebase] Native platform — setting up persistence via initializeAuth");
    try {
      initializeAuth(app as any, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log("[firebase] initializeAuth succeeded");
    } catch (e) {
      console.log("[firebase] initializeAuth failed:", e);
    }
    auth = firebase.auth();
  } else {
    auth = firebase.auth();
  }
} else {
  console.log("[firebase] App already initialized — reusing");
  app = firebase.app();
  auth = firebase.auth();
}

console.log("[firebase] auth ready:", !!auth, "currentUser:", auth.currentUser?.uid || "none");

const db = firebase.firestore();

export { app, auth, db, firebase };
