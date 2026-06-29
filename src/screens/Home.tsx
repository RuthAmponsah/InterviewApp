import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from '../config/supabase';
import { SkeletonCard } from '../components/Skeleton';
import OnboardingWalkthrough from '../components/OnboardingWalkthrough';
import { Modal } from 'react-native';
import PaywallModal from '../components/PaywallModal';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

const dailyTips = [
  "Use STAR: Situation, Task, Action, Result for strong answers.",
  "Maintain eye contact — confidence shows through body language.",
  "Pause before answering — clarity is better than speed.",
  "Explain WHY you made decisions, not just WHAT you did.",
  "Quantify impact: numbers make your achievements real.",
  "Turn weaknesses into learning moments.",
  "Practice out loud — the brain remembers spoken words better.",
  "Ask thoughtful questions at the end of an interview.",
  "'I' for personal wins, 'We' for team wins — balance both.",
  "Smile — it naturally boosts your vocal warmth and tone.",
];

const PAYWALL_PROMPT_KEY = 'paywall_prompt_last_shown_v1';
const PAYWALL_PROMPT_CHANCE = 0.2;

const Home: React.FC = () => {
  const navigation = useNavigation<RootNav>();
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  const [greeting, setGreeting] = useState('');
  const [name, setName] = useState("User");
  const [tipOfTheDay, setTipOfTheDay] = useState('');
  const [streak, setStreak] = useState(0);
  const [latestFeedback, setLatestFeedback] = useState<string | null>(null);
  const [hasInterviews, setHasInterviews] = useState(false);
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streakBroken, setStreakBroken] = useState(false);
  const [canRecoverStreak, setCanRecoverStreak] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ---------------------------
  // 1️⃣ GREETING BASED ON TIME
  // ---------------------------
  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 16) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  // ---------------------------
  // 2️⃣ DAILY TIP SELECTION
  // ---------------------------
  useEffect(() => {
    const dayIndex = new Date().getDate() % dailyTips.length;
    setTipOfTheDay(dailyTips[dayIndex]);
  }, []);
  
  // ---------------------------
  // // 4️⃣ LOAD SAVED USER NAME
  // // ---------------------------
  useEffect(() => {
    const loadName = async () => {
      const storedName = await AsyncStorage.getItem("userName");
      if (storedName) {
        setName(storedName);
      }
    };
    
    loadName();
  }, []);


  // ---------------------------
  // 3️⃣ DAILY STREAK TRACKER WITH RECOVERY
  // ---------------------------
  useEffect(() => {
    const loadStreak = async () => {
      const storedDate = await AsyncStorage.getItem("lastUsedDate");
      const storedStreak = await AsyncStorage.getItem("streak");
      const freezeUsed = await AsyncStorage.getItem("streakFreezeUsed");

      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (storedDate !== today) {
        if (storedDate === yesterday) {
          // Continue streak - used yesterday
          const newStreak = storedStreak ? Number(storedStreak) + 1 : 1;
          await AsyncStorage.setItem("streak", String(newStreak));
          await AsyncStorage.setItem("lastUsedDate", today);
          setStreak(newStreak);
        } else if (storedStreak && Number(storedStreak) > 0) {
          // Missed a day - offer freeze if not used
          if (!freezeUsed || freezeUsed === 'false') {
            setStreakBroken(true);
            setCanRecoverStreak(true);
            setStreak(Number(storedStreak));
          } else {
            // Already used freeze, reset streak
            await AsyncStorage.setItem("streak", "0");
            await AsyncStorage.setItem("streakFreezeUsed", "false");
            setStreak(0);
          }
        } else {
          // Start new streak
          await AsyncStorage.setItem("streak", "1");
          await AsyncStorage.setItem("lastUsedDate", today);
          setStreak(1);
        }
      } else {
        // Same day → keep existing streak
        if (storedStreak) setStreak(Number(storedStreak));
      }
    };

    loadStreak();
  }, []);

  // Pop sound for buttons
  const playPopSound = async () => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const player = createAudioPlayer(require('../../assets/sounds/pop.mp3'));
      player.volume = 0.1;
      player.play();
      console.log('🔊 Home pop sound played');
    } catch (error) {
      console.log('Home sound error:', error);
    }
  };

  const useStreakFreeze = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem("streakFreezeUsed", "true");
    const today = new Date().toDateString();
    await AsyncStorage.setItem("lastUsedDate", today);
    setStreakBroken(false);
    setCanRecoverStreak(false);
  };

  const declineStreakFreeze = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem("streak", "0");
    await AsyncStorage.setItem("streakFreezeUsed", "false");
    setStreak(0);
    setStreakBroken(false);
    setCanRecoverStreak(false);
  };

  // ---------------------------
  // 5️⃣ LOAD LATEST FEEDBACK
  // ---------------------------
  const loadLatestFeedback = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }

        const { data, error } = await supabase
          .from('interview_history')
          .select('feedback, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error loading feedback:', error);
          return;
        }

        if (data && data.length > 0) {
          setHasInterviews(true);
          setLatestFeedback(data[0].feedback || 'Complete your interview to see feedback here!');
          
          // Calculate last active
          const lastDate = new Date(data[0].created_at);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - lastDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) {
            setLastActive('Today');
          } else if (diffDays === 1) {
            setLastActive('Yesterday');
          } else if (diffDays < 7) {
            setLastActive(`${diffDays} days ago`);
          } else {
            const weeks = Math.floor(diffDays / 7);
            setLastActive(`${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`);
          }
        } else {
          setHasInterviews(false);
        }
      } catch (err) {
        console.error('Error loading feedback:', err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadLatestFeedback();
  }, []);

  useEffect(() => {
    const loadSubscriptionTier = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;

        const { data } = await supabase
          .from('user_preferences')
          .select('subscription_tier')
          .eq('user_id', userId)
          .single();

        if (data?.subscription_tier) {
          setSubscriptionTier(data.subscription_tier);
        }
      } catch (error) {
        console.error('Error loading subscription tier:', error);
      }
    };

    loadSubscriptionTier();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      maybeShowPaywallPrompt();
    });
    return unsubscribe;
  }, [navigation, subscriptionTier]);

  const maybeShowPaywallPrompt = async () => {
    if (subscriptionTier !== 'free') return;

    try {
      const today = new Date().toISOString().slice(0, 10);
      const lastShown = await AsyncStorage.getItem(PAYWALL_PROMPT_KEY);
      if (lastShown === today) return;

      if (Math.random() <= PAYWALL_PROMPT_CHANCE) {
        await AsyncStorage.setItem(PAYWALL_PROMPT_KEY, today);
        setShowPaywall(true);
      }
    } catch (error) {
      console.error('Error showing paywall prompt:', error);
    }
  };

  // Trigger entrance animation when loading completes
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadLatestFeedback();
    setRefreshing(false);
  };

  return (
    <>
      <OnboardingWalkthrough />
      <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primaryBlue}
          colors={[colors.primaryBlue]}
        />
      }
    >
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.greeting}>
        {greeting}, {name}
      </Text>

      <View style={styles.greetingRow}>
      <Text style={styles.subGreeting}>
        Ready to ace your next interview?
      </Text>
        {lastActive && (
          <Text style={styles.lastActive}>Last active: {lastActive}</Text>
        )}
      </View>

      {/* Primary CTA card */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            playPopSound();
            navigation.navigate('InterviewType');
          }}
        >
          <LinearGradient
            colors={['#1E63FF', '#0D47A1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.primaryCard]}
          >
            <Text style={styles.cardTitlePrimary}>Start Interview</Text>
            <Text style={styles.cardBodyPrimary}>
              Practice with AI-powered interviews tailored to your role
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Row of cards */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.smallCard]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('QuestionBank')}
        >
          <Text style={styles.cardTag}>Practice 📝</Text>
          <Text style={styles.cardTitle}>Question Bank</Text>
          <Text style={styles.cardBody}>Browse and practice common interview questions</Text>
          <Text style={styles.tapHint}>Tap to view</Text>
        </TouchableOpacity>

        <View style={[styles.card, styles.smallCard]}>
          <Text style={styles.cardTag}>Streak</Text>
          <Text style={styles.cardTitle}>{streak} day streak</Text>
          <Text style={styles.cardBody}>Keep practicing to build your streak!</Text>
        </View>
      </View>

      {/* Daily Tip Card */}
      {loading ? (
        <SkeletonCard />
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTag}>Daily Tip</Text>
          <Text style={styles.cardTitle}>Tip of the Day</Text>
          <Text style={styles.cardBody}>{tipOfTheDay}</Text>
        </View>
      )}

      {/* Latest feedback section */}
      {loading ? (
        <SkeletonCard />
      ) : (
        <TouchableOpacity 
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('AllFeedback');
          }}
        >
          <Text style={styles.cardTitle}>Latest Feedback</Text>
          {hasInterviews && latestFeedback ? (
            (() => {
              // Parse the feedback text
              const scoreMatch = latestFeedback.match(/Score:\s*(\d+)\/100/);
              const strengthsMatch = latestFeedback.match(/Strengths:\s*(.+?)\s*Areas to improve:/s);
              const improvementsMatch = latestFeedback.match(/Areas to improve:\s*(.+)$/s);
              
              const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
              const strengths = strengthsMatch ? strengthsMatch[1].trim() : '';
              const improvements = improvementsMatch ? improvementsMatch[1].trim() : '';
              
              return (
                <>
                  {score !== null && (
                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreText}>{score}/100</Text>
                    </View>
                  )}
                  
                  {strengths && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>What you did well</Text>
                      <Text style={styles.feedbackSectionText} numberOfLines={3}>
                        {strengths}
                      </Text>
                    </View>
                  )}
                  
                  {improvements && (
                    <View style={styles.feedbackSection}>
                      <Text style={styles.feedbackSectionTitle}>How to improve</Text>
                      <Text style={styles.feedbackSectionText} numberOfLines={3}>
                        {improvements}
                      </Text>
                    </View>
                  )}
                  
                  <Text style={styles.tapToViewMore}>Tap to view all feedback</Text>
                </>
              );
            })()
          ) : (
            <Text style={styles.cardBody}>
              No interviews completed yet. Start your first practice session!
            </Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('ViewCV');
        }}
      >
        <Text style={styles.cardTitle}>Enhance CV</Text>
        <Text style={styles.cardBody}>
          Paste your CV and get AI suggestions to improve it.
        </Text>
        <Text style={styles.tapToViewMore}>Tap to enhance CV</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('SuccessStories');
        }}
      >
        <Text style={styles.cardTitle}>Success Stories</Text>
        <Text style={styles.cardBody}>
          Read how other learners went from nervous to hired after practicing with Aya.
        </Text>
        <Text style={styles.tapToViewMore}>Tap to view success stories →</Text>
      </TouchableOpacity>
    </ScrollView>

    {/* Streak Freeze Modal */}
    <Modal transparent visible={streakBroken && canRecoverStreak} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalIcon}>🔥❄️</Text>
          <Text style={styles.modalTitle}>Streak Freeze Available!</Text>
          <Text style={styles.modalText}>
            You missed a day, but you can use a Streak Freeze to save your {streak}-day streak! 
            You get one free freeze - use it wisely.
          </Text>
          <TouchableOpacity style={styles.modalButton} onPress={useStreakFreeze}>
            <Text style={styles.modalButtonText}>Use Streak Freeze</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButtonSecondary} onPress={declineStreakFreeze}>
            <Text style={styles.modalButtonSecondaryText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    <PaywallModal
      visible={showPaywall}
      onClose={() => setShowPaywall(false)}
      onSuccess={() => setSubscriptionTier('premium')}
    />
    </>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: isDark ? '#1a1a1a' : '#F3F4F6',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 28,
  },
  logoText: {
    ...typography.heading,
    fontWeight: "800",
    color: colors.primaryBlue,
    alignSelf: 'center',
    marginBottom: 28,
  },
  greeting: {
    ...typography.headingMedium,
    color: isDark ? '#fff' : colors.textDark,
  },
  greetingRow: {
    marginBottom: 16,
  },
  subGreeting: {
    ...typography.bodyMedium,
    color: isDark ? '#aaa' : colors.textMuted,
    marginTop: 4,
    marginBottom: 6,
  },
  lastActive: {
    ...typography.bodySmall,
    color: colors.primaryBlue,
    fontWeight: '600',
  },
  card: {
    backgroundColor: isDark ? '#222' : '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
  },
  tapHint: {
    ...typography.caption,
    color: colors.primaryBlue,
    fontWeight: '600',
    marginTop: 8,
  },
  tapHintPrimary: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 10,
  },
  cardTitlePrimary: {
    ...typography.headingSmall,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardBodyPrimary: {
    ...typography.bodyMedium,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  smallCard: {
    flex: 1,
  },
  cardTag: {
    ...typography.caption,
    color: colors.primaryBlue,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: isDark ? '#fff' : colors.textDark,
    marginBottom: 4,
  },
  cardBody: {
    ...typography.bodySmall,
    color: isDark ? '#aaa' : colors.textMuted,
  },
  scoreBox: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 12,
  },
  scoreText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: '#fff',
    fontSize: 14,
  },
  feedbackSection: {
    marginBottom: 12,
  },
  feedbackSectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: isDark ? '#fff' : colors.textDark,
    marginBottom: 6,
    fontSize: 13,
  },
  feedbackSectionText: {
    ...typography.bodySmall,
    color: isDark ? '#b5b5b5' : colors.textMuted,
    lineHeight: 18,
    fontSize: 13,
  },
  tapToViewMore: {
    ...typography.caption,
    color: colors.primaryBlue,
    fontWeight: '600',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#E5E7EB',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    ...typography.headingMedium,
    fontWeight: '700',
    color: isDark ? '#fff' : '#111',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    ...typography.bodyMedium,
    color: isDark ? '#b5b5b5' : '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    width: '100%',
    backgroundColor: colors.primaryBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    ...typography.label,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalButtonSecondary: {
    paddingVertical: 12,
  },
  modalButtonSecondaryText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    fontWeight: '600',
  },
});export default Home;
