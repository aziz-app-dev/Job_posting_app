import React from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, StyleSheet, Text, TextStyle, TouchableOpacity, View } from 'react-native';

type AuthBtnProps = {
  title: string;
  imgSource?: ImageSourcePropType;
  onPress: () => void;
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: TextStyle["fontWeight"];
  disabled?: boolean;
  loading?: boolean;
};

const AuthBtn = ({
  title,
  onPress,
  imgSource,
  fontSize = 16,
  fontWeight = "500",
  disabled = false,
  loading = false,
}: AuthBtnProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.mainContainer, disabled && styles.disabled]}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <>
            {imgSource && <Image source={imgSource} style={styles.icon} />}
            <Text style={{ fontWeight, fontSize }}>{title}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default AuthBtn;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: "#1E24323B",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
});
