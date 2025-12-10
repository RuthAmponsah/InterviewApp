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

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'ai',
      text: 'Hello! I\'m Aya, your interview coach. Let\'s practice together. Tell me about yourself and what role you\'re preparing for.',
    },
  ]);
  const [input, setInput] = useState('');
  const flatListRef = React.useRef<FlatList>(null);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Auto-scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: 'That\'s a great answer! Can you tell me more about a specific example?',
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const endInterview = () => {
    navigation.navigate('Feedback');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>MY INTERVIEW</Text>
            <TouchableOpacity onPress={endInterview}>
              <Text style={styles.endInterview}>End interview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>

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
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'voice' && (
        <View style={styles.voiceFooter}>
          <Text style={styles.voiceText}>
            Voice mode coming soon — for now, you can use text mode to practice
            your answers.
          </Text>
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
      paddingTop: 52,
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
    },
    headerTitle: {
      ...typography.headingSmall,
      fontSize: 18,
      color: colors.primaryBlue,
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
    voiceFooter: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : colors.border,
      backgroundColor: isDark ? '#2b2415' : '#FEF3C7',
    },
    voiceText: {
      ...typography.bodySmall,
      fontSize: 13,
      color: isDark ? '#f3c77a' : '#92400E',
    },
  });

export default InterviewChat;
