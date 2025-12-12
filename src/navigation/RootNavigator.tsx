import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { useTheme } from "../theme/ThemeContext";

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
import AboutUs from "../screens/AboutUs";
import HelpCentre from "../screens/HelpCentre";
import ChangePassword from "../screens/ChangePassword";
import Notifications from "../screens/Notifications";
import InterviewHistory from "../screens/InterviewHistory";
import QuestionBank from "../screens/QuestionBank";

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
  Feedback: undefined;
  MyProfile: undefined;
  EditProfile: undefined;
  InterviewExperience: undefined;
  AppCustomisation: undefined;
  JobPreferences: undefined;
  PrivacySecurity: undefined;
  Support: undefined;
  AboutUs: undefined;
  HelpCentre: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  InterviewHistory: undefined;
  QuestionBank: undefined;
  Settings: undefined;
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

  return (
    <Stack.Navigator
      id="RootStack"
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
      <Stack.Screen name="ChangePassword" component={ChangePassword} />
      <Stack.Screen name="Notifications" component={Notifications} />

      {/* Settings pages */}
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="InterviewExperience" component={InterviewExperience} />
      <Stack.Screen name="AppCustomisation" component={AppCustomisation} />
      <Stack.Screen name="JobPreferences" component={JobPreferences} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurity} />
      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="AboutUs" component={AboutUs} />
      <Stack.Screen name="HelpCentre" component={HelpCentre} />
      <Stack.Screen name="InterviewHistory" component={InterviewHistory} />
      <Stack.Screen name="QuestionBank" component={QuestionBank} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
