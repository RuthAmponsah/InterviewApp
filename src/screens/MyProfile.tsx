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
import AppHeader from "../components/AppHeader";
import ScreenHeader from "../components/ScreenHeader";
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
  const [email, setEmail] = useState("");
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
      {navigation.canGoBack() ? <ScreenHeader /> : <AppHeader />}

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
        {/* Avatar + Name */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            {profilePhoto ? (
              <Image 
                source={{ uri: profilePhoto }} 
                style={styles.avatarImage}
                onError={(e) => console.log('Profile photo load error:', e.nativeEvent.error)}
              />
            ) : (
              <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Profile Completion */}
        {profileCompletion < 100 && (
        <TouchableOpacity 
          style={styles.completionCard}
          activeOpacity={0.85}
          onPress={() => {
            if (missingItems.some(item => item.includes('Job role'))) {
              navigation.navigate('JobPreferences');
            } else {
              navigation.navigate('EditProfile');
            }
          }}
        >
        <View style={styles.completionHeader}>
          <Text style={styles.completionTitle}>Profile completion</Text>
          <Text style={styles.completionPercentage}>{profileCompletion}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${profileCompletion}%` }]} />
        </View>
        {missingItems.length > 0 && (
          <Text style={styles.completionHint}>
            {missingItems[0]}
          </Text>
        )}
        </TouchableOpacity>
        )}

        {/* Achievements 2x2 grid */}
        <View style={styles.achievementsCard}>
          <Text style={styles.achievementsTitle}>Achievements</Text>
          <View style={styles.badgesGrid}>
            <View style={[styles.badge, achievements.streak7 && styles.badgeUnlocked]}>
              <View style={[styles.badgeIconContainer, achievements.streak7 && styles.badgeIconUnlocked]}>
                <Ionicons name="flame-outline" size={22} color={achievements.streak7 ? '#fff' : (isDark ? '#666' : '#9CA3AF')} />
              </View>
              <Text style={[styles.badgeLabel, achievements.streak7 && styles.badgeLabelUnlocked]}>7-day streak</Text>
              <Text style={[styles.badgeSubLabel, achievements.streak7 && styles.badgeStatusUnlocked]}>{achievements.streak7 ? 'Earned' : 'Locked'}</Text>
            </View>
            <View style={[styles.badge, achievements.interviews10 && styles.badgeUnlocked]}>
              <View style={[styles.badgeIconContainer, achievements.interviews10 && styles.badgeIconUnlocked]}>
                <Ionicons name="mic-outline" size={22} color={achievements.interviews10 ? '#fff' : (isDark ? '#666' : '#9CA3AF')} />
              </View>
              <Text style={[styles.badgeLabel, achievements.interviews10 && styles.badgeLabelUnlocked]}>10 interviews</Text>
              <Text style={[styles.badgeSubLabel, achievements.interviews10 && styles.badgeStatusUnlocked]}>{achievements.interviews10 ? 'Earned' : 'Locked'}</Text>
            </View>
            <View style={[styles.badge, achievements.questions20 && styles.badgeUnlocked]}>
              <View style={[styles.badgeIconContainer, achievements.questions20 && styles.badgeIconUnlocked]}>
                <Ionicons name="list-outline" size={22} color={achievements.questions20 ? '#fff' : (isDark ? '#666' : '#9CA3AF')} />
              </View>
              <Text style={[styles.badgeLabel, achievements.questions20 && styles.badgeLabelUnlocked]}>20 questions</Text>
              <Text style={[styles.badgeSubLabel, achievements.questions20 && styles.badgeStatusUnlocked]}>{achievements.questions20 ? 'Earned' : 'Locked'}</Text>
            </View>
            <View style={[styles.badge, styles.badgeUnlocked]}>
              <View style={[styles.badgeIconContainer, styles.badgeIconUnlocked]}>
                <Ionicons name="star-outline" size={22} color="#fff" />
              </View>
              <Text style={[styles.badgeLabel, styles.badgeLabelUnlocked]}>First session</Text>
              <Text style={[styles.badgeSubLabel, styles.badgeStatusUnlocked]}>Earned</Text>
            </View>
          </View>
        </View>

        {/* Options */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('EditProfile')}>
            <View style={styles.rowIconBox}><Ionicons name="pencil-outline" size={16} color={colors.primaryBlue} /></View>
            <Text style={styles.rowText}>Edit profile</Text>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#C7C7CC'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ChangePassword')}>
            <View style={styles.rowIconBox}><Ionicons name="lock-closed-outline" size={16} color={colors.primaryBlue} /></View>
            <Text style={styles.rowText}>Change password</Text>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#C7C7CC'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.rowIconBox}><Ionicons name="notifications-outline" size={16} color={colors.primaryBlue} /></View>
            <Text style={styles.rowText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#C7C7CC'} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await supabase.auth.signOut();
            await AsyncStorage.setItem('isLoggedIn', 'false');
            navigation.replace('SignIn');
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
      backgroundColor: isDark ? "#0f0f0f" : "#F2F4F7",
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
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 4,
    },

    /* Header */
    header: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
      marginBottom: 12,
      backgroundColor: '#1E3A6E',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: 90,
      height: 90,
    },
    avatarInitial: {
      fontSize: 36,
      fontWeight: '700',
      color: '#fff',
    },
    name: {
      ...typography.headingSmall,
      fontWeight: '700',
      marginBottom: 2,
      color: isDark ? '#fff' : '#111',
    },
    email: {
      ...typography.bodySmall,
      color: isDark ? '#888' : '#6B7280',
    },

    /* Achievements Card */
    achievementsCard: {
      backgroundColor: isDark ? '#1d1d1d' : '#fff',
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    achievementsTitle: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: isDark ? '#fff' : '#111',
      marginBottom: 14,
    },
    badgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    badge: {
      width: '47%',
      alignItems: 'center',
      paddingVertical: 18,
      borderRadius: 14,
      backgroundColor: isDark ? '#2a2a2a' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    badgeUnlocked: {
      backgroundColor: isDark ? '#1e3a5f' : '#EFF6FF',
      borderColor: colors.primaryBlue,
    },
    badgeIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#444' : '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    badgeIconUnlocked: {
      backgroundColor: colors.primaryBlue,
    },
    badgeLabel: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      color: isDark ? '#9CA3AF' : '#374151',
      marginBottom: 2,
    },
    badgeLabelUnlocked: {
      color: isDark ? '#fff' : colors.primaryBlue,
      fontWeight: '700',
    },
    badgeSubLabel: {
      fontSize: 11,
      textAlign: 'center',
      color: isDark ? '#666' : '#9CA3AF',
    },
    badgeStatusUnlocked: {
      color: isDark ? '#93C5FD' : colors.primaryBlue,
      fontWeight: '600',
    },

    /* Options Card */
    card: {
      backgroundColor: isDark ? '#1d1d1d' : '#fff',
      borderRadius: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2a2a2a' : '#F3F4F6',
      gap: 12,
    },
    rowIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#E8F0FE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      ...typography.label,
      color: isDark ? '#fff' : '#111',
      flex: 1,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#222' : '#fff',
      borderRadius: 14,
      paddingVertical: 14,
      marginBottom: 30,
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
