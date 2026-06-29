import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import MyProfile from "./MyProfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabase";
import { Ionicons } from "@expo/vector-icons";
import AppTutorial from "../components/AppTutorial";
import PaywallModal from "../components/PaywallModal";
import { syncSubscriptionStatus } from "../services/purchaseService";
import AppHeader from "../components/AppHeader";

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

const Settings = () => {
  const navigation = useNavigation<Nav>();
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Re-sync subscription every time Settings comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSubscriptionStatus();
    }, [])
  );

  const fetchSubscriptionStatus = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      // Sync from RevenueCat first to ensure DB is up-to-date
      await syncSubscriptionStatus();

      const { data } = await supabase
        .from('user_preferences')
        .select('subscription_tier')
        .eq('user_id', userId)
        .single();

      if (data) {
        setSubscriptionTier(data.subscription_tier || 'free');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const getSubscriptionBadge = () => {
    if (subscriptionTier === 'annual' || subscriptionTier === 'monthly') {
      return 'PREMIUM';
    }
    return 'FREE';
  };

  const getSubscriptionHelper = () => {
    if (subscriptionTier === 'annual' || subscriptionTier === 'monthly') {
      return 'Unlimited interviews • Premium features';
    }
    return '2 interviews per month • Upgrade for unlimited';
  };

  const SECTIONS: { icon: string; iconBg: string; label: string; route: SettingsRoute; badge?: string; comingSoon?: boolean }[] = [
    { icon: 'person-outline',       iconBg: '#E8F0FE', label: 'Account',              route: 'MyProfile' },
    { icon: 'star-outline',         iconBg: '#FFF8E1', label: 'Subscription',         route: 'Subscription', badge: getSubscriptionBadge() },
    { icon: 'time-outline',         iconBg: '#E8F0FE', label: 'Interview history',    route: 'InterviewHistory' },
    { icon: 'bar-chart-outline',    iconBg: '#E8F5E9', label: 'Progress dashboard',   route: 'ProgressDashboard' },
    { icon: 'chatbubble-outline',   iconBg: '#E8F0FE', label: 'Question bank',        route: 'QuestionBank' },
    { icon: 'bulb-outline',         iconBg: '#FFF8E1', label: 'Interview tips',       route: 'InterviewTips' },
    { icon: 'color-palette-outline',iconBg: '#F3E8FF', label: 'App customisation',    route: 'AppCustomisation' },
    { icon: 'mic-outline',          iconBg: '#E8F0FE', label: 'Interview experience', route: 'InterviewExperience', badge: 'COMING SOON', comingSoon: true },
    { icon: 'briefcase-outline',    iconBg: '#E8F0FE', label: 'Job preferences',      route: 'JobPreferences' },
    { icon: 'layers-outline',       iconBg: '#FFF3E0', label: 'Sector Packs',         route: 'SectorPacks' },
    { icon: 'lock-closed-outline',  iconBg: '#E8F0FE', label: 'Privacy and security', route: 'PrivacySecurity' },
    { icon: 'headset-outline',      iconBg: '#E8F0FE', label: 'Support',              route: 'Support' },
    { icon: 'information-circle-outline', iconBg: '#E8F0FE', label: 'About us',       route: 'AboutUs' },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <AppHeader />

      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your preferences</Text>

      {/* How to use app tutorial button */}
      <TouchableOpacity
        style={styles.tutorialButton}
        onPress={() => setShowTutorial(true)}
      >
        <View style={styles.tutorialIconBox}>
          <Ionicons name="book-outline" size={22} color="#fff" />
        </View>
        <View style={styles.tutorialTextContainer}>
          <Text style={styles.tutorialTitle}>How to use the app</Text>
          <Text style={styles.tutorialSubtitle}>Learn all features with screenshots</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primaryBlue} />
      </TouchableOpacity>

      <View style={styles.card}>
        {SECTIONS.map(({ icon, iconBg, label, route, badge, comingSoon }) => (
          <TouchableOpacity
            key={label}
            style={[styles.row, comingSoon && { opacity: 0.6 }]}
            onPress={() => {
              if (comingSoon) return;
              if (route === 'Subscription') {
                setShowPaywall(true);
              } else {
                navigation.navigate(route);
              }
            }}
            disabled={comingSoon}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2a2a2a' : iconBg }]}>
              <Ionicons name={icon as any} size={18} color={
                label === 'Subscription' ? '#F59E0B' :
                label === 'Interview tips' ? '#F59E0B' :
                label === 'App customisation' ? '#8B5CF6' :
                label === 'Sector Packs' ? '#F97316' :
                colors.primaryBlue
              } />
            </View>
            <View style={styles.rowContent}>
              <View style={styles.rowLabelRow}>
                <Text style={styles.rowText}>{label}</Text>
                {badge && (
                  <View style={[styles.badge, { backgroundColor: comingSoon ? '#9CA3AF' : badge === 'FREE' ? '#E5E7EB' : colors.primaryBlue }]}>
                    <Text style={[styles.badgeText, { color: comingSoon ? '#fff' : badge === 'FREE' ? '#6B7280' : '#fff' }]}>{badge}</Text>
                  </View>
                )}
              </View>
              {label === 'Subscription' && (
                <Text style={styles.rowHelper}>{getSubscriptionHelper()}</Text>
              )}
              {label === 'Sector Packs' && (
                <Text style={styles.rowHelper}>NHS, Graduate, Retail & more</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#C7C7CC'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          // Preserve onboarding status before clearing
          const hasCompletedOnboarding = await AsyncStorage.getItem("hasCompletedOnboarding");
          
          // Sign out from Supabase
          await supabase.auth.signOut();
          
          // Clear local storage
          await AsyncStorage.clear();
          
          // Restore onboarding status
          if (hasCompletedOnboarding === 'true') {
            await AsyncStorage.setItem("hasCompletedOnboarding", "true");
          }
          
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

      {/* App Tutorial Modal */}
      <AppTutorial visible={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Paywall Modal */}
      <PaywallModal 
        visible={showPaywall} 
        onClose={() => setShowPaywall(false)}
        onSuccess={() => fetchSubscriptionStatus()}
      />
    </ScrollView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: isDark ? '#0f0f0f' : '#F3F4F6' },
    content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
    logoText: {
      ...typography.heading,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 28,
    },
    title: { ...typography.headingSmall, color: isDark ? '#fff' : colors.textDark },
    subtitle: { ...typography.bodyMedium, color: isDark ? '#aaa' : colors.textMuted, marginBottom: 16 },
    tutorialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a2a4a' : '#E8F0FE',
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: isDark ? '#2a4a7a' : colors.primaryBlue + '30',
    },
    tutorialIconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.primaryBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tutorialTextContainer: {
      flex: 1,
    },
    tutorialTitle: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: isDark ? '#fff' : colors.textDark,
    },
    tutorialSubtitle: {
      ...typography.caption,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 2,
    },
    card: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2a2a2a' : '#F3F4F6',
      gap: 12,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowContent: {
      flex: 1,
    },
    rowLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rowText: { ...typography.label, color: isDark ? '#fff' : colors.textDark },
    rowHelper: { ...typography.caption, color: isDark ? '#888' : colors.textMuted, marginTop: 2 },
    badge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
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
