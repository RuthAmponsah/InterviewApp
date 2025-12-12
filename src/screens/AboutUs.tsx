import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../theme/ThemeContext";   // ⭐ NEW
import { typography } from "../theme/colors";
import BackButton from "../components/BackButton";

const AboutUs: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <ScrollView
      style={[styles.root, { backgroundColor: isDark ? "#0f0f0f" : colors.background }]}
      contentContainerStyle={styles.content}
    >
      <BackButton />

      <Text style={[styles.logoText, { color: colors.primaryBlue }]}>
        MY INTERVIEW
      </Text>

      <Text style={[styles.title, { color: isDark ? "#fff" : colors.textDark }]}>About us</Text>

      <Text style={[styles.subtitle, { color: isDark ? "#b5b5b5" : colors.textMuted }]}>
        My Interview is your friendly practice space for real-world interviews.
      </Text>

      <View style={[styles.card, { backgroundColor: isDark ? "#1d1d1d" : colors.card }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : colors.textDark }]}>
          Our mission
        </Text>
        <Text style={[styles.body, { color: isDark ? "#b5b5b5" : colors.textMuted }]}>
          We want to help people who feel anxious, under-confident or out of
          practice show up as their best selves in interviews. My Interview
          gives you a safe place to practise, reflect and grow before it really
          counts.
        </Text>

        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : colors.textDark }]}>
          Who it’s for
        </Text>
        <Text style={[styles.body, { color: isDark ? "#b5b5b5" : colors.textMuted }]}>
          Whether you’re changing careers, returning to work, applying for your
          very first role or aiming for a promotion, Aya is here to support you.
          The app is especially designed for people who don’t always have
          someone to practise with – or who prefer to rehearse privately first.
        </Text>

        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : colors.textDark }]}>
          How Aya helps
        </Text>
        <Text style={[styles.body, { color: isDark ? "#b5b5b5" : colors.textMuted }]}>
          Aya guides you through realistic mock interviews, tailored to the kind
          of job you’re going for. You can practise answering questions, get
          gentle feedback, and build your confidence one session at a time.
        </Text>

        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : colors.textDark }]}>
          What’s next
        </Text>
        <Text style={[styles.body, { color: isDark ? "#b5b5b5" : colors.textMuted }]}>
          We’re constantly improving My Interview – from smarter question sets
          and better feedback, to custom avatars and more control over how Aya
          sounds. Your feedback directly shapes what we build next.
        </Text>

        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : colors.textDark }]}>
          Thank you
        </Text>
        <Text style={[styles.body, { color: isDark ? "#b5b5b5" : colors.textMuted }]}>
          Thanks for trusting Aya to be part of your journey. We’re cheering you
          on for every application, every interview and every “You got the job!”
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 32,
  },
  logoText: {
    ...typography.heading,
    fontWeight: "800",
    alignSelf: "center",
    marginBottom: 28,
  },
  title: {
    ...typography.headingMedium,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodyMedium,
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  body: {
    ...typography.bodySmall,
    lineHeight: 22,
    marginBottom: 12,
  },
});

export default AboutUs;
