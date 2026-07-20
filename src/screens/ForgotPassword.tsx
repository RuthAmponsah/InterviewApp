import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ScrollView,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import TextInputField from '../components/TextInputField';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";
import { authKeyboardVerticalOffset, keyboardAwareScrollProps } from '../utils/keyboard';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPassword: React.FC<Props> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSendLink = async () => {
    if (!email) return;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // Send password reset email via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'interviewapp://reset-password',
      });

      setLoading(false);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Success - show confirmation
      setSent(true);
      Alert.alert(
        'Check Your Email',
        `A password reset link has been sent to ${email}. Please check your inbox and follow the instructions.`
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to send reset link. Please try again.');
      console.error('Password reset error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={authKeyboardVerticalOffset}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        {...keyboardAwareScrollProps}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
          <Text style={styles.logoText}>MY INTERVIEW</Text>

          <Text style={styles.title}>Forgot password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we’ll send you a password reset link.
          </Text>

          <View style={styles.form}>
            <TextInputField
              label="Email"
              placeholder="Your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <PrimaryButton
              title={sent ? 'Link sent' : 'Send link'}
              onPress={onSendLink}
              loading={loading}
              disabled={!email}
            />

            {sent && (
              <Text style={styles.infoText}>
                If an account exists with this email, a recovery link has been
                sent.
              </Text>
            )}
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.backLink}>Back to sign in</Text>
          </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: isDark ? '#0f0f0f' : colors.background },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 40,
    },
    container: {
      paddingHorizontal: 24,
      paddingTop: 70,
    },
    logoText: {
      ...typography.brandMark,
      color: colors.primaryBlue,
    },
    title: {
      ...typography.headingMedium,
      textAlign: 'center',
      color: isDark ? '#fff' : colors.textDark,
    },
    subtitle: {
      ...typography.bodyMedium,
      textAlign: 'center',
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    form: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 20,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    infoText: {
      ...typography.bodySmall,
      marginTop: 10,
      color: isDark ? '#b5b5b5' : colors.textMuted,
    },
    backLink: {
      ...typography.label,
      marginTop: 18,
      alignSelf: 'center',
      color: colors.primaryBlue,
    },
  });

export default ForgotPassword;
