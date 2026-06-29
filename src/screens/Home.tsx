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
import AppHeader from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
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
      <AppHeader showBell />

      <Text style={styles.greeting}>{greeting}, {name.split(' ')[0]}</Text>
      <Text style={styles.subGreeting}>Ready for your next interview?</Text>

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
            colors={['#1E3A6E', '#112244']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.primaryCard]}
          >
            <Text style={styles.practiceLabel}>PRACTICE SESSION</Text>
            <View style={styles.primaryCardBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitlePrimary}>Start AI interview</Text>
                <Text style={styles.cardBodyPrimary}>Tailored to your role</Text>
              </View>
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-forward" size={18} color="#1E3A6E" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Stat Cards Row */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.smallCard]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('QuestionBank')}
        >
          <View style={[styles.statIconCircle, { backgroundColor: colors.primaryBlue + '18' }]}>
            <Ionicons name="chatbubbles-outline" size={21} color={colors.primaryBlue} />
          </View>
          <Text style={styles.statCardTitle}>Question bank</Text>
          <View style={[styles.statPill, { backgroundColor: '#fce7f3' }]}>
            <Text style={[styles.statPillText, { color: '#be185d' }]}>250+ questions</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.card, styles.smallCard]}>
          <View style={[styles.statIconCircle, { backgroundColor: '#10b98118' }]}>
            <Ionicons name="flame-outline" size={21} color="#10b981" />
          </View>
          <Text style={styles.statCardTitle}>Your streak</Text>
          <Text style={styles.statCardSubtitle}>{streak} day{streak !== 1 ? 's' : ''} — keep{'\n'}going</Text>
        </View>
      </View>

      {/* Latest Feedback */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Latest feedback</Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('AllFeedback'); }}>
          <Text style={[styles.viewAllText, { color: colors.primaryBlue }]}>View all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <SkeletonCard />
      ) : (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('AllFeedback'); }}
        >
          {hasInterviews && latestFeedback ? (
            (() => {
              const scoreMatch = latestFeedback.match(/Score:\s*(\d+)\/100/);
              const strengthsMatch = latestFeedback.match(/Strengths:\s*(.+?)\s*Areas to improve:/s);
              const improvementsMatch = latestFeedback.match(/Areas to improve:\s*(.+)$/s);
              const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
              const strengths = strengthsMatch ? strengthsMatch[1].trim() : '';
              const improvements = improvementsMatch ? improvementsMatch[1].trim() : '';
              return (
                <View style={styles.feedbackEmptyRow}>
                  <View style={[styles.scoreCircle, { borderColor: colors.primaryBlue }]}>
                    <Text style={[styles.scoreCircleText, { color: colors.primaryBlue }]}>{score ?? '—'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    {strengths ? <Text style={styles.feedbackBodyText} numberOfLines={3}>{strengths}</Text> : null}
                    {improvements ? <Text style={[styles.feedbackBodyText, { marginTop: 4, color: isDark ? '#aaa' : colors.textMuted }]} numberOfLines={2}>{improvements}</Text> : null}
                  </View>
                </View>
              );
            })()
          ) : (
            <View style={styles.feedbackEmptyRow}>
              <View style={[styles.scoreCircle, { borderColor: isDark ? '#444' : '#d1d5db' }]}>
                <Text style={[styles.scoreCircleText, { color: isDark ? '#666' : '#9ca3af' }]}>0</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.feedbackEmptyTitle}>No sessions yet</Text>
                <Text style={styles.feedbackEmptySubtitle}>Complete a session to get feedback</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Tip of the Day */}
      {loading ? (
        <SkeletonCard />
      ) : (
        <View style={styles.card}>
          <View style={styles.tipHeaderRow}>
            <Text style={[styles.tipLabel, { color: '#f59e0b' }]}>TIP OF THE DAY</Text>
            <Ionicons name="bulb-outline" size={17} color="#f59e0b" />
          </View>
          <Text style={styles.tipText}>{tipOfTheDay}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('ViewCV'); }}
      >
        <Text style={styles.cardTitle}>Enhance CV</Text>
        <Text style={styles.cardBody}>Paste your CV and get AI suggestions to improve it.</Text>
        <Text style={styles.tapHint}>Tap to enhance →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('SuccessStories'); }}
      >
        <Text style={styles.cardTitle}>Success Stories</Text>
        <Text style={styles.cardBody}>Read how others went from nervous to hired after practicing with Aya.</Text>
        <Text style={styles.tapHint}>Tap to view →</Text>
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
    paddingTop: 8,
    paddingBottom: 28,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: isDark ? '#fff' : '#111827',
    letterSpacing: -0.2,
    marginBottom: 4,
    marginTop: 8,
  },
  subGreeting: {
    fontSize: 14,
    color: isDark ? '#9ca3af' : '#6b7280',
    marginBottom: 20,
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
    padding: 20,
    marginBottom: 12,
  },
  practiceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 10,
  },
  primaryCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitlePrimary: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardBodyPrimary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  smallCard: {
    flex: 1,
    marginBottom: 0,
  },
  statIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: isDark ? '#fff' : '#111827',
    marginBottom: 6,
  },
  statPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statCardSubtitle: {
    fontSize: 12,
    color: isDark ? '#9ca3af' : '#6b7280',
    lineHeight: 17,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: isDark ? '#fff' : '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackEmptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#fff' : '#111827',
    marginBottom: 2,
  },
  feedbackEmptySubtitle: {
    fontSize: 13,
    color: isDark ? '#9ca3af' : '#6b7280',
  },
  feedbackBodyText: {
    fontSize: 13,
    color: isDark ? '#d1d5db' : '#374151',
    lineHeight: 18,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  tipText: {
    fontSize: 14,
    color: isDark ? '#d1d5db' : '#374151',
    lineHeight: 21,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: isDark ? '#fff' : '#111827',
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 13,
    color: isDark ? '#9ca3af' : '#6b7280',
    lineHeight: 19,
  },
  tapHint: {
    fontSize: 12,
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
  modalIcon: { fontSize: 48, marginBottom: 12 },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#fff' : '#111',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
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
  modalButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  modalButtonSecondary: { paddingVertical: 12 },
  modalButtonSecondaryText: { color: colors.textMuted, fontWeight: '600', fontSize: 15 },
});

export default Home;