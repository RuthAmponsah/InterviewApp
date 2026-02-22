import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrimaryButton from '../components/PrimaryButton';
import PaywallModal from '../components/PaywallModal';
import { RootStackParamList } from '../navigation/RootNavigator';
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from '../config/supabase';
import { syncSubscriptionStatus } from '../services/purchaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'InterviewType'>;

const InterviewType: React.FC<Props> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  
  const [checklist, setChecklist] = useState({
    quietSpace: false,
    ready: false,
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      await syncSubscriptionStatus();
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('subscription_tier')
        .eq('user_id', userId)
        .single();

      if (prefs?.subscription_tier === 'monthly' || prefs?.subscription_tier === 'annual') {
        setIsPremium(true);
      }
    } catch (error) {
      console.log('Error checking subscription:', error);
    }
  };

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = checklist.quietSpace && checklist.ready;

  const checkInterviewLimit = async (): Promise<boolean> => {
    try {
      if (isPremium) {
        return true; // No limit for premium users
      }

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return false;

      const { data: prefs, error } = await supabase
        .from('user_preferences')
        .select('interviews_this_month, last_interview_date')
        .eq('user_id', userId)
        .maybeSingle();  // Use maybeSingle instead of single - doesn't throw if no record

      // If no preferences record exists, allow interview (they have 0 interviews)
      if (!prefs) {
        console.log('No preferences record - allowing first interview');
        return true;
      }

      // Check if we need to reset monthly count
      const lastInterview = prefs.last_interview_date ? new Date(prefs.last_interview_date) : null;
      const now = new Date();
      const shouldReset = !lastInterview || 
        (lastInterview.getMonth() !== now.getMonth() || lastInterview.getFullYear() !== now.getFullYear());

      const currentCount = shouldReset ? 0 : (prefs.interviews_this_month || 0);

      // Free tier: 2 interviews per month
      if (currentCount >= 2) {
        setShowPaywall(true);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking interview limit:', error);
      return false;
    }
  };

  const goToChat = async (mode: 'text' | 'voice') => {
    const canProceed = await checkInterviewLimit();
    if (canProceed) {
      navigation.navigate('InterviewChat', { mode });
    }
  };

  return (
    <View style={styles.root}>
      <BackButton />
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      {/* Prep Checklist */}
      <View style={styles.checklistCard}>
        <Text style={styles.checklistTitle}>🎯 Interview Prep Checklist</Text>
        <Text style={styles.checklistSubtitle}>Make sure you're ready before starting</Text>
        
        <TouchableOpacity 
          style={styles.checklistItem}
          onPress={() => toggleChecklistItem('quietSpace')}
        >
          <View style={[styles.checkbox, checklist.quietSpace && styles.checkboxChecked]}>
            {checklist.quietSpace && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checklistText}>Find a quiet space</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.checklistItem}
          onPress={() => toggleChecklistItem('ready')}
        >
          <View style={[styles.checkbox, checklist.ready && styles.checkboxChecked]}>
            {checklist.ready && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checklistText}>I'm ready to begin!</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Choose your interview style</Text>
        <Text style={styles.helper}>
          You can switch between vocal and text-based practice whenever you
          like.
        </Text>

        <PrimaryButton 
          title="Vocal interview" 
          onPress={() => goToChat('voice')} 
          disabled={!allChecked}
        />
        <PrimaryButton
          title="Text-based interview"
          onPress={() => goToChat('text')}
          variant="outline"
          disabled={!allChecked}
        />

        <Text style={styles.tip}>
          Tip: Voice interviews use cloud transcription. Make sure you have a good internet connection.
        </Text>
      </View>

      <PaywallModal 
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => {
          setShowPaywall(false);
          checkSubscriptionStatus();
        }}
      />
    </View>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? '#0f0f0f' : colors.background,
      paddingHorizontal: 24,
      paddingTop: 70,
    },
    logoText: {
      ...typography.heading,
      fontWeight: "800",
      color: colors.primaryBlue,
      alignSelf: "center",
      marginBottom: 28,
    },
    card: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 22,
      padding: 20,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    heading: {
      ...typography.headingSmall,
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 8,
    },
    helper: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginBottom: 16,
    },
    tip: {
      ...typography.caption,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 14,
    },
    checklistCard: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 22,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    checklistTitle: {
      ...typography.body,
      fontWeight: '600',
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 4,
    },
    checklistSubtitle: {
      ...typography.caption,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginBottom: 16,
    },
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: isDark ? '#555' : '#D1D5DB',
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
    },
    checklistText: {
      ...typography.bodySmall,
      color: isDark ? '#e5e5e5' : colors.textDark,
      flex: 1,
    },
  });

export default InterviewType;
