import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenHeader from '../components/ScreenHeader';
import { RootStackParamList, InterviewLevelMode } from '../navigation/RootNavigator';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'InterviewLevel'>;

type LevelOption = {
  id: InterviewLevelMode;
  title: string;
  subtitle: string;
  details: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const LEVELS: LevelOption[] = [
  {
    id: 'guided',
    title: 'Guided Practice',
    subtitle: 'Beginner-friendly support',
    details: 'Aya gives clearer prompts, gentler follow-ups and more structure as you practise.',
    icon: 'sparkles-outline',
  },
  {
    id: 'standard',
    title: 'Standard Mock Interview',
    subtitle: 'Your normal realistic interview',
    details: 'Starts with “Tell me about yourself”, then mixes common and role-specific questions.',
    icon: 'chatbubbles-outline',
  },
  {
    id: 'realistic',
    title: 'Realistic Interview',
    subtitle: 'Moderate interview pressure',
    details: 'Aya keeps the pace natural, asks concise follow-ups and expects fuller answers.',
    icon: 'briefcase-outline',
  },
  {
    id: 'challenge',
    title: 'Challenge Mode',
    subtitle: 'Harder, more probing practice',
    details: 'Aya challenges vague answers and asks sharper follow-ups so you can practise under pressure.',
    icon: 'trending-up-outline',
  },
  {
    id: 'quick',
    title: 'Quick Practice',
    subtitle: 'Short, casual session',
    details: 'A lighter one or two-question practice when you do not have time for a full mock interview.',
    icon: 'flash-outline',
  },
  {
    id: 'technical',
    title: 'Technical Interview',
    subtitle: 'Role-focused questioning',
    details: 'Best for specialist roles. Aya starts with your relevant experience, then asks practical role questions.',
    icon: 'construct-outline',
  },
];

const InterviewLevel: React.FC<Props> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);

  const chooseLevel = (level: InterviewLevelMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('InterviewType', { level });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <ScreenHeader />

      <Text style={styles.title}>Choose your interview level</Text>
      <Text style={styles.subtitle}>
        Pick the kind of practice you want today. You can choose a different level every time.
      </Text>

      <View style={styles.list}>
        {LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => chooseLevel(level.id)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={level.icon} size={22} color={colors.primaryBlue} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{level.title}</Text>
              <Text style={styles.cardSubtitle}>{level.subtitle}</Text>
              <Text style={styles.cardDetails}>{level.details}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#777' : colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? '#0f0f0f' : colors.background,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    title: {
      ...typography.headingMedium,
      color: isDark ? '#fff' : colors.textDark,
      textAlign: 'center',
      marginTop: 4,
    },
    subtitle: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 18,
      lineHeight: 22,
    },
    list: {
      gap: 12,
    },
    card: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 20,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: isDark ? '#162033' : '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardText: {
      flex: 1,
    },
    cardTitle: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: isDark ? '#fff' : colors.textDark,
    },
    cardSubtitle: {
      ...typography.caption,
      color: colors.primaryBlue,
      fontWeight: '600',
      marginTop: 3,
    },
    cardDetails: {
      ...typography.caption,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 5,
      lineHeight: 18,
    },
  });

export default InterviewLevel;
