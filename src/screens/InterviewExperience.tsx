
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

const MODES = ["Voice", "Text"];

const InterviewExperience: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const [mode, setMode] = useState<"Voice" | "Text">("Voice");

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem("interviewMode");
      if (stored === "Voice" || stored === "Text") {
        setMode(stored);
      }
    };
    load();
  }, []);

  const handleChangeMode = async (value: "Voice" | "Text") => {
    setMode(value);
    await AsyncStorage.setItem("interviewMode", value);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <BackButton />
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.title}>Interview experience</Text>
      <Text style={styles.subtitle}>
        Choose how you’d like Aya to run your mock interviews.
      </Text>

      {/* Mode card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Interview mode</Text>
        <Text style={styles.sectionHint}>
          Switch between spoken interviews and text-only practice.
        </Text>

        <View style={styles.segmentRow}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.segmentBtn,
                mode === m && styles.segmentBtnActive,
              ]}
              onPress={() => handleChangeMode(m as "Voice" | "Text")}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === m && styles.segmentTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Voice & avatar card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>AI voice</Text>
        <Text style={styles.sectionHint}>
          Currently using Aya’s default voice. More voices coming soon.
        </Text>

        <View style={[styles.rowBetween, { marginTop: 16 }]}>
          <View>
            <Text style={styles.rowTitle}>Interview avatar</Text>
            <Text style={styles.rowSubtitle}>Animated Aya is on her way 👀</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Coming soon</Text>
          </View>
        </View>
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
      paddingTop: 70,
      paddingBottom: 32,
    },
    logoText: {
      ...typography.heading,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 28,
    },
    title: {
      ...typography.headingMedium,
      color: isDark ? "#fff" : colors.textDark,
    },
    subtitle: {
      ...typography.bodySmall,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    sectionTitle: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 4,
    },
    sectionHint: {
      ...typography.bodySmall,
      fontSize: 13,
      color: isDark ? "#b5b5b5" : colors.textMuted,
    },
    segmentRow: {
      flexDirection: "row",
      marginTop: 16,
      gap: 8,
    },
    segmentBtn: {
      flex: 1,
      borderRadius: 999,
      paddingVertical: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#555" : colors.border,
      backgroundColor: isDark ? "#222" : "#FFFFFF",
    },
    segmentBtnActive: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
    },
    segmentText: {
      ...typography.bodySmall,
      fontWeight: "500",
      color: isDark ? "#fff" : colors.textDark,
    },
    segmentTextActive: {
      color: "#FFFFFF",
    },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowTitle: {
      ...typography.label,
      fontWeight: "600",
      color: colors.textDark,
    },
    rowSubtitle: {
      ...typography.bodySmall,
      fontSize: 13,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 2,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: isDark ? "#1f2a44" : "#EEF2FF",
    },
    badgeText: {
      ...typography.caption,
      fontSize: 11,
      color: colors.primaryBlue,
      fontWeight: "600",
    },
  });

export default InterviewExperience;
