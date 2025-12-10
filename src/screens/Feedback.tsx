import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

const Feedback: React.FC = () => {
  const navigation = useNavigation<RootNav>();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);

  const goHome = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.logoText}>MY INTERVIEW</Text>

      <Text style={styles.title}>Here is your feedback</Text>
      <Text style={styles.subtitle}>
        These points are based on your most recent interview practice.
      </Text>

      <View style={styles.card}>
        <Text style={styles.pointTitle}>What you did well</Text>
        <Text style={styles.pointText}>
          • Clear communication and confident tone throughout your answers.
        </Text>
        <Text style={styles.pointText}>
          • Good use of real examples from your experience.
        </Text>

        <Text style={[styles.pointTitle, { marginTop: 12 }]}>
          How you can improve
        </Text>
        <Text style={styles.pointText}>
          • Add more detail about your impact on the team or business.
        </Text>
        <Text style={styles.pointText}>
          • Try to keep answers focused and under 2 minutes.
        </Text>
        <Text style={styles.pointText}>
          • Practice your closing statement: why you’re a strong fit for this
          role.
        </Text>
      </View>

      <PrimaryButton title="Back to home" onPress={goHome} />
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
      paddingTop: 48,
      paddingBottom: 24,
    },
    logoText: {
      ...typography.headingMedium,
      fontWeight: '800',
      color: colors.primaryBlue,
      alignSelf: 'center',
      marginBottom: 20,
    },
    title: {
      ...typography.headingSmall,
      color: isDark ? '#fff' : colors.textDark,
    },
    subtitle: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#444' : colors.border,
      padding: 16,
      marginBottom: 20,
    },
    pointTitle: {
      ...typography.label,
      fontWeight: '700',
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 6,
    },
    pointText: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginBottom: 4,
    },
  });

export default Feedback;
