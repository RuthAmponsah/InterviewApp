import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications should be displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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

// Schedule daily practice reminder
export const scheduleDailyReminder = async (hour: number = 18, minute: number = 0) => {
  try {
    // Cancel existing reminders first
    await cancelDailyReminder();

    // Get user's streak for personalization
    const streak = await AsyncStorage.getItem('streak');
    const streakNum = parseInt(streak || '0');

    // Create personalized message
    let message = "Time to practice! 🎯";
    if (streakNum > 0) {
      message = `Keep your ${streakNum}-day streak going! 🔥`;
    }

    // Schedule daily notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "MY INTERVIEW",
        body: message,
        sound: true,
        data: { type: 'daily_reminder' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    // Save the notification identifier
    await AsyncStorage.setItem('dailyReminderIdentifier', identifier);
    console.log('Daily reminder scheduled for', `${hour}:${minute}`);
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return null;
  }
};

// Cancel daily reminder
export const cancelDailyReminder = async () => {
  try {
    const identifier = await AsyncStorage.getItem('dailyReminderIdentifier');
    if (identifier) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      await AsyncStorage.removeItem('dailyReminderIdentifier');
      console.log('Daily reminder cancelled');
    }
  } catch (error) {
    console.error('Error cancelling daily reminder:', error);
  }
};

// Check if daily reminder is scheduled
export const isDailyReminderScheduled = async (): Promise<boolean> => {
  try {
    const identifier = await AsyncStorage.getItem('dailyReminderIdentifier');
    if (!identifier) return false;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some(notif => notif.identifier === identifier);
  } catch (error) {
    console.error('Error checking daily reminder:', error);
    return false;
  }
};

// Send immediate test notification
export const sendTestNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "MY INTERVIEW",
        body: "Test notification - Your reminders are working! 🎯",
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};
