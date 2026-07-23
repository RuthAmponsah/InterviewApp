import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";
import { authKeyboardVerticalOffset, keyboardAwareScrollProps } from '../utils/keyboard';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPasswordViaEmail'>;

const ResetPasswordViaEmail: React.FC<Props> = ({ route, navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const resetParams = route.params;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    validateToken();
  }, [resetParams]);

  const validateToken = async () => {
    try {
      const isActiveRecoverySession = resetParams?.type === 'recovery' && resetParams.code === '__active_recovery_session__';
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session && isActiveRecoverySession) {
        setTokenValid(true);
        setValidatingToken(false);
        return;
      }

      if (!resetParams?.code && !resetParams?.token && !resetParams?.accessToken && !resetParams?.tokenHash) {
        Alert.alert('Error', 'Invalid reset link. Please request a new password reset.');
        setValidatingToken(false);
        return;
      }

      if (resetParams.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(resetParams.code);

        if (error) {
          Alert.alert('Error', error.message || 'Invalid or expired reset link.');
          setValidatingToken(false);
          return;
        }
      } else if (resetParams.accessToken && resetParams.refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: resetParams.accessToken,
          refresh_token: resetParams.refreshToken,
        });

        if (error) {
          Alert.alert('Error', error.message || 'Invalid or expired reset link.');
          setValidatingToken(false);
          return;
        }
      } else if (resetParams.tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: resetParams.tokenHash,
          type: 'recovery',
        });

        if (error) {
          Alert.alert('Error', error.message || 'Invalid or expired reset link.');
          setValidatingToken(false);
          return;
        }
      } else if (resetParams.token && resetParams.email) {
        const { error } = await supabase.auth.verifyOtp({
          email: resetParams.email,
          token: resetParams.token,
          type: 'recovery',
        });

        if (error) {
          Alert.alert('Error', error.message || 'Invalid or expired reset link.');
          setValidatingToken(false);
          return;
        }
      } else {
        Alert.alert('Error', 'Invalid reset link. Please request a new password reset.');
        setValidatingToken(false);
        return;
      }

      setTokenValid(true);
      setValidatingToken(false);
    } catch (error) {
      console.error('Token validation error:', error);
      Alert.alert('Error', 'Invalid or expired reset link.');
      setValidatingToken(false);
    }
  };

  const onResetPassword = async () => {
    setFormError('');

    if (!newPassword || !confirmPassword) {
      setFormError('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters long.');
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
        setFormError(error.message || 'Failed to reset password. Link may have expired.');
        return;
      }

      await supabase.auth.signOut();

      Alert.alert(
        'Success',
        'Your password has been updated. Please log in with your new password.',
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

            <Text style={styles.title}>Create new password</Text>
            <Text style={styles.subtitle}>
              Choose a secure password for your account.
            </Text>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>New password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textMuted}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setFormError('');
                  }}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword((value) => !value)}
                  accessibilityLabel={showNewPassword ? 'Hide new password' : 'Show new password'}
                  accessibilityRole="button"
                >
                  <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Confirm new password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setFormError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((value) => !value)}
                  accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  accessibilityRole="button"
                >
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.hintText}>
                Password must be at least 8 characters long.
              </Text>
              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

              <PrimaryButton
                title="Update password"
                onPress={onResetPassword}
                loading={loading}
                disabled={!newPassword || !confirmPassword}
              />
            </View>
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
    inputLabel: {
      ...typography.label,
      color: isDark ? '#b5b5b5' : '#333',
      marginBottom: 6,
      marginTop: 10,
    },
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1d1d1d' : '#F4F4F4',
      borderColor: isDark ? '#333' : '#e0e0e0',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      marginBottom: 8,
    },
    passwordInput: {
      ...typography.bodyMedium,
      flex: 1,
      color: isDark ? '#fff' : colors.textDark,
      paddingVertical: 14,
      paddingRight: 10,
    },
    hintText: {
      ...typography.bodySmall,
      color: isDark ? '#888' : colors.textMuted,
      marginBottom: 12,
    },
    errorText: {
      ...typography.bodySmall,
      color: '#EF4444',
      marginBottom: 12,
      lineHeight: 18,
    },
  });

export default ResetPasswordViaEmail;
