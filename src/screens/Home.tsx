import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import PaywallModal from '../components/PaywallModal';
import { checkSubscriptionStatus, isPremiumTier } from '../services/purchaseService';
import { flushInterviewQueue } from '../services/offlineQueue';

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
  "Research the company mission and connect one answer to it.",
  "Prepare three strong examples you can adapt to different questions.",
  "Keep answers focused: aim for 60 to 90 seconds unless asked for more.",
  "Use the job description as your revision checklist.",
  "Before the interview, write down the top three skills they need.",
  "When stuck, repeat the question briefly to buy thinking time.",
  "End answers by linking back to the role you want.",
  "Prepare one story about teamwork, one about challenge, and one about impact.",
  "For competency questions, describe your specific action, not just the team result.",
  "Avoid memorising scripts — practise flexible bullet points instead.",
  "If you do not know an answer, explain how you would find the solution.",
  "Use numbers where possible: time saved, customers helped, revenue, quality, or speed.",
  "Have a concise answer ready for 'Tell me about yourself'.",
  "Show enthusiasm with specifics: mention the team, product, mission, or role duties.",
  "Practise your first answer twice; early confidence settles nerves.",
  "Keep a glass of water nearby for voice interviews.",
  "For virtual interviews, test your camera, mic, and lighting beforehand.",
  "Use positive framing: say what you learned, improved, or would do next.",
  "Prepare a short closing statement about why you are a strong fit.",
  "Ask about success in the role, team priorities, or first 90 days.",
  "After answering, stop cleanly instead of filling silence.",
  "If interrupted, stay calm and ask if they would like more detail.",
  "Use active verbs: led, built, improved, solved, supported, delivered.",
  "Match your examples to the seniority of the role.",
  "Review your CV and be ready to explain every role, gap, and achievement.",
  "Practise saying salary expectations calmly before the interview.",
  "Listen for clues in the interviewer's follow-up questions.",
  "If nerves rise, slow your breathing and lower your speaking pace.",
  "Use 'we' for context, then 'I' for your contribution.",
  "Send a brief thank-you message after the interview if appropriate.",
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
  const [showJobRolePrompt, setShowJobRolePrompt] = useState(false);
  const [syncedSessions, setSyncedSessions] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
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
      const storedRole = await AsyncStorage.getItem("jobRole");
      if (!storedRole) setShowJobRolePrompt(true);
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
      player.volume = 0.009;
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
          .not('feedback', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error loading feedback:', error);
          return;
        }

        if (data && data.length > 0) {
          setHasInterviews(true);
          setLatestFeedback(data[0].feedback);
          
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
          setLatestFeedback(null);
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
        if (!userId) {
          setSubscriptionLoaded(true);
          return;
        }

        const status = await checkSubscriptionStatus();
        setSubscriptionTier(status.tier);
      } catch (error) {
        console.error('Error loading subscription tier:', error);
      } finally {
        setSubscriptionLoaded(true);
      }
    };

    loadSubscriptionTier();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      maybeShowPaywallPrompt();
    });
    return unsubscribe;
  }, [navigation, subscriptionLoaded, subscriptionTier]);

  const maybeShowPaywallPrompt = async () => {
    if (!subscriptionLoaded) return;
    if (isPremiumTier(subscriptionTier)) return;

    try {
      const latestStatus = await checkSubscriptionStatus();
      setSubscriptionTier(latestStatus.tier);
      if (latestStatus.isActive || isPremiumTier(latestStatus.tier)) return;

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

  // Flush offline-queued interviews on focus
  useFocusEffect(
    useCallback(() => {
      loadLatestFeedback();
      flushInterviewQueue().then(count => {
        if (count > 0) setSyncedSessions(count);
      });
    }, [])
  );

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

      {/* Synced sessions banner */}
      {syncedSessions > 0 && (
        <View style={styles.syncBanner}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
          <Text style={styles.syncBannerText}>
            {syncedSessions} session{syncedSessions > 1 ? 's' : ''} synced from offline
          </Text>
          <TouchableOpacity onPress={() => setSyncedSessions(0)} style={styles.freezeDismissBtn} accessibilityLabel="Dismiss" accessibilityRole="button">
            <Ionicons name="close" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Job Role Prompt Banner */}
      {showJobRolePrompt && (
        <View style={styles.rolePromptBanner}>
          <View style={styles.freezeBannerLeft}>
            <Ionicons name="briefcase-outline" size={20} color={colors.primaryBlue} />
            <View style={styles.freezeBannerTextBlock}>
              <Text style={styles.rolePromptTitle}>Set your job role</Text>
              <Text style={styles.rolePromptSub}>Personalise Aya's coaching for you</Text>
            </View>
          </View>
          <View style={styles.freezeBannerActions}>
            <TouchableOpacity
              onPress={() => { setShowJobRolePrompt(false); navigation.navigate('JobPreferences'); }}
              style={styles.rolePromptBtn}
            >
              <Text style={styles.rolePromptBtnText}>Set up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowJobRolePrompt(false)} style={styles.freezeDismissBtn} accessibilityLabel="Dismiss" accessibilityRole="button">
              <Ionicons name="close" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Primary CTA card */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            playPopSound();
            navigation.navigate('InterviewLevel');
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

      {/* Streak Freeze Banner */}
      {streakBroken && canRecoverStreak && (
        <View style={styles.freezeBanner}>
          <View style={styles.freezeBannerLeft}>
            <Ionicons name="snow-outline" size={20} color="#3b82f6" />
            <View style={styles.freezeBannerTextBlock}>
              <Text style={styles.freezeBannerTitle}>Streak Freeze Available</Text>
              <Text style={styles.freezeBannerSub}>Save your {streak}-day streak</Text>
            </View>
          </View>
          <View style={styles.freezeBannerActions}>
            <TouchableOpacity onPress={useStreakFreeze} style={styles.freezeUseBtn}>
              <Text style={styles.freezeUseBtnText}>Use</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={declineStreakFreeze} style={styles.freezeDismissBtn} accessibilityLabel="Dismiss streak freeze" accessibilityRole="button">
              <Ionicons name="close" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
              const scoreMatch = latestFeedback.match(/Score:\s*(\d+)\s*\/\s*100/i);
              const strengthsMatch = latestFeedback.match(/Strengths?:\s*([\s\S]*?)(?:Areas?\s*(?:to\s*improve|for\s*improvement):|$)/i);
              const improvementsMatch = latestFeedback.match(/Areas?\s*(?:to\s*improve|for\s*improvement):\s*([\s\S]*)$/i);
              const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
              const strengths = strengthsMatch ? strengthsMatch[1].trim() : '';
              const improvements = improvementsMatch ? improvementsMatch[1].trim() : '';
              const fallbackPreview = latestFeedback
                .replace(/Score:\s*\d+\s*\/\s*100\.?/i, '')
                .replace(/Strengths?:/gi, '')
                .replace(/Areas?\s*(?:to\s*improve|for\s*improvement):/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
              return (
                <View style={styles.feedbackEmptyRow}>
                  <View style={[styles.scoreCircle, { borderColor: colors.primaryBlue }]}>
                    <Text style={[styles.scoreCircleText, { color: colors.primaryBlue }]}>{score ?? '—'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    {strengths ? (
                      <Text style={styles.feedbackBodyText} numberOfLines={3}>{strengths}</Text>
                    ) : (
                      <Text style={styles.feedbackBodyText} numberOfLines={3}>
                        {fallbackPreview || 'Tap to view your latest feedback'}
                      </Text>
                    )}
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
        <Text style={styles.cardBody}>Read how others went from nervous to hired after practising with Aya.</Text>
        <Text style={styles.tapHint}>Tap to view →</Text>
      </TouchableOpacity>
    </ScrollView>


    <PaywallModal
      visible={showPaywall}
      onClose={() => setShowPaywall(false)}
      onSuccess={async () => {
        const status = await checkSubscriptionStatus();
        setSubscriptionTier(status.tier);
      }}
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
  freezeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#1e3a5f' : '#eff6ff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? '#2563eb44' : '#bfdbfe',
  },
  freezeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  freezeBannerTextBlock: {
    flex: 1,
  },
  freezeBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#93c5fd' : '#1d4ed8',
  },
  freezeBannerSub: {
    fontSize: 12,
    color: isDark ? '#60a5fa' : '#3b82f6',
    marginTop: 1,
  },
  freezeBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freezeUseBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  freezeUseBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  freezeDismissBtn: {
    padding: 4,
  },
  rolePromptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#1a2f50' : '#eef2ff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDark ? '#1E3A6E' : '#c7d2fe',
  },
  rolePromptTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#93c5fd' : colors.primaryBlue,
  },
  rolePromptSub: {
    fontSize: 12,
    color: isDark ? '#60a5fa' : '#4f6eb0',
    marginTop: 1,
  },
  rolePromptBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rolePromptBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDark ? '#052e16' : '#f0fdf4',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDark ? '#16a34a44' : '#bbf7d0',
  },
  syncBannerText: {
    flex: 1,
    fontSize: 13,
    color: isDark ? '#4ade80' : '#15803d',
    fontWeight: '500',
  },
});

export default Home;
