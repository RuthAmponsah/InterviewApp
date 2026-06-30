import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";

export default function ScreenHeader() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity
        style={styles.back}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={20} color={colors.primaryBlue} />
        <Text style={[styles.backText, { color: colors.primaryBlue }]}>Back</Text>
      </TouchableOpacity>

      <Text style={[styles.brand, { color: colors.primaryBlue }]}>MY INTERVIEW</Text>

      {/* Right spacer matches back button width so brand is truly centred */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    width: 64,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 2,
  },
  brand: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.5,
    textAlign: "center",
    flex: 1,
  },
  spacer: {
    width: 64,
  },
});
