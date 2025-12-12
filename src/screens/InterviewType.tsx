import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PrimaryButton from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/RootNavigator';
import BackButton from "../components/BackButton";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, 'InterviewType'>;

const InterviewType: React.FC<Props> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  
  const [checklist, setChecklist] = useState({
    quietSpace: false,
    goodLighting: false,
    ready: false,
  });

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = checklist.quietSpace && checklist.goodLighting && checklist.ready;

  const goToChat = (mode: 'text' | 'voice') => {
    navigation.navigate('InterviewChat', { mode });
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
          onPress={() => toggleChecklistItem('goodLighting')}
        >
          <View style={[styles.checkbox, checklist.goodLighting && styles.checkboxChecked]}>
            {checklist.goodLighting && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checklistText}>Good lighting (if using camera)</Text>
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
          Tip: For the best experience, make sure sound is on if you choose a
          vocal interview.
        </Text>
      </View>
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
      ...typography.body,
      color: isDark ? '#e5e5e5' : colors.textDark,
      flex: 1,
    },
  });

export default InterviewType;
