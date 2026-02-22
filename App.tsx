import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { initializePurchases } from './src/services/purchaseService';
import { initializeNotifications } from './src/services/notificationService';
import AnimatedSplash from './src/components/AnimatedSplash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/config/supabase';

export default function App() {
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
      <View style={[styles.container, { backgroundColor: isDark ? '#0f0f0f' : '#ffffff' }]}>
        <Text style={{ color: isDark ? '#ffffff' : '#000000', fontSize: 16, textAlign: 'center', marginHorizontal: 20 }}>
          ⚠️ Loading Error
          {'\n\n'}
          The app is having trouble loading. Please close and reopen the app.
        </Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0f0f0f' : '#ffffff' }]}>
        <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#0f0f0f'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f0f0f' : '#ffffff' }]}>
      <ThemeProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
      {showSplash && (
        <View style={StyleSheet.absoluteFill}>
          <AnimatedSplash onFinish={() => setShowSplash(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
