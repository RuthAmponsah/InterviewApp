# RevenueCat Payment Issue - Debug Guide

## The Problem

You're getting a payment flow bug on iPad - the subscribe button doesn't initiate payment on iPad Air.

## Root Cause: Test API Key ⚠️

Yes, you're likely using a **test/sandbox API key** which:
- ✅ Works in development
- ❌ **Does NOT work with real App Store submissions**
- Apple reviewers use production credentials, not sandbox

---

## Quick Fix: Switch to Production API Key

### Step 1: Check Your Current Key

In `src/services/purchaseService.ts`, line 8-9:

```typescript
const REVENUECAT_IOS_KEY = Constants.expoConfig?.extra?.revenuecatIosKey || process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = Constants.expoConfig?.extra?.revenuecatAndroidKey || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';
```

If this contains `test_` prefix → **You're using test key** ❌

### Step 2: Get Production API Keys

1. Go to: https://app.revenuecat.com/
2. Log in with your account
3. Click your **Project** → **Settings** → **API Keys**
4. You should see two keys:
   - **Sandbox/Test:** `test_oNKpBYbmxgLxjwwwHVhOfIfIFhP` (development only)
   - **Production:** `appl_xxxxxxxxxxxxx` (for App Store)

5. Copy the **Production** keys (start with `appl_` or `goog_`)

### Step 3: Update Your .env File

Edit `.env` in your root directory:

```bash
# OLD (Test - don't use for submission)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=test_oNKpBYbmxgLxjwwwHVhOfIfIFhP

# NEW (Production - use for App Store)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxx
```

### Step 4: Rebuild the App

```bash
# Rebuild with production credentials
eas build --platform ios --profile production

# Or locally for testing:
npx expo start --clean
```

---

## What Else Could Be Wrong

Even with production keys, check these:

### 1️⃣ Products Not Created in RevenueCat

If products don't exist, the payment flow fails.

**Check this:**
```
1. Go to https://app.revenuecat.com/
2. Click "Products" in left sidebar
3. Should see:
   - premium_monthly
   - premium_annual
```

If empty, create them:
```
1. Click "New Product"
2. Identifier: premium_monthly
3. Title: Premium - Monthly
4. Type: Subscription
5. Save

Repeat for premium_annual
```

### 2️⃣ Offering Not Set Up

Products must be in an "Offering" for the app to see them.

**Check this:**
```
1. Go to "Offerings" in left sidebar
2. Should see "default" offering
3. Click it - should list:
   - monthly package
   - annual package
```

If not set up:
```
1. Create new offering: "default"
2. Add packages:
   - Package ID: monthly, Product: premium_monthly
   - Package ID: annual, Product: premium_annual
3. Set as "Current" offering
```

### 3️⃣ App Store Products Missing

RevenueCat links to App Store, but **your products must exist in App Store Connect too**.

**Check this:**
```
1. Go to https://appstoreconnect.apple.com/
2. Select your app
3. Pricing and Availability → In-App Purchases
4. Should see:
   - premium_monthly (subscription)
   - premium_annual (subscription)
```

If missing, create them in App Store Connect first, then add to RevenueCat.

### 4️⃣ iPad Viewport Issue

Sometimes payment sheet doesn't display on iPad due to dimensions.

**Test this:**
```typescript
// In your Subscription screen, before calling purchase:

import { useWindowDimensions } from 'react-native';

export default function Subscription() {
  const { width, height } = useWindowDimensions();
  
  console.log('Screen dimensions:', width, 'x', height);
  // iPad Air: 1180 x 820 (landscape) or ~800 x ~1180 (portrait)
  
  const handleSubscribe = async (packageId: string) => {
    try {
      console.log('📱 Device dimensions:', width, 'x', height);
      console.log('🆔 Attempting to purchase:', packageId);
      
      // Your purchase code...
    } catch (error) {
      console.error('❌ Purchase error:', error);
    }
  };
}
```

---

## Step-by-Step Debug Checklist

Box these off as you go:

- [ ] **API Key**: Using production key (starts with `appl_` or `goog_`, NOT `test_`)
- [ ] **Products**: Created in RevenueCat dashboard (premium_monthly, premium_annual)
- [ ] **Offering**: Created in RevenueCat and set as "Current"
- [ ] **App Store**: Products created in App Store Connect
- [ ] **RevenueCat Linked**: App Store Connect API key uploaded to RevenueCat
- [ ] **Entitlement**: Created in RevenueCat with identifier "premium"
- [ ] **.env Updated**: `.env` file has production keys
- [ ] **App Rebuilt**: Fresh build with `eas build` or `expo start --clean`
- [ ] **Test Sandbox**: Use TestFlight sandbox account to test purchase
- [ ] **Device Test**: Test on actual iPad (or iPad Air simulator)
- [ ] **Console Logs**: Check for errors in device logs

---

## Testing the Fix

### On iPad Air Simulator

```bash
1. Open Xcode → Simulator → iPad Air 11-inch
2. Build and run your app
3. Navigate to Subscription screen
4. Tap "Subscribe" button
5. Should see payment sheet promptly

# Expected: Payment sheet appears
# If not: Check console for errors
```

### Using TestFlight (Real Device)

```bash
1. Build production version: eas build --platform ios
2. Submit to TestFlight from Xcode
3. Install on iPad Air via TestFlight
4. Go to Subscription screen
5. Try to purchase
6. Use Sandbox test account when prompted
```

---

## Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| **"No offerings available"** | RevenueCat products/offering not set up | Create products & offering in RevenueCat |
| **"Product not found"** | Product ID mismatch | Check spelling of product IDs |
| **"Network error"** | Bad API key or internet | Use production key, check internet |
| **"Store not available"** | Using test key with real App Store | Switch to production API key |
| **"User cancelled"** | User dismissed payment sheet | Normal - try again |

---

## Why This Happened

- **Development:** You used test keys to develop safely
- **Submission:** Apple's review device needs production keys
- **iPad Issue:** Test keys don't work on production builds

**Solution:** Switch to production credentials for App Store submission.

---

## After Fixing

1. ✅ Update `.env` with production keys
2. ✅ Rebuild app with `eas build --platform ios`
3. ✅ Test on iPad Air simulator
4. ✅ Submit new build to App Store
5. ✅ Reply to Apple saying "Issue resolved"

**Estimated Time to Fix:** 5-10 minutes

