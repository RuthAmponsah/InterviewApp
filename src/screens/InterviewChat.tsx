import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "../config/supabase";
import { initializeInterviewChat, sendMessageToAI, speakText, stopSpeaking } from "../services/aiService";
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'InterviewChat'>;

type Message = {
  id: string;
  from: 'ai' | 'user';
  text: string;
};

const InterviewChat: React.FC<Props> = ({ route, navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const { mode } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flatListRef = React.useRef<FlatList>(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [jobRole, setJobRole] = useState('');

  React.useEffect(() => {
    loadUserData();
    
    // Update elapsed time every second
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      const storedRole = await AsyncStorage.getItem('jobRole');
      const userName = await AsyncStorage.getItem('userName');
      
      if (storedRole) {
        setJobRole(storedRole);
        
        // Initialize AI with user context
        initializeInterviewChat(storedRole, userName || undefined);
        
        const greeting: Message = {
          id: '1',
          from: 'ai',
          text: `Hello${userName ? ' ' + userName : ''}! I'm Aya, your interview coach. I see you're preparing for a ${storedRole} position. Let's practice together! Tell me about yourself and why you're interested in this role.`,
        };
        setMessages([greeting]);
        
        // Speak the greeting in voice mode
        if (mode === 'voice') {
          setIsSpeaking(true);
          await speakText(greeting.text);
          setIsSpeaking(false);
        }
      } else {
        // Fallback if no role is set
        initializeInterviewChat('your desired position');
        const greeting: Message = {
          id: '1',
          from: 'ai',
          text: 'Hello! I\'m Aya, your interview coach. Let\'s practice together. Tell me about yourself.',
        };
        setMessages([greeting]);
        
        // Speak the greeting in voice mode
        if (mode === 'voice') {
          setIsSpeaking(true);
          await speakText(greeting.text);
          setIsSpeaking(false);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendMessage = async () => {
    if (!input.trim() || isAiTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userInput = input.trim();
    setInput('');

    // Auto-scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Get AI response
    setIsAiTyping(true);
    try {
      const aiResponse = await sendMessageToAI(userInput);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: aiResponse,
      };
      
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // In voice mode: speak the AI response and wait for it to finish before user can respond
      if (mode === 'voice') {
        setIsAiTyping(true); // Keep "thinking" state while speaking
        setIsSpeaking(true);
        await speakText(aiResponse);
        setIsSpeaking(false);
        setIsAiTyping(false); // Now ready for user response
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: "I'm having trouble responding right now. Could you try again?",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const endInterview = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      
      if (userId && jobRole) {
        // Calculate duration in minutes
        const durationMs = Date.now() - startTime;
        const durationMinutes = Math.round(durationMs / 60000);

        console.log('Saving interview to database...');
        console.log('User ID:', userId);
        console.log('Job Role:', jobRole);
        console.log('Duration:', durationMinutes);

        // Save to interview_history
        const { data: insertedInterview, error: insertError } = await supabase
          .from('interview_history')
          .insert({
            user_id: userId,
            job_role: jobRole,
            mode: mode,
            duration_minutes: durationMinutes,
            date: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error inserting interview:', insertError);
          console.error('Full error details:', JSON.stringify(insertError, null, 2));
        } else {
          console.log('✅ Interview saved successfully!');
          console.log('Interview data:', insertedInterview);
          console.log('Interview ID:', insertedInterview?.id);
        }

        // Update user_progress total_interviews count
        const { data: progress } = await supabase
          .from('user_progress')
          .select('total_interviews')
          .eq('user_id', userId)
          .single();

        if (progress) {
          await supabase
            .from('user_progress')
            .update({ total_interviews: (progress.total_interviews || 0) + 1 })
            .eq('user_id', userId);
        }
        
        // Navigate with performance metrics for AI feedback
        const messageCount = messages.filter(m => m.from === 'user').length;
        const interviewId = insertedInterview?.id;
        
        console.log('Navigating to Feedback with ID:', interviewId);
        
        navigation.navigate('Feedback', { 
          duration: durationMinutes, 
          messageCount,
          interviewId: interviewId // Pass the ID directly
        });
        return;
      }
    } catch (error) {
      console.error('Error saving interview:', error);
    }
    
    // Fallback navigation without params
    navigation.navigate('Feedback', undefined);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>MY INTERVIEW</Text>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>🕐 {formatTime(elapsedTime)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={endInterview}>
          <Text style={styles.endInterview}>End interview</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={styles.messageContainer}>
            {item.from === 'ai' && (
              <Text style={styles.senderLabel}>Aya</Text>
            )}
            <View
              style={[
                styles.bubble,
                item.from === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.from === 'user' ? styles.userText : styles.aiText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Typing indicator */}
      {isAiTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.senderLabel}>Aya</Text>
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>...</Text>
          </View>
        </View>
      )}

      {mode === 'text' && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type your answer..."
            placeholderTextColor={isDark ? '#666' : colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!input.trim() || isAiTyping) && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!input.trim() || isAiTyping}
          >
            <Text style={styles.sendText}>{isAiTyping ? 'Wait...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'voice' && (
        <View style={styles.voiceContainer}>
          {/* Animated voice circle */}
          <View style={styles.voiceCircleContainer}>
            <View style={[styles.voiceCircle, isSpeaking && styles.voiceCircleActive]}>
              <Ionicons 
                name={isSpeaking ? "volume-high" : "mic"} 
                size={48} 
                color="#fff" 
              />
            </View>
            {isSpeaking && (
              <>
                <View style={[styles.pulseCircle, styles.pulse1]} />
                <View style={[styles.pulseCircle, styles.pulse2]} />
                <View style={[styles.pulseCircle, styles.pulse3]} />
              </>
            )}
          </View>
          
          {/* Status text */}
          <Text style={styles.voiceStatusText}>
            {isSpeaking ? 'Aya is speaking...' : 'Listening...'}
          </Text>
          
          {/* Text input below */}
          <View style={styles.voiceInputContainer}>
            <TextInput
              style={styles.voiceInput}
              placeholder="Type your answer here..."
              placeholderTextColor={isDark ? '#666' : colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.voiceSendBtn, (!input.trim() || isAiTyping) && styles.sendBtnDisabled]} 
              onPress={sendMessage}
              disabled={!input.trim() || isAiTyping}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={(!input.trim() || isAiTyping) ? '#999' : '#fff'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? '#0f0f0f' : colors.background,
    },
    header: {
      paddingTop: 70,
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
    },
    headerLeft: {
      flex: 1,
    },
    headerTitle: {
      ...typography.headingSmall,
      fontSize: 18,
      color: colors.primaryBlue,
      marginBottom: 4,
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timerText: {
      ...typography.bodySmall,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '600',
    },
    endInterview: {
      ...typography.bodySmall,
      color: colors.primaryBlue,
      fontWeight: '600',
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: 20,
    },
    messageContainer: {
      marginVertical: 6,
      width: '100%',
    },
    senderLabel: {
      ...typography.caption,
      color: isDark ? '#888' : colors.textMuted,
      marginBottom: 4,
      marginLeft: 12,
    },
    bubble: {
      maxWidth: '75%',
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
    aiText: {
      color: isDark ? '#fff' : colors.textDark,
    },
    userText: {
      color: '#FFFFFF',
    },
    inputRow: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : colors.border,
      alignItems: 'flex-end',
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      gap: 10,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: isDark ? '#444' : colors.border,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 100,
      minHeight: 44,
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      backgroundColor: isDark ? '#2a2a2a' : '#F9FAFB',
    },
    sendBtn: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingVertical: 12,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnDisabled: {
      backgroundColor: isDark ? '#333' : '#D1D5DB',
      opacity: 0.5,
    },
    sendText: {
      ...typography.bodyMedium,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    typingContainer: {
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    typingBubble: {
      backgroundColor: isDark ? '#2a2a2a' : '#F3F4F6',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      alignSelf: 'flex-start',
      maxWidth: '80%',
    },
    typingText: {
      ...typography.body,
      color: isDark ? '#888' : colors.textMuted,
      fontSize: 24,
      lineHeight: 24,
    },
    voiceContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 20,
    },
    voiceCircleContainer: {
      position: 'relative',
      width: 200,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
    },
    voiceCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primaryBlue,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primaryBlue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 10,
    },
    voiceCircleActive: {
      backgroundColor: '#10B981',
      shadowColor: '#10B981',
    },
    pulseCircle: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#10B981',
      opacity: 0.6,
    },
    pulse1: {
      width: 140,
      height: 140,
      borderRadius: 70,
      opacity: 0.4,
    },
    pulse2: {
      width: 160,
      height: 160,
      borderRadius: 80,
      opacity: 0.3,
    },
    pulse3: {
      width: 180,
      height: 180,
      borderRadius: 90,
      opacity: 0.2,
    },
    voiceStatusText: {
      ...typography.bodyMedium,
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 40,
    },
    voiceInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 20,
      gap: 10,
      width: '100%',
    },
    voiceInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: isDark ? '#444' : colors.border,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 100,
      minHeight: 44,
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      backgroundColor: isDark ? '#2a2a2a' : '#F9FAFB',
    },
    voiceSendBtn: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 24,
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    voiceFooter: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : colors.border,
      backgroundColor: isDark ? '#1d3a2b' : '#DCFCE7',
      flexDirection: 'row',
      alignItems: 'center',
    },
    voiceText: {
      ...typography.bodySmall,
      fontSize: 13,
      color: isDark ? '#86EFAC' : '#16A34A',
      flex: 1,
    },
    speakingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    speakingText: {
      ...typography.bodySmall,
      color: colors.primaryBlue,
      fontWeight: '600',
    },
  });

export default InterviewChat;
