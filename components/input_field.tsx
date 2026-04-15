import { Colors } from "@/constants/theme";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type MyInputProps = TextInputProps & {
  placeholder?: string;
  value: string;
  title: string;
  onChangeText: (text: string) => void;
  bgColor?: string;
  textColor?: string;
  autoCapitalize?: string;
  borderWidth?: number;
  fontSize?: number;
  marginVertical?: number;
  fontWeight?: "400" | "500" | "600" | "700";
  secureTextEntry?: boolean;

  multiline?: boolean;
  numberOfLines?: number;

  // Icon props
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const MyInput = ({
  placeholder,
  value,
  title,
  onChangeText,
  bgColor = "transparent",
  textColor = Colors.black,
  fontSize = 16,
  marginVertical = 8,
  fontWeight = "500",
  autoCapitalize = "none",
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  multiline = false,
  numberOfLines = 1,
  borderWidth = 1,
  children: _children, // prevent passing to TextInput
  ...props
}: MyInputProps) => {
  return (
    <View
      style={[styles.container, { backgroundColor: bgColor, marginVertical }]}
    >
      <Text style={{ fontSize: 16, color: "#0F161E80" }}>{title}</Text>
      <View
        style={[
          styles.inputWrapper,
          { borderWidth: borderWidth, borderColor: "#0F161E59" },
          multiline
            ? { paddingVertical: 10, height: numberOfLines * 24 + 16 }
            : {},
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          cursorColor={Colors.black}
          placeholder={placeholder}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={"#0000004D"}
          value={value}
          onChangeText={onChangeText}
          style={[
            styles.input,
            {
              color: textColor,
              fontSize,
              fontWeight,
              textAlignVertical: multiline ? "top" : "center",
            },
            leftIcon ? { paddingLeft: 44 } : {},
            rightIcon ? { paddingRight: 44 } : {},
          ]}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 8,
    gap: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",

    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 48,
  },
  input: {
    flex: 1,
    height: "100%",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  leftIcon: {
    position: "absolute",
    left: 10,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: 40,
  },
  rightIcon: {
    position: "absolute",
    right: 10,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: 40,
  },
});

export default MyInput;
