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
    Modal,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrimaryButton from '../components/PrimaryButton';
import TextInputField from '../components/TextInputField';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const SignIn: React.FC<Props> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Error Modal State
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorVisible(true);
  };

  const onSignIn = async () => {
    if (!email || !password) {
      showError('Missing Information', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      if (authError) {
        setLoading(false);
        
        // Handle specific error messages
        if (authError.message.includes('Invalid login credentials')) {
          showError('Invalid Credentials', 'The email or password you entered is incorrect. Please try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          // Skip email verification check - allow unverified users to sign in
          console.log('Email not confirmed, but allowing sign in for development');
        } else {
          showError('Sign In Failed', authError.message);
        }
        return;
      }

      if (!authData.user) {
        setLoading(false);
        showError('Sign In Failed', 'Unable to sign in. Please try again.');
        return;
      }

      // Fetch user profile from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        setLoading(false);
        showError('Error', 'Could not load user profile. Please try again.');
        console.error('User fetch error:', userError);
        return;
      }

      // Clear all previous user data and store new user info in AsyncStorage
      await AsyncStorage.clear();
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('userId', authData.user.id);
      await AsyncStorage.setItem('userEmail', userData.email);
      await AsyncStorage.setItem('userName', userData.name);
      
      if (userData.job_role) {
        await AsyncStorage.setItem('jobRole', userData.job_role);
      }
      
      if (userData.profile_photo) {
        await AsyncStorage.setItem('userProfilePhoto', userData.profile_photo);
      }

      setLoading(false);
      
      // Navigate based on whether user has completed onboarding
      if (userData.job_role) {
        navigation.replace('MainTabs');
      } else {
        navigation.replace('Welcome');
      }

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
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.background} />
      </TouchableWithoutFeedback>

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

          <TextInputField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={onSignIn}
          />

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

      {/* Error Modal - Same style as SignUp */}
      <Modal transparent visible={errorVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalWarning}>⚠️ {errorTitle}</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setErrorVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  container: {
    flex: 1,
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

  /* Modal Styles - Same as SignUp */
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalBox: {
    width: "80%",
    backgroundColor: isDark ? "#1c1c1c" : "#fff",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
  },
  modalWarning: {
    ...typography.headingSmall,
    fontWeight: "800",
    marginBottom: 10,
    color: "#D9534F",
  },
  modalText: {
    ...typography.bodyMedium,
    textAlign: "center",
    marginBottom: 20,
    color: isDark ? "#e5e5e5" : "#333",
  },
  modalButton: {
    backgroundColor: colors.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalButtonText: {
    ...typography.bodyMedium,
    color: "white",
    fontWeight: "700",
  },
});

export default SignIn;
