import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import MyProfile from "./MyProfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabase";
import { Ionicons } from "@expo/vector-icons";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type SettingsRoute =
  | "MyProfile"
  | "InterviewHistory"
  | "QuestionBank"
  | "ProgressDashboard"
  | "InterviewTips"
  | "InterviewExperience"
  | "AppCustomisation"
  | "JobPreferences"
  | "PrivacySecurity"
  | "Support"
  | "AboutUs";

const SECTIONS: { label: string; route: SettingsRoute }[] = [
  { label: "Account", route: "MyProfile" },
  { label: "Interview history", route: "InterviewHistory" },
  { label: "Progress dashboard", route: "ProgressDashboard" },
  { label: "Question bank", route: "QuestionBank" },
  { label: "Interview tips", route: "InterviewTips" },
  { label: "Interview experience", route: "InterviewExperience" },
  { label: "App customisation", route: "AppCustomisation" },
  { label: "Job preferences", route: "JobPreferences" },
  { label: "Privacy and security", route: "PrivacySecurity" },
  { label: "Support", route: "Support" },
  { label: "About us", route: "AboutUs" },
];

const Settings = () => {
  const navigation = useNavigation<Nav>();
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your preferences</Text>

      <View style={styles.card}>
        {SECTIONS.map(({ label, route }) => (
          <TouchableOpacity
            key={label}
            style={styles.row}
            onPress={() => navigation.navigate(route)}
          >
            <View>
              <Text style={styles.rowText}>{label}</Text>

              {label === "Interview experience" && (
                <Text style={styles.rowHelper}>
                  AI voice, avatar, difficulty, and more.
                </Text>
              )}
            </View>

            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          // Sign out from Supabase
          await supabase.auth.signOut();
          // Clear local storage
          await AsyncStorage.setItem("isLoggedIn", "false");
          navigation.navigate("SignIn");
        }}
      >
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>
          Terms & Conditions · Privacy Policy
        </Text>
      </View>
    </ScrollView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: isDark ? '#0f0f0f' : '#F3F4F6' },
    content: { paddingHorizontal: 20, paddingTop: 70, paddingBottom: 24 },
    logoText: {
      ...typography.heading,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 28,
    },
    title: { ...typography.headingSmall, color: isDark ? '#fff' : colors.textDark },
    subtitle: { ...typography.bodyMedium, color: isDark ? '#aaa' : colors.textMuted, marginBottom: 16 },
    card: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
      overflow: "hidden",
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowText: { ...typography.label, color: isDark ? '#fff' : colors.textDark },
    rowHelper: { ...typography.caption, color: isDark ? '#aaa' : colors.textMuted },
    chevron: { fontSize: 20, color: isDark ? '#666' : colors.textMuted },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#222' : '#FFF',
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 20,
      borderWidth: 1,
      borderColor: '#FF3B30',
    },
    logoutText: {
      ...typography.bodyMedium,
      color: '#FF3B30',
      fontWeight: '600',
    },
    footer: { marginTop: 20, alignItems: "center" },
    footerText: { ...typography.caption, color: isDark ? '#aaa' : colors.textMuted },
  });

export default Settings;
