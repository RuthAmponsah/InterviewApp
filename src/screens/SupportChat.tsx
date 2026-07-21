import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import ScreenHeader from "../components/ScreenHeader";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { getSupportAgentReply } from "../services/aiService";
import { keyboardDismissMode } from "../utils/keyboard";

const KNOWLEDGE_BASE = [
  {
    keywords: ["what is", "my interview", "app"],
    answer:
      "My Interview is an AI-powered mock interview coach to help you practise, get feedback, and build confidence.",
  },
  {
    keywords: ["aya", "questions", "generate"],
    answer:
      "Aya uses your selected job role to tailor interview questions and feedback to your goals.",
  },
  {
    keywords: ["job", "role", "preferences", "change"],
    answer:
      "You can change your job role anytime in Settings → Job Preferences.",
  },
  {
    keywords: ["onboarding", "welcome", "first time"],
    answer:
      "Onboarding helps set your job role and preferences. You can revisit settings anytime to update your role.",
  },
  {
    keywords: ["cv", "resume"],
    answer:
      "The CV tool lets you paste your CV text to get suggestions and improvements from Aya.",
  },
  {
    keywords: ["paste", "analyze", "analyse"],
    answer:
      "Paste your CV text and tap Analyse CV. Aya will return suggestions based on your target job role.",
  },
  {
    keywords: ["saved jobs", "jobs"],
    answer:
      "The Jobs page lets you browse roles and save them. Use filters or search to narrow results.",
  },
  {
    keywords: ["location", "city", "remote", "hybrid", "on-site"],
    answer:
      "In Jobs, you can filter by location and work type (Remote, Hybrid, On-site).",
  },
  {
    keywords: ["subscription", "premium", "pay"],
    answer:
      "Some features are free, with optional premium upgrades available in the Subscription section.",
  },
  {
    keywords: ["profile", "name", "photo"],
    answer:
      "Update your profile info in Profile or Settings → Edit Profile.",
  },
  {
    keywords: ["dark mode", "light mode", "theme", "appearance"],
    answer:
      "Go to Settings → App customisation, then choose Light, Dark, or Match system.",
  },
  {
    keywords: ["privacy", "data", "delete"],
    answer:
      "You can manage privacy and account options in Settings → Privacy & Security.",
  },
  {
    keywords: ["notifications"],
    answer:
      "Notification settings can be updated in Settings → Notifications.",
  },
  {
    keywords: ["password", "reset"],
    answer:
      "You can reset your password from the Sign In screen or update it in Settings → Change Password.",
  },
  {
    keywords: ["interview", "practice", "feedback"],
    answer:
      "Start an interview from Home, and Aya will ask questions and give feedback tailored to your role.",
  },
  {
    keywords: ["transcript", "transcription", "recording"],
    answer:
      "After an interview, you can view your transcript in the Feedback screen. It appears alongside your feedback summary.",
  },
  {
    keywords: ["history", "progress", "dashboard"],
    answer:
      "Your interview history and progress are available in Settings → Interview History and Progress Dashboard.",
  },
  {
    keywords: ["question bank"],
    answer:
      "Question Bank gives you extra practice questions for your role in Settings → Question Bank.",
  },
  {
    keywords: ["success stories"],
    answer:
      "Success Stories lets you read and share wins from other users in Settings → Success Stories.",
  },
];

type ChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
};

const SupportChat: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "agent",
      text: "Hi! I can help with questions about the app. Ask me anything about features, settings, or how to use My Interview.",
    },
  ]);
  const [input, setInput] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [inputHeight, setInputHeight] = useState(44);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const findAnswer = (text: string) => {
    const normalized = text.toLowerCase();
    let bestScore = 0;
    let bestAnswer = "";

    for (const item of KNOWLEDGE_BASE) {
      const score = item.keywords.reduce(
        (count, keyword) => (normalized.includes(keyword) ? count + 1 : count),
        0
      );
      if (score > bestScore) {
        bestScore = score;
        bestAnswer = item.answer;
      }
    }

    if (bestScore > 0) {
      return bestAnswer;
    }

    return "I’m not fully sure I understood. Do you mean interviews, CV feedback, jobs, or account settings? If you still need help, go back and tap Contact support to email the team.";
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const reply = await getSupportAgentReply(trimmed);
      const fallback = findAnswer(trimmed);

      let responseText = reply.answer || fallback;
      if (reply.askClarify && reply.clarifyQuestion) {
        responseText = `${responseText} ${reply.clarifyQuestion}`;
      }
      if (reply.refuse && reply.suggestedHelp) {
        responseText = `${responseText} ${reply.suggestedHelp}`;
      }

      const agentMessage: ChatMessage = {
        id: `agent-${Date.now() + 1}`,
        role: "agent",
        text: responseText,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now() + 1}`,
        role: "agent",
        text: "Sorry, I had trouble answering that. Go back and tap Contact support to email the team.",
      };
      setMessages((prev) => [...prev, agentMessage]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={keyboardDismissMode}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        <ScreenHeader />
        <Text style={styles.title}>Chat with an agent</Text>
        <Text style={styles.subtitle}>
          Ask about features, settings, or how to use the app.
        </Text>

        <View style={styles.chatContainer}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.message,
                msg.role === "user" ? styles.userMessage : styles.agentMessage,
              ]}
            >
              <Text style={styles.messageText}>{msg.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.inputBar, { bottom: keyboardHeight }]}>
        <TextInput
          style={[styles.input, { height: Math.min(120, Math.max(44, inputHeight)) }]}
          placeholder="Type your question..."
          placeholderTextColor={isDark ? "#666" : colors.textMuted}
          selectionColor={colors.primaryBlue}
          value={input}
          onChangeText={setInput}
          onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
          multiline
          onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6" },
    content: {
      paddingHorizontal: 20,
            paddingBottom: 200,
    },
    logoText: {
      ...typography.brandMark,
      color: colors.primaryBlue,
    },
    title: {
      ...typography.headingMedium,
      textAlign: 'center',
      color: isDark ? "#fff" : colors.textDark,
    },
    subtitle: {
      ...typography.bodySmall,
      textAlign: 'center',
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    chatContainer: {
      backgroundColor: isDark ? "#1d1d1d" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      gap: 12,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    message: {
      padding: 12,
      borderRadius: 12,
      maxWidth: "90%",
    },
    userMessage: {
      alignSelf: "flex-end",
      backgroundColor: colors.primaryBlue,
    },
    agentMessage: {
      alignSelf: "flex-start",
      backgroundColor: isDark ? "#2a2a2a" : "#EEF2FF",
    },
    messageText: {
      ...typography.bodySmall,
      color: isDark ? "#fff" : colors.textDark,
    },
    inputBar: {
      position: "absolute",
      left: 0,
      right: 0,
      flexDirection: "row",
      gap: 10,
      padding: 12,
      backgroundColor: isDark ? "#121212" : "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: isDark ? "#2a2a2a" : "#E5E7EB",
    },
    input: {
      ...typography.bodySmall,
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      borderRadius: 12,
      backgroundColor: isDark ? "#1d1d1d" : "#F3F4F6",
      borderWidth: 1,
      borderColor: isDark ? "#2a2a2a" : "#E5E7EB",
      color: isDark ? "#fff" : "#111",
      textAlignVertical: "center",
    },
    sendButton: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      paddingHorizontal: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    sendText: {
      ...typography.label,
      color: "#fff",
      fontWeight: "600",
    },
  });

export default SupportChat;
