import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/colors';

const { width, height } = Dimensions.get('window');

type TutorialCategory = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  steps: TutorialStep[];
};

type TutorialStep = {
  title: string;
  description: string;
  image: any;
};

const TUTORIAL_CATEGORIES: TutorialCategory[] = [
  {
    id: 'home',
    title: 'Home',
    icon: 'home-outline',
    steps: [
      {
        title: 'Your Dashboard',
        description: 'Welcome to your home screen! See your streak, daily tips, latest feedback, and quickly start an interview.',
        image: require('../../assets/tutorial/homepage.png'),
      },
    ],
  },
  {
    id: 'interview',
    title: 'Interviews',
    icon: 'mic-outline',
    steps: [
      {
        title: 'Choose Interview Type',
        description: 'Select between Vocal (voice) or Text-based interviews. Complete the checklist before starting.',
        image: require('../../assets/tutorial/interviewtype.png'),
      },
      {
        title: 'Voice Recording',
        description: 'Tap the mic to record your answer. Tap again to stop. Your voice is transcribed automatically.',
        image: require('../../assets/tutorial/recordinterview.jpg'),
      },
      {
        title: 'Stop Recording',
        description: 'When you\'re done speaking, tap the red button to stop recording. Your answer will be sent automatically.',
        image: require('../../assets/tutorial/stoprecordinterview.jpg'),
      },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback',
    icon: 'checkmark-circle-outline',
    steps: [
      {
        title: 'All Feedback History',
        description: 'Review all your past interviews with scores, dates, and detailed feedback.',
        image: require('../../assets/tutorial/allfeedback.png'),
      },
    ],
  },
  {
    id: 'questions',
    title: 'Questions',
    icon: 'chatbubbles-outline',
    steps: [
      {
        title: 'Question Bank',
        description: 'Browse 32 common interview questions. Filter by category: Behavioral, Technical, Situational, and Strengths.',
        image: require('../../assets/tutorial/questionbank.png'),
      },
      {
        title: 'Practice Answers',
        description: 'Tap any question to practice. Use the STAR method template to structure your answers.',
        image: require('../../assets/tutorial/answerquestionbank.png'),
      },
      {
        title: 'Add Custom Questions',
        description: 'Create your own interview questions by tapping the + button. Choose the category that fits.',
        image: require('../../assets/tutorial/addtoquestionbank.png'),
      },
    ],
  },
  {
    id: 'jobs',
    title: 'Jobs',
    icon: 'briefcase-outline',
    steps: [
      {
        title: 'Browse Jobs',
        description: 'Search thousands of jobs. Filter by Remote, Hybrid, On-site, and more.',
        image: require('../../assets/tutorial/jobsearch.png'),
      },
      {
        title: 'Filter by Role',
        description: 'Use the dropdown to filter jobs by your saved preferences: Software Developer, Data Analyst, and more.',
        image: require('../../assets/tutorial/filterjobs.png'),
      },
    ],
  },
  {
    id: 'profile',
    title: 'Profile',
    icon: 'person-outline',
    steps: [
      {
        title: 'Your Achievements',
        description: 'View your badges and achievements. Unlock them by practising regularly!',
        image: require('../../assets/tutorial/Achivements.png'),
      },
      {
        title: 'Edit Profile',
        description: 'Update your name, email, phone, age, and bio. Add a profile photo!',
        image: require('../../assets/tutorial/editprofile.png'),
      },
      {
        title: 'Change Password',
        description: 'Keep your account secure. Update your password anytime.',
        image: require('../../assets/tutorial/changepassword.png'),
      },
      {
        title: 'Notifications',
        description: 'Enable daily practice reminders and feedback alerts to stay on track.',
        image: require('../../assets/tutorial/pushnotifications.png'),
      },
    ],
  },
  {
    id: 'cv',
    title: 'CV Analysis',
    icon: 'document-text-outline',
    steps: [
      {
        title: 'Upload Your CV',
        description: 'Paste your CV text and let Aya analyse it. Get personalised suggestions for improvement.',
        image: require('../../assets/tutorial/uploadcv.png'),
      },
    ],
  },
  {
    id: 'stories',
    title: 'Stories',
    icon: 'star-outline',
    steps: [
      {
        title: 'Success Stories',
        description: 'Read inspiring stories from people who practised with Aya and landed their dream jobs.',
        image: require('../../assets/tutorial/successstories.png'),
      },
      {
        title: 'Share Your Story',
        description: 'Landed a job? Inspire others by sharing your success story!',
        image: require('../../assets/tutorial/addsuccesstory.png'),
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings-outline',
    steps: [
      {
        title: 'App Settings',
        description: 'Access all app features: subscription, history, progress, tips, and customisation options.',
        image: require('../../assets/tutorial/settings.png'),
      },
      {
        title: 'Toggle Dark Mode',
        description: 'Choose between Light, Dark, or Match system to customise your app appearance.',
        image: require('../../assets/tutorial/switchtodarkmode.png'),
      },
    ],
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AppTutorial({ visible, onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState(TUTORIAL_CATEGORIES[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);

  const handleCategorySelect = (category: TutorialCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (currentStepIndex < selectedCategory.steps.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(TUTORIAL_CATEGORIES[0]);
    setCurrentStepIndex(0);
    onClose();
  };

  const currentStep = selectedCategory.steps[currentStepIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📖 How to Use the App</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} accessibilityLabel="Close tutorial" accessibilityRole="button">
              <Ionicons name="close" size={24} color={isDark ? '#fff' : '#333'} />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            {/* Left sidebar - Categories */}
            <ScrollView 
              style={styles.sidebar} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sidebarContent}
            >
              {TUTORIAL_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory.id === category.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Ionicons
                    name={category.icon}
                    size={18}
                    color={selectedCategory.id === category.id ? '#fff' : (isDark ? '#b5b5b5' : '#666')}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory.id === category.id && styles.categoryTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {category.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Right content - Image and description */}
            <View style={styles.contentArea}>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentScroll}
              >
                {/* Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={currentStep.image}
                    style={styles.tutorialImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Text content */}
                <View style={styles.textContent}>
                  <Text style={styles.stepTitle}>{currentStep.title}</Text>
                  <Text style={styles.stepDescription}>{currentStep.description}</Text>
                </View>

                {/* Step navigation */}
                {selectedCategory.steps.length > 1 && (
                  <View style={styles.stepNavigation}>
                    <TouchableOpacity
                      style={[styles.navButton, currentStepIndex === 0 && styles.navButtonDisabled]}
                      onPress={handlePrevStep}
                      disabled={currentStepIndex === 0}
                    >
                      <Ionicons name="chevron-back" size={20} color={currentStepIndex === 0 ? '#999' : colors.primaryBlue} />
                      <Text style={[styles.navButtonText, currentStepIndex === 0 && styles.navButtonTextDisabled]}>Prev</Text>
                    </TouchableOpacity>

                    <View style={styles.stepDots}>
                      {selectedCategory.steps.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.stepDot,
                            index === currentStepIndex && styles.stepDotActive,
                          ]}
                        />
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[styles.navButton, currentStepIndex === selectedCategory.steps.length - 1 && styles.navButtonDisabled]}
                      onPress={handleNextStep}
                      disabled={currentStepIndex === selectedCategory.steps.length - 1}
                    >
                      <Text style={[styles.navButtonText, currentStepIndex === selectedCategory.steps.length - 1 && styles.navButtonTextDisabled]}>Next</Text>
                      <Ionicons name="chevron-forward" size={20} color={currentStepIndex === selectedCategory.steps.length - 1 ? '#999' : colors.primaryBlue} />
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 40,
    },
    container: {
      backgroundColor: isDark ? '#1d1d1d' : '#fff',
      borderRadius: 24,
      width: '100%',
      height: height * 0.8,
      maxHeight: height * 0.85,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#E5E7EB',
    },
    headerTitle: {
      ...typography.headingSmall,
      color: isDark ? '#fff' : colors.textDark,
    },
    closeButton: {
      padding: 4,
    },
    mainContent: {
      flexDirection: 'row',
      flex: 1,
    },
    sidebar: {
      flex: 0.5,
      borderRightWidth: 1,
      borderRightColor: isDark ? '#333' : '#E5E7EB',
      backgroundColor: isDark ? '#151515' : '#F9FAFB',
    },
    sidebarContent: {
      paddingVertical: 8,
    },
    categoryButton: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
      marginHorizontal: 4,
      marginVertical: 2,
      borderRadius: 10,
    },
    categoryButtonActive: {
      backgroundColor: colors.primaryBlue,
    },
    categoryText: {
      ...typography.caption,
      fontSize: 9,
      color: isDark ? '#b5b5b5' : '#666',
      textAlign: 'center',
      marginTop: 2,
    },
    categoryTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    contentArea: {
      flex: 3.5,
      padding: 16,
    },
    contentScroll: {
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      height: 320,
      backgroundColor: isDark ? '#0f0f0f' : '#F3F4F6',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
    },
    tutorialImage: {
      width: '100%',
      height: '100%',
    },
    textContent: {
      width: '100%',
      paddingHorizontal: 4,
    },
    stepTitle: {
      ...typography.headingSmall,
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 8,
    },
    stepDescription: {
      ...typography.bodyMedium,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      lineHeight: 22,
    },
    stepNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#E5E7EB',
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
    navButtonText: {
      ...typography.bodyMedium,
      color: colors.primaryBlue,
      fontWeight: '600',
    },
    navButtonTextDisabled: {
      color: '#999',
    },
    stepDots: {
      flexDirection: 'row',
      gap: 6,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? '#333' : '#E5E7EB',
    },
    stepDotActive: {
      backgroundColor: colors.primaryBlue,
      width: 20,
    },
  });
