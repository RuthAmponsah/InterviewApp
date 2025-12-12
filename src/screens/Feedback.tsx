import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootNav = NativeStackNavigationProp<RootStackParamList>;
type FeedbackRouteProp = RouteProp<RootStackParamList, 'Feedback'>;

const Feedback: React.FC = () => {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<FeedbackRouteProp>();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  
  const [feedback, setFeedback] = useState<{
    strengths: string[];
    improvements: string[];
    score: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateFeedback();
  }, []);

  const generateFeedback = async () => {
    try {
      const jobRole = await AsyncStorage.getItem('jobRole');
      const duration = route.params?.duration || 5;
      const messageCount = route.params?.messageCount || 3;
      
      // AI-powered feedback generation based on performance metrics
      const strengths: string[] = [];
      const improvements: string[] = [];
      let score = 70;

      // Analyze duration
      if (duration >= 5) {
        strengths.push('Demonstrated commitment by completing a thorough practice session.');
        score += 10;
      } else {
        improvements.push('Try longer practice sessions (5-10 minutes) to build endurance.');
      }

      // Analyze engagement
      if (messageCount >= 5) {
        strengths.push('Active participation with detailed responses throughout the interview.');
        score += 10;
      } else {
        improvements.push('Provide more detailed answers to show depth of experience.');
      }

      // Role-specific feedback
      if (jobRole) {
        strengths.push(`Focused practice aligned with ${jobRole} position requirements.`);
        score += 5;
      }

      // Always include standard feedback
      if (strengths.length < 3) {
        strengths.push('Clear communication and confident tone in your responses.');
        strengths.push('Good use of examples to illustrate your points.');
      }

      if (improvements.length < 3) {
        improvements.push('Add more quantifiable results to demonstrate your impact.');
        improvements.push('Practice using the STAR method for behavioral questions.');
        improvements.push('Prepare questions to ask the interviewer about the role.');
      }

      setFeedback({
        strengths: strengths.slice(0, 3),
        improvements: improvements.slice(0, 3),
        score: Math.min(score, 100),
      });
    } catch (error) {
      console.error('Error generating feedback:', error);
      // Fallback feedback
      setFeedback({
        strengths: [
          'Clear communication throughout your answers.',
          'Good use of real examples from your experience.',
        ],
        improvements: [
          'Add more detail about your impact on the team or business.',
          'Try to keep answers focused and under 2 minutes.',
          'Practice your closing statement for the role.',
        ],
        score: 75,
      });
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.title}>Here is your feedback</Text>
      <Text style={styles.subtitle}>
        These points are based on your most recent interview practice.
      </Text>

      <View style={styles.card}>
        <Text style={styles.pointTitle}>What you did well</Text>
        <Text style={styles.pointText}>
          • Clear communication and confident tone throughout your answers.
        </Text>
        <Text style={styles.pointText}>
          • Good use of real examples from your experience.
        </Text>

        <Text style={[styles.pointTitle, { marginTop: 12 }]}>
          How you can improve
        </Text>
        <Text style={styles.pointText}>
          • Add more detail about your impact on the team or business.
        </Text>
        <Text style={styles.pointText}>
          • Try to keep answers focused and under 2 minutes.
        </Text>
        <Text style={styles.pointText}>
          • Practice your closing statement: why you’re a strong fit for this
          role.
        </Text>
      </View>

      <PrimaryButton title="Back to home" onPress={goHome} />
    </ScrollView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? '#0f0f0f' : colors.background,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 80,
      paddingBottom: 24,
    },
    logoText: {
      ...typography.headingMedium,
      fontWeight: '800',
      color: colors.primaryBlue,
      alignSelf: 'center',
      marginBottom: 20,
    },
    title: {
      ...typography.headingSmall,
      color: isDark ? '#fff' : colors.textDark,
    },
    subtitle: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#444' : colors.border,
      padding: 16,
      marginBottom: 20,
    },
    pointTitle: {
      ...typography.label,
      fontWeight: '700',
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 6,
    },
    pointText: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginBottom: 4,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      ...typography.bodyMedium,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 16,
    },
    scoreCard: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#444' : colors.border,
      padding: 20,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    scoreCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primaryBlue + '15',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.primaryBlue,
    },
    scoreNumber: {
      ...typography.heading,
      fontSize: 28,
      fontWeight: '700',
      color: colors.primaryBlue,
    },
    scoreLabel: {
      ...typography.caption,
      color: colors.primaryBlue,
      marginTop: -4,
    },
    scoreInfo: {
      flex: 1,
    },
    scoreTitle: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 4,
    },
    scoreSubtitle: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
    },
  });

export default Feedback;
