import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// RevenueCat API Keys
const REVENUECAT_IOS_KEY = Constants.expoConfig?.extra?.revenuecatIosKey || process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = Constants.expoConfig?.extra?.revenuecatAndroidKey || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

if (!REVENUECAT_IOS_KEY || !REVENUECAT_ANDROID_KEY) {
  console.warn('⚠️ RevenueCat API keys not found. Subscription functionality will be limited.');
}

/**
 * Initialize RevenueCat SDK
 * Call this in App.tsx on app launch
 */
export const initializePurchases = async () => {
  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
    
    if (apiKey.includes('YOUR_')) {
      console.log('⚠️ RevenueCat not configured - Using mock purchases');
      return false;
    }

    await Purchases.configure({ apiKey });
    
    // Set user ID if logged in
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      await Purchases.logIn(userId);
      
      // Sync subscription status with database
      await syncSubscriptionStatus();
    }
    
    console.log('✅ RevenueCat initialized');
    return true;
  } catch (error) {
    console.error('❌ RevenueCat init error:', error);
    return false;
  }
};

/**
 * Sync subscription status from RevenueCat to database
 * This ensures the database stays in sync with actual purchase status
 */
export const syncSubscriptionStatus = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    const customerInfo = await Purchases.getCustomerInfo();
    
    // Check if user has active premium entitlement
    if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
      const entitlement = customerInfo.entitlements.active['premium'];
      const tier = entitlement.productIdentifier.includes('annual') ? 'annual' : 'monthly';
      
      await supabase
        .from('user_preferences')
        .update({
          subscription_tier: tier,
          subscription_expires_at: entitlement.expirationDate,
        })
        .eq('user_id', userId);
      
      console.log(`✅ Synced subscription: ${tier}`);
    } else {
      // No active subscription, set to free
      await supabase
        .from('user_preferences')
        .update({
          subscription_tier: 'free',
          subscription_expires_at: null,
        })
        .eq('user_id', userId);
      
      console.log('✅ Synced subscription: free');
    }
  } catch (error) {
    console.error('Error syncing subscription:', error);
  }
};

/**
 * Get available subscription offerings
 */
export const getSubscriptionOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current;
    }
    return null;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
};

/**
 * Purchase a subscription package
 */
export const purchaseSubscription = async (
  packageToPurchase: PurchasesPackage
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    
    // Check if user has active subscription
    if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
      // Update database
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const tier = packageToPurchase.identifier.includes('annual') ? 'annual' : 'monthly';
        
        await supabase
          .from('user_preferences')
          .update({
            subscription_tier: tier,
            subscription_expires_at: customerInfo.entitlements.active['premium'].expirationDate,
          })
          .eq('user_id', userId);
      }
      
      return { success: true };
    }
    
    return { success: false, error: 'Purchase did not activate entitlement' };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, error: 'User cancelled' };
    }
    console.error('Purchase error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Purchase a one-time sector pack
 */
export const purchaseSectorPack = async (
  packId: string,
  price: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // For sector packs, use non-consumable in-app purchase
    // This requires setting up products in App Store Connect / Google Play Console
    
    // TODO: Implement non-consumable IAP for sector packs
    // For now, mock the purchase
    
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      return { success: false, error: 'User not logged in' };
    }
    
    // Get current purchased packs
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('purchased_packs')
      .eq('user_id', userId)
      .single();
    
    const currentPacks = prefs?.purchased_packs || [];
    
    // Add new pack
    if (!currentPacks.includes(packId)) {
      await supabase
        .from('user_preferences')
        .update({
          purchased_packs: [...currentPacks, packId],
        })
        .eq('user_id', userId);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Sector pack purchase error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore purchases (for users who reinstalled app)
 */
export const restorePurchases = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    
    // Update database with restored purchases
    const userId = await AsyncStorage.getItem('userId');
    if (userId && typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
      const entitlement = customerInfo.entitlements.active['premium'];
      const tier = entitlement.productIdentifier.includes('annual') ? 'annual' : 'monthly';
      
      await supabase
        .from('user_preferences')
        .update({
          subscription_tier: tier,
          subscription_expires_at: entitlement.expirationDate,
        })
        .eq('user_id', userId);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Restore error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check current subscription status
 */
export const checkSubscriptionStatus = async (): Promise<{
  isActive: boolean;
  tier: 'free' | 'monthly' | 'annual';
  expiresAt?: string;
}> => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      return { isActive: false, tier: 'free' };
    }
    
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('subscription_tier, subscription_expires_at')
      .eq('user_id', userId)
      .single();
    
    if (!prefs || prefs.subscription_tier === 'free') {
      return { isActive: false, tier: 'free' };
    }
    
    // Check if subscription is still active
    const expiresAt = prefs.subscription_expires_at ? new Date(prefs.subscription_expires_at) : null;
    const isActive = !expiresAt || expiresAt > new Date();
    
    return {
      isActive,
      tier: prefs.subscription_tier,
      expiresAt: prefs.subscription_expires_at,
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { isActive: false, tier: 'free' };
  }
};

/**
 * Get purchased sector packs
 */
export const getPurchasedPacks = async (): Promise<string[]> => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return [];
    
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('purchased_packs')
      .eq('user_id', userId)
      .single();
    
    return prefs?.purchased_packs || [];
  } catch (error) {
    console.error('Error fetching packs:', error);
    return [];
  }
};
