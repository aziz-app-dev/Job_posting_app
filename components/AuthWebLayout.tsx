import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const BREAKPOINT = 768;

interface AuthWebLayoutProps {
  children: React.ReactNode;
}

/**
 * Wraps auth screen content in a split layout on web (image left, form right).
 * On mobile it just renders children as-is.
 */
const AuthWebLayout: React.FC<AuthWebLayoutProps> = ({ children }) => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width >= BREAKPOINT;

  if (!isWeb) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Left - Image */}
      <View style={styles.imageSection}>
        <Image
          source={require("@/assets/images/sp.png")}
          style={styles.image}
        />
        <View style={styles.imageOverlay}>
          <Text style={styles.brandName}>WorkCircle</Text>
          <Text style={styles.brandTagline}>
            Your professional community
          </Text>
        </View>
      </View>

      {/* Right - Form */}
      <ScrollView
        style={styles.formSection}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formInner}>{children}</View>
      </ScrollView>
    </View>
  );
};

export default AuthWebLayout;

export const useIsWebLayout = () => {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= BREAKPOINT;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
  },
  imageSection: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
    padding: 48,
  },
  brandName: {
    fontSize: 42,
    fontWeight: "800",
    color: "#fff",
  },
  brandTagline: {
    fontSize: 18,
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
  },
  formSection: {
    flex: 1,
    backgroundColor: "#fff",
  },
  formContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  formInner: {
    width: "100%",
    maxWidth: 440,
  },
});
