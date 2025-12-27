import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { getConversationSummary, clearConversationHistory } from '../services/aiService';

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
    
    // Clear conversation history when leaving this screen
    return () => {
      clearConversationHistory();
    };
  }, []);

  const generateFeedback = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const duration = route.params?.duration || 5;
      const messageCount = route.params?.messageCount || 3;
      const interviewId = route.params?.interviewId; // Get interview ID from params
      const hasNoResponses = route.params?.hasNoResponses || false;
      
      console.log('Generating AI feedback for interview...');
      console.log('Interview ID from params:', interviewId);
      console.log('Has no responses:', hasNoResponses);
      
      // If user ended without submitting anything, give score 0
      if (hasNoResponses || messageCount === 0) {
        console.log('User ended interview without submitting any responses');
        const noResponseFeedback = {
          strengths: ['You started the interview, which shows initiative.'],
          improvements: [
            'Complete the interview by answering at least one question.',
            'Provide detailed responses to showcase your skills and experience.',
            'Practice articulating your thoughts clearly in interview settings.'
          ],
          score: 0
        };
        
        setFeedback(noResponseFeedback);
        
        // Save this feedback to database
        if (userId && interviewId) {
          const feedbackText = 'Score: 0/100. No responses submitted. The interview was ended before any answers were provided.';
          await supabase
            .from('interview_history')
            .update({ feedback: feedbackText })
            .eq('id', interviewId);
          console.log('✅ Zero score feedback saved to database');
        }
        
        setLoading(false);
        return;
      }
      
      // Get AI-generated feedback from conversation history
      const aiSummary = await getConversationSummary();
      
      console.log('AI Summary received:', aiSummary);
      console.log('AI Summary length:', aiSummary?.length || 0);
      
      // Handle NO_RESPONSES_SUBMITTED case
      if (aiSummary === 'NO_RESPONSES_SUBMITTED') {
        console.log('AI service detected no responses');
        const noResponseFeedback = {
          strengths: ['You started the interview, which shows initiative.'],
          improvements: [
            'Complete the interview by answering at least one question.',
            'Provide detailed responses to showcase your skills and experience.',
            'Practice articulating your thoughts clearly in interview settings.'
          ],
          score: 0
        };
        
        setFeedback(noResponseFeedback);
        
        // Save this feedback to database
        if (userId && interviewId) {
          const feedbackText = 'Score: 0/100. No responses submitted. The interview was ended before any answers were provided.';
          await supabase
            .from('interview_history')
            .update({ feedback: feedbackText })
            .eq('id', interviewId);
          console.log('✅ Zero score feedback saved to database');
        }
        
        setLoading(false);
        return;
      }
      
      // Parse AI feedback into strengths and improvements
      const strengths: string[] = [];
      const improvements: string[] = [];
      let score = 50; // Start lower

      // Extract feedback from AI summary
      if (aiSummary && aiSummary.length > 0) {
        console.log('Parsing AI summary...');
        
        // Try to parse structured format first
        const strengthsMatch = aiSummary.match(/STRENGTHS?:([\s\S]*?)(?=IMPROVEMENTS?:|SCORE:|$)/i);
        const improvementsMatch = aiSummary.match(/IMPROVEMENTS?:([\s\S]*?)(?=SCORE:|$)/i);
        const scoreMatch = aiSummary.match(/SCORE:\s*(\d+)/i);
        
        console.log('Strengths match:', strengthsMatch?.[0]?.substring(0, 100));
        console.log('Improvements match:', improvementsMatch?.[0]?.substring(0, 100));
        console.log('Score match:', scoreMatch?.[1]);
        
        // Extract AI-generated score
        if (scoreMatch) {
          score = parseInt(scoreMatch[1], 10);
          console.log('Using AI score:', score);
        }
        
        if (strengthsMatch) {
          const strengthLines = strengthsMatch[1]
            .split('\n')
            .map(line => line.trim().replace(/^[-•*]\s*/, ''))
            .filter(line => line.length > 10);
          strengths.push(...strengthLines.slice(0, 3));
        }
        
        if (improvementsMatch) {
          const improvementLines = improvementsMatch[1]
            .split('\n')
            .map(line => line.trim().replace(/^[-•*]\s*/, ''))
            .filter(line => line.length > 10);
          improvements.push(...improvementLines.slice(0, 3));
        }
        
        // Fallback: parse by keywords if structured format not found
        if (strengths.length === 0 || improvements.length === 0) {
          const positiveKeywords = ['strength', 'well', 'good', 'excellent', 'strong', 'clear', 'confident', 'detailed'];
          const improvementKeywords = ['improve', 'could', 'should', 'consider', 'try', 'practice', 'work on', 'develop'];
          
          const sentences = aiSummary.split(/[.!?]+/).filter(s => s.trim().length > 0);
          
          sentences.forEach(sentence => {
            const lowerSentence = sentence.toLowerCase();
            const hasPositive = positiveKeywords.some(keyword => lowerSentence.includes(keyword));
            const hasImprovement = improvementKeywords.some(keyword => lowerSentence.includes(keyword));
            
            if (hasPositive && !hasImprovement && strengths.length < 3) {
              strengths.push(sentence.trim() + '.');
            } else if (hasImprovement && improvements.length < 3) {
              improvements.push(sentence.trim() + '.');
            }
          });
        }
      }

      // Don't artificially boost score based on duration/messages
      // Let the AI score stand as is
      console.log('Final strengths:', strengths);
      console.log('Final improvements:', improvements);
      console.log('Final score:', score);

      // Fallback feedback if AI didn't provide enough
      if (strengths.length === 0) {
        console.log('Using fallback strengths');
        strengths.push('Clear communication and confident tone in your responses.');
        strengths.push('Good use of examples to illustrate your points.');
      }

      if (improvements.length === 0) {
        console.log('Using fallback improvements');
        improvements.push('Add more quantifiable results to demonstrate your impact.');
        improvements.push('Practice using the STAR method for behavioral questions.');
      }

      const feedbackData = {
        strengths: strengths.slice(0, 3),
        improvements: improvements.slice(0, 3),
        score: Math.min(score, 100),
      };

      console.log('Setting feedback state with:', JSON.stringify(feedbackData, null, 2));
      setFeedback(feedbackData);
      console.log('Feedback state set successfully');

      // Save feedback to the most recent interview in database (don't let this fail the whole function)
      try {
        if (userId && interviewId) {
          // Use the interview ID passed from InterviewChat
          const feedbackText = `Score: ${feedbackData.score}/100. Strengths: ${feedbackData.strengths.join(' ')} Areas to improve: ${feedbackData.improvements.join(' ')}`;
          
          console.log('Saving feedback to database...');
          console.log('User ID:', userId);
          console.log('Interview ID:', interviewId);
          console.log('Feedback text:', feedbackText);
          
          const { error: updateError } = await supabase
            .from('interview_history')
            .update({ feedback: feedbackText })
            .eq('id', interviewId);
            
          if (updateError) {
            console.error('Error updating feedback:', updateError);
          } else {
            console.log('✅ Feedback saved successfully to database!');
          }
        } else {
          console.log('Missing userId or interviewId, skipping database save');
          console.log('userId:', userId, 'interviewId:', interviewId);
        }
      } catch (dbError) {
        console.error('Error saving feedback to database:', dbError);
        // Don't throw - we still want to show the feedback even if save fails
      }
    } catch (error) {
      console.error('!!!! CAUGHT ERROR IN FEEDBACK GENERATION !!!!');
      console.error('Error generating feedback:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Don't set fallback - let it show as null so we can debug
      setFeedback(null);
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Analyzing your interview...</Text>
        </View>
      ) : feedback ? (
        <View style={styles.card}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Interview Score</Text>
            <Text style={styles.scoreValue}>{feedback.score}/100</Text>
          </View>

          <Text style={styles.pointTitle}>What you did well</Text>
          {feedback.strengths.map((strength, index) => (
            <Text key={`strength-${index}`} style={styles.pointText}>
              • {strength}
            </Text>
          ))}

          <Text style={[styles.pointTitle, { marginTop: 16 }]}>
            How you can improve
          </Text>
          {feedback.improvements.map((improvement, index) => (
            <Text key={`improvement-${index}`} style={styles.pointText}>
              • {improvement}
            </Text>
          ))}
        </View>
      ) : null}

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
      paddingTop: 70,
      paddingBottom: 24,
    },
    logoText: {
      ...typography.heading,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 28,
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
    scoreContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : colors.border,
    },
    scoreLabel: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginBottom: 8,
      fontSize: 13,
    },
    scoreValue: {
      fontSize: 56,
      fontWeight: '700',
      color: colors.primaryBlue,
      lineHeight: 64,
    },
  });

export default Feedback;
