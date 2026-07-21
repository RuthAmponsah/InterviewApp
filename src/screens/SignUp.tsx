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
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../components/PrimaryButton';
import TextInputField from '../components/TextInputField';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import { supabase } from "../config/supabase";
import { authKeyboardVerticalOffset, keyboardAwareScrollProps } from '../utils/keyboard';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUp: React.FC<Props> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = makeStyles(colors, isDark);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    Alert.alert('Warning', msg);
  };

  const showSuccess = (msg: string) => {
    Alert.alert('Success', msg, [
      {
        text: 'OK',
        onPress: () => navigation.replace('SignIn'),
      },
    ]);
  };

  // CREATE AUTH USER, THEN RETURN TO SIGN IN
  const handleSignUp = async () => {
    if (!name || !email || !password) return;

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
      // 1. Create auth user in Supabase
      console.log('Creating Supabase Auth account for:', email.toLowerCase());
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: 'interviewapp://',
          data: {
            name: name,
            age: ageNum.toString(),
          },
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

      setLoading(false);

      if (authData.session) {
        await supabase.auth.signOut();
      }

      // Show success message and return to sign in
      showSuccess(
        `Account created! Please check your email to confirm, then sign in.`
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
      keyboardVerticalOffset={authKeyboardVerticalOffset}
    >
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

            <TextInputField
              label="Age"
              placeholder="Your age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />

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
});

export default SignUp;
