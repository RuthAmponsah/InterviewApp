# RevenueCat Payment Integration Setup

## 🎯 Overview

Your app now supports **real in-app purchases** via RevenueCat for:
- Subscriptions (Monthly £7.99, Annual £59.99)
- One-time sector packs (£9.99-£19.99)

RevenueCat handles:
- ✅ iOS App Store billing
- ✅ Google Play billing  
- ✅ Receipt validation
- ✅ Subscription management
- ✅ Cross-platform purchases

---

## 📋 Setup Steps

### 1. Create RevenueCat Account

1. Go to https://www.revenuecat.com/
2. Sign up for free account
3. Create a new app project
4. Note your **API keys** (iOS & Android)

### 2. Configure App Store Connect (iOS)

1. **Create App in App Store Connect:**
   - Go to https://appstoreconnect.apple.com/
   - Create your app listing
   - Note your **Bundle ID**

2. **Create In-App Purchases:**
   
   **Subscriptions:**
   - Type: Auto-Renewable Subscription
   - Group: Create "Premium" subscription group
   
   Products:
   ```
   Product ID: premium_monthly
   Price: £7.99 (GBP)
   Duration: 1 Month
   
   Product ID: premium_annual
   Price: £59.99 (GBP)
   Duration: 1 Year
   ```

   **Sector Packs (Non-Consumable):**
   ```
   Product ID: pack_nhs_care
   Price: £14.99 (GBP)
   
   Product ID: pack_graduate
   Price: £19.99 (GBP)
   
   Product ID: pack_retail
   Price: £9.99 (GBP)
   
   Product ID: pack_management
   Price: £14.99 (GBP)
   ```

3. **Link to RevenueCat:**
   - In RevenueCat dashboard → Project Settings → Apple App Store
   - Upload your App Store Connect API Key
   - Enter Bundle ID

### 3. Configure Google Play Console (Android)

1. **Create App in Google Play Console:**
   - Go to https://play.google.com/console/
   - Create your app listing
   - Note your **Package Name**

2. **Create In-App Products:**
   
   Same Product IDs as iOS:
   - `premium_monthly` - £7.99
   - `premium_annual` - £59.99
   - `pack_nhs_care` - £14.99
   - `pack_graduate` - £19.99
   - `pack_retail` - £9.99
   - `pack_management` - £14.99

3. **Link to RevenueCat:**
   - In RevenueCat dashboard → Project Settings → Google Play
   - Upload Service Account JSON key
   - Enter Package Name

### 4. Configure RevenueCat Offerings

1. **In RevenueCat Dashboard → Offerings:**

2. **Create "Default" Offering:**
   
   **Packages:**
   ```
   Package Identifier: monthly
   Product: premium_monthly
   
   Package Identifier: annual
   Product: premium_annual
   ```

3. **Create Entitlement:**
   - Name: `premium`
   - Attach both products to this entitlement

### 5. Update App Code

Edit [src/services/purchaseService.ts](src/services/purchaseService.ts):

```typescript
// Replace these with your actual keys
const REVENUECAT_IOS_KEY = 'appl_xxxxxxxxxxxxxxxx';
const REVENUECAT_ANDROID_KEY = 'goog_xxxxxxxxxxxxxxxx';
```

### 6. Initialize RevenueCat in App

Edit [App.tsx](App.tsx):

```typescript
import { initializePurchases } from './src/services/purchaseService';

export default function App() {
  useEffect(() => {
    initializePurchases();
  }, []);
  
  // ...rest of your code
}
```

### 7. Update app.json

Add required permissions:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-purchases",
        {
          "enablePendingPurchases": true
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "SKAdNetworkItems": [
          {
            "SKAdNetworkIdentifier": "cstr6suwn9.skadnetwork"
          }
        ]
      }
    }
  }
}
```

---

## 🧪 Testing

### Test Purchases (Sandbox)

**iOS:**
1. Settings → App Store → Sandbox Account
2. Create test account in App Store Connect
3. Use test account to purchase

**Android:**
1. Google Play Console → License Testing
2. Add your Gmail as test account
3. Use that account to purchase

### Test in Your App

1. Run: `npx expo run:ios` or `npx expo run:android`
2. Go to Settings → Subscription
3. Click "Start Annual Plan"
4. Use sandbox/test account to complete purchase
5. Should update database and unlock unlimited interviews

---

## 💰 Pricing & Fees

**RevenueCat Free Tier:**
- Up to $2,500 monthly tracked revenue
- Unlimited purchases
- All features included

**App Store Fees (iOS):**
- 30% commission first year
- 15% after 1 year subscription

**Google Play Fees (Android):**
- 30% commission first year
- 15% after 1 year subscription

---

## 🔐 Security

✅ **Server-Side Validation:**
- RevenueCat validates all receipts
- Prevents fraud and piracy
- Updates happen in real-time

✅ **Database Updates:**
- Only updated after successful purchase
- Stores subscription expiry dates
- Handles renewals automatically

---

## 🚀 Going Live

### Before Production:

1. ✅ Test all purchase flows
2. ✅ Test restore purchases
3. ✅ Test subscription cancellation
4. ✅ Add privacy policy URL
5. ✅ Add terms of service URL
6. ✅ Submit for App Store review
7. ✅ Submit for Google Play review

### After Approval:

1. Switch from sandbox to production in RevenueCat
2. Monitor purchases in RevenueCat dashboard
3. Check Supabase for correct subscription_tier updates

---

## 📊 Analytics

RevenueCat provides:
- Active subscriptions count
- Monthly recurring revenue (MRR)
- Churn rate
- Trial conversion rate
- Refund rate

Access at: https://app.revenuecat.com/charts

---

## ❓ Troubleshooting

**"No products found":**
- Check product IDs match exactly
- Wait 2-4 hours after creating products
- Ensure products are approved/active

**"Purchase failed":**
- Check sandbox account is signed in
- Verify Bundle ID / Package Name matches
- Check RevenueCat API keys are correct

**"Already purchased":**
- Use "Restore Purchases" button
- Or delete and reinstall app in sandbox

---

## 📚 Resources

- RevenueCat Docs: https://docs.revenuecat.com/
- iOS IAP Guide: https://developer.apple.com/in-app-purchase/
- Android IAP Guide: https://developer.android.com/google/play/billing

---

## ✅ Current Status

- ✅ RevenueCat SDK installed
- ✅ Purchase service created
- ✅ Subscription screen updated
- ✅ Sector packs screen updated
- ⏳ RevenueCat keys needed (add yours)
- ⏳ App Store products needed
- ⏳ Google Play products needed

**Next:** Add your RevenueCat API keys and create products in app stores!
