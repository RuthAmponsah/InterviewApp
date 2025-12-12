import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";

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
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <BackButton />
      
      <View style={styles.headerRow}>
        <Text style={styles.logoText}>MY INTERVIEW</Text>
        {stats.total > 0 && (
          <TouchableOpacity style={styles.shareButton} onPress={shareResults}>
            <Ionicons name="share-social-outline" size={24} color={colors.primary} />
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

      {/* Interview List */}
      <View style={styles.card}>
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : interviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No interviews yet</Text>
            <Text style={styles.emptySubtext}>
              Complete your first practice interview to see it here!
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('InterviewType')}
            >
              <Text style={styles.startButtonText}>Start Interview</Text>
            </TouchableOpacity>
          </View>
        ) : (
          interviews.map((interview) => (
            <View key={interview.id} style={styles.interviewItem}>
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
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreText}>{interview.feedback_score}</Text>
                </View>
              )}
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
      paddingTop: 80,
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
      ...typography.heading,
      fontWeight: "800",
      color: colors.primaryBlue,
    },
    shareButton: {
      position: 'absolute',
      right: 0,
      padding: 8,
    },
    title: {
      ...typography.headingMedium,
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 4,
    },
    subtitle: {
      ...typography.bodyMedium,
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
    interviewItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2a2a2a" : colors.border,
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
    scoreCircle: {
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
  });
