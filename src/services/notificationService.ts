import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// EAS project ID (from app.json extra.eas.projectId)
const EAS_PROJECT_ID = '5fe21a1b-adb5-4a48-ab5a-6d149d888986';

// Configure how notifications should be displayed
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const enabled = await arePushNotificationsEnabled();

    return {
      shouldShowAlert: enabled,
      shouldPlaySound: enabled,
      shouldSetBadge: false,
      shouldShowBanner: enabled,
      shouldShowList: enabled,
    };
  },
});

// ==========================================
// DAILY PRACTICE NOTIFICATION MESSAGES
// ==========================================

const DAILY_REMINDER_MESSAGES = [
  { title: "Aya's ready when you are", body: "One quick practice could make tomorrow's answer sharper." },
  { title: "Tiny practice, big confidence", body: "Want to run through one interview question?" },
  { title: "Future you says thanks", body: "Your interview self will appreciate 5 minutes today." },
  { title: "Keep your streak warm", body: "Aya has a question ready for you." },
  { title: "Less scary, more prepared", body: "One answer today can make the real interview feel easier." },
  { title: "Quick check-in", body: "Practise one answer before the evening disappears." },
  { title: "Confidence is built in repeats", body: "Ready for today's practice?" },
  { title: "Aya has your next question", body: "Open My Interview when you're ready." },
  { title: "Five minutes. One question.", body: "A little more prepared than yesterday." },
  { title: "Keep going", body: "The more you practise, the more natural your answers sound." },
  { title: "Evening practice?", body: "Aya can help you polish one answer today." },
  { title: "Don't wait until interview week", body: "Build the habit now." },
  { title: "You're closer than you think", body: "Let's practise one strong answer." },
  { title: "A calm interview starts here", body: "Ready for a quick session?" },
  { title: "One thoughtful answer", body: "It could be the one you remember later." },
  { title: "Your streak is calling", body: "Aya's ready to help you keep it going." },
  { title: "Practise out loud", body: "Even once can make the real thing feel easier." },
  { title: "Turn nerves into structure", body: "Try one question with Aya." },
  { title: "Small step tonight", body: "Stronger answers tomorrow." },
  { title: "Your next opportunity matters", body: "Practise with Aya?" },
];

const DAILY_REMINDER_LOOKAHEAD_DAYS = 20;
const DAILY_REMINDER_RECENT_WINDOW = 5;
const DAILY_REMINDER_IDENTIFIERS_KEY = 'dailyReminderIdentifiers';
const DAILY_REMINDER_HISTORY_KEY = 'dailyReminderMessageHistory';

const STREAK_ENDING_MESSAGES = [
  { title: "🚨 STREAK ALERT!", body: "Your {streak}-day streak is about to end! One quick interview?" },
  { title: "Don't let {streak} days go to waste! 😱", body: "Aya believes in you. Practice now!" },
  { title: "Your streak is in danger! ⚠️", body: "{streak} days of hard work... save it!" },
  { title: "SOS 🆘", body: "Your {streak}-day streak needs you!" },
  { title: "This is not a drill! 🚨", body: "Your streak dies at midnight. Save it!" },
  { title: "URGENT: Streak rescue needed! 🚑", body: "{streak} days on the line. Don't give up now!" },
];

const STREAK_MILESTONE_MESSAGES = [
  { days: 3, title: "3 days strong! 💪", body: "You're building a great habit!" },
  { days: 7, title: "🎉 ONE WEEK STREAK!", body: "You're officially unstoppable!" },
  { days: 14, title: "2 WEEKS! 🏆", body: "Interview skills = leveling up!" },
  { days: 30, title: "30 DAYS! 🔥🔥🔥", body: "You're an interview machine!" },
  { days: 50, title: "LEGENDARY! 👑", body: "50 days! Employers fear you now!" },
  { days: 100, title: "100 DAYS!!! 🎊", body: "You're basically a professional interviewee!" },
];

const WEEKLY_SUMMARY_MESSAGES = [
  { title: "Your week in review 📊", body: "You completed {count} interviews! {emoji}" },
  { title: "Weekly report is in! 📈", body: "{count} interviews done. {message}" },
];

const getRandomMessage = (messages: any[]) => {
  return messages[Math.floor(Math.random() * messages.length)];
};

const readJsonArray = async <T,>(key: string): Promise<T[]> => {
  try {
    const saved = await AsyncStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const pickReminderMessageIndexes = (count: number, recentIndexes: number[]) => {
  const picked: number[] = [];

  for (let i = 0; i < count; i++) {
    const blocked = new Set([
      ...recentIndexes.slice(-DAILY_REMINDER_RECENT_WINDOW),
      ...picked.slice(-DAILY_REMINDER_RECENT_WINDOW),
    ]);
    const available = DAILY_REMINDER_MESSAGES
      .map((_, index) => index)
      .filter((index) => !blocked.has(index));
    const pool = available.length > 0 ? available : DAILY_REMINDER_MESSAGES.map((_, index) => index);
    picked.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return picked;
};

const getNextReminderDates = (hour: number, minute: number, count: number) => {
  const now = new Date();
  const dates: Date[] = [];
  const first = new Date();
  first.setHours(hour, minute, 0, 0);

  if (first <= now) {
    first.setDate(first.getDate() + 1);
  }

  for (let i = 0; i < count; i++) {
    const date = new Date(first);
    date.setDate(first.getDate() + i);
    dates.push(date);
  }

  return dates;
};

const cancelDailyReminders = async () => {
  const identifiers = await readJsonArray<string>(DAILY_REMINDER_IDENTIFIERS_KEY);
  const legacyIdentifier = await AsyncStorage.getItem('dailyReminderIdentifier');

  await Promise.all(
    [...identifiers, legacyIdentifier].filter(Boolean).map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier as string).catch(() => undefined)
    )
  );

  await AsyncStorage.removeItem(DAILY_REMINDER_IDENTIFIERS_KEY);
  await AsyncStorage.removeItem('dailyReminderIdentifier');
};

export const NOTIFICATION_PREF_SET_KEY = 'notif_push_preference_set';

export const arePushNotificationsEnabled = async (): Promise<boolean> => {
  return (await AsyncStorage.getItem('notif_push')) === 'true';
};

const setDefaultNotificationPreferences = async () => {
  await AsyncStorage.setItem('notif_push', 'true');

  const practice = await AsyncStorage.getItem('notif_practice');
  if (practice === null) {
    await AsyncStorage.setItem('notif_practice', 'true');
  }

  const feedback = await AsyncStorage.getItem('notif_feedback');
  if (feedback === null) {
    await AsyncStorage.setItem('notif_feedback', 'true');
  }
};

const getWeeklyEmoji = (count: number) => {
  if (count === 0) return "😴";
  if (count <= 2) return "👍";
  if (count <= 5) return "🔥";
  if (count <= 10) return "💪";
  return "🏆";
};

const getWeeklyMessage = (count: number) => {
  if (count === 0) return "Let's change that next week!";
  if (count <= 2) return "Good start! Try for more next week!";
  if (count <= 5) return "Great job! You're building momentum!";
  if (count <= 10) return "Incredible dedication!";
  return "You're a legend!";
};

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Schedule rolling daily practice reminders with varied messages
export const scheduleDailyReminder = async (hour: number = 18, minute: number = 0) => {
  try {
    if (!(await arePushNotificationsEnabled())) return null;

    await cancelDailyReminders();

    const recentIndexes = await readJsonArray<number>(DAILY_REMINDER_HISTORY_KEY);
    const messageIndexes = pickReminderMessageIndexes(DAILY_REMINDER_LOOKAHEAD_DAYS, recentIndexes);
    const dates = getNextReminderDates(hour, minute, DAILY_REMINDER_LOOKAHEAD_DAYS);
    const identifiers: string[] = [];

    for (let i = 0; i < dates.length; i++) {
      const message = DAILY_REMINDER_MESSAGES[messageIndexes[i]];
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          sound: true,
          data: { type: 'daily_reminder', messageIndex: messageIndexes[i] },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dates[i],
        },
      });
      identifiers.push(identifier);
    }

    await AsyncStorage.setItem(DAILY_REMINDER_IDENTIFIERS_KEY, JSON.stringify(identifiers));
    await AsyncStorage.setItem('dailyReminderIdentifier', identifiers[0] || '');
    await AsyncStorage.setItem('dailyReminderTime', JSON.stringify({ hour, minute }));
    await AsyncStorage.setItem(
      DAILY_REMINDER_HISTORY_KEY,
      JSON.stringify([...recentIndexes, ...messageIndexes].slice(-DAILY_REMINDER_RECENT_WINDOW))
    );
    console.log(`Daily reminders scheduled for ${dates.length} days at`, `${hour}:${minute}`);
    
    return identifiers[0] || null;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return null;
  }
};

// Schedule streak ending warning (sent at 9 PM if no practice that day)
export const scheduleStreakWarning = async () => {
  try {
    if (!(await arePushNotificationsEnabled())) return;

    const streak = await AsyncStorage.getItem('streak');
    const streakNum = parseInt(streak || '0');
    
    if (streakNum <= 0) return; // No streak to lose

    const lastUsedDate = await AsyncStorage.getItem('lastUsedDate');
    const today = new Date().toDateString();
    
    if (lastUsedDate === today) return; // Already practised today

    // Get a random streak warning message
    const message = getRandomMessage(STREAK_ENDING_MESSAGES);
    const title = message.title.replace('{streak}', String(streakNum));
    const body = message.body.replace('{streak}', String(streakNum));

    // Schedule for 9 PM today
    const now = new Date();
    const ninepm = new Date();
    ninepm.setHours(21, 0, 0, 0);
    
    if (now >= ninepm) return; // Already past 9 PM

    const secondsUntil9pm = Math.floor((ninepm.getTime() - now.getTime()) / 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { type: 'streak_warning' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil9pm,
      },
    });

    console.log('Streak warning scheduled for 9 PM');
  } catch (error) {
    console.error('Error scheduling streak warning:', error);
  }
};

// Schedule weekly summary (every Sunday at 6 PM)
export const scheduleWeeklySummary = async () => {
  try {
    if (!(await arePushNotificationsEnabled())) return null;

    // Cancel existing weekly summary
    const existingId = await AsyncStorage.getItem('weeklySummaryIdentifier');
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📊 Your Weekly Interview Summary",
        body: "Tap to see how you did this week!",
        sound: true,
        data: { type: 'weekly_summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 18,
        minute: 0,
      },
    });

    await AsyncStorage.setItem('weeklySummaryIdentifier', identifier);
    console.log('Weekly summary scheduled for Sundays at 6 PM');
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling weekly summary:', error);
    return null;
  }
};

// Send streak milestone notification
export const checkAndSendStreakMilestone = async (streak: number) => {
  try {
    if (!(await arePushNotificationsEnabled())) return;

    const milestone = STREAK_MILESTONE_MESSAGES.find(m => m.days === streak);
    if (!milestone) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: milestone.title,
        body: milestone.body,
        sound: true,
        data: { type: 'streak_milestone', streak },
      },
      trigger: null, // Send immediately
    });

    console.log(`Streak milestone notification sent for ${streak} days`);
  } catch (error) {
    console.error('Error sending streak milestone:', error);
  }
};

// Send immediate weekly summary with actual data
export const sendWeeklySummaryNow = async () => {
  try {
    if (!(await arePushNotificationsEnabled())) return;

    // Get this week's interview count from AsyncStorage or calculate
    const weeklyCount = parseInt(await AsyncStorage.getItem('weeklyInterviewCount') || '0');
    const emoji = getWeeklyEmoji(weeklyCount);
    const message = getWeeklyMessage(weeklyCount);

    const template = getRandomMessage(WEEKLY_SUMMARY_MESSAGES);
    const body = template.body
      .replace('{count}', String(weeklyCount))
      .replace('{emoji}', emoji)
      .replace('{message}', message);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: template.title,
        body,
        sound: true,
        data: { type: 'weekly_summary', count: weeklyCount },
      },
      trigger: null,
    });

    console.log('Weekly summary sent');
  } catch (error) {
    console.error('Error sending weekly summary:', error);
  }
};

// Cancel all reminders
export const cancelAllReminders = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem('dailyReminderIdentifier');
    await AsyncStorage.removeItem(DAILY_REMINDER_IDENTIFIERS_KEY);
    await AsyncStorage.removeItem('weeklySummaryIdentifier');
    console.log('All reminders cancelled');
  } catch (error) {
    console.error('Error cancelling reminders:', error);
  }
};

// Check if daily reminder is scheduled
export const isDailyReminderScheduled = async (): Promise<boolean> => {
  try {
    const identifiers = await readJsonArray<string>(DAILY_REMINDER_IDENTIFIERS_KEY);
    const legacyIdentifier = await AsyncStorage.getItem('dailyReminderIdentifier');
    const reminderIds = [...identifiers, legacyIdentifier].filter(Boolean);
    if (reminderIds.length === 0) return false;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some(notif => reminderIds.includes(notif.identifier));
  } catch (error) {
    console.error('Error checking daily reminder:', error);
    return false;
  }
};

// Send immediate test notification
export const sendTestNotification = async () => {
  try {
    if (!(await arePushNotificationsEnabled())) return;

    const message = getRandomMessage(DAILY_REMINDER_MESSAGES);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};

// Initialize all notifications (call this on app start after permission granted)
export const initializeNotifications = async () => {
  try {
    const preferenceSet = await AsyncStorage.getItem(NOTIFICATION_PREF_SET_KEY);
    const notifPush = await AsyncStorage.getItem('notif_push');

    if (preferenceSet !== 'true' && notifPush === null) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        await AsyncStorage.setItem('notif_push', 'false');
        await AsyncStorage.setItem(NOTIFICATION_PREF_SET_KEY, 'true');
        await cancelAllReminders();
        return;
      }

      await setDefaultNotificationPreferences();
      await registerPushToken();
    } else if (notifPush !== 'true') {
      await cancelAllReminders();
      return;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      await AsyncStorage.setItem('notif_push', 'false');
      await AsyncStorage.setItem(NOTIFICATION_PREF_SET_KEY, 'true');
      await cancelAllReminders();
      return;
    }

    const notifPractice = await AsyncStorage.getItem('notif_practice');

    // Schedule daily reminder only if practice reminders are enabled.
    if (notifPractice === 'true') {
      const savedTime = await AsyncStorage.getItem('dailyReminderTime');
      if (savedTime) {
        const { hour, minute } = JSON.parse(savedTime);
        await scheduleDailyReminder(hour, minute);
      } else {
        await scheduleDailyReminder(18, 0);
      }
    }

    // Schedule weekly summary
    await scheduleWeeklySummary();

    // Schedule streak warning check
    await scheduleStreakWarning();

    console.log('All notifications initialized');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

// Update weekly interview count (call after each interview)
export const incrementWeeklyCount = async () => {
  try {
    const count = parseInt(await AsyncStorage.getItem('weeklyInterviewCount') || '0');
    await AsyncStorage.setItem('weeklyInterviewCount', String(count + 1));
    
    // Reset count if it's a new week
    const lastReset = await AsyncStorage.getItem('weeklyCountResetDate');
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    if (!lastReset || new Date(lastReset) < startOfWeek) {
      await AsyncStorage.setItem('weeklyInterviewCount', '1');
      await AsyncStorage.setItem('weeklyCountResetDate', new Date().toISOString());
    }
  } catch (error) {
    console.error('Error incrementing weekly count:', error);
  }
};

// ------------------------------------------------------------------
// REMOTE PUSH TOKEN REGISTRATION
// Requires a push_token column in user_preferences:
//   ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS push_token text;
// ------------------------------------------------------------------

/**
 * Gets the Expo Push Token and saves it to Supabase so the server
 * can send remote pushes via the send-push Edge Function.
 */
export const registerPushToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') return null;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E3A6E',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
    const token = tokenData.data;

    await AsyncStorage.setItem('expoPushToken', token);

    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      await supabase
        .from('user_preferences')
        .update({ push_token: token })
        .eq('user_id', userId);
    }

    console.log('\u2705 Push token registered:', token);
    return token;
  } catch (error) {
    console.error('Error registering push token:', error);
    return null;
  }
};

/** Removes the push token from Supabase so no further remote pushes are sent. */
export const unregisterPushToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('expoPushToken');

    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      await supabase
        .from('user_preferences')
        .update({ push_token: null })
        .eq('user_id', userId);
    }

    console.log('Push token unregistered');
  } catch (error) {
    console.error('Error unregistering push token:', error);
  }
};

export const incrementWeeklyInterviewCount = async (): Promise<void> => {
  try {
    const count = parseInt(await AsyncStorage.getItem('weeklyInterviewCount') || '0');
    await AsyncStorage.setItem('weeklyInterviewCount', String(count + 1));
    
    // Reset count if it's a new week
    const lastReset = await AsyncStorage.getItem('weeklyCountResetDate');
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    if (!lastReset || new Date(lastReset) < startOfWeek) {
      await AsyncStorage.setItem('weeklyInterviewCount', '1');
      await AsyncStorage.setItem('weeklyCountResetDate', new Date().toISOString());
    }
  } catch (error) {
    console.error('Error incrementing weekly count:', error);
  }
};
