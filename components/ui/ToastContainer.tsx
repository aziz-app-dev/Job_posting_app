import { useToast } from "@/context/ToastContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProgressToast from "./ProgressToast";

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 80 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ProgressToast
          key={toast.id}
          toast={toast}
          onDismiss={() => hideToast(toast.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});

export default ToastContainer;
