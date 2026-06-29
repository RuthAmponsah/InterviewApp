import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenHeader from "../components/ScreenHeader";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

const THEMES = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "Match system" },
] as const;

type ThemeKey = (typeof THEMES)[number]["key"];

const AppCustomisation: React.FC = () => {
  const { colors, theme, setTheme } = useTheme();
  const systemTheme = useColorScheme(); // "light" | "dark"

  // Compute the ACTIVE color mode
  const activeTheme = theme === "system" ? systemTheme : theme;
  const isDark = activeTheme === "dark";
  const styles = makeStyles(colors, isDark);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader />

      <Text style={[styles.title, { color: isDark ? "#fff" : colors.textDark }]}>
        App customisation
      </Text>

      <Text
        style={[
          styles.subtitle,
          { color: isDark ? "#ccc" : colors.textMuted },
        ]}
      >
        Adjust how the app looks so it feels just right for you.
      </Text>

      {/* Card */}
      <View style={styles.card}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? "#FFF" : colors.textDark },
          ]}
        >
          Appearance
        </Text>

        <Text
          style={[
            styles.sectionHint,
            { color: isDark ? "#AAA" : colors.textMuted },
          ]}
        >
          Choose between light, dark, or follow your phone’s system settings.
        </Text>

        {THEMES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={styles.row}
            onPress={() => setTheme(t.key)}
            activeOpacity={0.8}
          >
            <View>
              <Text
                style={[
                  styles.rowTitle,
                  { color: isDark ? "#FFF" : colors.textDark },
                ]}
              >
                {t.label}
              </Text>

              {t.key === "system" && (
                <Text
                  style={[
                    styles.rowSubtitle,
                    { color: isDark ? "#AAA" : colors.textMuted },
                  ]}
                >
                  Automatically switches with your device.
                </Text>
              )}
            </View>

            {/* Radio Button */}
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    theme === t.key
                      ? colors.primaryBlue
                      : isDark
                      ? "#666"
                      : colors.border,
                },
              ]}
            >
              {theme === t.key && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: colors.primaryBlue },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6",
    },
    content: {
      paddingHorizontal: 20,
            paddingBottom: 32,
    },
    logoText: {
      ...typography.brandMark,
      color: colors.primaryBlue,
    },
    title: {
      ...typography.headingMedium,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.bodySmall,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 16,
    },
    card: {
      borderRadius: 20,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      backgroundColor: isDark ? "#1d1d1d" : "#FFF",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E5E7EB",
    },
    sectionTitle: {
      ...typography.bodyMedium,
      fontWeight: "600",
      marginBottom: 4,
    },
    sectionHint: {
      ...typography.bodySmall,
      fontSize: 13,
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "#333" : "#E5E7EB",
    },
    rowTitle: {
      ...typography.label,
    },
    rowSubtitle: {
      ...typography.caption,
      marginTop: 2,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
  });

export default AppCustomisation;
