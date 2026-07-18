# WorkCircle — Professional Networking & Job Platform (React Native + Expo)

> **WorkCircle** is a cross-platform professional networking and job-posting application built with **React Native**, **Expo Router**, and **Firebase**. Connect with professionals, share posts, discover jobs, apply with one tap, and grow your professional network — on **Android**, **iOS**, and **Web** from a single codebase.

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.8-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
![Platforms](https://img.shields.io/badge/Platforms-iOS_%7C_Android_%7C_Web-4CAF50)

**Keywords:** react native, expo, expo router, firebase, firestore, professional networking app, job board app, social media app, cross-platform app, typescript, mobile app development, react native web, firebase auth, cloudinary, job posting app, career app.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Firebase Setup Guide](#firebase-setup-guide)
- [Google Services Files (google-services.json)](#google-services-files-google-servicesjson)
- [Running on Android](#running-on-android)
- [Running on iOS](#running-on-ios)
- [Running on Web](#running-on-web)
- [Package Name & Bundle Identifier](#package-name--bundle-identifier)
- [Available Scripts](#available-scripts)
- [Authentication Flow](#authentication-flow)
- [Routing & Navigation](#routing--navigation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

WorkCircle is a **production-ready, cross-platform professional networking application**. It combines the social-feed experience of LinkedIn with a clean, modern mobile-first design. The app enables users to:

- Build a professional profile with skills, interests, and job preferences
- Post updates, articles, and job listings with images and videos
- Follow other professionals and interact through comments and bookmarks
- Discover and apply to jobs with one tap
- Chat directly with other users via real-time messaging
- Manage notifications, drafts, and saved collections

Built with a **single TypeScript codebase** that runs on iOS, Android, and Web using **Expo Router** and **React Native Web**.

---

## Features

### Core Functionality
- **Cross-platform** — Single codebase for iOS, Android, and Web
- **Firebase Authentication** — Email/Password, Google Sign-In, Apple Sign-In
- **Persistent sessions** — AsyncStorage-backed auth persistence on native devices
- **Real-time Firestore data** — Live feed, notifications, messaging
- **Splash screen with auth routing** — Checks login state before navigating
- **Deep linking** — `workcircle://post/<id>` and `workcircle://profile/<id>`

### Social Features
- Create, edit, and delete posts with media (images / videos)
- Follow / unfollow, block / unblock, hide users
- Like, comment, and bookmark posts
- Real-time notifications (likes, comments, follows, job applications)
- **Direct messaging** — real-time 1:1 chat with keyboard-aware input
- **Unread message badges** — on the Messages tab (mobile) and sidebar (web)
- Drafts system for saving unpublished posts

### AI-Powered Content (Groq)
- **AI caption / job-description suggestions** — generate post copy with one tap on the Create Post screen, powered by the [Groq](https://groq.com/) API (Llama 3.3 70B)
- **Adjustable length** — choose **Short / Medium / Long** and regenerate instantly
- **Edit before applying** — tap a suggestion to open it in an editable box, tweak the wording, then insert it
- **AI topic suggestions** — recommend relevant, searchable topics/tags based on your post content
- **Fully optional** — the caption field is a normal text input; AI is just a helper you can ignore and type your own
- **Graceful fallback** — friendly error if the API key is missing or the device is offline

### Jobs & Careers
- Create job posts with salary, experience level, job type, location
- Search and filter job listings
- One-tap apply with profile-based applications
- Track submitted applications and received applicants
- Job recommendations based on user preferences

### Media & Storage
- Cloudinary integration for image/video uploads
- Image picker and cropping support
- Video thumbnails and inline playback

### User Experience
- Light and dark theme support
- Custom toast notifications
- Haptic feedback on tabs
- Responsive web layout with sidebar (≥768px)
- Safe-area-aware layouts on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.81.5, Expo SDK 54 |
| **Language** | TypeScript 5.9 |
| **Navigation** | Expo Router 6 (file-based routing) |
| **Auth & DB** | Firebase Auth, Cloud Firestore, Realtime Database |
| **Media** | Cloudinary (uploads), expo-image, expo-video |
| **AI** | Groq API (Llama 3.3 70B) for caption & topic suggestions |
| **State** | React Context API (Auth, Feed, Post, Collection, Notifications, Toast) |
| **Storage** | AsyncStorage (auth persistence), Firestore (app data) |
| **UI** | React Native core components, @gorhom/bottom-sheet, react-native-modal |
| **Icons** | @expo/vector-icons, react-native-vector-icons |
| **Web Support** | react-native-web 0.21 |

---

## Project Structure

```
LightHouse/
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx               # Root layout with all providers
│   ├── index.tsx                 # Splash screen (auth gate, routes to tabs or auth)
│   ├── (auth)/                   # Authentication flow
│   │   ├── into_screen.tsx       # Welcome screen (sign in options)
│   │   ├── login_screen.tsx      # Email/password login
│   │   ├── signup_screen.tsx     # Create account
│   │   ├── user_name_screen.tsx  # Set display name
│   │   ├── age_screen.tsx        # Age input
│   │   ├── img_screen.tsx        # Profile photo upload
│   │   ├── profile_into_screen.tsx
│   │   ├── inspiration_screen.tsx
│   │   └── user_welcome_Screen.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Home feed
│   │   ├── add.tsx               # Create post / job
│   │   ├── book_mark.tsx         # Saved items
│   │   └── profile.tsx           # User profile
│   ├── (profile)/                # Profile-related screens
│   ├── (search)/                 # Search screen
│   └── (modal)/                  # Modal overlays
├── components/                   # Reusable UI components
├── config/
│   └── firebase.ts               # Firebase initialization
├── context/                      # React Context providers
│   ├── AuthContext.tsx
│   ├── FeedContext.tsx
│   ├── PostContext.tsx
│   ├── CollectionContext.tsx
│   ├── NotificationContext.tsx
│   └── ToastContext.tsx
├── services/                     # Firestore services layer
│   ├── authService.ts
│   ├── userService.ts
│   ├── postService.ts
│   ├── jobApplicationService.ts
│   ├── companyService.ts
│   ├── messagingService.ts
│   ├── aiService.ts              # Groq AI caption & topic suggestions
│   └── ... (18+ services)
├── constants/                    # Types, colors, static data
├── hooks/                        # Custom hooks
├── assets/                       # Images, icons, fonts
├── android/                      # Native Android project
├── ios/                          # Native iOS project (generated)
├── app.json                      # Expo configuration
├── google-services.json          # Firebase Android config
├── .env                          # Local environment variables (DO NOT COMMIT)
└── .env.example                  # Template for .env
```

---

## Prerequisites

Before you begin, make sure you have the following installed:

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 18.x | JavaScript runtime |
| **npm** or **yarn** | Latest | Package manager |
| **Git** | Latest | Version control |
| **Expo CLI** | Latest | Run `npm install -g expo-cli` (optional; `npx expo` works too) |
| **Android Studio** | Latest | Android SDK, emulators, build tools (for Android) |
| **Xcode** | 15+ | iOS builds (macOS only) |
| **JDK** | 17 | Required by modern Android Gradle Plugin |

> **Windows users:** Ensure `ANDROID_HOME` is set in your environment variables and `adb`, `emulator`, `sdkmanager` are on your `PATH`.

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/workcircle.git
cd workcircle

# 2. Install dependencies
npm install

# 3. Create your .env file from the template
cp .env.example .env
# Then fill in your Firebase config (see Environment Variables below)

# 4. Add your google-services.json to the project root
#    (download from Firebase Console — see Firebase Setup Guide)

# 5. Start the dev server
npm start

# Or run directly on a platform:
npm run android   # Android emulator / device
npm run ios       # iOS simulator (macOS only)
npm run web       # Browser
```

---

## Environment Variables

The project uses `EXPO_PUBLIC_*` environment variables (exposed to the app bundle). Copy `.env.example` to `.env` and fill in:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary (for image/video uploads)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset

# Groq AI (for post caption / description & topic suggestions) — optional
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

> **Important:** Never commit `.env` to git. It's already in `.gitignore`. Only `.env.example` should be committed.

> **Note on the Groq key:** Like all `EXPO_PUBLIC_*` values, the Groq key is bundled into the client app. This is fine for development, but for production consider proxying AI requests through a small backend / Cloud Function so the key isn't shipped to devices. The AI features are optional — the app runs fine without a Groq key (the AI Suggest buttons simply show a "not configured" message).

### Cloudinary quick setup

1. Create a free account at [cloudinary.com](https://cloudinary.com/).
2. From your dashboard copy the **Cloud name** → `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. Go to **Settings → Upload → Upload presets**, create a new **unsigned** preset.
4. Copy the preset name → `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
5. Set the preset's folder / transformations as you prefer.

Where to find these values: **Firebase Console → Project Settings → General → Your apps → SDK setup and configuration**.

### Groq AI quick setup (optional)

The AI Suggest features (post captions, job descriptions, and topic tags) use the [Groq](https://groq.com/) API. To enable them:

1. Create a free account at [console.groq.com](https://console.groq.com/).
2. Go to **API Keys** → **Create API Key** and copy it (starts with `gsk_...`).
3. Add it to your `.env`:
   ```bash
   EXPO_PUBLIC_GROQ_API_KEY=gsk_your_key_here
   ```
4. Restart the dev server with a cleared cache so the new env var is picked up:
   ```bash
   npx expo start --clear
   ```

The model used is `llama-3.3-70b-versatile` (configurable in [services/aiService.ts](services/aiService.ts)). If you skip this step, the app still works — the AI Suggest buttons just report that suggestions aren't configured.

---

## Firebase Setup Guide

This project requires a Firebase project for authentication, database, and storage. Follow these steps:

### Step 1 — Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**, give it a name (e.g. `workcircle`), and click **Continue**.
3. Enable Google Analytics (optional) and click **Create project**.

### Step 2 — Enable Authentication

1. In the sidebar, go to **Build → Authentication**.
2. Click **Get started**.
3. Go to the **Sign-in method** tab.
4. Enable the providers you want to use:
   - **Email/Password** — Required for login/signup flow
   - **Google** — For "Continue with Google" button
   - **Apple** — For iOS "Continue with Apple" button

### Step 3 — Create a Firestore Database

1. Go to **Build → Firestore Database**.
2. Click **Create database**.
3. Start in **Production mode** (or Test mode for quick setup).
4. Choose your region (pick one close to your users; it cannot be changed later).

Add a minimal starter rules-set in the **Rules** tab (tighten later before going to production):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 4 — Enable Realtime Database (optional)

If you plan to use the `databaseURL` (for features like online presence):

1. Go to **Build → Realtime Database**.
2. Click **Create Database** and pick a location.

### Step 5 — Register an Android app

1. In **Project Settings → General**, click the **Android icon** under "Your apps".
2. Enter:
   - **Android package name:** `com.azizurrehman.WorkCircle` (must match `android/app/build.gradle` `applicationId`)
   - **App nickname:** `WorkCircle Android`
   - **Debug signing certificate (SHA-1):** Run this to get it:
     ```bash
     cd android
     ./gradlew signingReport
     ```
     Copy the SHA-1 under the `debug` variant.
3. Click **Register app**.
4. **Download `google-services.json`** and place it in the **project root** (same folder as `app.json`).

### Step 6 — Register an iOS app (macOS only)

1. Click the **iOS icon** in **Project Settings**.
2. Enter your iOS **Bundle ID** (must match `ios/<app>.xcodeproj` bundle identifier).
3. Download `GoogleService-Info.plist` and place it in the `ios/` folder.

### Step 7 — Register a Web app

1. Click the **Web icon (`</>`)** in **Project Settings**.
2. Nickname it (e.g. `WorkCircle Web`) and click **Register**.
3. Copy the shown `firebaseConfig` values into your `.env`.

### Step 8 — Copy config values to `.env`

Map the Firebase config values you were shown to the `.env`:

| Firebase field | `.env` key |
|---|---|
| `apiKey` | `EXPO_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `databaseURL` | `EXPO_PUBLIC_FIREBASE_DATABASE_URL` |
| `projectId` | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `EXPO_PUBLIC_FIREBASE_APP_ID` |

---

## Google Services Files (google-services.json)

The `google-services.json` file is **required for Android builds**. It contains OAuth client IDs, Firebase app IDs, and project metadata.

### Where it lives
- **Android:** `google-services.json` in the **project root** (referenced by `app.json`)
- **iOS:** `GoogleService-Info.plist` in the `ios/` folder (generated at build time by Expo)

### Important rules

1. **Package name must match.** Inside `google-services.json`, look for:
   ```json
   "android_client_info": {
     "package_name": "com.azizurrehman.WorkCircle"
   }
   ```
   This **must match** the `applicationId` in [android/app/build.gradle](android/app/build.gradle) and the `android.package` value in [app.json](app.json).

2. **If you change the package name**, re-download `google-services.json` from Firebase (or add a new Android app in Firebase with the new package name, then download).

3. **The `EXPO_PUBLIC_FIREBASE_APP_ID` in `.env`** must correspond to the same package entry. In `google-services.json`, find your package block and copy `mobilesdk_app_id` — that's the `FIREBASE_APP_ID`.

4. **Never commit `google-services.json`** with real API keys to a public repo. Add it to `.gitignore` and share via secure channels.

### How `google-services.json` is consumed

`android/build.gradle` applies the Google Services Gradle plugin, which reads `google-services.json` at build time and generates resource values (project ID, API keys, OAuth client IDs) accessible from native Android code and Firebase SDKs.

---

## Running on Android

### Prerequisites
- Android Studio installed with an emulator created (or a physical device with USB debugging enabled)
- `ANDROID_HOME` set in environment variables
- JDK 17 installed and on `PATH`

### Steps

```bash
# Start Metro + build & launch
npx expo run:android
```

On first run, this will:
1. Generate the Android native project (if not already present)
2. Download Gradle dependencies
3. Compile and install the APK on your emulator/device

### If builds get stuck or fail

Clean the Android build cache:

```bash
cd android
./gradlew clean
# Or nuke all build folders:
rm -rf android/app/build android/build android/.gradle
```

Then retry `npx expo run:android`.

### Running on a physical Android device

1. Enable **Developer Options** → **USB Debugging** on your phone
2. Connect via USB
3. Run `adb devices` — confirm your device is listed
4. Run `npx expo run:android`

---

## Running on iOS

> **Requires macOS with Xcode 15+ installed.**

```bash
# Install CocoaPods dependencies (first run)
cd ios && pod install && cd ..

# Run on iOS simulator
npx expo run:ios

# Run on a specific simulator
npx expo run:ios --simulator "iPhone 15 Pro"

# Run on a connected physical device
npx expo run:ios --device
```

For physical devices, you'll need to open `ios/WorkCircle.xcworkspace` in Xcode and configure signing with your Apple Developer team.

---

## Running on Web

WorkCircle supports web via **react-native-web**. The app automatically detects web layouts (≥768px) and renders a sidebar-based experience instead of bottom tabs.

```bash
npm run web
# Or:
npx expo start --web
```

The site will open at `http://localhost:8081` (or the next available port).

### Web-specific features
- Sidebar navigation instead of bottom tabs
- Hover states and cursor pointers
- Deep-link URL patterns via query parameters (`?post=<id>`, `?profile=<id>`)

---

## Package Name & Bundle Identifier

The canonical package name for this app is:

```
com.azizurrehman.WorkCircle
```

This **must match** in **all** these locations:

| File | Location | Line |
|---|---|---|
| `app.json` | `expo.android.package` | — |
| `android/app/build.gradle` | `namespace` & `applicationId` | ~90–92 |
| `android/app/src/main/java/com/azizurrehman/WorkCircle/MainActivity.kt` | `package` declaration | 1 |
| `android/app/src/main/java/com/azizurrehman/WorkCircle/MainApplication.kt` | `package` declaration | 1 |
| `google-services.json` | `client[*].client_info.android_client_info.package_name` | — |

If any of these go out of sync, the Android build will fail with errors like `package com.xxx does not exist`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the Expo dev server (Metro bundler) |
| `npm run android` | Build and run on Android emulator/device |
| `npm run ios` | Build and run on iOS simulator (macOS only) |
| `npm run web` | Run on web browser |
| `npm run lint` | Run ESLint on the project |
| `npm run reset-project` | Reset to a blank Expo starter (destructive!) |

---

## Authentication Flow

The app uses a **splash-gated auth flow**:

1. App launches → **`app/index.tsx`** (splash screen) shows for a minimum of 2.5 seconds
2. In parallel, `AuthProvider` subscribes to `onAuthStateChanged` — Firebase restores the session from AsyncStorage (up to 2 seconds)
3. Once both conditions are met:
   - **If authenticated** → navigate to `/(tabs)` (home feed)
   - **If not authenticated** → navigate to `/(auth)/into_screen` (welcome)

The welcome screen offers three sign-in paths:
- Email & password (`login_screen.tsx`)
- Google Sign-In (popup on web, redirect on native)
- Apple Sign-In (iOS and web)

New users go through a multi-step onboarding: name → age → photo → interests → welcome → home.

---

## Routing & Navigation

WorkCircle uses **Expo Router** with file-based routing. The app has 6 route groups:

| Group | Purpose |
|---|---|
| `/` | Splash screen (auth gate) |
| `(auth)` | Login, signup, onboarding |
| `(tabs)` | Main app navigation (Home, Add, Bookmarks, Profile) |
| `(profile)` | Profile-related screens (chat, notifications, applicants, etc.) |
| `(search)` | Search screen |
| `(modal)` | Transparent modal overlays |

### Deep links

| Pattern | Route |
|---|---|
| `workcircle://post/<postId>` | `/(profile)/post_detail?postId=<id>` |
| `workcircle://profile/<userId>` | `/(profile)/public_profile?userId=<id>` |
| `?post=<id>` (web) | Same as above |
| `?profile=<id>` (web) | Same as above |

---

## Push Notifications (roadmap)

The app currently uses **Firestore real-time listeners** for in-app message updates. This works while the app is open but does **not** deliver OS-level push notifications when the app is closed or backgrounded.

To add full push notification support you need:

1. Install [`expo-notifications`](https://docs.expo.dev/versions/latest/sdk/notifications/) + `expo-device`
2. Register the device's push token in Firestore when the user logs in
3. Deploy a **Firebase Cloud Function** (requires the **Blaze pay-as-you-go plan**) that triggers on new message writes and sends an FCM push to the recipient's token
4. Handle tap actions to deep-link into the correct conversation

On the **Firebase free (Spark) plan**, Cloud Functions are not available. You can still:

- Use in-app toast banners via the existing `ToastContext` when a new message arrives while the app is open
- Show local notifications via `expo-notifications` while the app is in the foreground

---

## Troubleshooting

### `package com.xxx.yyy does not exist` during Android build
The package name is out of sync. Check all locations listed in [Package Name & Bundle Identifier](#package-name--bundle-identifier). After fixing, delete `android/app/build` and `android/build` folders, then rebuild.

### `Network request failed` on login
- Check that your `.env` values are correct (especially `FIREBASE_API_KEY` and `FIREBASE_PROJECT_ID`).
- Confirm the device/emulator has internet access.
- On Android, check that Firebase Email/Password sign-in is **enabled** in the Firebase Console.

### Splash screen is skipped / goes straight to home
Make sure `app/index.tsx` exists (splash logic must be at the root `index.tsx`, not in `splash.tsx`). Expo Router resolves `/` to `(tabs)/index.tsx` otherwise.

### Port 8081 is already in use
Accept the prompt to use port 8082, or kill the existing process:
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <pid> /F

# macOS/Linux
lsof -ti:8081 | xargs kill -9
```

### `Metro` bundler fails with cache issues
```bash
npx expo start --clear
```

### iOS Pods errors
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

### Firebase Auth: "An error occurred. Please try again"
Usually a mismatched API key or a blocked sign-in provider. Enable logging in [services/authService.ts](services/authService.ts) (already enabled with `console.log("[signIn] error:", ...)`) and watch Metro output for the actual error code.

### On-screen keyboard doesn't open on a physical Android device
When a phone is connected via USB for debugging, Android may detect a "hardware keyboard" and suppress the soft keyboard, so tapping a text input does nothing. Re-enable the on-screen keyboard:

```bash
adb shell settings put secure show_ime_with_hard_keyboard 1
```

Or on the device: **Settings → System → Languages & input → Physical keyboard → turn ON "Show on-screen keyboard"** (wording varies by manufacturer). Note this can reset after unplug/reboot. Testing over Wi-Fi (no USB) avoids the issue entirely.

### AI Suggest says "not configured" or "suggestions unavailable"
- **Not configured** → `EXPO_PUBLIC_GROQ_API_KEY` is missing. Add it to `.env` and restart with `npx expo start --clear`.
- **Unavailable / failed** → the device is offline, or the key is invalid/rate-limited. Confirm the device has internet and that the key is active in the [Groq Console](https://console.groq.com/).

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feature/my-feature`
2. Commit your changes: `git commit -m "Add my feature"`
3. Push to the branch: `git push origin feature/my-feature`
4. Open a Pull Request

Please run `npm run lint` before committing.

---

## License

This project is proprietary software. All rights reserved.

---

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/docs/getting-started)
- [Firebase for React Native](https://firebase.google.com/docs/web/setup)
- [React Native Web](https://necolas.github.io/react-native-web/)

---

**Made with ❤️ using React Native + Expo + Firebase**
