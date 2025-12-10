import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

const Notifications: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);

  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [practiceReminders, setPracticeReminders] = useState(false);
  const [feedbackAlerts, setFeedbackAlerts] = useState(false);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      const push = await AsyncStorage.getItem("notif_push");
      const email = await AsyncStorage.getItem("notif_email");
      const practice = await AsyncStorage.getItem("notif_practice");
      const feedback = await AsyncStorage.getItem("notif_feedback");

      if (push === "true") setPushEnabled(true);
      if (email === "true") setEmailEnabled(true);
      if (practice === "true") setPracticeReminders(true);
      if (feedback === "true") setFeedbackAlerts(true);
    };
    loadPreferences();
  }, []);

  // Save individual preference
  const togglePreference = async (
    key: string,
    value: boolean,
    setter: (val: boolean) => void
  ) => {
    setter(value);
    await AsyncStorage.setItem(key, value.toString());
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
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
      paddingTop: 80,
      paddingBottom: 32,
    },
    logoText: {
      ...typography.headingMedium,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 24,
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
  });

export default Notifications;
