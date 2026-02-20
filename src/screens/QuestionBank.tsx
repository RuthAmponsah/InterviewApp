import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from '../config/supabase';

type QuestionCategory = 'Behavioral' | 'Technical' | 'Situational' | 'Strengths' | 'Custom';

type Question = {
  id: string;
  category: QuestionCategory;
  text: string;
  isCustom?: boolean;
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

const CATEGORIES: QuestionCategory[] = ['Behavioral', 'Technical', 'Situational', 'Strengths', 'Custom'];

export default function QuestionBank({ navigation }: any) {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'All' | 'Favorites'>('All');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState<QuestionCategory>('Behavioral');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [previousAnswers, setPreviousAnswers] = useState<any[]>([]);

  useEffect(() => {
    loadCustomQuestions();
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem('favorite_questions');
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (questionId: string) => {
    const newFavorites = new Set(favorites);
    const isAdding = !newFavorites.has(questionId);
    
    if (newFavorites.has(questionId)) {
      newFavorites.delete(questionId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      newFavorites.add(questionId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setFavorites(newFavorites);
    try {
      await AsyncStorage.setItem('favorite_questions', JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // Load previous answers for a selected question
  const loadPreviousAnswers = async (questionId: string) => {
    try {
      const user_id = await AsyncStorage.getItem('userId');
      if (!user_id) return;

      const { data, error } = await supabase
        .from('question_answers')
        .select('*')
        .eq('user_id', user_id)
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading previous answers:', error);
      } else if (data) {
        setPreviousAnswers(data);
      }
    } catch (error) {
      console.error('Error loading previous answers:', error);
    }
  };

  const loadCustomQuestions = async () => {
    try {
      // Get user ID from AsyncStorage
      const user_id = await AsyncStorage.getItem('userId');
      
      if (user_id) {
        const { data, error } = await supabase
          .from('custom_questions')
          .select('id, question_text, category')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error loading from database, trying local storage:', error);
        } else if (data) {
          // Convert database format to Question format
          const dbQuestions: Question[] = data.map((q: any) => ({
            id: q.id,
            category: q.category as QuestionCategory,
            text: q.question_text,
            isCustom: true,
          }));
          setCustomQuestions(dbQuestions);
          return;
        }
      }

      // Fallback to local storage if not logged in or database fails
      const saved = await AsyncStorage.getItem('custom_questions');
      if (saved) {
        setCustomQuestions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading custom questions:', error);
    }
  };

  const saveCustomQuestions = async (questions: Question[]) => {
    try {
      // Update local state
      setCustomQuestions(questions);
      // Also save to local storage as backup
      await AsyncStorage.setItem('custom_questions', JSON.stringify(questions));
    } catch (error) {
      console.error('Error saving custom questions locally:', error);
    }
  };

  const addCustomQuestion = async () => {
    if (!newQuestion.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    try {
      // Get user ID from AsyncStorage
      const user_id = await AsyncStorage.getItem('userId');
      
      if (!user_id) {
        Alert.alert('Error', 'You must be logged in to create custom questions.');
        return;
      }

      // Save to database first
      const { data, error } = await supabase
        .from('custom_questions')
        .insert([
          {
            user_id,
            question_text: newQuestion.trim(),
            category: newCategory,
          },
        ])
        .select();

      if (error) {
        console.error('Database error:', error);
        Alert.alert('Error', 'Failed to create custom question. Please try again.');
        return;
      }

      // Create local question object with database ID
      const question: Question = {
        id: data[0].id, // Use database UUID as ID
        category: newCategory,
        text: newQuestion.trim(),
        isCustom: true,
      };

      // Update local state
      const updated = [...customQuestions, question];
      saveCustomQuestions(updated);
      setNewQuestion('');
      setShowAddModal(false);
      Alert.alert('✅ Success', 'Custom question created and saved!');
    } catch (error) {
      console.error('Error creating custom question:', error);
      Alert.alert('Error', 'Failed to create custom question.');
    }
  };

  const deleteCustomQuestion = (id: string) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this custom question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get user ID from AsyncStorage
              const user_id = await AsyncStorage.getItem('userId');
              if (!user_id) {
                Alert.alert('Error', 'You must be logged in to delete questions.');
                return;
              }

              // Delete from database (specify user_id for RLS)
              const { error } = await supabase
                .from('custom_questions')
                .delete()
                .eq('id', id)
                .eq('user_id', user_id);

              if (error) {
                console.error('Database error:', error);
                Alert.alert('Error', 'Failed to delete question.');
                return;
              }

              // Delete from local state
              const updated = customQuestions.filter(q => q.id !== id);
              saveCustomQuestions(updated);
              Alert.alert('✅ Deleted', 'Custom question removed.');
            } catch (error) {
              console.error('Error deleting question:', error);
              Alert.alert('Error', 'Failed to delete question.');
            }
          },
        },
      ]
    );
  };

  const allQuestions = [...PRACTICE_QUESTIONS, ...customQuestions];
  
  let filteredQuestions = selectedCategory === 'All' 
    ? allQuestions
    : selectedCategory === 'Custom'
    ? customQuestions
    : selectedCategory === 'Favorites'
    ? allQuestions.filter(q => favorites.has(q.id))
    : allQuestions.filter(q => q.category === selectedCategory);

  // Apply search filter
  if (searchQuery.trim()) {
    filteredQuestions = filteredQuestions.filter(q => 
      q.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Save answer to Supabase
  const saveAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) {
      Alert.alert('Error', 'Please write an answer first.');
      return;
    }
    try {
      // Get user ID from AsyncStorage (most reliable method)
      const user_id = await AsyncStorage.getItem('userId');
      console.log('📝 Attempting to save answer - userId:', user_id);
      
      if (!user_id) {
        Alert.alert('Error', 'You must be logged in to save answers.');
        return;
      }

      // Determine question type
      const questionType = selectedQuestion.isCustom ? 'custom' : 'standard';

      const { error } = await supabase.from('question_answers').insert([
        {
          user_id,
          question_id: selectedQuestion.id,
          question_text: selectedQuestion.text,
          answer: answer.trim(),
          question_type: questionType,
        },
      ]);

      if (error) {
        console.error('Database error:', error);
        Alert.alert('Error', 'Failed to save answer. Please try again.');
        return;
      }

      Alert.alert('✅ Saved!', 'Your answer has been saved to your account.');
      setAnswer('');
      setSelectedQuestion(null);
    } catch (error) {
      console.error('Error saving answer:', error);
      Alert.alert('Error', 'Failed to save answer.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomQuestions();
    await loadFavorites();
    setRefreshing(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.root}>
          <ScrollView 
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryBlue}
              />
            }
          >
            <BackButton />
            
            <View style={styles.headerRow}>
              <Text style={styles.logoText}>MY INTERVIEW</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add-circle" size={28} color={colors.primaryBlue} />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Question Bank</Text>
            <Text style={styles.subtitle}>
              Practice answering common interview questions
            </Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search questions..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, selectedCategory === 'All' && styles.filterChipActive]}
                onPress={() => setSelectedCategory('All')}
              >
                <Text style={[styles.filterText, selectedCategory === 'All' && styles.filterTextActive]}>
                  All ({allQuestions.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedCategory === 'Favorites' && styles.filterChipActive]}
                onPress={() => setSelectedCategory('Favorites')}
              >
                <Ionicons 
                  name={selectedCategory === 'Favorites' ? "star" : "star-outline"} 
                  size={16} 
                  color={selectedCategory === 'Favorites' ? '#fff' : colors.textDark}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.filterText, selectedCategory === 'Favorites' && styles.filterTextActive]}>
                  Favorites ({favorites.size})
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
                {filteredQuestions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No questions yet</Text>
                    <Text style={styles.emptySubtext}>Add your first custom question!</Text>
                  </View>
                ) : (
                  filteredQuestions.map((question) => (
                    <View key={question.id} style={styles.questionCard}>
                      <TouchableOpacity
                        style={styles.questionContent}
                        onPress={() => {
                          setSelectedQuestion(question);
                          setAnswer('');
                          setPreviousAnswers([]);
                          loadPreviousAnswers(question.id);
                        }}
                      >
                        <View style={styles.questionHeader}>
                          <Text style={styles.categoryBadge}>{question.category}</Text>
                          {question.isCustom && (
                            <Text style={styles.customBadge}>Custom</Text>
                          )}
                        </View>
                        <Text style={styles.questionText}>{question.text}</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.favoriteButton}
                          onPress={() => toggleFavorite(question.id)}
                        >
                          <Ionicons 
                            name={favorites.has(question.id) ? "star" : "star-outline"} 
                            size={20} 
                            color={favorites.has(question.id) ? "#FFD700" : colors.textMuted}
                          />
                        </TouchableOpacity>
                        {question.isCustom && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => deleteCustomQuestion(question.id)}
                          >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}
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

                {/* Display Previous Answers */}
                {previousAnswers.length > 0 && (
                  <View style={[styles.previousAnswersSection, { borderColor: colors.primaryBlue }]}>
                    <Text style={styles.previousAnswersTitle}>📋 Your Previous Answers ({previousAnswers.length})</Text>
                    {previousAnswers.map((prev, index) => (
                      <View key={index} style={[styles.previousAnswerCard, { backgroundColor: isDark ? '#1a1a1a' : '#f9fafb' }]}>
                        <Text style={styles.previousAnswerDate}>
                          {new Date(prev.created_at).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        <Text style={[styles.previousAnswerText, { color: colors.textDark }]}>{prev.answer}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.answerLabel}>Your Answer (STAR Method)</Text>
                <View style={styles.keyboardHeader}>
                  <TouchableOpacity 
                    style={styles.keyboardDismissButton}
                    onPress={() => Keyboard.dismiss()}
                  >
                    <Ionicons name="chevron-down" size={20} color={colors.primaryBlue} />
                    <Text style={styles.keyboardDismissText}>Close Keyboard</Text>
                  </TouchableOpacity>
                </View>
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
                  <Text style={styles.saveButtonText}>💾 Save Answer</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          {/* Add Custom Question Modal */}
          <Modal
            visible={showAddModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAddModal(false)}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Add Custom Question</Text>
                  <Text style={styles.inputLabel}>Question</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter your question..."
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    value={newQuestion}
                    onChangeText={setNewQuestion}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.categoryGrid}>
                    {['Behavioral', 'Technical', 'Situational', 'Strengths'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryOption,
                          newCategory === cat && styles.categoryOptionSelected
                        ]}
                        onPress={() => setNewCategory(cat as QuestionCategory)}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          newCategory === cat && styles.categoryOptionTextSelected
                        ]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalButtonCancel]}
                      onPress={() => {
                        setShowAddModal(false);
                        setNewQuestion('');
                      }}
                    >
                      <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalButtonSave]}
                      onPress={addCustomQuestion}
                    >
                      <Text style={styles.modalButtonTextSave}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
      paddingTop: 70,
      paddingBottom: 32,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      position: 'relative',
    },
    logoText: {
      ...typography.heading,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 28,
    },
    addButton: {
      position: 'absolute',
      right: 0,
      padding: 4,
    },
    title: {
      ...typography.headingMedium,
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 4,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#3a3a3a' : colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
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
      flexDirection: 'row',
      alignItems: 'center',
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
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyText: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: isDark ? '#fff' : colors.textDark,
      marginTop: 12,
    },
    emptySubtext: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 4,
    },
    questionCard: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    questionContent: {
      flex: 1,
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
      flexDirection: 'row',
      gap: 8,
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
    customBadge: {
      ...typography.caption,
      color: '#8B5CF6',
      fontWeight: '600',
      backgroundColor: '#8B5CF6' + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    favoriteButton: {
      padding: 16,
    },
    deleteButton: {
      padding: 16,
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
    previousAnswersSection: {
      backgroundColor: isDark ? '#1a1a1a' : '#f0f9ff',
      borderRadius: 12,
      padding: 12,
      marginVertical: 12,
      borderLeftWidth: 4,
    },
    previousAnswersTitle: {
      ...typography.bodyMedium,
      color: colors.primaryBlue,
      fontWeight: '700',
      marginBottom: 12,
    },
    previousAnswerCard: {
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
    },
    previousAnswerDate: {
      ...typography.caption,
      color: isDark ? '#999' : '#666',
      marginBottom: 6,
      fontWeight: '500',
    },
    previousAnswerText: {
      ...typography.bodySmall,
      lineHeight: 20,
    },
    keyboardHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
      marginBottom: 8,
    },
    keyboardDismissButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#222' : '#f0f9ff',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primaryBlue,
    },
    keyboardDismissText: {
      ...typography.caption,
      color: colors.primaryBlue,
      fontWeight: '600',
      marginLeft: 4,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: isDark ? "#1d1d1d" : "#fff",
      borderRadius: 20,
      padding: 24,
      width: "100%",
      maxWidth: 400,
    },
    modalTitle: {
      ...typography.headingSmall,
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 20,
      textAlign: "center",
    },
    inputLabel: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginBottom: 8,
      marginTop: 12,
    },
    modalInput: {
      backgroundColor: isDark ? '#2a2a2a' : '#F9FAFB',
      borderRadius: 12,
      padding: 12,
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
      minHeight: 80,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    categoryOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isDark ? '#2a2a2a' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    categoryOptionSelected: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
    },
    categoryOptionText: {
      ...typography.bodySmall,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '500',
    },
    categoryOptionTextSelected: {
      color: '#fff',
      fontWeight: '600',
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    modalButtonCancel: {
      backgroundColor: isDark ? "#2a2a2a" : "#F3F4F6",
    },
    modalButtonSave: {
      backgroundColor: colors.primaryBlue,
    },
    modalButtonTextCancel: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
    },
    modalButtonTextSave: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: "#fff",
    },
  });
