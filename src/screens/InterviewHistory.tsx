import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, RefreshControl, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from 'expo-haptics';
import ScreenHeader from "../components/ScreenHeader";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";
import { SkeletonListItem } from '../components/Skeleton';

type InterviewRecord = {
  id: string;
  job_role: string;
  mode: 'text' | 'voice';
  duration_minutes: number;
  date: string;
  feedback_score?: number;
};

export default function InterviewHistory({ navigation }: any) {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    avgDuration: 0,
  });

  useEffect(() => {
    loadInterviewHistory();
  }, []);

  const loadInterviewHistory = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('interview_history')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (data) {
        setInterviews(data);
        calculateStats(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading interview history:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadInterviewHistory();
    setRefreshing(false);
  };

  const deleteInterview = async (interviewId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Delete from Supabase
      const { error } = await supabase
        .from('interview_history')
        .delete()
        .eq('id', interviewId);

      if (error) {
        console.error('Error deleting interview:', error);
        return;
      }

      // Update local state
      const updatedInterviews = interviews.filter(i => i.id !== interviewId);
      setInterviews(updatedInterviews);
      calculateStats(updatedInterviews);
    } catch (error) {
      console.error('Error deleting interview:', error);
    }
  };

  const confirmDeleteInterview = (interviewId: string) => {
    Alert.alert(
      'Delete Interview',
      'Are you sure you want to delete this interview? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteInterview(interviewId) },
      ]
    );
  };

  const calculateStats = (data: InterviewRecord[]) => {
    const total = data.length;
    const now = new Date();
    const thisMonth = data.filter(i => {
      const date = new Date(i.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    
    const avgDuration = total > 0
      ? Math.round(data.reduce((sum, i) => sum + i.duration_minutes, 0) / total)
      : 0;

    setStats({ total, thisMonth, avgDuration });
  };

  const getWeeklyData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(day => {
      const count = interviews.filter(i => i.date.split('T')[0] === day).length;
      return { date: day, count };
    });
  };

  const getRoleCategory = (role: string) => {
    const normalized = (role || "").toLowerCase().trim();
    if (!normalized || normalized === "unknown") return "General";

    const match = (keywords: string[]) => keywords.some((k) => normalized.includes(k));

    if (match(["software", "developer", "engineer", "it", "data", "devops", "qa", "ux", "ui", "web", "mobile", "machine learning"])) {
      return "Tech";
    }
    if (match(["nurse", "health", "therap", "counselor", "paramedic", "pharmacy", "care"])) {
      return "Healthcare & Therapy";
    }
    if (match(["teacher", "tutor", "education", "childcare", "school", "classroom"])) {
      return "Education & Childcare";
    }
    if (match(["retail", "store", "cashier", "customer service", "customer success"])) {
      return "Retail & Customer Service";
    }
    if (match(["chef", "cook", "server", "waiter", "waitress", "bar", "food", "hospitality", "hotel", "housekeeper", "front desk"])) {
      return "Food & Hospitality";
    }
    if (match(["construction", "electrician", "plumber", "welder", "trades", "painter", "maintenance"])) {
      return "Construction & Trades";
    }
    if (match(["warehouse", "logistics", "driver", "delivery", "dispatcher", "supply chain", "loader", "picker"])) {
      return "Logistics & Warehouse";
    }
    if (match(["admin", "assistant", "office", "operations", "project", "coordinator", "manager", "recruiter", "hr"])) {
      return "Business & Admin";
    }
    if (match(["sales", "marketing", "account manager", "business development", "customer", "social media"])) {
      return "Sales & Marketing";
    }
    if (match(["finance", "account", "legal", "compliance", "auditor", "insurance"])) {
      return "Finance & Legal";
    }

    return "Other";
  };

  const getTopRoles = () => {
    const roleCounts: { [key: string]: number } = {};
    interviews.forEach((i) => {
      const category = getRoleCategory(i.job_role);
      roleCounts[category] = (roleCounts[category] || 0) + 1;
    });

    return Object.entries(roleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([role, count]) => ({ role, count }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const shareResults = async () => {
    const message = `🎯 I've completed ${stats.total} interview practice sessions with MY INTERVIEW!\n\n📊 Stats:\n• This month: ${stats.thisMonth} interviews\n• Average duration: ${stats.avgDuration} minutes\n\nPractice makes perfect! 💪`;
    
    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <ScrollView 
      style={styles.root} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primaryBlue}
          colors={[colors.primaryBlue]}
        />
      }
    >
      <ScreenHeader />
      
      <View style={styles.headerRow}>
        {stats.total > 0 && (
          <TouchableOpacity style={styles.shareButton} onPress={shareResults} accessibilityLabel="Share results" accessibilityRole="button">
            <Ionicons name="share-social-outline" size={24} color={colors.primaryBlue} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>Interview History</Text>
      <Text style={styles.subtitle}>
        Track your practice sessions and improvement over time.
      </Text>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.thisMonth}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.avgDuration}m</Text>
          <Text style={styles.statLabel}>Avg Time</Text>
        </View>
      </View>

      {/* Analytics Section */}
      {interviews.length > 0 && (
        <>
          {/* Weekly Activity */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>📊 Last 7 Days</Text>
            <View style={styles.chartContainer}>
              {getWeeklyData().map((day, index) => {
                const maxCount = Math.max(...getWeeklyData().map(d => d.count), 1);
                const heightPercentage = (day.count / maxCount) * 100;
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            height: `${Math.max(heightPercentage, 5)}%`,
                            backgroundColor: day.count > 0 ? colors.primaryBlue : (isDark ? '#2a2a2a' : '#E5E7EB'),
                          }
                        ]}
                      >
                        {day.count > 0 && (
                          <Text style={styles.barCount}>{day.count}</Text>
                        )}
                      </View>
                    </View>
                    <Text style={styles.barLabel}>{dayName}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Top Categories */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>🎯 Most Practiced Categories</Text>
            {getTopRoles().map((item, index) => {
              const maxCount = Math.max(...getTopRoles().map(r => r.count));
              const widthPercentage = (item.count / maxCount) * 100;
              
              return (
                <View key={index} style={styles.roleItem}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.roleName}>{item.role}</Text>
                    <Text style={styles.roleCount}>{item.count} interview{item.count !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${widthPercentage}%`,
                          backgroundColor: index === 0 ? '#10B981' : index === 1 ? colors.primaryBlue : '#8B5CF6',
                        }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Interview List */}
      <View style={styles.card}>
        {loading ? (
          <>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </>
        ) : interviews.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyCircle}>
                <Ionicons name="mic-outline" size={52} color={colors.primaryBlue} />
              </View>
              <View style={styles.emptyDotA} />
              <View style={styles.emptyDotB} />
            </View>
            <Text style={styles.emptyText}>No interviews yet</Text>
            <Text style={styles.emptySubtext}>
              Complete your first practice interview to see it here!
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('InterviewLevel');
              }}
            >
              <Text style={styles.startButtonText}>Start Interview</Text>
            </TouchableOpacity>
          </View>
        ) : (
          interviews.map((interview) => (
            <View key={interview.id} style={styles.interviewItemContainer}>
              <View style={styles.interviewItem}>
                <View style={styles.interviewIcon}>
                  <Ionicons
                    name={interview.mode === 'text' ? 'chatbubbles' : 'mic'}
                    size={20}
                    color={colors.primaryBlue}
                  />
                </View>
                <View style={styles.interviewDetails}>
                  <Text style={styles.interviewRole}>{interview.job_role}</Text>
                  <Text style={styles.interviewMeta}>
                    {formatDate(interview.date)} • {interview.duration_minutes} min
                  </Text>
                </View>
                {interview.feedback_score && (
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>{interview.feedback_score}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmDeleteInterview(interview.id)}
                activeOpacity={0.7}
                accessibilityLabel="Delete interview"
                accessibilityRole="button"
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0f0f0f" : colors.background,
    },
    content: {
      paddingHorizontal: 24,
            paddingBottom: 32,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      position: 'relative',
    },
    logoText: {
      ...typography.brandMark,
      color: colors.primaryBlue,
    },
    shareButton: {
      position: 'absolute',
      right: 0,
      padding: 8,
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
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    statNumber: {
      ...typography.headingMedium,
      color: colors.primaryBlue,
      fontWeight: '700',
      marginBottom: 4,
    },
    statLabel: {
      ...typography.bodySmall,
      color: isDark ? "#888" : colors.textMuted,
    },
    card: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIllustration: {
      width: 120,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primaryBlue + '14',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyDotA: {
      position: 'absolute',
      top: 6,
      right: 8,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.primaryBlue + '28',
    },
    emptyDotB: {
      position: 'absolute',
      bottom: 6,
      left: 10,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primaryBlue + '1e',
    },
    emptyText: {
      ...typography.body,
      color: isDark ? "#888" : colors.textMuted,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      ...typography.bodyMedium,
      color: isDark ? "#666" : colors.textMuted,
      textAlign: 'center',
      marginBottom: 24,
    },
    startButton: {
      backgroundColor: colors.primaryBlue,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    startButtonText: {
      ...typography.bodyMedium,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    interviewItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2a2a2a" : colors.border,
    },
    interviewItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    deleteButton: {
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    interviewIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? "#2a2a2a" : colors.primaryBlue + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    interviewDetails: {
      flex: 1,
    },
    interviewRole: {
      ...typography.bodyMedium,
      color: isDark ? "#fff" : colors.textDark,
      fontWeight: '600',
      marginBottom: 2,
    },
    interviewMeta: {
      ...typography.bodySmall,
      color: isDark ? "#888" : colors.textMuted,
    },
    scoreContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accentGreen + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreText: {
      ...typography.bodyMedium,
      color: colors.accentGreen,
      fontWeight: '700',
    },
    analyticsCard: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    analyticsTitle: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 16,
    },
    chartContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 140,
      gap: 4,
    },
    barContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    barWrapper: {
      width: '100%',
      height: 100,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    bar: {
      width: '100%',
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 4,
      minHeight: 5,
    },
    barCount: {
      ...typography.caption,
      color: '#fff',
      fontWeight: '700',
    },
    barLabel: {
      ...typography.caption,
      color: isDark ? "#888" : colors.textMuted,
      marginTop: 6,
    },
    roleItem: {
      marginBottom: 16,
    },
    roleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    roleName: {
      ...typography.bodyMedium,
      color: isDark ? "#fff" : colors.textDark,
      fontWeight: '600',
    },
    roleCount: {
      ...typography.bodySmall,
      color: isDark ? "#888" : colors.textMuted,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#E5E7EB',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 4,
    },
  });
