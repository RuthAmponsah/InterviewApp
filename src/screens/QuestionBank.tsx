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
import ScreenHeader from "../components/ScreenHeader";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from '../config/supabase';
import { getQuestionAnswerFeedback, type QuestionAnswerFeedback } from "../services/aiService";
import PaywallModal from "../components/PaywallModal";

type QuestionCategory = 'Behavioral' | 'Technical' | 'Situational' | 'Strengths' | 'Role-Specific' | 'Custom';

type Question = {
  id: string;
  category: QuestionCategory;
  text: string;
  isCustom?: boolean;
  isPremium?: boolean;
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
  
  // Role-Specific (Premium) - Software Engineer
  { id: 'rs-1', category: 'Role-Specific', text: 'Walk me through your approach to debugging a critical production bug affecting customer transactions.', isPremium: true },
  { id: 'rs-2', category: 'Role-Specific', text: 'Describe how you would refactor a large, working codebase to improve performance and maintainability.', isPremium: true },
  { id: 'rs-3', category: 'Role-Specific', text: 'Tell me about your experience designing and implementing a system that scales to handle millions of users.', isPremium: true },
  { id: 'rs-4', category: 'Role-Specific', text: 'How do you approach code reviews? Give an example of constructive feedback you\'ve given a colleague.', isPremium: true },
  
  // Role-Specific (Premium) - Data Analyst
  { id: 'rs-5', category: 'Role-Specific', text: 'Describe a time when you identified an anomaly in data and how you investigated and resolved it.', isPremium: true },
  { id: 'rs-6', category: 'Role-Specific', text: 'Walk me through how you would build a dashboard to track key business metrics for executives.', isPremium: true },
  { id: 'rs-7', category: 'Role-Specific', text: 'Tell me about a time you used data to challenge an existing business assumption or decision.', isPremium: true },
  { id: 'rs-8', category: 'Role-Specific', text: 'How do you ensure data quality when working with multiple sources and complex datasets?', isPremium: true },
  
  // Role-Specific (Premium) - Sales
  { id: 'rs-9', category: 'Role-Specific', text: 'Describe how you\'ve turned a prospect who initially said "no" into a closed deal.', isPremium: true },
  { id: 'rs-10', category: 'Role-Specific', text: 'Walk me through your process for understanding a customer\'s pain points and positioning our solution.', isPremium: true },
  { id: 'rs-11', category: 'Role-Specific', text: 'Tell me about your strategy for managing a pipeline with strict quarterly targets.', isPremium: true },
  { id: 'rs-12', category: 'Role-Specific', text: 'How do you build long-term relationships with clients and identify upsell opportunities?', isPremium: true },
  
  // Role-Specific (Premium) - Project Manager
  { id: 'rs-13', category: 'Role-Specific', text: 'Describe a project that went off track. How did you identify the issue and get it back on schedule?', isPremium: true },
  { id: 'rs-14', category: 'Role-Specific', text: 'Walk me through your approach to managing stakeholder expectations across a complex project.', isPremium: true },
  { id: 'rs-15', category: 'Role-Specific', text: 'Tell me about a time you had to manage conflicting priorities between team members or departments.', isPremium: true },
  { id: 'rs-16', category: 'Role-Specific', text: 'How do you measure project success and communicate progress to leadership?', isPremium: true },
  
  // Role-Specific (Premium) - Marketing
  { id: 'rs-17', category: 'Role-Specific', text: 'Describe a marketing campaign you created from scratch and how you measured its success.', isPremium: true },
  { id: 'rs-18', category: 'Role-Specific', text: 'Walk me through your approach to A/B testing and optimizing marketing performance.', isPremium: true },
  { id: 'rs-19', category: 'Role-Specific', text: 'Tell me about a time you had to pivot a marketing strategy based on data or market changes.', isPremium: true },
  { id: 'rs-20', category: 'Role-Specific', text: 'How do you collaborate with sales and product teams to ensure aligned messaging and targets?', isPremium: true },
];

const AI_FREE_LIMIT = 2;
const AI_USAGE_KEY = 'question_bank_ai_usage_v1';

const CATEGORIES: QuestionCategory[] = ['Behavioral', 'Technical', 'Situational', 'Strengths', 'Role-Specific', 'Custom'];

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
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [jobRole, setJobRole] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<QuestionAnswerFeedback | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadCustomQuestions();
    loadFavorites();
    loadUserData();
    loadAiUsage();
  }, []);


  const loadAiUsage = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const stored = await AsyncStorage.getItem(AI_USAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { date: string; count: number };
        if (parsed.date === today) {
          setAiUsageCount(parsed.count || 0);
          return;
        }
      }
      await AsyncStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      setAiUsageCount(0);
    } catch (error) {
      console.error('Error loading AI usage:', error);
    }
  };

  const incrementAiUsage = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const nextCount = aiUsageCount + 1;
      await AsyncStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: today, count: nextCount }));
      setAiUsageCount(nextCount);
    } catch (error) {
      console.error('Error saving AI usage:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const jobRoleStored = await AsyncStorage.getItem('jobRole');
      
      if (userId) {
        // Load subscription tier from database
        const { data, error } = await supabase
          .from('user_preferences')
          .select('subscription_tier')
          .eq('user_id', userId)
          .single();
        
        if (data) {
          setSubscriptionTier(data.subscription_tier || 'free');
        }
      }
      
      if (jobRoleStored) {
        setJobRole(jobRoleStored);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

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

  const handleGetAiFeedback = async () => {
    if (!selectedQuestion || !answer.trim()) {
      Alert.alert('Error', 'Please write an answer first.');
      return;
    }

    if (subscriptionTier === 'free' && aiUsageCount >= AI_FREE_LIMIT) {
      Alert.alert(
        'AI Feedback Limit Reached',
        'You have used your 2 free AI feedback requests for today. Upgrade for unlimited feedback.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => setShowPaywall(true) },
        ]
      );
      return;
    }

    try {
      setAiLoading(true);
      const feedback = await getQuestionAnswerFeedback(
        selectedQuestion.text,
        answer.trim(),
        jobRole || undefined
      );

      if (!feedback) {
        Alert.alert('Error', 'Unable to generate feedback right now. Please try again.');
        return;
      }

      setAiFeedback(feedback);

      if (subscriptionTier === 'free') {
        await incrementAiUsage();
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      Alert.alert('Error', 'Unable to generate feedback right now.');
    } finally {
      setAiLoading(false);
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
            <ScreenHeader />
            
            <View style={styles.headerRow}>
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.title}>Question Bank</Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primaryBlue + '15', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primaryBlue }]}
                onPress={() => setShowAddModal(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="add-circle" size={20} color={colors.primaryBlue} />
                  <Text style={{ color: colors.primaryBlue, fontSize: 12, fontWeight: '600' }}>Add</Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              Practice answering common interview questions
            </Text>

            {/* Info banner about custom questions */}
            <View style={[styles.infoBanner, { backgroundColor: colors.primaryBlue + '08', borderColor: colors.primaryBlue + '30', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start' }]}>
              <Ionicons name="information-circle" size={16} color={colors.primaryBlue} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[styles.infoBannerText, { color: isDark ? '#b5b5b5' : colors.textMuted, fontSize: 12, flex: 1 }]}>
                Use the <Text style={{ fontWeight: '600', color: colors.primaryBlue }}>Add</Text> button to create your own interview questions
              </Text>
            </View>

            {/* Premium unlock message for role-specific */}
            {subscriptionTier === 'free' && (
              <View style={[styles.premiumUnlockBanner, { backgroundColor: colors.primaryBlue + '15', borderColor: colors.primaryBlue, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="lock-closed" size={16} color={colors.primaryBlue} style={{ marginRight: 8 }} />
                <Text style={[styles.premiumUnlockText, { color: colors.primaryBlue, fontSize: 13 }]}>
                  Unlock role-specific questions with Premium
                </Text>
              </View>
            )}

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
                <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search" accessibilityRole="button">
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
                    <View style={styles.emptyIllustration}>
                      <View style={styles.emptyCircle}>
                        <Ionicons name="help-circle-outline" size={52} color={colors.primaryBlue} />
                      </View>
                      <View style={styles.emptyDotA} />
                      <View style={styles.emptyDotB} />
                    </View>
                    <Text style={styles.emptyText}>No questions yet</Text>
                    <Text style={styles.emptySubtext}>Add your first custom question!</Text>
                  </View>
                ) : (
                  filteredQuestions.map((question) => (
                    <View key={question.id}>
                      {question.isPremium && subscriptionTier === 'free' ? (
                        <TouchableOpacity 
                          style={[styles.questionCard, { backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }]}
                          onPress={() => setShowPaywall(true)}
                        >
                          <View style={styles.lockedQuestionContent}>
                            <View style={{ flex: 1, position: 'relative' }}>
                              <View style={styles.questionHeader}>
                                <Text style={[styles.categoryBadge, { opacity: 0.4 }]}>{question.category}</Text>
                              </View>
                              <View style={{ position: 'relative', marginVertical: 8 }}>
                                <Text style={[styles.questionText, { color: colors.textDark, marginVertical: 8, opacity: 0 }]}>{question.text}</Text>
                                <View style={{ 
                                  position: 'absolute', 
                                  top: 0, 
                                  left: 0, 
                                  right: 0, 
                                  bottom: 0,
                                  backgroundColor: isDark ? '#2a2a2a' : '#F0F0F0',
                                  borderRadius: 6,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  opacity: 0.85
                                }}>
                                  <View style={{ alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '500' }}>Premium content</Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 10 }}>Tap to unlock</Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.questionCard}>
                          <TouchableOpacity
                            style={styles.questionContent}
                            onPress={() => {
                              setSelectedQuestion(question);
                              setAnswer('');
                              setAiFeedback(null);
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
                                accessibilityLabel="Delete question"
                                accessibilityRole="button"
                              >
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      )}
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
                  onChangeText={(text) => {
                    setAnswer(text);
                    setAiFeedback(null);
                  }}
                  multiline
                  numberOfLines={12}
                  textAlignVertical="top"
                />

                <TouchableOpacity style={styles.saveButton} onPress={saveAnswer}>
                  <Text style={styles.saveButtonText}>💾 Save Answer</Text>
                </TouchableOpacity>

                <View style={styles.aiSection}>
                  {subscriptionTier === 'free' && (
                    <Text style={styles.aiUsageText}>
                      Free AI feedback left today: {Math.max(0, AI_FREE_LIMIT - aiUsageCount)}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.aiButton, aiLoading && { opacity: 0.6 }]}
                    onPress={handleGetAiFeedback}
                    disabled={aiLoading}
                  >
                    <Text style={styles.aiButtonText}>
                      {aiLoading ? 'Analyzing...' : 'Get AI Feedback'}
                    </Text>
                  </TouchableOpacity>

                  {aiFeedback && (
                    <View style={styles.aiFeedbackCard}>
                      <View style={styles.aiFeedbackHeader}>
                        <Text style={styles.aiFeedbackTitle}>AI Feedback</Text>
                        <View style={styles.aiScoreBadge}>
                          <Text style={styles.aiScoreText}>{aiFeedback.score}/10</Text>
                        </View>
                      </View>

                      <Text style={styles.aiSectionLabel}>Strengths</Text>
                      {aiFeedback.strengths.map((item, index) => (
                        <Text key={`s-${index}`} style={styles.aiFeedbackItem}>• {item}</Text>
                      ))}

                      <Text style={styles.aiSectionLabel}>Improvements</Text>
                      {aiFeedback.improvements.map((item, index) => (
                        <Text key={`i-${index}`} style={styles.aiFeedbackItem}>• {item}</Text>
                      ))}

                      <Text style={styles.aiSectionLabel}>Better Answer</Text>
                      <Text style={styles.aiFeedbackText}>{aiFeedback.betterAnswer}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
          <PaywallModal
            visible={showPaywall}
            onClose={() => setShowPaywall(false)}
            onSuccess={() => loadUserData()}
          />
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
      ...typography.brandMark,
      color: colors.primaryBlue,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    addButton: {
      padding: 0,
    },
    title: {
      ...typography.headingMedium,
      textAlign: 'center',
      color: isDark ? "#fff" : colors.textDark,
    },
    subtitle: {
      ...typography.bodyMedium,
      textAlign: 'center',
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginBottom: 20,
    },
    infoBanner: {
      gap: 8,
    },
    infoBannerText: {
      ...typography.caption,
    },
    premiumUnlockBanner: {
      gap: 8,
    },
    premiumUnlockText: {
      ...typography.bodySmall,
      fontWeight: '600',
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
      marginBottom: 24,
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
    emptyIllustration: {
      width: 120,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primaryBlue + '14',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyDotA: {
      position: 'absolute',
      top: 6,
      right: 8,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.primaryBlue + '28',
    },
    emptyDotB: {
      position: 'absolute',
      bottom: 6,
      left: 10,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primaryBlue + '1e',
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
    lockedQuestionContent: {
      flex: 1,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
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
    aiSection: {
      marginTop: 16,
      gap: 12,
    },
    aiUsageText: {
      ...typography.caption,
      color: isDark ? '#b5b5b5' : colors.textMuted,
    },
    aiButton: {
      backgroundColor: isDark ? '#111827' : '#111827',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    aiButtonText: {
      ...typography.bodyMedium,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    aiFeedbackCard: {
      backgroundColor: isDark ? '#1a1a1a' : '#F9FAFB',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
      gap: 8,
    },
    aiFeedbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    aiFeedbackTitle: {
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '700',
    },
    aiScoreBadge: {
      backgroundColor: colors.primaryBlue + '20',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    aiScoreText: {
      ...typography.caption,
      color: colors.primaryBlue,
      fontWeight: '700',
    },
    aiSectionLabel: {
      ...typography.caption,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      fontWeight: '600',
      marginTop: 4,
    },
    aiFeedbackItem: {
      ...typography.bodySmall,
      color: isDark ? '#fff' : colors.textDark,
    },
    aiFeedbackText: {
      ...typography.bodySmall,
      color: isDark ? '#fff' : colors.textDark,
      lineHeight: 18,
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
