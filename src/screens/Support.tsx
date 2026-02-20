import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

// ▶️ ADD THIS
import BackButton from "../components/BackButton"; 
// (Make sure the file exists: src/components/BackButton.tsx)

const Support: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const openEmail = () => {
    Linking.openURL("mailto:info@interviewappcom.com?subject=Support%20request");
  };

  const openFaq = () => {
    console.log("Open help centre");
  };

  const openFeedback = () => {
    Linking.openURL("mailto:info@interviewappcom.com?subject=App%20feedback");
  };

  const navigation: any = useNavigation();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      

      {/* ▶️ ADD THIS */}
      <BackButton />

      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.title}>Support</Text>
      <Text style={styles.subtitle}>
        Stuck on something? We’re here to help you feel confident using the app.
      </Text>

      <View style={styles.card}>
        <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate("HelpCentre")}
        activeOpacity={0.8}>
          <View>
            <Text style={styles.rowTitle}>Help centre</Text>
            <Text style={styles.rowSubtitle}>
              Browse quick guides and common questions.
              </Text>
              </View>
              </TouchableOpacity>


        <TouchableOpacity style={styles.row} onPress={openEmail} activeOpacity={0.8}>
          <View>
            <Text style={styles.rowTitle}>Contact support</Text>
            <Text style={styles.rowSubtitle}>
              Email the team if something isn’t working as expected.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={openFeedback} activeOpacity={0.8}>
          <View>
            <Text style={styles.rowTitle}>Share feedback</Text>
            <Text style={styles.rowSubtitle}>
              Tell us what you’d love to see next in My Interview.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.chatCard}>
        <Text style={styles.chatTitle}>Chat with an agent</Text>
        <Text style={styles.chatSubtitle}>
          Ask questions about how the app works and get instant guidance.
        </Text>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => navigation.navigate("SupportChat")}
          activeOpacity={0.85}
        >
          <Text style={styles.chatButtonText}>Start chat</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6" },
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
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    row: {
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#333" : "#E5E7EB",
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
    chatCard: {
      marginTop: 16,
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    chatTitle: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
    },
    chatSubtitle: {
      ...typography.caption,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 6,
    },
    chatButton: {
      marginTop: 12,
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
    },
    chatButtonText: {
      ...typography.label,
      color: "#fff",
      fontWeight: "600",
    },
  });

export default Support;
