import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ConfettiAnimation from '../components/ConfettiAnimation';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { getConversationSummary, clearConversationHistory } from '../services/aiService';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [transcript, setTranscript] = useState<{from: string; text: string}[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);

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
      if (hasNoResponses && messageCount === 0) {
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
        improvements.push('Practise using the STAR method for behavioural questions.');
      }

      const feedbackData = {
        strengths: strengths.slice(0, 3),
        improvements: improvements.slice(0, 3),
        score: Math.min(score, 100),
      };

      console.log('Setting feedback state with:', JSON.stringify(feedbackData, null, 2));
      setFeedback(feedbackData);
      console.log('Feedback state set successfully');
      
      // Trigger confetti for high scores
      if (feedbackData.score >= 80) {
        setTimeout(() => {
          setShowConfetti(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 500);
      }

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
          
          // Fetch the transcript for this interview
          const { data: interviewData } = await supabase
            .from('interview_history')
            .select('transcript')
            .eq('id', interviewId)
            .single();
            
          if (interviewData?.transcript) {
            try {
              const parsedTranscript = JSON.parse(interviewData.transcript);
              setTranscript(parsedTranscript);
              console.log('✅ Transcript loaded:', parsedTranscript.length, 'messages');
            } catch (e) {
              console.log('Could not parse transcript');
            }
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
    <>
      <ConfettiAnimation visible={showConfetti} duration={3000} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logoText}>MY INTERVIEW</Text>

        <Text style={styles.title}>
          {feedback && feedback.score >= 80 ? '🎉 Amazing job!' : 'Here is your feedback'}
        </Text>
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
          
          {transcript.length > 0 && (
            <TouchableOpacity 
              style={styles.transcriptButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowTranscript(true);
              }}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.primaryBlue} />
              <Text style={styles.transcriptButtonText}>Tap to view transcript</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primaryBlue} />
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      <PrimaryButton title="Back to home" onPress={goHome} />
      </ScrollView>
      
      {/* Transcript Modal - Popup bubble style */}
      <Modal
        visible={showTranscript}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTranscript(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="chatbubbles" size={24} color={colors.primaryBlue} />
                <Text style={styles.modalTitle}>Interview Transcript</Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowTranscript(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={isDark ? '#fff' : '#666'} />
              </TouchableOpacity>
            </View>
            
            {/* Messages - InterviewChat style */}
            <ScrollView 
              style={styles.transcriptScroll} 
              contentContainerStyle={styles.transcriptContent}
              showsVerticalScrollIndicator={false}
            >
              {transcript.map((msg, index) => (
                <View 
                  key={index} 
                  style={styles.messageContainer}
                >
                  <Text style={[
                    styles.senderLabel,
                    msg.from === 'user' && { textAlign: 'right', marginRight: 12, marginLeft: 0 }
                  ]}>
                    {msg.from === 'user' ? 'You' : 'Aya'}
                  </Text>
                  <View style={[
                    styles.bubble,
                    msg.from === 'user' ? styles.userBubble : styles.aiBubble
                  ]}>
                    <Text style={[
                      styles.bubbleText,
                      msg.from === 'user' ? styles.userBubbleText : styles.aiBubbleText
                    ]}>
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
      paddingBottom: 100,
    },
    logoText: {
      ...typography.brandMark,
      color: colors.primaryBlue,
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
    transcriptButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 122, 255, 0.3)' : 'rgba(0, 122, 255, 0.2)',
    },
    transcriptButtonText: {
      ...typography.bodyMedium,
      color: colors.primaryBlue,
      marginHorizontal: 8,
      fontWeight: '600',
    },
    // Popup modal styles (like PaywallModal)
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 400,
      maxHeight: '85%',
        height: '85%',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : colors.border,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    modalTitle: {
      ...typography.headingSmall,
      fontSize: 18,
      color: isDark ? '#fff' : colors.textDark,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    transcriptScroll: {
      flex: 1,
    },
    transcriptContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    // InterviewChat style messages
    messageContainer: {
      marginVertical: 6,
      width: '100%',
    },
    senderLabel: {
      ...typography.caption,
      fontSize: 12,
      color: isDark ? '#888' : colors.textMuted,
      marginBottom: 4,
      marginLeft: 12,
    },
    bubble: {
      maxWidth: '80%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#2a2a2a' : '#F3F4F6',
      borderBottomLeftRadius: 4,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primaryBlue,
      borderBottomRightRadius: 4,
    },
    bubbleText: {
      ...typography.bodyMedium,
      lineHeight: 22,
    },
    aiBubbleText: {
      color: isDark ? '#fff' : colors.textDark,
    },
    userBubbleText: {
      color: '#FFFFFF',
    },
  });

export default Feedback;
