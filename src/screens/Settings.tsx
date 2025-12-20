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
  | "AboutUs"
  | "Subscription"
  | "SectorPacks";

const SECTIONS: { emoji: string; label: string; route: SettingsRoute; badge?: string; comingSoon?: boolean }[] = [
  { emoji: "👤", label: "Account", route: "MyProfile" },
  { emoji: "⭐", label: "Subscription", route: "Subscription", badge: "FREE" },
  { emoji: "📋", label: "Interview history", route: "InterviewHistory" },
  { emoji: "📊", label: "Progress dashboard", route: "ProgressDashboard" },
  { emoji: "💬", label: "Question bank", route: "QuestionBank" },
  { emoji: "💡", label: "Interview tips", route: "InterviewTips" },
  { emoji: "🎨", label: "App customisation", route: "AppCustomisation" },
  { emoji: "🎯", label: "Interview experience", route: "InterviewExperience", badge: "COMING SOON", comingSoon: true },
  { emoji: "💼", label: "Job preferences", route: "JobPreferences" },
  { emoji: "📚", label: "Sector Packs", route: "SectorPacks", badge: "COMING SOON", comingSoon: true },
  { emoji: "🔒", label: "Privacy and security", route: "PrivacySecurity" },
  { emoji: "💬", label: "Support", route: "Support" },
  { emoji: "ℹ️", label: "About us", route: "AboutUs" },
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
        {SECTIONS.map(({ emoji, label, route, badge, comingSoon }) => (
          <TouchableOpacity
            key={label}
            style={[styles.row, comingSoon && { opacity: 0.6 }]}
            onPress={() => !comingSoon && navigation.navigate(route)}
            disabled={comingSoon}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.rowEmoji}>{emoji}</Text>
                <View style={styles.separator} />
                <Text style={styles.rowText}>{label}</Text>
                {badge && (
                  <View style={[styles.badge, { backgroundColor: comingSoon ? '#999' : colors.primaryBlue }]}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )}
              </View>

              {label === "Interview experience" && (
                <Text style={[styles.rowHelper, { marginLeft: 30 }]}>
                  AI voice, avatar, difficulty, and more.
                </Text>
              )}
              {label === "Subscription" && (
                <Text style={[styles.rowHelper, { marginLeft: 30 }]}>
                  5 interviews per month • Upgrade for unlimited
                </Text>
              )}
              {label === "Sector Packs" && (
                <Text style={[styles.rowHelper, { marginLeft: 30 }]}>
                  NHS, Graduate, Retail & more
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
    rowEmoji: {
      fontSize: 18,
      marginRight: 8,
    },
    separator: {
      width: 1,
      height: 18,
      backgroundColor: colors.border,
      marginRight: 12,
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
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    footer: { marginTop: 20, alignItems: "center" },
    footerText: { ...typography.caption, color: isDark ? '#aaa' : colors.textMuted },
  });

export default Settings;
