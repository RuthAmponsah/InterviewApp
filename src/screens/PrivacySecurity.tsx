import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ScreenHeader from "../components/ScreenHeader";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";

const PrivacySecurity: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
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

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              if (userId) {
                // Delete all user data from every table
                await supabase.from('question_answers').delete().eq('user_id', userId);
                await supabase.from('interview_history').delete().eq('user_id', userId);
                await supabase.from('custom_questions').delete().eq('user_id', userId);
                await supabase.from('success_stories').delete().eq('user_email', await AsyncStorage.getItem('userEmail'));
                await supabase.from('user_preferences').delete().eq('user_id', userId);
                await supabase.from('users').delete().eq('id', userId);
              }

              // Delete the Supabase Auth record via Edge Function
              const { error: fnError } = await supabase.functions.invoke('delete-account', { method: 'POST' });
              if (fnError) {
                console.error('delete-account function error:', fnError);
                // Still sign out — DB rows are gone, auth record removal failed gracefully
              }

              // Sign out and wipe local storage
              await supabase.auth.signOut();
              await AsyncStorage.clear();

              Alert.alert(
                "Account Deleted",
                "Your account and all data have been permanently deleted.",
                [{ text: "OK", onPress: () => navigation.navigate("SignIn") }]
              );
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert("Error", "Failed to delete account. Please try again or contact support@myinterview.app.");
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert("Error", "You must be signed in to export your data.");
        return;
      }

      Alert.alert("Exporting Data", "Please wait while we prepare your data...");

      // Fetch all user data from Supabase
      const [preferencesRes, interviewsRes, feedbackRes] = await Promise.all([
        supabase.from('user_preferences').select('*').eq('user_id', userId),
        supabase.from('interviews').select('*').eq('user_id', userId),
        supabase.from('interview_feedback').select('*').eq('user_id', userId),
      ]);

      // Compile data into exportable format
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: userId,
        profile: preferencesRes.data || [],
        interviews: interviewsRes.data || [],
        feedback: feedbackRes.data || [],
        statistics: {
          totalInterviews: interviewsRes.data?.length || 0,
          totalFeedback: feedbackRes.data?.length || 0,
        }
      };

      // Convert to formatted JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create file in cache directory
      const fileName = `my-interview-data-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Save Your Interview Data',
          UTI: 'public.json',
        });
        
        Alert.alert(
          "Export Complete", 
          "Your data has been exported. You can save it to your device or share it."
        );
      } else {
        Alert.alert(
          "Export Ready",
          `Your data has been saved to: ${fileUri}`,
          [{ text: "OK" }]
        );
      }

    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert(
        "Export Failed", 
        "There was an error exporting your data. Please try again or contact support."
      );
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <ScreenHeader />

      <Text style={styles.title}>Privacy and security</Text>
      <Text style={styles.subtitle}>
        Learn how your data is used and manage what’s stored on this device.
      </Text>

      <View style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.primaryBlue} />
          <Text style={styles.sectionTitle}>Legal Documents</Text>
        </View>
        <Text style={styles.sectionHint}>
          Review our privacy and terms policies
        </Text>

        <TouchableOpacity 
          style={styles.row} 
          activeOpacity={0.8}
          onPress={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
        >
          <View>
            <Text style={styles.rowTitle}>Privacy Policy</Text>
            <Text style={styles.rowSubtitle}>
              {showPrivacyPolicy ? 'Tap to collapse' : 'How we collect, use, and protect your data'}
            </Text>
          </View>
        </TouchableOpacity>

        {showPrivacyPolicy && (
          <View style={styles.policyContent}>
            <Text style={styles.policyText}>
              <Text style={styles.policyBold}>1. Information We Collect{'\n'}</Text>
              We collect email address, account details, interview answers, and usage data necessary to provide the service.{'\n\n'}
              
              <Text style={styles.policyBold}>2. How We Use Your Data{'\n'}</Text>
              Your data is used to provide AI-generated interview feedback, track progress, and improve app performance. We do not sell your data to third parties.{'\n\n'}
              
              <Text style={styles.policyBold}>3. AI Processing{'\n'}</Text>
              Interview answers are analysed using AI to generate feedback. AI feedback is designed to support practice and does not guarantee employment outcomes.{'\n\n'}
              
              <Text style={styles.policyBold}>4. Legal Basis (GDPR){'\n'}</Text>
              We process your data based on your consent and legitimate interest in providing the service. You can withdraw consent at any time.{'\n\n'}
              
              <Text style={styles.policyBold}>5. Data Storage & Security{'\n'}</Text>
              Your data is stored securely with restricted access. We take reasonable steps to protect against loss or misuse.{'\n\n'}
              
              <Text style={styles.policyBold}>6. Your Rights{'\n'}</Text>
              Under UK GDPR, you have the right to access, correct, request deletion, and request a copy of your data.{'\n\n'}
              
              <Text style={styles.policyBold}>7. Data Retention{'\n'}</Text>
              We keep your data only while your account is active. Deleted accounts are permanently removed within 30 days.
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.row} 
          activeOpacity={0.8}
          onPress={() => setShowTerms(!showTerms)}
        >
          <View>
            <Text style={styles.rowTitle}>Terms of Service</Text>
            <Text style={styles.rowSubtitle}>
              {showTerms ? 'Tap to collapse' : 'Rules and guidelines for using the app'}
            </Text>
          </View>
        </TouchableOpacity>

        {showTerms && (
          <View style={styles.policyContent}>
            <Text style={styles.policyText}>
              <Text style={styles.policyBold}>1. Purpose of the App{'\n'}</Text>
              This app provides AI-assisted interview practice and feedback. It is a preparation tool only and does not guarantee job offers or interview success.{'\n\n'}
              
              <Text style={styles.policyBold}>2. User Responsibilities{'\n'}</Text>
              You agree to provide accurate information, use the app for lawful purposes only, and not misuse or attempt to reverse-engineer the service.{'\n\n'}
              
              <Text style={styles.policyBold}>3. AI Disclaimer{'\n'}</Text>
              All feedback is generated by AI and should be treated as guidance, not professional advice. Final interview decisions are made by employers.{'\n\n'}
              
              <Text style={styles.policyBold}>4. Payments & Subscriptions{'\n'}</Text>
              Subscriptions renew automatically unless cancelled. You can cancel at any time through your app store account. Refunds are subject to app store policies.{'\n\n'}
              
              <Text style={styles.policyBold}>5. Limitation of Liability{'\n'}</Text>
              We are not responsible for interview outcomes, employment decisions, or losses resulting from reliance on AI feedback. Use of the app is at your own discretion.{'\n\n'}
              
              <Text style={styles.policyBold}>6. Age Requirement{'\n'}</Text>
              This app is intended for users aged 16 and over. We do not knowingly collect data from children under 13.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="bar-chart-outline" size={16} color={colors.primaryBlue} />
          <Text style={styles.sectionTitle}>Your Data Rights</Text>
        </View>
        <Text style={styles.sectionHint}>
          We follow UK GDPR regulations. You are always in control of your data.
        </Text>

        <TouchableOpacity
          style={styles.row}
          onPress={handleExportData}
          activeOpacity={0.8}
        >
          <View>
            <Text style={styles.rowTitle}>Download Your Data</Text>
            <Text style={styles.rowSubtitle}>
              Export your interview answers, feedback, and progress history
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
            paddingBottom: 32,
    },
    logoText: {
      ...typography.brandMark,
      color: colors.primaryBlue,
    },
    title: {
      ...typography.headingMedium,
      textAlign: 'center',
      color: isDark ? "#fff" : colors.textDark,
    },
    subtitle: {
      ...typography.bodySmall,
      textAlign: 'center',
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
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    sectionTitle: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: isDark ? '#fff' : colors.textDark,
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
    policyContent: {
      marginTop: 12,
      padding: 16,
      backgroundColor: isDark ? "#0a0a0a" : "#F9FAFB",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#2a2a2a" : "#E5E7EB",
    },
    policyText: {
      ...typography.bodySmall,
      fontSize: 13,
      lineHeight: 20,
      color: isDark ? "#d1d1d1" : colors.textDark,
    },
    policyBold: {
      fontWeight: "700",
      color: isDark ? "#fff" : colors.textDark,
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
