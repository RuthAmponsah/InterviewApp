import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";

export default function BackButton() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
      <Text style={[styles.text, { color: colors.primaryBlue }]}>← Back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
