import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
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
          feedbackList.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardRole}>{item.job_role}</Text>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
              </View>
              <View style={styles.cardDuration}>
                <Text style={styles.durationText}>
                  ⏱️ {item.duration_minutes} {item.duration_minutes === 1 ? 'minute' : 'minutes'}
                </Text>
              </View>
              <Text style={styles.cardFeedback}>{item.feedback}</Text>
            </View>
          ))
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
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    cardRole: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: colors.primaryBlue,
      flex: 1,
    },
    cardDate: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    cardDuration: {
      marginBottom: 12,
    },
    durationText: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    cardFeedback: {
      ...typography.bodyMedium,
      color: isDark ? '#e0e0e0' : colors.textDark,
      lineHeight: 22,
    },
  });

export default AllFeedback;
