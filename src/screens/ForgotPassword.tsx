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
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import TextInputField from '../components/TextInputField';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPassword: React.FC<Props> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSendLink = () => {
    if (!email) return;
    setLoading(true);
    // TODO: integrate reset password backend
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 700);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: isDark ? '#0f0f0f' : colors.background },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 48,
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

