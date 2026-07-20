import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firstConfigValue, isValidHttpUrl } from '../utils/env';

const supabaseUrl = firstConfigValue(
  Constants.expoConfig?.extra?.supabaseUrl,
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.supabaseUrl,
);
const supabaseAnonKey = firstConfigValue(
  Constants.expoConfig?.extra?.supabaseAnonKey,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  process.env.supabaseAnonKey,
);

if (!supabaseUrl || !isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials not found. Please check your .env file.');
}

// Use placeholder credentials if config is missing/invalid to avoid a startup crash.
const safeUrl = isValidHttpUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
