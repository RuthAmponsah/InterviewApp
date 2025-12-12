import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

const FAQ_ITEMS = [
  {
    q: "What is My Interview?",
    a: "My Interview is an AI-powered mock interview coach designed to help you practise and build confidence.",
  },
  {
    q: "How does Aya generate questions?",
    a: "Aya uses your selected job role to tailor interview questions and feedback to your career goals.",
  },
  {
    q: "Can I change my job preferences later?",
    a: "Yes! You can update your job role anytime in Settings → Job Preferences.",
  },
  {
    q: "Does the app store my voice recordings?",
    a: "No. Your recordings are processed in real time and are not stored on any server.",
  },
  {
    q: "Is My Interview free?",
    a: "Many features are free, with optional premium upgrades coming soon.",
  },
];

export default function HelpCentre() {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <BackButton />

      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.title}>Help centre</Text>
      <Text style={styles.subtitle}>
        Quick answers to common questions about the app.
      </Text>

      <View style={styles.card}>
        {FAQ_ITEMS.map((item, index) => (
          <View key={index} style={styles.faqBlock}>
            <Text style={styles.question}>{item.q}</Text>
            <Text style={styles.answer}>{item.a}</Text>

            {/* Divider except last item */}
            {index !== FAQ_ITEMS.length - 1 && (
              <View style={styles.divider} />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6",
    },
    content: {
      paddingTop: 70,
      paddingHorizontal: 20,
      paddingBottom: 40,
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
      ...typography.bodySmall,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 18,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    faqBlock: {
      paddingVertical: 10,
    },
    question: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 6,
    },
    answer: {
      ...typography.bodySmall,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginBottom: 10,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? "#333" : "#E5E7EB",
      marginVertical: 10,
    },
  });
