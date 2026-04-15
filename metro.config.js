const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix for Firebase Auth in React Native
config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs"];

module.exports = config;
