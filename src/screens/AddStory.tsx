import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/colors';
import BackButton from '../components/BackButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const AddStory: React.FC = () => {
  const navigation = useNavigation();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);
  const [interviewCount, setInterviewCount] = useState(0);
  const [timeframe, setTimeframe] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Load user's name
      const userName = await AsyncStorage.getItem('userName');
      if (userName) setName(userName);

      // Load user's job role preference
      const jobRole = await AsyncStorage.getItem('jobRole');
      if (jobRole) setRole(jobRole);

      // Calculate interview stats
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (!userEmail) return;

      const { data, error } = await supabase
        .from('interview_history')
        .select('created_at')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setInterviewCount(data.length);

        // Calculate timeframe from first to last interview
        const firstDate = new Date(data[0].created_at);
        const lastDate = new Date(data[data.length - 1].created_at);
        const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weeks = Math.ceil(diffDays / 7);
        
        setTimeframe(weeks === 1 ? '1 week' : `${weeks} weeks`);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name');
      return;
    }
    if (!role.trim()) {
      Alert.alert('Missing Information', 'Please enter your role');
      return;
    }
    if (!company.trim()) {
      Alert.alert('Missing Information', 'Please enter your company');
      return;
    }
    if (!story.trim()) {
      Alert.alert('Missing Information', 'Please share your story');
      return;
    }
    if (story.trim().length < 50) {
      Alert.alert('Story Too Short', 'Please write at least 50 characters to share your full experience');
      return;
    }

    setLoading(true);

    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      const { error } = await supabase
        .from('success_stories')
        .insert({
          user_email: userEmail,
          name: name.trim(),
          role: role.trim(),
          company: company.trim(),
          story: story.trim(),
          interview_count: interviewCount,
          timeframe: timeframe || 'N/A',
        });

      if (error) {
        console.error('Error saving story:', error);
        Alert.alert('Error', 'Failed to submit your story. Please try again.');
      } else {
        Alert.alert(
          'Success!',
          'Thank you for sharing your story! It will inspire others on their journey.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting story:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logoText}>MY INTERVIEW</Text>
        <Text style={styles.title}>Share Your Success Story</Text>
        <Text style={styles.subtitle}>
          Inspire others by sharing how practicing with Aya helped you land your dream job!
        </Text>

        {interviewCount > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsText}>
              📊 You've completed <Text style={styles.statsBold}>{interviewCount}</Text> practice interviews over <Text style={styles.statsBold}>{timeframe}</Text>
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Sarah Chen"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role You Landed</Text>
            <TextInput
              style={styles.input}
              value={role}
              onChangeText={setRole}
              placeholder="e.g., Software Engineer"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="e.g., Google"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Story</Text>
            <Text style={styles.helper}>
              Share how practicing with Aya helped you succeed. What changed? What did you learn?
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={story}
              onChangeText={setStory}
              placeholder="I was nervous about technical interviews, but after practicing with Aya for several weeks..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{story.length} characters (min 50)</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Your Story</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By submitting, you agree to share your story publicly to inspire other learners.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#F3F4F6',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 70,
      paddingBottom: 40,
    },
    logoText: {
      ...typography.heading,
      fontWeight: '800',
      color: colors.primaryBlue,
      alignSelf: 'center',
      marginBottom: 28,
    },
    title: {
      ...typography.headingSmall,
      color: isDark ? '#fff' : colors.textDark,
      marginBottom: 8,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: colors.textMuted,
      marginBottom: 24,
      lineHeight: 22,
    },
    statsCard: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    statsText: {
      ...typography.bodyMedium,
      color: '#fff',
      textAlign: 'center',
      lineHeight: 22,
    },
    statsBold: {
      fontWeight: '700',
    },
    form: {
      gap: 20,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: isDark ? '#fff' : colors.textDark,
    },
    helper: {
      ...typography.bodySmall,
      color: colors.textMuted,
      lineHeight: 18,
    },
    input: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 12,
      padding: 16,
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      borderWidth: 1,
      borderColor: isDark ? '#3a3a3a' : '#E5E7EB',
    },
    textArea: {
      minHeight: 120,
      paddingTop: 16,
    },
    charCount: {
      ...typography.bodySmall,
      color: colors.textMuted,
      textAlign: 'right',
    },
    submitButton: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: '#fff',
    },
    disclaimer: {
      ...typography.bodySmall,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
  });

export default AddStory;
