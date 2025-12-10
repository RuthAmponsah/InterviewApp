import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  const goToChat = (mode: 'text' | 'voice') => {
    navigation.navigate('InterviewChat', { mode });
  };

  return (
    <View style={styles.root}>
      <BackButton />
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>Choose your interview style</Text>
        <Text style={styles.helper}>
          You can switch between vocal and text-based practice whenever you
          like.
        </Text>

        <PrimaryButton title="Vocal interview" onPress={() => goToChat('voice')} />
        <PrimaryButton
          title="Text-based interview"
          onPress={() => goToChat('text')}
          variant="outline"
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
      paddingTop: 64,
    },
    logoText: {
      ...typography.headingMedium,
      fontWeight: '800',
      color: colors.primaryBlue,
      alignSelf: 'center',
      marginBottom: 24,
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
  });

export default InterviewType;
