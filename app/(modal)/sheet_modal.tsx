// components/SheetWrapper.tsx  (helper component)
import { Colors } from "@/constants/theme";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SheetWrapperProps = {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

function SheetWrapper({ title, children, onClose }: SheetWrapperProps) {
  return (
    <>
      {/* Backdrop */}
      <Pressable style={modalStyles.backdrop} onPress={onClose} />

      {/* Bottom sheet */}
      <View style={modalStyles.bottomSheet}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.headerTitle}>{title}</Text>
        </View>

        <View style={modalStyles.body}>{children}</View>

        {/* Footer is now inside each sheet component */}
      </View>
    </>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  header: {
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#E5EAF1",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.black,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80,
  },
});

export default SheetWrapper;
