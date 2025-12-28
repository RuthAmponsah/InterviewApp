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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "../config/supabase";
import { initializeInterviewChat, sendMessageToAI, speakText, stopSpeaking } from "../services/aiService";
import { startRecording, stopRecording, transcribeAudio, cancelRecording } from "../services/voiceRecordingService";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const flatListRef = React.useRef<FlatList>(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [jobRole, setJobRole] = useState('');

  React.useEffect(() => {
    ensureSupabaseSession();
    checkInterviewLimit();
    loadUserData();
    
    // Update elapsed time every second
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => {
      clearInterval(interval);
      // Stop any audio when leaving screen
      stopSpeaking();
    };
  }, []);

  const ensureSupabaseSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('⚠️ No session found on InterviewChat load');
        console.log('Attempting to restore session from AsyncStorage...');
        
        // Try to get the manually stored session
        const storedSession = await AsyncStorage.getItem('supabase.session');
        
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          console.log('Found stored session, restoring...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: parsedSession.access_token,
            refresh_token: parsedSession.refresh_token,
          });
          
          if (error) {
            console.error('❌ Failed to restore session:', error);
            console.log('User needs to log out and log back in');
          } else {
            console.log('✅ Session restored successfully!');
            console.log('Session user ID:', data.session?.user.id);
          }
        } else {
          console.error('❌ No stored session found in AsyncStorage');
          console.log('User needs to log out and log back in');
        }
      } else {
        console.log('✅ Active session found on InterviewChat load');
        console.log('Session user ID:', session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const checkInterviewLimit = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      // Check if user is ruth@gmail.com (dev/test account - unlimited access)
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (userEmail === 'ruth@gmail.com') {
        console.log('✅ Developer account - unlimited interviews');
        return;
      }

      // Get user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('subscription_tier, interviews_this_month, last_interview_date')
        .eq('user_id', userId)
        .single();

      if (!prefs) return;

      // If premium, no limit
      if (prefs.subscription_tier === 'monthly' || prefs.subscription_tier === 'annual') {
        return;
      }

      // Check if we need to reset monthly count
      const lastInterview = prefs.last_interview_date ? new Date(prefs.last_interview_date) : null;
      const now = new Date();
      const shouldReset = !lastInterview || 
        (lastInterview.getMonth() !== now.getMonth() || lastInterview.getFullYear() !== now.getFullYear());

      const currentCount = shouldReset ? 0 : (prefs.interviews_this_month || 0);

      // Free tier: 5 interviews per month
      if (currentCount >= 5) {
        Alert.alert(
          '🔒 Interview Limit Reached',
          "You've used all 5 free interviews this month.\n\nUpgrade to Premium for unlimited practice!",
          [
            {
              text: 'Maybe Later',
              onPress: () => navigation.goBack(),
              style: 'cancel',
            },
            {
              text: 'Upgrade Now',
              onPress: () => {
                navigation.goBack();
                setTimeout(() => navigation.navigate('Subscription'), 100);
              },
            },
          ]
        );
        return;
      }

      // Increment count
      await supabase
        .from('user_preferences')
        .update({
          interviews_this_month: currentCount + 1,
          last_interview_date: now.toISOString(),
        })
        .eq('user_id', userId);

    } catch (error) {
      console.error('Error checking interview limit:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const storedRole = await AsyncStorage.getItem('jobRole');
      const userName = await AsyncStorage.getItem('userName');
      
      let greetingText = '';
      
      if (storedRole) {
        setJobRole(storedRole);
        
        // Initialize AI with user context
        initializeInterviewChat(storedRole, userName || undefined);
        
        greetingText = `Hello${userName ? ' ' + userName : ''}! I'm Aya, your interview coach. I see you're preparing for a ${storedRole} position. Let's practice together! Tell me about yourself and why you're interested in this role.`;
      } else {
        // Fallback if no role is set
        initializeInterviewChat('your desired position');
        greetingText = 'Hello! I\'m Aya, your interview coach. Let\'s practice together. Tell me about yourself.';
      }
      
      const greeting: Message = {
        id: '1',
        from: 'ai',
        text: greetingText,
      };
      setMessages([greeting]);
      
      // Speak the greeting in voice mode
      if (mode === 'voice') {
        console.log('Speaking initial greeting in voice mode...');
        setIsSpeaking(true);
        await speakText(greetingText);
        setIsSpeaking(false);
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

  const handleVoicePress = async () => {
    try {
      if (isRecording) {
        // Stop recording and transcribe
        setIsRecording(false);
        const audioUri = await stopRecording();
        
        if (audioUri) {
          setIsTranscribing(true);
          const transcript = await transcribeAudio(audioUri);
          setIsTranscribing(false);
          
          if (transcript && transcript.trim()) {
            setInput(transcript);
            // Auto-send after transcription
            setTimeout(() => {
              sendMessageWithText(transcript);
            }, 500);
          }
        }
      } else {
        // Start recording
        const started = await startRecording();
        if (started) {
          setIsRecording(true);
          setInput(''); // Clear input when starting to record
        } else {
          Alert.alert(
            'Microphone Access',
            'Please allow microphone access in your device settings to use voice input.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      setIsRecording(false);
      setIsTranscribing(false);
      Alert.alert('Error', 'Failed to process voice input. Please try again.');
    }
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isAiTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userInput = text.trim();
    setInput('');

    // Auto-scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Send to AI
    setIsAiTyping(true);
    const aiResponse = await sendMessageToAI(userInput);
    setIsAiTyping(false);

    if (aiResponse) {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: aiResponse,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // If voice mode, speak the AI response
      if (mode === 'voice' && aiResponse) {
        setIsSpeaking(true);
        await speakText(aiResponse);
        setIsSpeaking(false);
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isAiTyping) return;
    sendMessageWithText(input);
  };

  const endInterview = async () => {
    try {
      // Stop any speaking immediately
      await stopSpeaking();
      
      const userId = await AsyncStorage.getItem("userId");
      
      if (userId) {
        // Calculate duration in minutes
        const durationMs = Date.now() - startTime;
        const durationMinutes = Math.round(durationMs / 60000);
        const userMessageCount = messages.filter(m => m.from === 'user').length;
        const hasNoResponses = userMessageCount === 0;

        console.log('Saving interview to database...');
        console.log('User ID:', userId);
        console.log('Job Role:', jobRole || 'Not set');
        console.log('Duration:', durationMinutes);
        console.log('User messages:', userMessageCount);

        // Check if Supabase session exists
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Supabase session active:', session ? 'Yes' : 'No');
        console.log('Session user ID:', session?.user?.id);
        console.log('Expected user ID:', userId);
        
        if (!session) {
          console.error('❌ No Supabase session - RLS will block insert');
          // Still try the insert but it will likely fail
        }
        
        if (session && session.user.id !== userId) {
          console.error('⚠️ Session user ID does not match stored userId!');
          console.error('This will cause RLS policy violation');
        }

        // Save to interview_history (even if no job role, use 'Unknown')
        const { data: insertedInterview, error: insertError } = await supabase
          .from('interview_history')
          .insert({
            user_id: userId,
            job_role: jobRole || 'Unknown',
            mode: mode,
            duration_minutes: durationMinutes,
            date: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error inserting interview:', insertError);
          console.error('Full error details:', JSON.stringify(insertError, null, 2));
          console.error('Insert failed - interviewId will be undefined');
          // Continue anyway to show feedback, but note the issue
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
        
        const interviewId = insertedInterview?.id;
        
        console.log('Navigating to Feedback with ID:', interviewId);
        
        // Navigate with flag if user submitted nothing
        navigation.navigate('Feedback', { 
          duration: durationMinutes, 
          messageCount: userMessageCount,
          interviewId: interviewId,
          hasNoResponses: hasNoResponses
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

      {/* Message list - shown in both text and voice modes */}
      <FlatList
        ref={flatListRef}
        style={[styles.list, mode === 'voice' && styles.listVoiceMode]}
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

      {/* Typing indicator - shown in both modes */}
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
        <View style={styles.voiceInputRow}>
          {/* Voice button */}
          <TouchableOpacity 
            style={[
              styles.voiceButton, 
              (isSpeaking || isAiTyping) && styles.voiceButtonDisabled,
              isRecording && styles.voiceButtonRecording
            ]}
            onPress={handleVoicePress}
            disabled={isSpeaking || isAiTyping}
          >
            <Ionicons 
              name={isRecording ? "stop" : isTranscribing ? "hourglass" : isSpeaking ? "volume-high" : "mic"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          {/* Text input */}
          <TextInput
            style={styles.voiceTextInput}
            placeholder={
              isTranscribing 
                ? 'Transcribing...' 
                : isRecording 
                ? 'Recording... (Tap to stop)' 
                : isSpeaking 
                ? 'Aya is speaking...'
                : 'Tap mic or type here...'
            }
            placeholderTextColor={isDark ? '#666' : colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!isRecording && !isTranscribing}
          />
          
          {/* Send button */}
          <TouchableOpacity 
            style={[styles.sendBtn, (!input.trim() || isAiTyping || isRecording || isTranscribing) && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!input.trim() || isAiTyping || isRecording || isTranscribing}
          >
            <Text style={styles.sendText}>{isAiTyping ? 'Wait...' : 'Send'}</Text>
          </TouchableOpacity>
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
    voiceCircleRecording: {
      backgroundColor: '#EF4444',
      shadowColor: '#EF4444',
    },
    voiceCircleDisabled: {
      backgroundColor: '#999',
      shadowColor: '#999',
      opacity: 0.6,
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
    listVoiceMode: {
      flex: 1,
    },
    voiceInputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : colors.border,
      backgroundColor: isDark ? '#1d1d1d' : '#fff',
    },
    voiceButton: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 24,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    voiceButtonRecording: {
      backgroundColor: '#EF4444',
    },
    voiceButtonDisabled: {
      backgroundColor: '#999',
      opacity: 0.6,
    },
    voiceTextInput: {
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
  });

export default InterviewChat;
