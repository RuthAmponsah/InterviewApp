import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { initializePurchases } from './src/services/purchaseService';
import { initializeNotifications } from './src/services/notificationService';
import AnimatedSplash from './src/components/AnimatedSplash';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Initialize RevenueCat for in-app purchases
    initializePurchases();
    
    // Initialize push notifications with Duolingo-style reminders
    initializeNotifications();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
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
