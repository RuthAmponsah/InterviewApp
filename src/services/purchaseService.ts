import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { firstConfigValue } from '../utils/env';

export type SubscriptionTier = 'free' | 'monthly' | 'annual' | 'premium';
export type PaidSubscriptionTier = Exclude<SubscriptionTier, 'free' | 'premium'>;

const SUBSCRIPTION_TIER_CACHE_KEY = 'subscriptionTier';

const getPackageSignals = (pkg: PurchasesPackage) => {
  const product = (pkg as any).product || {};
  return [
    product.identifier,
    product.productIdentifier,
    product.title,
    product.description,
    product.subscriptionPeriod,
    product.period,
    pkg.identifier,
    pkg.packageType,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

export const getPackageSubscriptionTier = (pkg: PurchasesPackage): PaidSubscriptionTier => {
  const packageType = String((pkg as any).packageType || '').toLowerCase();
  if (packageType.includes('annual')) return 'annual';
  if (packageType.includes('monthly')) return 'monthly';

  const signals = getPackageSignals(pkg);

  if (/year|yearly|annual|annually|12\s*month|p1y/.test(signals)) {
    return 'annual';
  }

  return 'monthly';
};

export const getSubscriptionPackageForTier = (
  packages: PurchasesPackage[],
  tier: PaidSubscriptionTier,
): PurchasesPackage | null => {
  const packageTypeMatch = packages.find((pkg) => {
    const packageType = String((pkg as any).packageType || '').toLowerCase();
    return tier === 'annual'
      ? packageType.includes('annual')
      : packageType.includes('monthly');
  });

  if (packageTypeMatch) return packageTypeMatch;

  return packages.find((pkg) => getPackageSubscriptionTier(pkg) === tier) || null;
};

export const getPackageDisplayPrice = (pkg: PurchasesPackage | null, fallback: string) => {
  const product = (pkg as any)?.product || {};
  return product.priceString || product.localizedPriceString || product.priceStringWithCurrencyCode || fallback;
};

export const isPremiumTier = (tier?: string | null) =>
  tier === 'monthly' || tier === 'annual' || tier === 'premium';

const cacheSubscriptionTier = async (tier: SubscriptionTier) => {
  await AsyncStorage.setItem(SUBSCRIPTION_TIER_CACHE_KEY, tier);
};

const saveSubscriptionStatus = async (
  userId: string,
  tier: SubscriptionTier,
  expiresAt: string | null,
) => {
  const update = {
    subscription_tier: tier,
    subscription_expires_at: expiresAt,
  };

  const { data: existingPrefs, error: selectError } = await supabase
    .from('user_preferences')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) {
    console.error('Error checking subscription status row:', selectError);
    throw selectError;
  }

  const { error } = existingPrefs
    ? await supabase
        .from('user_preferences')
        .update(update)
        .eq('user_id', userId)
    : await supabase
        .from('user_preferences')
        .insert({ user_id: userId, ...update });

  if (error) {
    console.error('Error saving subscription status:', error);
    throw error;
  }

  await cacheSubscriptionTier(tier);
};

// RevenueCat API Keys
const envExtra = ((Constants.expoConfig as any)?.extra || (Constants.manifest as any)?.extra || {}) as Record<string, any>;
const REVENUECAT_IOS_KEY = firstConfigValue(
  envExtra.revenuecatIosKey,
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
);
const REVENUECAT_ANDROID_KEY = firstConfigValue(
  envExtra.revenuecatAndroidKey,
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
);

if (!REVENUECAT_IOS_KEY || !REVENUECAT_ANDROID_KEY) {
  console.warn('⚠️ RevenueCat API keys not found. Subscription functionality will be limited.');
} else {
  console.log('✅ RevenueCat keys loaded:', {
    ios: Boolean(REVENUECAT_IOS_KEY),
    android: Boolean(REVENUECAT_ANDROID_KEY),
  });
}

/**
 * Initialize RevenueCat SDK
 * Call this in App.tsx on app launch
 */
export const initializePurchases = async () => {
  try {
    const isIos = Platform.OS === 'ios';
    const apiKey = isIos ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

    console.log(`RevenueCat initialize on ${Platform.OS}`, {
      apiKeyPresent: Boolean(apiKey),
      expectedPrefix: isIos ? 'appl_' : 'goog_',
      keySample: apiKey ? apiKey.slice(0, 5) : null,
    });

    if (!apiKey) {
      console.warn('⚠️ RevenueCat API key is missing for this platform.');
      return false;
    }

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
      const tier = /year|annual|p1y/i.test(entitlement.productIdentifier) ? 'annual' : 'monthly';
      
      await saveSubscriptionStatus(userId, tier, entitlement.expirationDate);
      
      console.log(`✅ Synced subscription: ${tier}`);
    } else {
      // No active subscription, set to free
      await saveSubscriptionStatus(userId, 'free', null);
      
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
        const tier = getPackageSubscriptionTier(packageToPurchase);
        
        await saveSubscriptionStatus(
          userId,
          tier,
          customerInfo.entitlements.active['premium'].expirationDate,
        );
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

// Maps internal pack IDs to App Store / Google Play product IDs
const SECTOR_PACK_PRODUCT_IDS: Record<string, string> = {
  'nhs-care':   'myinterview_nhs_care_v2',
  'graduate':   'myinterview_graduate_v2',
  'retail':     'myinterview_retail_v2',
  'management': 'myinterview_management_v2',
};

/**
 * Saves a purchased pack ID to the database for the current user
 */
const waitForServerPackUnlock = async (
  packId: string,
  attempts = 10,
  delayMs = 2000,
): Promise<boolean> => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const purchasedPacks = await getPurchasedPacks();
    if (purchasedPacks.includes(packId)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
};

export const syncSectorPacksFromServer = async (): Promise<string[]> => {
  const { data, error } = await supabase.functions.invoke('sync-sector-packs', {
    method: 'POST',
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data?.purchasedPacks) ? data.purchasedPacks : [];
};

/**
 * Direct database helper for reading confirmed server-side purchases.
 */
const getPurchasedPacksFromDb = async (): Promise<string[]> => {
  const userId = await AsyncStorage.getItem('userId');
  if (!userId) return [];

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('purchased_packs')
    .eq('user_id', userId)
    .single();

  return prefs?.purchased_packs || [];
};

/**
 * Purchase a one-time sector pack via RevenueCat non-consumable IAP
 */
export const purchaseSectorPack = async (
  packId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const productId = SECTOR_PACK_PRODUCT_IDS[packId];
    if (!productId) {
      return { success: false, error: 'Unknown pack' };
    }

    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      return { success: false, error: 'User not logged in' };
    }

    // Fetch product from App Store / Google Play via RevenueCat
    const products = await Purchases.getProducts([productId]);
    if (!products || products.length === 0) {
      console.error('Sector pack product not found in store:', productId);
      return { success: false, error: 'Product not available in store. Please try again later.' };
    }

    // Trigger the purchase sheet
    const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);

    // This client-side check is only used to know whether to wait for the
    // RevenueCat webhook. The database unlock is server-side only.
    const purchased = customerInfo.nonSubscriptionTransactions.some(
      (t) => t.productIdentifier === productId
    );

    if (purchased) {
      const serverUnlocked = await waitForServerPackUnlock(packId);
      if (serverUnlocked) {
        console.log('✅ Sector pack verified by server:', packId);
        return { success: true };
      }

      return {
        success: false,
        error: 'Purchase completed, but server verification is still pending. Please tap Restore Purchases in a moment.',
      };
    }

    return { success: false, error: 'Purchase not confirmed by store.' };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, error: 'User cancelled' };
    }
    console.error('Sector pack purchase error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore previously purchased sector packs (e.g. after reinstall)
 */
export const restoreSectorPacks = async (): Promise<{ restoredCount: number; error?: string }> => {
  try {
    await Purchases.restorePurchases();
    const before = await getPurchasedPacksFromDb();
    const after = await syncSectorPacksFromServer();
    const restoredPackIds = after.filter((packId) => !before.includes(packId));

    console.log('✅ Server-verified sector packs:', after);
    return { restoredCount: restoredPackIds.length || after.length };
  } catch (error: any) {
    console.error('Restore sector packs error:', error);
    return { restoredCount: 0, error: error.message };
  }
};

/**
 * Restore purchases (for users who reinstalled app)
 */
export const restorePurchases = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    let restoredPacks: string[] = [];
    
    // Update database with restored purchases
    const userId = await AsyncStorage.getItem('userId');
    if (userId && typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
      const entitlement = customerInfo.entitlements.active['premium'];
      const tier = /year|annual|p1y/i.test(entitlement.productIdentifier) ? 'annual' : 'monthly';
      
      await saveSubscriptionStatus(userId, tier, entitlement.expirationDate);
    }

    if (userId) {
      try {
        restoredPacks = await syncSectorPacksFromServer();
      } catch (packError) {
        console.error('Restore sector packs during purchase restore failed:', packError);
      }
    }
    
    return {
      success:
        typeof customerInfo.entitlements.active['premium'] !== 'undefined' ||
        restoredPacks.length > 0,
    };
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
  tier: SubscriptionTier;
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
    
    const cachedTier = await AsyncStorage.getItem(SUBSCRIPTION_TIER_CACHE_KEY);
    const tier = (prefs?.subscription_tier || cachedTier || 'free') as SubscriptionTier;

    if (!isPremiumTier(tier)) {
      await cacheSubscriptionTier('free');
      return { isActive: false, tier: 'free' };
    }
    
    // Check if subscription is still active
    const expiresAt = prefs?.subscription_expires_at ? new Date(prefs.subscription_expires_at) : null;
    const isActive = !expiresAt || expiresAt > new Date();
    await cacheSubscriptionTier(isActive ? tier : 'free');
    
    return {
      isActive,
      tier: isActive ? tier : 'free',
      expiresAt: prefs?.subscription_expires_at,
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
    return await getPurchasedPacksFromDb();
  } catch (error) {
    console.error('Error fetching packs:', error);
    return [];
  }
};
