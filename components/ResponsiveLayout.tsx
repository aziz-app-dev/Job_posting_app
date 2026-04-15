import React from "react";
import { Platform, StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";

const MAX_CONTENT_WIDTH = 480;
const BREAKPOINT_TABLET = 768;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  showCard?: boolean;
}

/**
 * Responsive wrapper that constrains content to a mobile-like width on web/tablet.
 * On mobile it renders full width. On web it centers content with max-width and
 * optionally wraps it in a card.
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  style,
  maxWidth = MAX_CONTENT_WIDTH,
  showCard = true,
}) => {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= BREAKPOINT_TABLET;

  if (!isWide) {
    return <View style={[styles.mobileContainer, style]}>{children}</View>;
  }

  return (
    <View style={[styles.webOuter, style]}>
      <View
        style={[
          styles.webInner,
          { maxWidth },
          showCard && styles.webCard,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

export default ResponsiveLayout;

export const useIsWideScreen = () => {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= BREAKPOINT_TABLET;
};

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  webOuter: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  webInner: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
  },
  webCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
});
