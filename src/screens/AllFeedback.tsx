import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/colors';
import BackButton from '../components/BackButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

interface FeedbackItem {
  id: string;
  date: string;
  job_role: string;
  feedback: string;
  duration_minutes: number;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AllFeedback: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);

  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllFeedback();
  }, []);

  const loadAllFeedback = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('interview_history')
        .select('id, date, job_role, feedback, duration_minutes')
        .eq('user_id', userId)
        .not('feedback', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading feedback:', error);
      } else if (data) {
        setFeedbackList(data);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllFeedback();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <BackButton />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryBlue}
          />
        }
      >
        <Text style={styles.logoText}>MY INTERVIEW</Text>
        <Text style={styles.title}>All Feedback</Text>
        <Text style={styles.subtitle}>
          Review your feedback history from past interviews
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={styles.loadingText}>Loading feedback...</Text>
          </View>
        ) : feedbackList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>Nothing to see yet</Text>
            <Text style={styles.emptyText}>
              Complete your first interview to start receiving personalized feedback and track your progress!
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('InterviewType')}
            >
              <Text style={styles.startButtonText}>Start Interview Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          feedbackList.map((item) => {
            // Parse the feedback text to extract score, strengths, and improvements
            const scoreMatch = item.feedback.match(/Score:\s*(\d+)\/100/);
            const strengthsMatch = item.feedback.match(/Strengths:\s*(.+?)\s*Areas to improve:/s);
            const improvementsMatch = item.feedback.match(/Areas to improve:\s*(.+)$/s);
            
            const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
            const strengths = strengthsMatch ? strengthsMatch[1].trim() : '';
            const improvements = improvementsMatch ? improvementsMatch[1].trim() : '';
            
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.cardRole}>{item.job_role}</Text>
                    <View style={styles.cardDuration}>
                      <Text style={styles.durationText}>
                        ⏱️ {item.duration_minutes} {item.duration_minutes === 1 ? 'minute' : 'minutes'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.headerRight}>
                    <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                    {score !== null && (
                      <View style={styles.scoreBox}>
                        <Text style={styles.scoreText}>{score}/100</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {strengths && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✅ What you did well</Text>
                    <Text style={styles.sectionText}>{strengths}</Text>
                  </View>
                )}
                
                {improvements && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💡 How to improve</Text>
                    <Text style={styles.sectionText}>{improvements}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#F3F4F6',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 70,
      paddingBottom: 40,
    },
    logoText: {
      ...typography.heading,
      fontWeight: '800',
      color: colors.primaryBlue,
      alignSelf: 'center',
      marginBottom: 28,
    },
    title: {
      ...typography.headingSmall,
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 8,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: colors.textMuted,
      marginBottom: 24,
      lineHeight: 22,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      ...typography.bodyMedium,
      color: colors.textMuted,
      marginTop: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 30,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      ...typography.headingMedium,
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 12,
      textAlign: 'center',
    },
    emptyText: {
      ...typography.bodyMedium,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    startButton: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    startButtonText: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: '#fff',
      textAlign: 'center',
    },
    card: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDark ? '#444' : colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#444' : colors.border,
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      alignItems: 'flex-end',
    },
    cardRole: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: colors.primaryBlue,
      marginBottom: 6,
      fontSize: 16,
    },
    cardDate: {
      ...typography.caption,
      color: isDark ? '#888' : colors.textMuted,
      marginBottom: 8,
    },
    cardDuration: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    durationText: {
      ...typography.caption,
      color: isDark ? '#888' : colors.textMuted,
      fontSize: 12,
    },
    scoreBox: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginTop: 4,
    },
    scoreText: {
      ...typography.bodySmall,
      fontWeight: '700',
      color: '#fff',
      fontSize: 14,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      ...typography.bodySmall,
      fontWeight: '700',
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 8,
      fontSize: 14,
    },
    sectionText: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      lineHeight: 20,
    },
  });

export default AllFeedback;
