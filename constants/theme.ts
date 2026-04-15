/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  primary: "#a3e635",
  primaryLight: "#0ea5e9",
  primaryDark: "#0369a1",

  text: "#fff",
  textLight: "#e5e5e5",
  textLighter: "#d4d4d4",
  splashBg: "#9fdd7650",

  white: "#fff",
  black: "#000",
  grey: "#6e6e6e",
  greyLight: "#9e9e9e",

  rose: "#ef4444",
  error: "#ef4444",
  green: "#16a34a",
  blue: "#32ADE6",

  // roseOverlay: "rgba(239, 68, 68, 0.7)",
  // greenOverlay: "rgba(22, 163, 74, 0.7)",
  // primaryLightOverlay: "rgba(14, 165, 233, 0.7)",
  // primaryDarkOverlay: "rgba(3, 105, 161, 0.7)",

  // neutral50: "#fafafa",
  // neutral100: "#f5f5f5",
  // neutral200: "#e5e5e5",
  // neutral300: "#d4d4d4",
  // neutral350: "#cccccc",
  // neutral400: "#a3a3a3",
  // neutral500: "#737373",
  // neutral600: "#525252",
  // neutral700: "#404040",
  // neutral800: "#262626",
  // neutral900: "#171717",
  light: {
    text: "#fff",
    background: "#FFFFFF",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#fff",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
