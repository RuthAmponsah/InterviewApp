import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { initializePurchases } from './src/services/purchaseService';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
  });

  useEffect(() => {
    // Initialize RevenueCat for in-app purchases
    initializePurchases();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}
