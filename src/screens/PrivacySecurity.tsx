
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

const PrivacySecurity: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const handleClearLocalData = () => {
    Alert.alert(
      "Delete local data?",
      "This will remove your saved name, preferences, and streaks from this device. It will not affect any future online account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "In a future version, this will permanently delete your account and interview history. For now, it only clears data on this device.",
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <BackButton />
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.title}>Privacy and security</Text>
      <Text style={styles.subtitle}>
        Learn how your data is used and manage what’s stored on this device.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data & privacy</Text>
        <Text style={styles.sectionHint}>
          Aya uses your name, role and answers to generate more realistic
          interviews. Your practice is private and only used to improve your
          own experience.
        </Text>

        <TouchableOpacity style={styles.row} activeOpacity={0.8}>
          <View>
            <Text style={styles.rowTitle}>View privacy policy</Text>
            <Text style={styles.rowSubtitle}>
              Opens the full policy in your browser. (Placeholder for now.)
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your data on this device</Text>
        <Text style={styles.sectionHint}>
          Clear interview streaks, role preferences and cached settings.
        </Text>

        <TouchableOpacity
          style={styles.row}
          onPress={handleClearLocalData}
          activeOpacity={0.8}
        >
          <View>
            <Text style={styles.rowTitle}>Clear local data</Text>
            <Text style={styles.rowSubtitle}>
              Removes saved name, role, streaks and preferences on this phone.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
          activeOpacity={0.9}
        >
          <Text style={styles.deleteText}>Delete account</Text>
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
      paddingTop: 80,
      paddingBottom: 32,
    },
    logoText: {
      ...typography.headingMedium,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 24,
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
      marginBottom: 12,
    },
    row: {
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "#333" : "#E5E7EB",
    },
    rowTitle: {
      ...typography.label,
      color: isDark ? "#fff" : colors.textDark,
    },
    rowSubtitle: {
      ...typography.caption,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 2,
    },
    deleteBtn: {
      marginTop: 16,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: isDark ? "#3b1f1f" : "#FEE2E2",
    },
    deleteText: {
      ...typography.label,
      color: isDark ? "#fca5a5" : "#B91C1C",
      fontWeight: "700",
    },
  });

export default PrivacySecurity;
