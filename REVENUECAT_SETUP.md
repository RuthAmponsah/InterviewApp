# RevenueCat Setup Guide

## ✅ Current Status
- API Key configured: `test_oNKpBYbmxgLxjwwwHVhOfIfIFhP`
- App code already integrated with RevenueCat SDK
- Service layer configured in `src/services/purchaseService.ts`
- Subscription screen ready to display offerings

## 📋 Next Steps to Complete Setup

### 1. Create Products in RevenueCat Dashboard

Go to your RevenueCat project: https://app.revenuecat.com

#### Create Monthly Subscription:
1. Click "Products" in left sidebar
2. Click "New Product"
3. Fill in:
   - **Product ID**: `premium_monthly` (must match your store product ID)
   - **Display Name**: Premium Monthly
   - **Description**: Unlimited interview practice
   - **Type**: Subscription
   - **Duration**: 1 month

#### Create Annual Subscription:
1. Click "New Product" again
2. Fill in:
   - **Product ID**: `premium_annual` (must match your store product ID)
   - **Display Name**: Premium Annual
   - **Description**: Unlimited interview practice - Best Value!
   - **Type**: Subscription
   - **Duration**: 1 year

### 2. Create Entitlement

1. Click "Entitlements" in left sidebar
2. Click "New Entitlement"
3. Fill in:
   - **Identifier**: `premium`
   - **Display Name**: Premium Access
4. Click "Create"
5. Add products to this entitlement:
   - Click the entitlement you just created
   - Click "Add Product"
   - Add both `premium_monthly` and `premium_annual`

### 3. Create Offering

1. Click "Offerings" in left sidebar
2. Click "New Offering"
3. Fill in:
   - **Identifier**: `default`
   - **Display Name**: Default Offering
4. Click "Create"
5. Add packages:
   - Click "Add Package"
   - **Package Identifier**: `monthly`
   - **Product**: Select `premium_monthly`
   - **Position**: 1
   
   - Click "Add Package" again
   - **Package Identifier**: `annual`
   - **Product**: Select `premium_annual`
   - **Position**: 2

6. Set as current offering (toggle switch)

### 4. Set Up App Store Connect (iOS)

1. In RevenueCat dashboard, go to "Apps"
2. Click your iOS app (or create one)
3. Fill in:
   - **Bundle ID**: `com.myinterviewapp` (or your actual bundle ID)
   - **Shared Secret**: Get from App Store Connect
   
4. In App Store Connect:
   - Go to your app
   - Features > In-App Purchases
   - Create subscriptions:
     - `premium_monthly` - Auto-renewable subscription - £7.99/month
     - `premium_annual` - Auto-renewable subscription - £59.99/year
   - Create Subscription Group if needed

### 5. Set Up Google Play (Android)

1. In RevenueCat dashboard, go to "Apps"
2. Click your Android app (or create one)
3. Fill in:
   - **Package Name**: `com.myinterviewapp` (or your actual package name)
   - **Service Account JSON**: Upload from Google Play Console
   
4. In Google Play Console:
   - Go to your app
   - Monetize > Subscriptions
   - Create subscriptions:
     - `premium_monthly` - £7.99/month
     - `premium_annual` - £59.99/year

### 6. Test the Integration

1. Install the app on a device
2. Navigate to Subscription screen
3. You should see both Monthly and Annual plans with prices
4. Try making a test purchase (use test account)
5. Verify subscription syncs to your database

## 🧪 Testing

### iOS Testing
1. Add sandbox test account in App Store Connect
2. Sign out of App Store on device
3. When prompted during purchase, sign in with test account
4. Purchase will complete without charging

### Android Testing
1. Add license tester in Google Play Console
2. Use test Gmail account
3. Purchases will complete without charging

## 🔍 Troubleshooting

### Products not showing in app
- Verify products are in "default" offering
- Check product identifiers match exactly
- Restart app after creating products

### Purchase fails
- Check API key is correct
- Verify App Store Connect / Google Play products exist
- Check bundle ID / package name matches

### Subscription not syncing to database
- Check `syncSubscriptionStatus()` in purchaseService.ts
- Verify entitlement identifier is "premium"
- Check database has `subscription_tier` and `subscription_expires_at` columns

## 📚 Documentation

- RevenueCat Docs: https://docs.revenuecat.com
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console

## 🎯 Current Configuration

```typescript
// Product IDs (must match store products)
- premium_monthly
- premium_annual

// Entitlement ID (must match in code)
- premium

// Offering ID
- default

// App Bundle IDs
- iOS: com.myinterviewapp
- Android: com.myinterviewapp
```

## ✅ Checklist

- [ ] Create products in RevenueCat
- [ ] Create entitlement "premium"
- [ ] Create offering "default"
- [ ] Add products to offering
- [ ] Set up App Store Connect subscriptions
- [ ] Set up Google Play subscriptions
- [ ] Link App Store Connect to RevenueCat
- [ ] Link Google Play to RevenueCat
- [ ] Test purchase on iOS device
- [ ] Test purchase on Android device
- [ ] Verify subscription syncs to database
- [ ] Test restore purchases
- [ ] Test subscription expiry handling

---

**Note**: You're currently using a test API key. When ready for production:
1. Create production project in RevenueCat
2. Get production API keys
3. Update `.env` file with production keys
4. Rebuild app for production
