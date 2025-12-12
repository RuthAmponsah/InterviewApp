import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

type QuestionCategory = 'Behavioral' | 'Technical' | 'Situational' | 'Strengths';

type Question = {
  id: string;
  category: QuestionCategory;
  text: string;
};

const PRACTICE_QUESTIONS: Question[] = [
  // Behavioral
  { id: '1', category: 'Behavioral', text: 'Tell me about yourself.' },
  { id: '2', category: 'Behavioral', text: 'Why do you want to work here?' },
  { id: '3', category: 'Behavioral', text: 'Tell me about a time you faced a challenge at work.' },
  { id: '4', category: 'Behavioral', text: 'Describe a time you worked on a team project.' },
  { id: '5', category: 'Behavioral', text: 'Tell me about a time you had a conflict with a coworker.' },
  { id: '6', category: 'Behavioral', text: 'Describe a time you failed and what you learned.' },
  { id: '7', category: 'Behavioral', text: 'Tell me about a time you showed leadership.' },
  { id: '8', category: 'Behavioral', text: 'Describe a time you had to meet a tight deadline.' },
  
  // Technical  
  { id: '9', category: 'Technical', text: 'What programming languages are you proficient in?' },
  { id: '10', category: 'Technical', text: 'Explain the difference between SQL and NoSQL databases.' },
  { id: '11', category: 'Technical', text: 'How would you optimize a slow database query?' },
  { id: '12', category: 'Technical', text: 'What is your experience with cloud platforms?' },
  { id: '13', category: 'Technical', text: 'Explain what RESTful APIs are.' },
  { id: '14', category: 'Technical', text: 'How do you handle errors in your code?' },
  { id: '15', category: 'Technical', text: 'What testing frameworks have you used?' },
  { id: '16', category: 'Technical', text: 'Explain version control and Git workflow.' },
  
  // Situational
  { id: '17', category: 'Situational', text: 'How would you handle an angry customer?' },
  { id: '18', category: 'Situational', text: 'What would you do if you disagreed with your manager?' },
  { id: '19', category: 'Situational', text: 'How would you prioritize multiple urgent tasks?' },
  { id: '20', category: 'Situational', text: 'What would you do if you made a mistake at work?' },
  { id: '21', category: 'Situational', text: 'How would you handle a team member not pulling their weight?' },
  { id: '22', category: 'Situational', text: 'What would you do if asked to do something unethical?' },
  { id: '23', category: 'Situational', text: 'How would you approach learning a new technology quickly?' },
  { id: '24', category: 'Situational', text: 'What would you do if you couldn\'t meet a deadline?' },
  
  // Strengths
  { id: '25', category: 'Strengths', text: 'What are your greatest strengths?' },
  { id: '26', category: 'Strengths', text: 'What are your weaknesses?' },
  { id: '27', category: 'Strengths', text: 'Why should we hire you?' },
  { id: '28', category: 'Strengths', text: 'Where do you see yourself in 5 years?' },
  { id: '29', category: 'Strengths', text: 'What motivates you?' },
  { id: '30', category: 'Strengths', text: 'What makes you unique?' },
  { id: '31', category: 'Strengths', text: 'What are you passionate about?' },
  { id: '32', category: 'Strengths', text: 'What is your greatest accomplishment?' },
];

const CATEGORIES: QuestionCategory[] = ['Behavioral', 'Technical', 'Situational', 'Strengths'];

export default function QuestionBank({ navigation }: any) {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'All'>('All');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');

  const filteredQuestions = selectedCategory === 'All' 
    ? PRACTICE_QUESTIONS 
    : PRACTICE_QUESTIONS.filter(q => q.category === selectedCategory);

  const saveAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) {
      Alert.alert('Error', 'Please write an answer first.');
      return;
    }

    try {
      const key = `answer_${selectedQuestion.id}`;
      await AsyncStorage.setItem(key, answer);
      Alert.alert('Saved!', 'Your answer has been saved.');
      setAnswer('');
      setSelectedQuestion(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save answer.');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />
        
        <Text style={styles.logoText}>MY INTERVIEW</Text>

        <Text style={styles.title}>Question Bank</Text>
        <Text style={styles.subtitle}>
          Practice answering common interview questions
        </Text>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'All' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[styles.filterText, selectedCategory === 'All' && styles.filterTextActive]}>
              All ({PRACTICE_QUESTIONS.length})
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Questions List */}
        {!selectedQuestion ? (
          <View style={styles.questionsList}>
            {filteredQuestions.map((question) => (
              <TouchableOpacity
                key={question.id}
                style={styles.questionCard}
                onPress={() => setSelectedQuestion(question)}
              >
                <View style={styles.questionHeader}>
                  <Text style={styles.categoryBadge}>{question.category}</Text>
                </View>
                <Text style={styles.questionText}>{question.text}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.answerSection}>
            <TouchableOpacity
              style={styles.backToList}
              onPress={() => {
                setSelectedQuestion(null);
                setAnswer('');
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primaryBlue} />
              <Text style={styles.backToListText}>Back to questions</Text>
            </TouchableOpacity>

            <View style={styles.selectedQuestionCard}>
              <Text style={styles.categoryBadge}>{selectedQuestion.category}</Text>
              <Text style={styles.selectedQuestionText}>{selectedQuestion.text}</Text>
            </View>

            <Text style={styles.answerLabel}>Your Answer (STAR Method)</Text>
            <TextInput
              style={styles.answerInput}
              placeholder="Situation: Describe the context...
Task: What needed to be done?
Action: What did you do?
Result: What was the outcome?"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={answer}
              onChangeText={setAnswer}
              multiline
              numberOfLines={12}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveAnswer}>
              <Text style={styles.saveButtonText}>Save Answer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6",
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 80,
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
      marginBottom: 4,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginBottom: 20,
    },
    filterRow: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      marginRight: 8,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
    },
    filterText: {
      ...typography.bodySmall,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '500',
    },
    filterTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    questionsList: {
      gap: 12,
    },
    questionCard: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    questionHeader: {
      marginBottom: 8,
    },
    categoryBadge: {
      ...typography.caption,
      color: colors.primaryBlue,
      fontWeight: '600',
      backgroundColor: colors.primaryBlue + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    questionText: {
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      flex: 1,
    },
    answerSection: {
      gap: 16,
    },
    backToList: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    backToListText: {
      ...typography.bodyMedium,
      color: colors.primaryBlue,
      fontWeight: '600',
    },
    selectedQuestionCard: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    selectedQuestionText: {
      ...typography.body,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '600',
    },
    answerLabel: {
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '600',
      marginTop: 8,
    },
    answerInput: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      height: 240,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
    },
    saveButton: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonText: {
      ...typography.bodyMedium,
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });
