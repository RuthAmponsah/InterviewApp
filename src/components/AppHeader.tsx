import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";

interface AppHeaderProps {
  showBell?: boolean;
}

export default function AppHeader({ showBell = false }: AppHeaderProps) {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + 8 }]}>
      <Text style={[styles.brand, { color: colors.primaryBlue }]}>MY INTERVIEW</Text>
      {showBell && (
        <TouchableOpacity
          style={[styles.bellButton, { backgroundColor: isDark ? "#2a2a2a" : "#fff" }]}
          onPress={() => navigation.navigate("Notifications")}
          activeOpacity={0.8}
          accessibilityLabel="Notifications"
          accessibilityRole="button"
        >
          <Ionicons
            name="notifications-outline"
            size={19}
            color={isDark ? "#fff" : "#374151"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  brand: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
