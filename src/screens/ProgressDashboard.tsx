import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenHeader from "../components/ScreenHeader";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";

export default function ProgressDashboard() {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  
  const [stats, setStats] = useState({
    totalInterviews: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalMinutes: 0,
    thisWeek: 0,
    lastWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setLoading(false);
        return;
      }

      // Get total interviews and minutes
      const { data: interviews } = await supabase
        .from('interview_history')
        .select('duration_minutes, date')
        .eq('user_id', userId);

      const totalInterviews = interviews?.length || 0;
      const totalMinutes = interviews?.reduce((sum, i) => sum + i.duration_minutes, 0) || 0;

      // Calculate this week vs last week
      const now = new Date();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay());
      startOfThisWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const thisWeek = interviews?.filter(i => 
        new Date(i.date) >= startOfThisWeek
      ).length || 0;

      const lastWeek = interviews?.filter(i => {
        const date = new Date(i.date);
        return date >= startOfLastWeek && date < startOfThisWeek;
      }).length || 0;

      // Get streak from user_progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('streak')
        .eq('user_id', userId)
        .single();

      const currentStreak = progress?.streak || 0;
      const streak = await AsyncStorage.getItem('streak');
      const longestStreak = Math.max(currentStreak, parseInt(streak || '0'));

      setStats({
        totalInterviews,
        currentStreak,
        longestStreak,
        totalMinutes,
        thisWeek,
        lastWeek,
      });
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgressData();
    setRefreshing(false);
  };

  const getWeekProgress = () => {
    const change = stats.lastWeek === 0 ? 100 : 
      ((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100;
    return Math.round(change);
  };

  const getProgressLevel = () => {
    if (stats.totalInterviews >= 50) return { level: 'Expert', icon: '🏆', color: '#FFD700' };
    if (stats.totalInterviews >= 20) return { level: 'Advanced', icon: '⭐', color: '#3b82f6' };
    if (stats.totalInterviews >= 10) return { level: 'Intermediate', icon: '💪', color: '#10B981' };
    return { level: 'Beginner', icon: '🌱', color: '#8B5CF6' };
  };

  const progressLevel = getProgressLevel();
  const weekProgress = getWeekProgress();

  return (
    <ScrollView 
      style={styles.root} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primaryBlue}
        />
      }
    >
      <ScreenHeader />

      <Text style={styles.title}>Progress Dashboard</Text>
      <Text style={styles.subtitle}>
        Track your journey to interview success
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      ) : (
        <>
      {/* Level Card */}
      <View style={styles.levelCard}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelIcon}>{progressLevel.icon}</Text>
        </View>
        <View style={styles.levelInfo}>
          <Text style={styles.levelTitle}>{progressLevel.level}</Text>
          <Text style={styles.levelSubtitle}>
            {stats.totalInterviews >= 50 ? 'Interview Master!' : 
             stats.totalInterviews >= 20 ? 'Keep up the great work!' :
             stats.totalInterviews >= 10 ? 'You\'re making progress!' :
             'Just getting started'}
          </Text>
        </View>
        <View style={[styles.levelDot, { backgroundColor: progressLevel.color }]} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="chatbubbles" size={24} color={colors.primaryBlue} />
          <Text style={styles.statNumber}>{stats.totalInterviews}</Text>
          <Text style={styles.statLabel}>Total Interviews</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{stats.totalMinutes}</Text>
          <Text style={styles.statLabel}>Total Minutes</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trophy" size={24} color="#8B5CF6" />
          <Text style={styles.statNumber}>{stats.longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
      </View>

      {/* Weekly Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 Weekly Progress</Text>
        <View style={styles.weeklyStats}>
          <View style={styles.weekStat}>
            <Text style={styles.weekLabel}>This Week</Text>
            <Text style={styles.weekNumber}>{stats.thisWeek}</Text>
          </View>
          <View style={styles.weekDivider} />
          <View style={styles.weekStat}>
            <Text style={styles.weekLabel}>Last Week</Text>
            <Text style={styles.weekNumber}>{stats.lastWeek}</Text>
          </View>
        </View>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: weekProgress >= 0 ? '#10B981' : '#EF4444' }]}>
            {weekProgress >= 0 ? '↑' : '↓'} {Math.abs(weekProgress)}% {weekProgress >= 0 ? 'increase' : 'decrease'}
          </Text>
        </View>
      </View>

      {/* Milestones */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="flag-outline" size={18} color={colors.primaryBlue} />
          <Text style={styles.cardTitle}>Next Milestones</Text>
        </View>
        {[
          { target: 10, label: 'Complete 10 interviews', icon: 'barbell-outline' },
          { target: 20, label: 'Reach Advanced level',   icon: 'star-outline' },
          { target: 50, label: 'Become an Expert',       icon: 'trophy-outline' },
        ]
          .filter(m => stats.totalInterviews < m.target)
          .slice(0, 3)
          .map((milestone, index) => {
            const progress = (stats.totalInterviews / milestone.target) * 100;
            return (
              <View key={index} style={styles.milestone}>
                <View style={styles.milestoneIconCircle}>
                  <Ionicons name={milestone.icon as any} size={16} color={colors.primaryBlue} />
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneLabel}>{milestone.label}</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.milestoneProgress}>
                    {stats.totalInterviews} / {milestone.target}
                  </Text>
                </View>
              </View>
            );
          })}
      </View>
      </>
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6",
    },
    content: {
      paddingHorizontal: 24,
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
      marginBottom: 4,
    },
    subtitle: {
      ...typography.bodyMedium,
      textAlign: 'center',
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginBottom: 20,
    },
    levelCard: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    levelBadge: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDark ? '#2a2a2a' : '#F9FAFB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    levelIcon: {
      fontSize: 32,
    },
    levelInfo: {
      flex: 1,
    },
    levelTitle: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 4,
    },
    levelSubtitle: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
    },
    levelDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    statNumber: {
      ...typography.heading,
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#fff' : colors.textDark,
      marginTop: 8,
    },
    statLabel: {
      ...typography.caption,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    card: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    cardTitle: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: isDark ? '#fff' : colors.textDark,
    },
    weeklyStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    weekStat: {
      flex: 1,
      alignItems: 'center',
    },
    weekLabel: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginBottom: 8,
    },
    weekNumber: {
      ...typography.heading,
      fontSize: 32,
      fontWeight: '700',
      color: isDark ? '#fff' : colors.textDark,
    },
    weekDivider: {
      width: 1,
      height: 40,
      backgroundColor: isDark ? '#333' : '#E5E7EB',
    },
    progressInfo: {
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#E5E7EB',
    },
    progressText: {
      ...typography.bodyMedium,
      fontWeight: '600',
    },
    milestone: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    milestoneIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: isDark ? '#1a2a4a' : '#E8F0FE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    milestoneIcon: {
      fontSize: 24,
    },
    milestoneInfo: {
      flex: 1,
    },
    milestoneLabel: {
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 8,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#E5E7EB',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primaryBlue,
      borderRadius: 4,
    },
    milestoneProgress: {
      ...typography.caption,
      color: isDark ? '#b5b5b5' : colors.textMuted,
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
