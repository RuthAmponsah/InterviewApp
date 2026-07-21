import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrimaryButton from '../components/PrimaryButton';
import TextInputField from '../components/TextInputField';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";
import { syncSectorPacksFromServer, syncSubscriptionStatus } from '../services/purchaseService';
import Purchases from 'react-native-purchases';
import { authKeyboardVerticalOffset, keyboardAwareScrollProps } from '../utils/keyboard';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const SignIn: React.FC<Props> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, translateY]);

  const showError = (title: string, message: string, allowResend: boolean = false) => {
    if (allowResend) {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resend email', onPress: handleResendConfirmation },
        { text: 'OK' },
      ]);
      return;
    }

    Alert.alert(title, message);
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      showError('Missing Email', 'Please enter your email address first.');
      return;
    }

    if (resendCooldown > 0) {
      return;
    }

    try {
      setResendLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase(),
      });

      if (error) {
        Alert.alert('Could Not Resend', 'Could not resend confirmation email. Please try again.');
        console.error('Resend confirmation error:', error);
        return;
      }

      Alert.alert('Email Sent', 'Confirmation email sent. Please check your inbox.');
      
      // Start 30-second cooldown
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setResendLoading(false);
    }
  };

  const onSignIn = async () => {
    if (!email || !password) {
      showError('Missing Information', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Try to sign in with Supabase Auth FIRST (for new accounts)
      console.log('Attempting Supabase Auth login for:', email.toLowerCase());
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      if (authError) {
        setLoading(false);
        console.error('Supabase Auth failed:', authError.message);
        console.error('Error code:', authError.status);
        const needsConfirmation = /email\s*not\s*confirmed|confirm\s*your\s*email|email\s*confirmation/i.test(
          authError.message
        );

        if (needsConfirmation) {
          showError(
            'Email Not Confirmed',
            'Please confirm your email before signing in.',
            true
          );
          return;
        }

        showError('Invalid Credentials', 'The email or password you entered is incorrect. Please try again.');
        return;
      }

      console.log('✅ Supabase Auth successful, session created');
      console.log('Auth user ID:', authData.user.id);

      // Fetch user profile from database using authenticated user's ID
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        const userMeta = authData.user.user_metadata || {};
        const ageValue = userMeta.age && /^\d+$/.test(userMeta.age) ? parseInt(userMeta.age, 10) : null;

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: (authData.user.email || email).toLowerCase(),
            name: userMeta.name || 'User',
            gender: userMeta.gender || null,
            age: ageValue,
          }, { onConflict: 'id' })
          .select('*')
          .single();

        if (createError || !createdUser) {
          setLoading(false);
          showError('Profile Error', 'Could not create your profile. Please contact support.');
          console.error('User profile create error:', createError || userError);
          return;
        }

        userData = createdUser;
      }

      const hasSeenOnboardingGlobal = await AsyncStorage.getItem('hasSeenOnboardingGlobal');

      // DO NOT clear all storage - Supabase manages session in AsyncStorage automatically
      // Only remove old user-specific data
      const keysToRemove = [
        'userName', 'userEmail', 'userId', 'jobRole', 'userProfilePhoto'
      ];
      for (const key of keysToRemove) {
        await AsyncStorage.removeItem(key);
      }

      if (hasSeenOnboardingGlobal === 'true') {
        await AsyncStorage.setItem('hasSeenOnboardingGlobal', 'true');
      }
      
      // Store userId early so onboarding check can access it
      await AsyncStorage.setItem('userId', authData.user.id);
      
      // Check if user has done interviews before - if so, skip onboarding
      const { data: interviewHistory } = await supabase
        .from('interview_history')
        .select('id')
        .eq('user_id', authData.user.id)
        .limit(1);
      
      if (interviewHistory && interviewHistory.length > 0) {
        // Returning user with interview history - skip onboarding (per-user flag)
        await AsyncStorage.setItem(`hasSeenOnboarding_${authData.user.id}`, 'true');
      }
      // Otherwise, let them see the walkthrough (new account or never did interviews)
      
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userEmail', userData.email);
      await AsyncStorage.setItem('userName', userData.name);
      
      if (userData.job_role) {
        await AsyncStorage.setItem('jobRole', userData.job_role);
        console.log('✅ Job role loaded from database:', userData.job_role);
      } else {
        console.log('⚠️ No job role found in database - user needs to set in Job Preferences');
      }
      
      if (userData.profile_photo) {
        await AsyncStorage.setItem('userProfilePhoto', userData.profile_photo);
        console.log('✅ Profile photo loaded:', userData.profile_photo);
      }

      // Link user with RevenueCat and sync subscription status
      try {
        await Purchases.logIn(userData.id);
        await syncSubscriptionStatus();
        await syncSectorPacksFromServer();
      } catch (error) {
        console.log('RevenueCat sync skipped:', error);
      }

      setLoading(false);
      
      const shouldShowWelcome = !userData.job_role;

      if (shouldShowWelcome) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });

    } catch (error) {
      setLoading(false);
      showError('Error', 'Something went wrong. Please try again.');
      console.error('Sign in error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={authKeyboardVerticalOffset}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.background} />
      </TouchableWithoutFeedback>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        {...keyboardAwareScrollProps}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View
            style={[
              styles.container,
              { opacity: fadeAnim, transform: [{ translateY }] },
            ]}
          >
          <Text style={styles.logoText}>MY INTERVIEW</Text>

          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>
            Welcome back. Let’s get you ready for your next interview.
          </Text>

          <View style={styles.form}>
            <TextInputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />

            <View style={styles.passwordContainer}>
              <TextInputField
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={onSignIn}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={isDark ? '#888' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotLinkContainer}
            >
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              title="Sign in"
              onPress={onSignIn}
              loading={loading}
              disabled={!email || !password}
            />
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.bottomLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: isDark ? '#0f0f0f' : colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDark ? '#0f0f0f' : '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 70,
  },
  logoText: {
    ...typography.heading,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.primaryBlue,
    alignSelf: 'center',
    marginBottom: 32,
  },
  title: {
    ...typography.headingMedium,
    color: isDark ? '#fff' : colors.textDark,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: isDark ? '#b5b5b5' : colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  form: {
    backgroundColor: isDark ? '#1c1c1c' : '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 45,
    zIndex: 10,
  },
  forgotLinkContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
  },
  forgotLink: {
    ...typography.label,
    color: colors.primaryBlue,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  bottomText: {
    ...typography.bodyMedium,
    color: isDark ? '#b5b5b5' : colors.textMuted,
    marginRight: 4,
  },
  bottomLink: {
    ...typography.bodyMedium,
    color: colors.primaryBlue,
    fontWeight: '600',
  },

});

export default SignIn;
