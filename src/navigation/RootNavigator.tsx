import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "../theme/ThemeContext";
import OfflineBanner from "../components/OfflineBanner";
import { supabase } from "../config/supabase";

// Screens
import SignIn from "../screens/SignIn";
import SignUp from "../screens/SignUp";
import ForgotPassword from "../screens/ForgotPassword";
import ResetPassword from "../screens/ResetPassword";
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

// -----------------------------
// STACK NAV TYPES
// -----------------------------
export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
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

  useEffect(() => {
    const determineInitialRoute = async () => {
      try {
        // Wait a moment for Supabase to restore session from AsyncStorage
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📱 App loaded - Supabase session:', session ? 'Active ✅' : 'None ❌');

        if (session) {
          // Logged in, go to main app
          console.log('✅ User has valid session, showing MainTabs');
          setInitialRoute("MainTabs");
        } else {
          // Logged out, show sign in
          console.log('❌ No session found, showing SignIn');
          setInitialRoute("SignIn");
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setInitialRoute("SignIn");
      }
    };

    determineInitialRoute();
  }, []);

  // Show loading state while determining route
  if (initialRoute === null) {
    return null;
  }

  return (
    <>
      <Stack.Navigator
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
