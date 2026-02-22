import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
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
  
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
  });
  const [showSplash, setShowSplash] = useState(true);

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

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0f0f0f' : '#ffffff' }]}
      >
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
