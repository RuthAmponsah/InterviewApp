import React, { useEffect, useRef, useState, Component } from 'react';
import { View, StyleSheet, useColorScheme, ActivityIndicator, Text, ScrollView } from 'react-native';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { RootStackParamList } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { initializePurchases } from './src/services/purchaseService';
import { initializeNotifications } from './src/services/notificationService';
import LaunchAnimation from './src/components/LaunchAnimation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/config/supabase';

const BRAND_BLUE = '#1E3A6E';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['interviewapp://'],
  config: {
    screens: {
      ResetPasswordViaEmail: 'reset-password',
      SignIn: 'sign-in',
      SignUp: 'sign-up',
      ForgotPassword: 'forgot-password',
      MainTabs: '',
    },
  },
};

const AppLoadingScreen = ({ isDark, message = 'Loading My Interview...' }: { isDark: boolean; message?: string }) => (
  <View style={[styles.loadingScreen, { backgroundColor: isDark ? '#0f0f0f' : '#FFFFFF' }]}>
    <Text style={styles.loadingBrand}>MY INTERVIEW</Text>
    <ActivityIndicator size="large" color={BRAND_BLUE} />
    <Text style={[styles.loadingText, { color: isDark ? '#e5e5e5' : '#4B5563' }]}>{message}</Text>
  </View>
);

// ─── Error Boundary ───────────────────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error: string; }
class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message || String(error) };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('❌ App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <ScrollView contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ fontSize: 13, color: '#555', textAlign: 'center' }}>{this.state.error}</Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 16, textAlign: 'center' }}>Please close and reopen the app. If this keeps happening, contact support.</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

// Catch fatal JS errors that happen outside React's render cycle (event handlers,
// promises, timers, native module init) — ErrorBoundary alone cannot catch these,
// and in production/release builds an uncaught error here shows as a blank white
// screen with no visible log. Logging it at least gets it into device logs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalObj = globalThis as any;
if (globalObj.ErrorUtils) {
  const defaultHandler = globalObj.ErrorUtils.getGlobalHandler();
  globalObj.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error('❌ Uncaught global error:', isFatal, error);
    defaultHandler(error, isFatal);
  });
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [fontsLoaded, fontLoadError] = useFonts({
    Poppins_600SemiBold,
  });
  const [showSplash, setShowSplash] = useState(true);
  const [fontError, setFontError] = useState(false);

  useEffect(() => {
    // Check if fonts failed to load or took too long
    if (fontLoadError) {
      console.error('❌ Font load error:', fontLoadError);
      setFontError(true);
    } else {
      // Set a timeout - if fonts don't load in 10 seconds, show error
      const timer = setTimeout(() => {
        if (!fontsLoaded) {
          console.error('⏱️ Fonts took too long to load, showing error');
          setFontError(true);
        }
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontLoadError]);

  useEffect(() => {
    // Initialize RevenueCat for in-app purchases
    initializePurchases();
    
    // Initialize push notifications with Duolingo-style reminders
    initializeNotifications();

    // Restore Supabase session from AsyncStorage if it exists
    restoreSupabaseSession();
  }, []);

  const restoreSupabaseSession = async () => {
    try {
      const sessionJson = await AsyncStorage.getItem('supabase.session');
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        // Set the session on the Supabase client
        const { error } = await supabase.auth.setSession(session);
        if (error) {
          console.warn('Error restoring session:', error);
        } else {
          console.log('✅ Supabase session restored');
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
    }
  };

  if (fontError) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: isDark ? '#0f0f0f' : '#ffffff' }]}>
        <Text style={{ color: isDark ? '#ffffff' : '#000000', fontSize: 16, textAlign: 'center', marginHorizontal: 20 }}>
          ⚠️ Loading Error
          {'\n\n'}
          The app is having trouble loading. Please close and reopen the app.
        </Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return <AppLoadingScreen isDark={isDark} message="Preparing your app..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f0f0f' : '#ffffff' }]}>
      <ThemeProvider>
        <NavigationContainer linking={linking}>
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
      {showSplash && (
        <View style={StyleSheet.absoluteFill}>
          <LaunchAnimation onFinish={() => setShowSplash(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingBrand: {
    color: BRAND_BLUE,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
});
