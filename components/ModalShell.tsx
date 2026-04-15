import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

const BREAKPOINT = 768;

interface ModalShellProps {
  children: React.ReactNode;
  onClose: () => void;
  /** Width of the dialog on web. Default 520 */
  width?: number;
  /** Height of the dialog on web. Default "70%" */
  height?: number | string;
}

/**
 * On mobile: renders children as-is (bottom sheet style).
 * On web: renders a centered floating dialog with a backdrop.
 */
const ModalShell: React.FC<ModalShellProps> = ({
  children,
  onClose,
  width = 520,
  height = "70%",
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && screenWidth >= BREAKPOINT;

  if (!isWeb) {
    return <>{children}</>;
  }

  return (
    <View style={webStyles.overlay}>
      <Pressable style={webStyles.backdrop} onPress={onClose} />
      <View style={[webStyles.dialog, { width, maxHeight: height }]}>
        {children}
      </View>
    </View>
  );
};

export default ModalShell;

const webStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
});
