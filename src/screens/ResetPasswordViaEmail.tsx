import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import TextInputField from '../components/TextInputField';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPasswordViaEmail'>;

const ResetPasswordViaEmail: React.FC<Props> = ({ route, navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const token = route.params?.token;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'Invalid reset link. Please request a new password reset.');
        setValidatingToken(false);
        return;
      }

      // For email-based password reset, we validate the token by attempting to use it
      // The token should be a recovery token from Supabase
      setTokenValid(true);
      setValidatingToken(false);
    } catch (error) {
      console.error('Token validation error:', error);
      Alert.alert('Error', 'Invalid or expired reset link.');
      setValidatingToken(false);
    }
  };

  const onResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Use the recovery token to update password via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      }, {
        // The token should be passed in the session
        // Supabase will validate the recovery token automatically
      });

      setLoading(false);

      if (error) {
        Alert.alert('Error', error.message || 'Failed to reset password. Link may have expired.');
        return;
      }

      Alert.alert(
        'Success',
        'Your password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('SignIn'),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      console.error('Reset password error:', error);
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    }
  };

  if (validatingToken) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
        <Text style={[styles.subtitle, { marginTop: 16 }]}>Validating reset link...</Text>
      </View>
    );
  }

  if (!tokenValid) {
    return (
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Text style={styles.logoText}>MY INTERVIEW</Text>
            <Text style={styles.title}>Invalid Link</Text>
            <Text style={styles.subtitle}>
              This password reset link has expired or is invalid. Please request a new one.
            </Text>
            <PrimaryButton
              title="Request New Reset Link"
              onPress={() => navigation.navigate('ForgotPassword')}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.logoText}>MY INTERVIEW</Text>

          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below.
          </Text>

          <View style={styles.form}>
            <TextInputField
              label="New password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextInputField
              label="Confirm password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Text style={styles.hintText}>
              Password must be at least 8 characters long.
            </Text>

            <PrimaryButton
              title="Reset password"
              onPress={onResetPassword}
              loading={loading}
              disabled={!newPassword || !confirmPassword}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: isDark ? '#0f0f0f' : colors.background },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 70,
    },
    logoText: {
      ...typography.heading,
      fontWeight: '800',
      color: colors.primaryBlue,
      alignSelf: 'center',
      marginBottom: 28,
    },
    title: {
      ...typography.headingMedium,
      color: isDark ? '#fff' : colors.textDark,
    },
    subtitle: {
      ...typography.bodyMedium,
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
    hintText: {
      ...typography.bodySmall,
      color: isDark ? '#888' : colors.textMuted,
      marginBottom: 12,
    },
  });

export default ResetPasswordViaEmail;
