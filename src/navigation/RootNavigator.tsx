import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState, useEffect, useRef } from "react";
import { ActivityIndicator, View, Text, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "../theme/ThemeContext";
import OfflineBanner from "../components/OfflineBanner";
import { supabase } from "../config/supabase";

// Screens
import SignIn from "../screens/SignIn";
import SignUp from "../screens/SignUp";
import ForgotPassword from "../screens/ForgotPassword";
import ResetPassword from "../screens/ResetPassword";
import ResetPasswordViaEmail from "../screens/ResetPasswordViaEmail";
import Welcome from "../screens/Welcome";
import Home from "../screens/Home";
import Jobs from "../screens/Jobs";
import Settings from "../screens/Settings";
import MyProfile from "../screens/MyProfile";
import EditProfile from "../screens/EditProfile";
import InterviewType from "../screens/InterviewType";
import InterviewChat from "../screens/InterviewChat";
import Feedback from "../screens/Feedback";
import InterviewExperience from "../screens/InterviewExperience";
import AppCustomisation from "../screens/AppCustomisation";
import JobPreferences from "../screens/JobPreferences";
import PrivacySecurity from "../screens/PrivacySecurity";
import Support from "../screens/Support";
import SupportChat from "../screens/SupportChat";
import AboutUs from "../screens/AboutUs";
import HelpCentre from "../screens/HelpCentre";
import ChangePassword from "../screens/ChangePassword";
import Notifications from "../screens/Notifications";
import InterviewHistory from "../screens/InterviewHistory";
import QuestionBank from "../screens/QuestionBank";
import ProgressDashboard from "../screens/ProgressDashboard";
import InterviewTips from "../screens/InterviewTips";
import SuccessStories from "../screens/SuccessStories";
import AddStory from "../screens/AddStory";
import AllFeedback from "../screens/AllFeedback";
import Subscription from "../screens/Subscription";
import SectorPacks from "../screens/SectorPacks";
import ViewCV from "../screens/ViewCV";
import CreateCV from "../screens/CreateCV";

// -----------------------------
// STACK NAV TYPES
// -----------------------------
export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  ResetPasswordViaEmail: {
    token?: string;
    email?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenHash?: string;
    type?: string;
  } | undefined;
  Welcome: undefined;
  MainTabs: undefined;
  InterviewType: undefined;
  InterviewChat: { mode: "text" | "voice" };
  Feedback: { duration?: number; messageCount?: number; interviewId?: string; hasNoResponses?: boolean } | undefined;
  MyProfile: undefined;
  EditProfile: undefined;
  InterviewExperience: undefined;
  AppCustomisation: undefined;
  JobPreferences: undefined;
  PrivacySecurity: undefined;
  Support: undefined;
  SupportChat: undefined;
  AboutUs: undefined;
  HelpCentre: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  InterviewHistory: undefined;
  QuestionBank: undefined;
  ProgressDashboard: undefined;
  InterviewTips: undefined;
  SuccessStories: undefined;
  AddStory: undefined;
  AllFeedback: undefined;
  Settings: undefined;
  Subscription: { showClose?: boolean } | undefined;
  SectorPacks: undefined;
  ViewCV: undefined;
  CreateCV: undefined;
};

// -----------------------------
// TABS
// -----------------------------
export type MainTabParamList = {
  HomeTab: undefined;
  JobsTab: undefined;
  SettingsTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { colors } = useTheme();
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      const name = await AsyncStorage.getItem("userName");
      const email = await AsyncStorage.getItem("userEmail");
      const photo = await AsyncStorage.getItem("userProfilePhoto");
      const jobRole = await AsyncStorage.getItem("jobRole");
      
      let completedItems = 0;
      if (name && name !== "User") completedItems++;
      if (email) completedItems++;
      if (photo) completedItems++;
      if (jobRole) completedItems++;
      
      const percentage = Math.round((completedItems / 4) * 100);
      setProfileIncomplete(percentage < 100);
    };

    checkProfileCompletion();
    
    // Check every time tabs gain focus
    const interval = setInterval(checkProfileCompletion, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mark onboarding as complete when user reaches main tabs
  useEffect(() => {
    AsyncStorage.setItem("hasCompletedOnboarding", "true");
  }, []);

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryBlue,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="JobsTab"
        component={Jobs}
        options={{
          title: "Jobs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={Settings}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={MyProfile}
        options={{
          title: "My Profile",
          tabBarBadge: profileIncomplete ? ' ' : undefined,
          tabBarBadgeStyle: {
            minWidth: 8,
            maxWidth: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#EF4444',
            fontSize: 0,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// -----------------------------
// ROOT NAV
// -----------------------------
const RootNavigator = () => {
  const { colors } = useTheme();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [resetPasswordParams, setResetPasswordParams] =
    useState<RootStackParamList['ResetPasswordViaEmail']>(undefined);
  const resetLinkHandledRef = useRef(false);

  const parseResetPasswordLink = (url: string): RootStackParamList['ResetPasswordViaEmail'] => {
    if (!url.includes('reset-password') && !url.includes('type=recovery')) {
      return undefined;
    }

    const parsedParams: Record<string, string> = {};
    const fragments = url.split(/[?#]/).slice(1);

    for (const fragment of fragments) {
      for (const pair of fragment.split('&')) {
        const [rawKey, rawValue] = pair.split('=');
        if (!rawKey || !rawValue) continue;
        parsedParams[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
      }
    }

    return {
      token: parsedParams.token,
      email: parsedParams.email,
      accessToken: parsedParams.access_token,
      refreshToken: parsedParams.refresh_token,
      tokenHash: parsedParams.token_hash,
      type: parsedParams.type,
    };
  };

  const syncUserContextFromSession = async (session: any) => {
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) return;

    await AsyncStorage.setItem('userId', userId);
    if (userEmail) {
      await AsyncStorage.setItem('userEmail', userEmail.toLowerCase());
    }

    const { data: userData } = await supabase
      .from('users')
      .select('name, email, job_role, profile_photo')
      .eq('id', userId)
      .single();

    if (userData?.name) {
      await AsyncStorage.setItem('userName', userData.name);
    }
    if (userData?.email) {
      await AsyncStorage.setItem('userEmail', userData.email.toLowerCase());
    }
    if (userData?.job_role) {
      await AsyncStorage.setItem('jobRole', userData.job_role);
    } else {
      await AsyncStorage.removeItem('jobRole');
    }
    if (userData?.profile_photo) {
      await AsyncStorage.setItem('userProfilePhoto', userData.profile_photo);
    } else {
      await AsyncStorage.removeItem('userProfilePhoto');
    }

    await AsyncStorage.setItem('isLoggedIn', 'true');
  };

  const clearLocalAuthContext = async () => {
    const keysToRemove = ['userId', 'userEmail', 'userName', 'jobRole', 'userProfilePhoto', 'supabase.session'];
    for (const key of keysToRemove) {
      await AsyncStorage.removeItem(key);
    }
    await AsyncStorage.setItem('isLoggedIn', 'false');
  };

  useEffect(() => {
    // Handle deep links for password reset
    const handleDeepLink = (url: string | null) => {
      if (!url) return;
      const params = parseResetPasswordLink(url);
      if (params) {
        resetLinkHandledRef.current = true;
        setResetPasswordParams(params);
        setInitialRoute('ResetPasswordViaEmail');
      }
    };

    Linking.getInitialURL().then(handleDeepLink);
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const determineInitialRoute = async () => {
      try {
        // Create session promise with a timeout
        let session = null;
        let timedOut = false;

        // Start the session check
        const sessionPromise = supabase.auth.getSession();

        // Create a timeout that marks failure
        const timeoutId = setTimeout(() => {
          timedOut = true;
          console.warn('⏱️ Session check timed out after 5 seconds');
        }, 5000);

        // Wait for session or timeout
        const { data: { session: authSession } } = await sessionPromise;
        clearTimeout(timeoutId);

        if (resetLinkHandledRef.current) {
          return;
        }

        if (timedOut) {
          console.warn('⚠️ Session check completed but took too long, defaulting to SignIn');
          setInitialRoute("SignIn");
          return;
        }

        session = authSession;
        console.log('📱 App loaded - Supabase session:', session ? 'Active ✅' : 'None ❌');

        if (session) {
          await syncUserContextFromSession(session);
          // Logged in, go to main app
          console.log('✅ User has valid session, showing MainTabs');
          setInitialRoute("MainTabs");
        } else {
          await clearLocalAuthContext();
          // Logged out, show sign in
          console.log('❌ No session found, showing SignIn');
          setInitialRoute("SignIn");
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
        setLoadError(true);
        setInitialRoute("SignIn");
      }
    };

    determineInitialRoute();
  }, []);

  // Show loading state while determining route
  if (initialRoute === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  // Show error state if loading failed
  if (loadError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: colors.textDark,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          ⚠️ Loading Error
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textMuted,
            textAlign: "center",
          }}
        >
          The app encountered an error. Please close and reopen the app.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Navigator
        key={initialRoute === 'ResetPasswordViaEmail' ? `reset-${JSON.stringify(resetPasswordParams)}` : 'root'}
        id="RootStack"
        initialRouteName={initialRoute as any}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
      {/* Auth */}
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen
        name="ResetPasswordViaEmail"
        component={ResetPasswordViaEmail}
        initialParams={resetPasswordParams}
      />

      {/* Intro */}
      <Stack.Screen name="Welcome" component={Welcome} />

      {/* Tabs */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Interview */}
      <Stack.Screen name="InterviewType" component={InterviewType} />
      <Stack.Screen name="InterviewChat" component={InterviewChat} />
      <Stack.Screen name="Feedback" component={Feedback} />

      {/* Profile */}
      <Stack.Screen name="MyProfile" component={MyProfile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="ViewCV" component={ViewCV} />
      <Stack.Screen name="CreateCV" component={CreateCV} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} />
      <Stack.Screen name="Notifications" component={Notifications} />

      {/* Settings pages */}
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="InterviewExperience" component={InterviewExperience} />
      <Stack.Screen name="AppCustomisation" component={AppCustomisation} />
      <Stack.Screen name="JobPreferences" component={JobPreferences} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurity} />
      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="SupportChat" component={SupportChat} />
      <Stack.Screen name="AboutUs" component={AboutUs} />
      <Stack.Screen name="HelpCentre" component={HelpCentre} />
      <Stack.Screen name="InterviewHistory" component={InterviewHistory} />
      <Stack.Screen name="QuestionBank" component={QuestionBank} />
      <Stack.Screen name="ProgressDashboard" component={ProgressDashboard} />
      <Stack.Screen name="InterviewTips" component={InterviewTips} />
      <Stack.Screen name="SuccessStories" component={SuccessStories} />
      <Stack.Screen name="AddStory" component={AddStory} />
      <Stack.Screen name="AllFeedback" component={AllFeedback} />
      
      {/* Subscription & Monetization */}
      <Stack.Screen name="Subscription" component={Subscription} />
      <Stack.Screen name="SectorPacks" component={SectorPacks} />
    </Stack.Navigator>
    <OfflineBanner />
    </>
  );
};

export default RootNavigator;
