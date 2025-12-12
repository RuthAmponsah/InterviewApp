
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dropdown } from "react-native-element-dropdown";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

const JOB_TYPES = [
  "Cyber Security",
  "Data Analyst",
  "IT Support",
  "Sales",
  "Customer Service",
  "Software Engineer",
  "Project Manager",
];

const JobPreferences: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const [job, setJob] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedText, setSavedText] = useState("");

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem("jobRole");
      if (stored) setJob(stored);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!job) return;
    setSaving(true);
    await AsyncStorage.setItem("jobRole", job);
    setSaving(false);
    setSavedText("Job preference saved ✅");
    setTimeout(() => setSavedText(""), 2000);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <BackButton />
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.title}>Job preferences</Text>
      <Text style={styles.subtitle}>
        Tell Aya what role you’re aiming for so your interviews feel relevant.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Primary job focus</Text>
        <Text style={styles.sectionHint}>
          This is the role Aya will use when generating interview questions.
        </Text>

        <View style={styles.currentPill}>
          <Text style={styles.currentPillLabel}>Current</Text>
          <Text style={styles.currentPillValue}>
            {job || "Not set yet"}
          </Text>
        </View>

        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={JOB_TYPES.map((item) => ({ label: item, value: item }))}
          labelField="label"
          valueField="value"
          placeholder={job ? "Change job role…" : "Choose a job role…"}
          value={job}
          onChange={(item) => {
            setJob(item.value);
          }}
        />

        {savedText !== "" && (
          <Text style={styles.savedText}>{savedText}</Text>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, !job && { opacity: 0.4 }]}
          disabled={!job || saving}
          onPress={handleSave}
          activeOpacity={0.9}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save preference"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6" },
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
      marginBottom: 12,
    },
    currentPill: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    currentPillLabel: {
      ...typography.caption,
      fontSize: 11,
      textTransform: "uppercase",
      color: colors.primaryBlue,
      fontWeight: "700",
      marginRight: 6,
    },
    currentPillValue: {
      ...typography.bodySmall,
      fontSize: 13,
      color: isDark ? "#fff" : colors.textDark,
      fontWeight: "500",
    },
    dropdown: {
      height: 52,
      borderColor: isDark ? "#555" : colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: isDark ? "#1f1f1f" : "#F7F7F7",
      marginBottom: 12,
    },
    placeholderStyle: { ...typography.bodyMedium, color: isDark ? "#bbb" : colors.textMuted },
    selectedTextStyle: { ...typography.bodyMedium, color: isDark ? "#fff" : colors.textDark },
    saveBtn: {
      marginTop: 8,
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      alignItems: "center",
      paddingVertical: 12,
    },
    saveText: {
      ...typography.label,
      color: "#FFFFFF",
      fontWeight: "600",
    },
    savedText: {
      ...typography.bodySmall,
      fontSize: 13,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 4,
    },
  });

export default JobPreferences;
