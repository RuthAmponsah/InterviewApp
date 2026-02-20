import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, RefreshControl, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import PrimaryButton from "../components/PrimaryButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";

// ⭐ FIX: Add proper navigation typing
type ProfileNav = NativeStackNavigationProp<RootStackParamList, "MyProfile">;

export default function MyProfile() {
  // ⭐ FIX: Tell TypeScript this screen belongs to RootStackParamList
  const navigation = useNavigation<ProfileNav>();
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);

  const [name, setName] = useState("User");
  const [email, setEmail] = useState("ruthrocwel@example.com");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [cvUploaded, setCvUploaded] = useState(false);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [achievements, setAchievements] = useState({
    streak7: false,
    interviews10: false,
    questions20: false,
  });
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Calculate profile completion percentage
  const calculateCompletion = async () => {
    let completedItems = 0;
    const totalItems = 4;
    const missing: string[] = [];

    // Read directly from AsyncStorage to ensure accurate data
    const storedName = await AsyncStorage.getItem('userName');
    const storedEmail = await AsyncStorage.getItem('userEmail');
    const storedPhoto = await AsyncStorage.getItem('userProfilePhoto');
    const storedRole = await AsyncStorage.getItem('jobRole');

    console.log('📊 Profile check:', { storedName, storedEmail, storedPhoto: !!storedPhoto, storedRole });

    if (storedName && storedName.trim() !== "" && storedName !== "User") {
      completedItems++;
    } else {
      missing.push('Name');
    }
    
    if (storedEmail) {
      completedItems++;
    } else {
      missing.push('Email');
    }
    
    if (storedPhoto) {
      completedItems++;
    } else {
      missing.push('Profile photo');
    }
    
    // Check if job role is set
    if (storedRole) {
      completedItems++;
    } else {
      missing.push('Job role (in Job Preferences)');
    }
    
    setMissingItems(missing);
    const percentage = Math.round((completedItems / totalItems) * 100);
    setProfileCompletion(percentage);
    
    // Save completion status so it doesn't show again once complete
    if (percentage === 100) {
      await AsyncStorage.setItem('profileComplete', 'true');
    }
  };

  // Load saved profile data from storage and Supabase
  const loadProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      
      // Check if CV is uploaded
      const cvUri = await AsyncStorage.getItem("cvUri");
      const cvName = await AsyncStorage.getItem("cvFileName");
      if (cvUri && cvName) {
        setCvUploaded(true);
        setCvFileName(cvName);
      }
      
      // Check if profile was already marked as complete
      const isComplete = await AsyncStorage.getItem('profileComplete');
      if (isComplete === 'true') {
        setProfileCompletion(100);
      }

      // Always load from AsyncStorage first (most reliable)
      const storedName = await AsyncStorage.getItem('userName');
      const storedEmail = await AsyncStorage.getItem('userEmail');
      const storedPhoto = await AsyncStorage.getItem('userProfilePhoto');
      
      if (storedName && storedName !== 'User') {
        setName(storedName);
      }
      if (storedEmail) {
        setEmail(storedEmail);
      }
      if (storedPhoto) {
        setProfilePhoto(storedPhoto);
      }
      
      if (userId) {
        // Try to fetch latest data from Supabase (may fail due to RLS)
        try {
          const { data, error } = await supabase
            .from('users')
            .select('name, email, profile_photo')
            .eq('id', userId)
            .single();

          if (data && !error) {
            if (data.name) {
              setName(data.name);
              await AsyncStorage.setItem('userName', data.name);
            }
            if (data.email) {
              setEmail(data.email);
            }
            console.log('📸 Profile data from DB:', { name: data.name, photo: data.profile_photo });
            if (data.profile_photo) {
              setProfilePhoto(data.profile_photo);
              await AsyncStorage.setItem("userProfilePhoto", data.profile_photo);
              console.log('✅ Profile photo set:', data.profile_photo);
            }
          }
        } catch (dbError) {
          console.log('⚠️ Could not fetch from DB, using AsyncStorage values');
        }

        // Check achievements
        const streak = parseInt(await AsyncStorage.getItem("streak") || "0");
        const { data: progress } = await supabase
          .from('user_progress')
          .select('total_interviews')
          .eq('user_id', userId)
          .single();

        // Check custom questions count
        const customQuestionsStr = await AsyncStorage.getItem('customQuestions');
        const customQuestions = customQuestionsStr ? JSON.parse(customQuestionsStr) : [];
        const hasCustomQuestions = customQuestions.length >= 20;

        setAchievements({
          streak7: streak >= 7,
          interviews10: (progress?.total_interviews || 0) >= 10,
          questions20: hasCustomQuestions,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reload profile when screen comes into focus (after editing)
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        await loadProfile();
        await calculateCompletion();
      };
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    await calculateCompletion();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <BackButton />
      
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryBlue}
          />
        }
      >
        {/* Profile Completion - Only show if not complete */}
        {profileCompletion < 100 && (
        <TouchableOpacity 
          style={styles.completionCard}
          activeOpacity={0.85}
          onPress={() => {
            // Navigate to the first missing item's screen
            if (missingItems.some(item => item.includes('Job role'))) {
              navigation.navigate('JobPreferences');
            } else if (missingItems.includes('Profile photo')) {
              navigation.navigate('EditProfile');
            } else {
              navigation.navigate('EditProfile');
            }
          }}
        >
        <View style={styles.completionHeader}>
          <Text style={styles.completionTitle}>Profile Completion</Text>
          <Text style={styles.completionPercentage}>{profileCompletion}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${profileCompletion}%` }]} />
        </View>
        {missingItems.length > 0 && (
          <Text style={styles.completionHint}>
            Missing: {missingItems.join(', ')}
          </Text>
        )}
        <Text style={styles.tapHint}>Tap to complete →</Text>
      </TouchableOpacity>
        )}

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {profilePhoto ? (
            <Image 
              source={{ uri: profilePhoto }} 
              style={styles.avatarImage}
              onError={(e) => console.log('Profile photo load error:', e.nativeEvent.error)}
            />
          ) : (
            <Ionicons name="person" size={50} color={colors.textMuted} />
          )}
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* Achievements Card */}
      <View style={styles.achievementsCard}>
        <View style={styles.achievementsHeader}>
          <Text style={styles.achievementsTitle}>🏆 Achievements</Text>
          <Text style={styles.achievementsSubtitle}>Unlock badges by practicing regularly</Text>
        </View>
        <View style={styles.badgesContainer}>
          <View style={[styles.badge, achievements.streak7 && styles.badgeUnlocked]}>
            <View style={styles.badgeIconContainer}>
              <Text style={styles.badgeIcon}>{achievements.streak7 ? "🔥" : "🔒"}</Text>
            </View>
            <Text style={[styles.badgeLabel, achievements.streak7 && styles.badgeLabelUnlocked]}>
              7-Day
            </Text>
            <Text style={[styles.badgeSubLabel, achievements.streak7 && styles.badgeLabelUnlocked]}>
              Streak
            </Text>
          </View>
          <View style={[styles.badge, achievements.interviews10 && styles.badgeUnlocked]}>
            <View style={styles.badgeIconContainer}>
              <Text style={styles.badgeIcon}>{achievements.interviews10 ? "🎯" : "🔒"}</Text>
            </View>
            <Text style={[styles.badgeLabel, achievements.interviews10 && styles.badgeLabelUnlocked]}>
              10 Mock
            </Text>
            <Text style={[styles.badgeSubLabel, achievements.interviews10 && styles.badgeLabelUnlocked]}>
              Interviews
            </Text>
          </View>
          <View style={[styles.badge, achievements.questions20 && styles.badgeUnlocked]}>
            <View style={styles.badgeIconContainer}>
              <Text style={styles.badgeIcon}>{achievements.questions20 ? "📚" : "🔒"}</Text>
            </View>
            <Text style={[styles.badgeLabel, achievements.questions20 && styles.badgeLabelUnlocked]}>
              20 Custom
            </Text>
            <Text style={[styles.badgeSubLabel, achievements.questions20 && styles.badgeLabelUnlocked]}>
              Questions
            </Text>
          </View>
        </View>
      </View>

      {/* Options Section */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.rowText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cvCard}
          onPress={() => navigation.navigate("ViewCV")}
          activeOpacity={0.7}
        >
          <View style={styles.cvCardIcon}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cvCardTitle}>✨ Enhance Your CV</Text>
            <Text style={styles.cvCardSubtitle}>
              Upload or paste your CV to get AI-powered suggestions
            </Text>
            {cvFileName && (
              <Text style={styles.cvCardFile}>
                📄 {cvFileName}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primaryBlue} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("ChangePassword")}
        >
          <Text style={styles.rowText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Text style={styles.rowText}>Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          // Sign out from Supabase
          await supabase.auth.signOut();
          // Clear local storage
          await AsyncStorage.setItem("isLoggedIn", "false");
          navigation.replace("SignIn");
        }}
      >
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
      </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 22,
      paddingTop: 70,
      backgroundColor: isDark ? "#0f0f0f" : "#F2F4F7",
    },
    logoText: {
      ...typography.heading,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 28,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    completionCard: {
      backgroundColor: isDark ? "#1c1c1c" : "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? "#333" : colors.border,
    },
    completionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    completionTitle: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
    },
    completionPercentage: {
      ...typography.bodyMedium,
      fontWeight: "700",
      color: colors.primaryBlue,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: isDark ? "#2a2a2a" : "#E5E7EB",
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 8,
    },
    progressBar: {
      height: "100%",
      backgroundColor: colors.primaryBlue,
      borderRadius: 4,
    },
    completionHint: {
      ...typography.bodySmall,
      color: colors.textMuted,
      lineHeight: 18,
    },
    tapHint: {
      ...typography.caption,
      color: colors.primaryBlue,
      fontWeight: '600',
      marginTop: 10,
    },

    /* Header */
    header: {
      alignItems: "center",
      marginBottom: 30,
    },
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
      marginBottom: 12,
      backgroundColor: isDark ? "#2a2a2a" : "#E5E7EB",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: isDark ? "#444" : "#D1D5DB",
      overflow: "hidden",
    },
    avatarImage: {
      width: 110,
      height: 110,
    },
    name: {
      ...typography.headingMedium,
      marginBottom: 4,
      color: isDark ? "#fff" : "#111",
    },
    email: {
      ...typography.label,
      color: isDark ? "#b5b5b5" : "#666",
    },

    /* Achievements Card */
    achievementsCard: {
      backgroundColor: isDark ? "#1d1d1d" : "#fff",
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 24,
      marginBottom: 25,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E6E6E6",
    },
    achievementsHeader: {
      marginBottom: 20,
    },
    achievementsTitle: {
      ...typography.headingMedium,
      fontWeight: "700",
      color: isDark ? "#fff" : "#111",
      marginBottom: 4,
    },
    achievementsSubtitle: {
      ...typography.bodySmall,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    badgesContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    badge: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 20,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: isDark ? "#2a2a2a" : "#F9FAFB",
      borderWidth: 2,
      borderColor: isDark ? "#444" : "#E5E7EB",
    },
    badgeUnlocked: {
      backgroundColor: isDark ? "#1e3a5f" : "#EFF6FF",
      borderColor: colors.primaryBlue,
      borderWidth: 2,
    },
    badgeIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDark ? "#333" : "#F3F4F6",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    badgeIcon: {
      fontSize: 32,
    },
    badgeLabel: {
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginBottom: 2,
    },
    badgeSubLabel: {
      fontSize: 11,
      fontWeight: "500",
      textAlign: "center",
      color: isDark ? "#6B7280" : "#9CA3AF",
    },
    badgeLabelUnlocked: {
      color: colors.primaryBlue,
      fontWeight: "700",
    },

    /* Options Card */
    card: {
      backgroundColor: isDark ? "#1d1d1d" : "#fff",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 25,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E6E6E6",
    },

    row: {
      paddingVertical: 16,
      borderBottomColor: isDark ? "#333" : "#E6E6E6",
      borderBottomWidth: 1,
    },
    rowText: {
      ...typography.bodyMedium,
      color: isDark ? "#fff" : "#111",
    },
    rowSubtext: {
      ...typography.bodySmall,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    cvCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryBlue,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginVertical: 16,
      marginHorizontal: 0,
      shadowColor: colors.primaryBlue,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
      gap: 12,
    },
    cvCardIcon: {
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 12,
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cvCardTitle: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: '#fff',
      fontSize: 16,
      marginBottom: 4,
    },
    cvCardSubtitle: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.9)',
      fontSize: 13,
      marginBottom: 6,
    },
    cvCardFile: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.7)',
      fontSize: 12,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#222' : '#FFF',
      borderRadius: 12,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: '#FF3B30',
    },
    logoutText: {
      ...typography.bodyMedium,
      color: '#FF3B30',
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      ...typography.bodyMedium,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 12,
    },
  });
