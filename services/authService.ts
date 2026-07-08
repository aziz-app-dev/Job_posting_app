import { auth } from "../config/firebase";
import firebase from "firebase/compat/app";
import { Platform } from "react-native";
import { createUserProfile } from "./userService";

type User = firebase.User;

// Sign up with email and password
export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);

    // Create user profile in Firestore
    if (userCredential.user) {
      await createUserProfile(
        userCredential.user.uid,
        email,
        userCredential.user.displayName || "",
        userCredential.user.photoURL || ""
      );
    }

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) };
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.log("[signIn] error:", error?.code, error?.message, error);
    const mapped = getErrorMessage(error?.code);
    return { user: null, error: mapped === "An error occurred. Please try again" ? (error?.message || mapped) : mapped };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await auth.signOut();
    return { error: null };
  } catch (error: any) {
    return { error: getErrorMessage(error.code) };
  }
};

// Delete user account
export const deleteAccount = async (): Promise<{ error: string | null }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { error: "No user is signed in" };
    }

    const uid = currentUser.uid;

    // Delete user profile from Firestore
    const { db } = require("../config/firebase");
    await db.collection("users").doc(uid).delete();

    // Delete the Firebase Auth account
    await currentUser.delete();

    return { error: null };
  } catch (error: any) {
    if (error.code === "auth/requires-recent-login") {
      return { error: "For security, please log out and log back in before deleting your account." };
    }
    return { error: getErrorMessage(error.code) || error.message };
  }
};

// Sign in with Google (web only - uses popup)
export const signInWithGoogle = async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const userCredential = await auth.signInWithPopup(provider);

    if (userCredential.user) {
      await createUserProfile(
        userCredential.user.uid,
        userCredential.user.email || "",
        userCredential.user.displayName || "",
        userCredential.user.photoURL || ""
      );
    }

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    if (error.code === "auth/popup-closed-by-user") {
      return { user: null, error: null };
    }
    return { user: null, error: getErrorMessage(error.code) || error.message };
  }
};

// Sign in with Google ID token (native - uses expo-auth-session)
export const signInWithGoogleIdToken = async (idToken: string) => {
  try {
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth.signInWithCredential(credential);

    if (userCredential.user) {
      await createUserProfile(
        userCredential.user.uid,
        userCredential.user.email || "",
        userCredential.user.displayName || "",
        userCredential.user.photoURL || ""
      );
    }

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) || error.message };
  }
};

// Sign in with Apple
export const signInWithApple = async () => {
  try {
    const provider = new firebase.auth.OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");

    let userCredential;
    if (Platform.OS === "web") {
      userCredential = await auth.signInWithPopup(provider);
    } else {
      userCredential = await auth.signInWithRedirect(provider);
      return { user: null, error: null };
    }

    if (userCredential.user) {
      await createUserProfile(
        userCredential.user.uid,
        userCredential.user.email || "",
        userCredential.user.displayName || "",
        userCredential.user.photoURL || ""
      );
    }

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    if (error.code === "auth/popup-closed-by-user") {
      return { user: null, error: null };
    }
    return { user: null, error: getErrorMessage(error.code) || error.message };
  }
};

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    await auth.sendPasswordResetEmail(email);
    return { error: null };
  } catch (error: any) {
    return { error: getErrorMessage(error.code) };
  }
};

// Update user profile
export const updateUserProfile = async (displayName?: string, photoURL?: string) => {
  try {
    if (auth.currentUser) {
      await auth.currentUser.updateProfile({ displayName, photoURL });
      return { error: null };
    }
    return { error: "No user is signed in" };
  } catch (error: any) {
    return { error: getErrorMessage(error.code) };
  }
};

// Subscribe to auth state changes
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Error message helper
const getErrorMessage = (code: string): string => {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/weak-password":
      return "Password is too weak";
    case "auth/user-not-found":
      return "No account found with this email";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later";
    case "auth/network-request-failed":
      return "Network error. Check your connection";
    case "auth/invalid-credential":
      return "Invalid email or password";
    default:
      return "An error occurred. Please try again";
  }
};
