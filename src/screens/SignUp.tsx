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
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../components/PrimaryButton';
import TextInputField from '../components/TextInputField';
import { RootStackParamList } from '../navigation/RootNavigator';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { sendWelcomeEmail } from "../services/emailService";
import { supabase } from "../config/supabase";

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUp: React.FC<Props> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Popup Modal
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningText, setWarningText] = useState("");
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
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
    ]).start();
  }, [fadeAnim, translateY]);

  const showWarning = (msg: string) => {
    setWarningText(msg);
    setWarningVisible(true);
    setIsSuccessMessage(false);
  };

  const showSuccess = (msg: string) => {
    setWarningText(msg);
    setWarningVisible(true);
    setIsSuccessMessage(true);
  };

  // SAVE USER DATA TO SUPABASE + SEND WELCOME EMAIL + GO TO WELCOME PAGE
  const handleSignUp = async () => {
    if (!name || !email || !password) return;

    // GENDER VALIDATION
    const upperGender = gender.toUpperCase();
    if (upperGender !== "F" && upperGender !== "M") {
      showWarning("Please enter F or M only.");
      return;
    }

    // AGE VALIDATION
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 16) {
      showWarning("You must be 16 or older.");
      return;
    }

    // EMAIL VALIDATION (basic format check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showWarning("Please enter a valid email address.");
      return;
    }

    // PASSWORD VALIDATION (minimum 8 characters and at least one special character)
    if (password.length < 8) {
      showWarning("Password must be at least 8 characters long.");
      return;
    }
    
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;`~]/;
    if (!specialCharRegex.test(password)) {
      showWarning("Password must contain at least one special character (!@#$%^&* etc.).");
      return;
    }

    setLoading(true);

    try {
      // 1. Create auth user in Supabase (NO email verification)
      // Create Supabase Auth account (no email verification required for testing)
      console.log('Creating Supabase Auth account for:', email.toLowerCase());
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name: name,
          },
          // Skip email confirmation for development (requires Supabase dashboard setting)
          // Go to Authentication > Settings > Enable email confirmations = OFF
        }
      });

      if (authError) {
        setLoading(false);
        console.error('Supabase Auth signup error:', authError);
        
        // Handle email rate limit - don't block signup
        if (authError.message.includes('Email rate limit exceeded') || authError.message.includes('rate limit')) {
          console.log('⚠️ Supabase rate limit - please wait and try again');
          showWarning("Too many signups right now. Please wait 1 minute and try again, or sign in if you already have an account.");
          return;
        } else if (authError.message.includes('already registered')) {
          showWarning("This email is already registered. Please sign in instead.");
          return;
        } else {
          showWarning(authError.message);
          return;
        }
      }

      if (!authData?.user) {
        setLoading(false);
        showWarning("Failed to create account. Please try again.");
        return;
      }

      const userId = authData.user.id;

      // 2. Check if user profile already exists, if not create it
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingUser) {
        // Create user profile in database (password is handled by Supabase Auth, don't store it)
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: email.toLowerCase(),
            name: name,
            gender: upperGender,
            age: ageNum,
          });

        if (profileError) {
          setLoading(false);
          showWarning("Account created but profile setup failed. Please contact support.");
          console.error('Profile creation error:', profileError);
          return;
        }
      }

      // 3. Create user preferences (if not exists)
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      if (!existingPrefs) {
        await supabase.from('user_preferences').insert({
          user_id: authData.user.id,
          theme: 'system',
          notif_push: true,
          notif_email: true,
          notif_practice: true,
          notif_feedback: true,
        });
      }

      // 4. Create user progress (if not exists)
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingProgress) {
        await supabase.from('user_progress').insert({
          user_id: userId,
          streak: 0,
          total_interviews: 0,
        });
      }

      // 5. Clear all previous user data and store new user info in AsyncStorage
      await AsyncStorage.clear();
      // NOTE: Do NOT set hasSeenOnboarding here - let new users see the welcome walkthrough on Home screen
      
      // Store the session so Supabase can authenticate database operations
      if (authData.session) {
        await AsyncStorage.setItem('supabase.session', JSON.stringify(authData.session));
        console.log('✅ Session stored in AsyncStorage after signup');
      }
      
      await AsyncStorage.setItem("userName", name);
      await AsyncStorage.setItem("userEmail", email.toLowerCase());
      await AsyncStorage.setItem("userId", userId);
      await AsyncStorage.setItem("isLoggedIn", "true");

      // 6. Welcome email (sent via Resend, not Supabase) - non-blocking
      sendWelcomeEmail(email, name).catch(err => {
        console.log('Welcome email failed (non-critical):', err);
      });

      setLoading(false);
      
      // Show success message
      showSuccess(
        `Welcome ${name}! 🎉\n\nYour account has been created successfully!\n\nYou can now sign in and start your interview preparation journey!`
      );

    } catch (error) {
      setLoading(false);
      showWarning("Something went wrong. Please try again.");
      console.error('Sign up error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim, transform: [{ translateY }] },
          ]}
        >
        <Text style={styles.logoText}>MY INTERVIEW</Text>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Set up your profile so Aya can personalise your interview journey.
        </Text>

        <View style={styles.form}>
          <TextInputField
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />

          <TextInputField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.passwordContainer}>
            <TextInputField
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
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

          <Text style={styles.hintText}>
            Password must be at least 8 characters and include 1 special character.
          </Text>

          <View style={styles.row}>
            <View style={styles.rowHalf}>
              <TextInputField
                label="F / M"
                placeholder="F or M"
                value={gender}
                onChangeText={setGender}
                maxLength={1}
              />
            </View>

            <View style={styles.rowHalf}>
              <TextInputField
                label="Age"
                placeholder="Your age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>
          </View>

          <PrimaryButton
            title="Sign up"
            onPress={handleSignUp}
            loading={loading}
            disabled={!name || !email || !password}
          />
        </View>

        <TouchableOpacity
          style={styles.backToSignIn}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.backText}>Back to sign in</Text>
        </TouchableOpacity>
      </Animated.View>
      </TouchableWithoutFeedback>

      {/* ⚠️ WARNING/SUCCESS POPUP MODAL */}
      <Modal transparent visible={warningVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[
              styles.modalWarning, 
              isSuccessMessage && styles.modalSuccess
            ]}>
              {isSuccessMessage ? '✅ Success' : '⚠️ Warning'}
            </Text>
            <Text style={styles.modalText}>{warningText}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setWarningVisible(false);
                // Navigate to Welcome screen to continue onboarding
                if (isSuccessMessage) {
                  setTimeout(() => {
                    navigation.replace("Welcome");
                  }, 300);
                }
              }}
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
    marginBottom: 24,
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
    backgroundColor: isDark ? '#1c1c1c' : '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hintText: {
    ...typography.caption,
    color: isDark ? '#b5b5b5' : colors.textMuted,
    marginTop: 4,
    marginBottom: 10,
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
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  rowHalf: {
    flex: 1,
  },
  backToSignIn: {
    marginTop: 16,
    alignSelf: 'center',
  },
  backText: {
    ...typography.label,
    color: colors.primaryBlue,
  },

  /* MODAL STYLES */
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
  modalSuccess: {
    color: "#10B981",
  },
  modalText: {
    ...typography.bodyMedium,
    textAlign: "center",
    marginBottom: 20,
    color: isDark ? "#e5e5e5" : "#333",
    lineHeight: 24,
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

export default SignUp;
