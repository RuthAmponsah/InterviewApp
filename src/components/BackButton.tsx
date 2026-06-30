import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function BackButton() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()} activeOpacity={0.7} accessibilityLabel="Go back" accessibilityRole="button">
      <Ionicons name="chevron-back" size={20} color={colors.primaryBlue} />
      <Text style={[styles.text, { color: colors.primaryBlue }]}>Back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 52,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    zIndex: 10,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
  },
});
