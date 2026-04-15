import { Colors } from "@/constants/theme";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
} from "react-native";

type MyBtnProps = {
  title: string;
  onPress: () => void;

  // Colors
  bgColor?: string;
  textColor?: string;

  // Text styles
  fontSize?: number;
  fontWeight?: TextStyle["fontWeight"];

  // States
  disabled?: boolean;
  loading?: boolean;
};

const MyBtn = ({
  title,
  onPress,
  bgColor = "#090909",
  textColor = Colors.white,
  fontSize = 16,
  fontWeight = "600",
  disabled = false,
  loading = false,
}: MyBtnProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bgColor },
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.txt,
            {
              color: textColor,
              fontSize,
              fontWeight,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 48,
    width:"100%",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 0,
  },
  txt: {
    // base styles only
  },
  disabled: {
    opacity: 0.6,
    color:"#0000004D"
  },
});


export default MyBtn;
