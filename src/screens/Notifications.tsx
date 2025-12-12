import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  Platform,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { 
  requestNotificationPermissions, 
  scheduleDailyReminder, 
  cancelDailyReminder,
  sendTestNotification,
} from "../services/notificationService";

const Notifications: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);

  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [practiceReminders, setPracticeReminders] = useState(false);
  const [feedbackAlerts, setFeedbackAlerts] = useState(false);
  const [reminderTime, setReminderTime] = useState({ hour: 18, minute: 0 });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      const push = await AsyncStorage.getItem("notif_push");
      const email = await AsyncStorage.getItem("notif_email");
      const practice = await AsyncStorage.getItem("notif_practice");
      const feedback = await AsyncStorage.getItem("notif_feedback");
      const savedHour = await AsyncStorage.getItem("reminderHour");
      const savedMinute = await AsyncStorage.getItem("reminderMinute");

      if (push === "true") setPushEnabled(true);
      if (email === "true") setEmailEnabled(true);
      if (practice === "true") setPracticeReminders(true);
      if (feedback === "true") setFeedbackAlerts(true);
      
      if (savedHour && savedMinute) {
        setReminderTime({ hour: parseInt(savedHour), minute: parseInt(savedMinute) });
      }

      // Request permissions on load
      const granted = await requestNotificationPermissions();
      setPermissionsGranted(granted);
    };
    loadPreferences();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const push = await AsyncStorage.getItem("notif_push");
    const email = await AsyncStorage.getItem("notif_email");
    const practice = await AsyncStorage.getItem("notif_practice");
    const feedback = await AsyncStorage.getItem("notif_feedback");
    const savedHour = await AsyncStorage.getItem("reminderHour");
    const savedMinute = await AsyncStorage.getItem("reminderMinute");

    if (push === "true") setPushEnabled(true);
    else setPushEnabled(false);
    if (email === "true") setEmailEnabled(true);
    else setEmailEnabled(false);
    if (practice === "true") setPracticeReminders(true);
    else setPracticeReminders(false);
    if (feedback === "true") setFeedbackAlerts(true);
    else setFeedbackAlerts(false);
    
    if (savedHour && savedMinute) {
      setReminderTime({ hour: parseInt(savedHour), minute: parseInt(savedMinute) });
    }
    setRefreshing(false);
  };

  // Save individual preference
  const togglePreference = async (
    key: string,
    value: boolean,
    setter: (val: boolean) => void
  ) => {
    setter(value);
    await AsyncStorage.setItem(key, value.toString());
    
    // Handle practice reminders scheduling
    if (key === "notif_practice") {
      if (value && permissionsGranted) {
        await scheduleDailyReminder(reminderTime.hour, reminderTime.minute);
      } else {
        await cancelDailyReminder();
      }
    }
  };

  const updateReminderTime = async (hour: number, minute: number) => {
    setReminderTime({ hour, minute });
    await AsyncStorage.setItem("reminderHour", hour.toString());
    await AsyncStorage.setItem("reminderMinute", minute.toString());
    
    // Reschedule if reminders are enabled
    if (practiceReminders && permissionsGranted) {
      await scheduleDailyReminder(hour, minute);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  return (
    <ScrollView
      style={styles.root}
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
      <BackButton />

      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>
        Manage how you'd like to be notified about your interview progress.
      </Text>

      {/* General Notifications */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>General</Text>

        <View style={styles.row}>
          <View style={styles.rowTextContainer}>
            <Text style={styles.rowTitle}>Push notifications</Text>
            <Text style={styles.rowSubtitle}>
              Receive alerts on your device.
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={(val) =>
              togglePreference("notif_push", val, setPushEnabled)
            }
            trackColor={{ false: "#ccc", true: colors.primaryBlue }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowTextContainer}>
            <Text style={styles.rowTitle}>Email notifications</Text>
            <Text style={styles.rowSubtitle}>
              Get updates sent to your inbox.
            </Text>
          </View>
          <Switch
            value={emailEnabled}
            onValueChange={(val) =>
              togglePreference("notif_email", val, setEmailEnabled)
            }
            trackColor={{ false: "#ccc", true: colors.primaryBlue }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Practice Reminders */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Practice reminders</Text>

        <View style={styles.row}>
          <View style={styles.rowTextContainer}>
            <Text style={styles.rowTitle}>Daily practice reminders</Text>
            <Text style={styles.rowSubtitle}>
              Get a nudge to keep your streak going.
            </Text>
          </View>
          <Switch
            value={practiceReminders}
            onValueChange={(val) =>
              togglePreference("notif_practice", val, setPracticeReminders)
            }
            trackColor={{ false: "#ccc", true: colors.primaryBlue }}
            thumbColor="#fff"
          />
        </View>

        {practiceReminders && (
          <TouchableOpacity 
            style={styles.timeRow}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.timeLabel}>Reminder time</Text>
            <Text style={styles.timeValue}>{formatTime(reminderTime.hour, reminderTime.minute)}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.row}>
          <View style={styles.rowTextContainer}>
            <Text style={styles.rowTitle}>Feedback alerts</Text>
            <Text style={styles.rowSubtitle}>
              Know when new feedback is available.
            </Text>
          </View>
          <Switch
            value={feedbackAlerts}
            onValueChange={(val) =>
              togglePreference("notif_feedback", val, setFeedbackAlerts)
            }
            trackColor={{ false: "#ccc", true: colors.primaryBlue }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Reminder Time</Text>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.pickerItem, reminderTime.hour === i && styles.pickerItemSelected]}
                      onPress={() => setReminderTime({ ...reminderTime, hour: i })}
                    >
                      <Text style={[styles.pickerText, reminderTime.hour === i && styles.pickerTextSelected]}>
                        {i.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minute</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {[0, 15, 30, 45].map((min) => (
                    <TouchableOpacity
                      key={min}
                      style={[styles.pickerItem, reminderTime.minute === min && styles.pickerItemSelected]}
                      onPress={() => setReminderTime({ ...reminderTime, minute: min })}
                    >
                      <Text style={[styles.pickerText, reminderTime.minute === min && styles.pickerTextSelected]}>
                        {min.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={() => {
                  updateReminderTime(reminderTime.hour, reminderTime.minute);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6",
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 70,
      paddingBottom: 32,
    },
    logoText: {
      ...typography.heading,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 28,
    },
    title: {
      ...typography.headingMedium,
      color: isDark ? "#fff" : colors.textDark,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E5E7EB",
    },
    sectionTitle: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#333" : "#E5E7EB",
    },
    rowTextContainer: {
      flex: 1,
      marginRight: 12,
    },
    rowTitle: {
      ...typography.label,
      color: isDark ? "#fff" : colors.textDark,
    },
    rowSubtitle: {
      ...typography.caption,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 2,
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: isDark ? "#2a2a2a" : "#F9FAFB",
      borderRadius: 12,
      marginVertical: 8,
    },
    timeLabel: {
      ...typography.bodyMedium,
      color: isDark ? "#b5b5b5" : colors.textMuted,
    },
    timeValue: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.primaryBlue,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: isDark ? "#1d1d1d" : "#fff",
      borderRadius: 20,
      padding: 24,
      width: "100%",
      maxWidth: 400,
    },
    modalTitle: {
      ...typography.headingSmall,
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 20,
      textAlign: "center",
    },
    timePickerContainer: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 24,
    },
    pickerColumn: {
      flex: 1,
    },
    pickerLabel: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginBottom: 8,
      textAlign: "center",
    },
    picker: {
      maxHeight: 200,
      backgroundColor: isDark ? "#2a2a2a" : "#F9FAFB",
      borderRadius: 12,
    },
    pickerItem: {
      paddingVertical: 12,
      alignItems: "center",
    },
    pickerItemSelected: {
      backgroundColor: isDark ? "#3b82f6" : colors.primaryBlue,
    },
    pickerText: {
      ...typography.bodyMedium,
      color: isDark ? "#b5b5b5" : colors.textDark,
    },
    pickerTextSelected: {
      color: "#fff",
      fontWeight: "600",
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    modalButtonCancel: {
      backgroundColor: isDark ? "#2a2a2a" : "#F3F4F6",
    },
    modalButtonSave: {
      backgroundColor: colors.primaryBlue,
    },
    modalButtonTextCancel: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
    },
    modalButtonTextSave: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: "#fff",
    },
  });

export default Notifications;
