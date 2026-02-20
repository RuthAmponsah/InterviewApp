import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/colors';

const { width } = Dimensions.get('window');

type OnboardingStep = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to My Interview',
    description: 'Practice realistic mock interviews with Aya, your AI interview coach. Build confidence and land your dream job!',
    icon: 'hand-right',
  },
  {
    title: 'Start Your Interview',
    description: 'Choose text or voice mode, then answer questions tailored to your target role. Aya guides you through each question.',
    icon: 'mic',
  },
  {
    title: 'Get Smart Feedback',
    description: 'After each interview, receive personalized feedback on your strengths and areas to improve.',
    icon: 'checkmark-circle',
  },
  {
    title: 'Track Your Progress',
    description: 'View your interview history, maintain streaks, unlock achievements, and watch your skills grow over time.',
    icon: 'trending-up',
  },
];

export default function OnboardingWalkthrough() {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      // Get current user ID
      const userId = await AsyncStorage.getItem('userId');
      console.log('🎯 OnboardingWalkthrough: userId from AsyncStorage:', userId ? '✅ Found' : '❌ NOT found');
      
      if (!userId) {
        console.log('🎯 OnboardingWalkthrough: No userId, not showing onboarding');
        return; // Not logged in
      }

      // Check if THIS user has seen onboarding (check per-user flag)
      const hasSeenKey = `hasSeenOnboarding_${userId}`;
      const hasSeenOnboarding = await AsyncStorage.getItem(hasSeenKey);
      console.log('🎯 OnboardingWalkthrough: Checking flag:', hasSeenKey, '=', hasSeenOnboarding);
      
      // Show onboarding only if flag is NOT set
      if (!hasSeenOnboarding) {
        setVisible(true);
        console.log('🎯 Showing onboarding for user:', userId);
      } else {
        console.log('🎯 User has already seen onboarding, skipping');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      // Get current user ID
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        // Mark onboarding as seen for THIS specific user
        const hasSeenKey = `hasSeenOnboarding_${userId}`;
        await AsyncStorage.setItem(hasSeenKey, 'true');
        console.log('✅ Onboarding flag saved:', hasSeenKey);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setVisible(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (!visible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Skip button */}
          {!isLastStep && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name={step.icon} size={80} color={colors.primaryBlue} />
            </View>

            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
          </View>

          {/* Progress dots */}
          <View style={styles.dotsContainer}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Next/Get Started button */}
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {isLastStep ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={isLastStep ? 'checkmark' : 'arrow-forward'} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>

          {/* Step counter */}
          <Text style={styles.stepCounter}>
            {currentStep + 1} of {ONBOARDING_STEPS.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      width: width - 40,
      maxWidth: 400,
      backgroundColor: isDark ? '#1d1d1d' : '#fff',
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    skipButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      padding: 8,
      zIndex: 10,
    },
    skipText: {
      ...typography.bodyMedium,
      color: colors.textMuted,
      fontWeight: '600',
    },
    content: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 32,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isDark ? '#1e3a5f' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    title: {
      ...typography.headingMedium,
      fontWeight: '700',
      color: isDark ? '#fff' : '#111',
      textAlign: 'center',
      marginBottom: 12,
    },
    description: {
      ...typography.bodyMedium,
      color: isDark ? '#b5b5b5' : '#6B7280',
      textAlign: 'center',
      lineHeight: 22,
    },
    dotsContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 24,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? '#444' : '#D1D5DB',
    },
    dotActive: {
      width: 24,
      backgroundColor: colors.primaryBlue,
    },
    button: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primaryBlue,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    buttonText: {
      ...typography.label,
      color: '#fff',
      fontWeight: '700',
    },
    stepCounter: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
  });
