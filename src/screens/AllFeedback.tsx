import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/colors';
import BackButton from '../components/BackButton';
import PaywallModal from '../components/PaywallModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import * as Haptics from 'expo-haptics';

interface FeedbackItem {
  id: string;
  date: string;
  job_role: string;
  feedback: string;
  duration_minutes: number;
  transcript?: string;
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
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<{from: string; text: string}[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [showPaywall, setShowPaywall] = useState(false);
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageScore: 0,
    totalMinutes: 0,
    bestScore: 0,
  });

  useEffect(() => {
    loadAllFeedback();
    loadSubscriptionTier();
  }, []);

  const loadSubscriptionTier = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      console.log('📋 Subscription check - userId:', userId);
      if (!userId) {
        console.log('⚠️ No userId found');
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('subscription_tier')
        .eq('user_id', userId)
        .single();

      console.log('✅ Subscription data:', data);
      console.log('❌ Subscription error:', error);

      if (data?.subscription_tier) {
        console.log('🎯 Setting subscription tier to:', data.subscription_tier);
        setSubscriptionTier(data.subscription_tier);
      } else {
        console.log('⚠️ No subscription_tier in response, staying as:', subscriptionTier);
      }
    } catch (error) {
      console.error('Error loading subscription tier:', error);
    }
  };

  const loadAllFeedback = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log('⚠️ No userId found');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('interview_history')
        .select('id, date, job_role, feedback, duration_minutes, transcript')
        .eq('user_id', userId)
        .not('feedback', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading feedback:', error);
        Alert.alert('Database Error', `Failed to load feedback: ${error.message}`);
      } else if (data) {
        console.log('📊 Loaded feedback, count:', data.length);
        data.forEach((item, i) => {
          console.log(`Interview ${i}:`, {
            id: item.id,
            job_role: item.job_role,
            has_feedback: !!item.feedback,
            has_transcript: !!item.transcript,
            transcript_type: typeof item.transcript,
            transcript_preview: item.transcript ? item.transcript.substring(0, 50) : 'NULL'
          });
        });
        setFeedbackList(data);
        
        // Calculate stats
        const scores = data
          .map(item => {
            const scoreMatch = item.feedback.match(/Score:\s*(\d+)\/100/);
            return scoreMatch ? parseInt(scoreMatch[1]) : 0;
          })
          .filter(score => score > 0);
        
        const avgScore = scores.length > 0 
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;
        
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const totalMinutes = data.reduce((sum, item) => sum + item.duration_minutes, 0);
        
        setStats({
          totalFeedback: data.length,
          averageScore: avgScore,
          totalMinutes,
          bestScore,
        });
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

  const openTranscript = (transcriptString: string | undefined) => {
    console.log('🔍 Opening transcript...');
    console.log('📦 Received type:', typeof transcriptString);
    console.log('📦 Received value:', transcriptString);
    
    if (!transcriptString) {
      console.log('⚠️ No transcript provided - null/undefined');
      Alert.alert('No Transcript', 'This interview does not have a transcript saved.');
      return;
    }

    if (typeof transcriptString !== 'string') {
      console.log('⚠️ Transcript is not a string!', typeof transcriptString);
      Alert.alert('Transcript Error', 'Transcript data is in wrong format.');
      return;
    }

    if (transcriptString.trim() === '') {
      console.log('⚠️ Transcript is empty string');
      Alert.alert('No Transcript', 'Transcript is empty.');
      return;
    }

    try {
      console.log('🔄 Attempting to parse...');
      let parsed = transcriptString;
      
      // Handle double-stringified JSON
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
        console.log('✅ First parse successful, type:', typeof parsed);
        
        if (typeof parsed === 'string') {
          console.log('🔄 Double-stringified detected, parsing again...');
          parsed = JSON.parse(parsed);
        }
      }
      
      if (!Array.isArray(parsed)) {
        console.error('❌ Not an array after parsing:', parsed);
        Alert.alert('Transcript Error', 'Transcript format invalid (not an array)');
        return;
      }
      
      console.log('✅ Successfully parsed! Messages:', parsed.length);
      setCurrentTranscript(parsed);
      setShowTranscript(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.error('❌ Parse error:', e);
      console.error('Attempted to parse:', transcriptString);
      Alert.alert('Transcript Error', `Parse failed: ${(e as Error).message}`);
    }
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

        {!loading && feedbackList.length > 0 && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={20} color={colors.primaryBlue} />
              <Text style={styles.statNumber}>{stats.totalFeedback}</Text>
              <Text style={styles.statLabel}>Total Feedback</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.statNumber}>{stats.averageScore}</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="time" size={20} color="#10B981" />
              <Text style={styles.statNumber}>{stats.totalMinutes}</Text>
              <Text style={styles.statLabel}>Total Minutes</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="trophy" size={20} color="#8B5CF6" />
              <Text style={styles.statNumber}>{stats.bestScore}</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
          </View>
        )}

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
          <>
            {feedbackList.some(item => !item.transcript) && (
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={18} color={colors.primaryBlue} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoBannerTitle}>📝 Transcripts Available</Text>
                  <Text style={styles.infoBannerText}>
                    Recent interviews include full conversation transcripts. Click "View transcript" to see the chat!
                  </Text>
                </View>
              </View>
            )}
            {feedbackList.map((item) => {
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
                
                {item.transcript && (
                  <TouchableOpacity 
                    disabled={subscriptionTier === 'free'}
                    style={[styles.transcriptButton, subscriptionTier === 'free' && styles.transcriptButtonDisabled]}
                    onPress={() => {
                      if (subscriptionTier === 'free') {
                        setShowPaywall(true);
                        return;
                      }
                      console.log('🎬 Transcript button pressed - premium user');
                      console.log('📦 Transcript value:', item.transcript?.substring(0, 50));
                      openTranscript(item.transcript);
                    }}
                  >
                    <Ionicons 
                      name={subscriptionTier === 'free' ? "lock-closed" : "document-text-outline"} 
                      size={16} 
                      color={subscriptionTier === 'free' ? colors.textMuted : colors.primaryBlue} 
                    />
                    <Text style={[styles.transcriptButtonText, subscriptionTier === 'free' && styles.transcriptButtonTextDisabled]}>
                      {subscriptionTier === 'free' ? 'View transcript (Premium)' : 'View transcript'}
                    </Text>
                    <Ionicons 
                      name="chevron-forward" 
                      size={16} 
                      color={subscriptionTier === 'free' ? colors.textMuted : colors.primaryBlue} 
                    />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          </>
        )}
      </ScrollView>
      
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => loadSubscriptionTier()}
      />
      
      {/* Transcript Modal */}
      <Modal
        visible={showTranscript}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowTranscript(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="chatbubbles" size={24} color={colors.primaryBlue} />
                <Text style={styles.modalTitle}>Interview Transcript</Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowTranscript(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={isDark ? '#fff' : '#666'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.transcriptScroll} 
              contentContainerStyle={styles.transcriptContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={{fontSize: 12, color: colors.textMuted, marginBottom: 12}}>
                📋 Transcript has {currentTranscript.length} messages
              </Text>
              {currentTranscript.length === 0 ? (
                <Text style={styles.noTranscriptText}>No transcript available</Text>
              ) : (
                currentTranscript.map((msg, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.simpleMessageRow,
                      msg.from === 'user' && styles.userMessageRow
                    ]}
                  >
                    <View style={[
                      styles.simpleBubble,
                      msg.from === 'user' ? styles.userBubble : styles.aiBubble
                    ]}>
                      <Text style={[
                        styles.bubbleText,
                        msg.from === 'user' ? styles.userBubbleText : styles.aiBubbleText
                      ]}>
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 12,
      padding: 16,
      width: '48%',
      marginBottom: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: isDark ? '#444' : colors.border,
    },
    statNumber: {
      ...typography.headingMedium,
      color: isDark ? '#fff' : colors.textDark,
      marginTop: 8,
      marginBottom: 4,
      fontSize: 24,
      fontWeight: '700',
    },
    statLabel: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      fontSize: 12,
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
    infoBanner: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
      borderLeftWidth: 4,
      borderLeftColor: colors.primaryBlue,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
      marginBottom: 20,
      gap: 12,
    },
    infoBannerTitle: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: colors.primaryBlue,
      marginBottom: 4,
    },
    infoBannerText: {
      ...typography.caption,
      color: isDark ? '#aaa' : colors.textMuted,
      lineHeight: 18,
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
    transcriptButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 122, 255, 0.3)' : 'rgba(0, 122, 255, 0.2)',
    },
    transcriptButtonText: {
      ...typography.bodySmall,
      color: colors.primaryBlue,
      marginHorizontal: 6,
      fontWeight: '600',
    },
    transcriptButtonDisabled: {
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: isDark ? 'rgba(120, 120, 120, 0.3)' : 'rgba(200, 200, 200, 0.3)',
    },
    transcriptButtonTextDisabled: {
      color: colors.textMuted,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 400,
      height: '85%',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
      flexDirection: 'column',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : colors.border,
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    modalTitle: {
      ...typography.headingSmall,
      fontSize: 18,
      color: isDark ? '#fff' : colors.textDark,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    transcriptScroll: {
      flex: 1,
    },
    transcriptContent: {
      paddingHorizontal: 12,
      paddingVertical: 16,
      flexGrow: 1,
    },
    noTranscriptText: {
      ...typography.bodyMedium,
      color: isDark ? '#888' : colors.textMuted,
      textAlign: 'center',
      paddingVertical: 40,
    },
    simpleMessageRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginVertical: 8,
      paddingHorizontal: 8,
    },
    userMessageRow: {
      justifyContent: 'flex-end',
    },
    simpleBubble: {
      maxWidth: '85%',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 18,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    messageContainer: {
      marginVertical: 6,
      width: '100%',
    },
    senderLabel: {
      ...typography.caption,
      fontSize: 12,
      color: isDark ? '#888' : colors.textMuted,
      marginBottom: 4,
      marginLeft: 12,
    },
    bubble: {
      maxWidth: '80%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#2a2a2a' : '#F3F4F6',
      borderBottomLeftRadius: 4,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primaryBlue,
      borderBottomRightRadius: 4,
    },
    bubbleText: {
      ...typography.bodyMedium,
      lineHeight: 22,
    },
    aiBubbleText: {
      color: isDark ? '#fff' : colors.textDark,
    },
    userBubbleText: {
      color: '#FFFFFF',
    },
    paywallOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    paywallContainer: {
      backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      maxHeight: '90%',
    },
    paywallCloseButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    paywallContent: {
      paddingHorizontal: 24,
      paddingVertical: 40,
      paddingTop: 60,
      paddingBottom: 40,
    },
    paywallTitle: {
        ...typography.heading,
      fontSize: 32,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    paywallSubtitle: {
      ...typography.bodyMedium,
      color: isDark ? '#999' : colors.textMuted,
      textAlign: 'center',
      marginBottom: 32,
      fontSize: 16,
    },
    benefitsList: {
      marginBottom: 32,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    benefitTitle: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 4,
    },
    benefitDesc: {
      ...typography.bodySmall,
      color: isDark ? '#999' : colors.textMuted,
      lineHeight: 18,
    },
    paywallUpgradeButton: {
      backgroundColor: colors.primaryBlue,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: colors.primaryBlue,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    paywallUpgradeButtonText: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: '#FFFFFF',
      fontSize: 16,
    },
  });

export default AllFeedback;
