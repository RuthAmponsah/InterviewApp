# Deployment Process Guide

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All code is committed to git
- [ ] `.env` file configured with production keys
- [ ] `.env` added to `.gitignore`
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] All tests pass (if you have tests)
- [ ] App runs successfully on physical device
- [ ] Database migrations completed
- [ ] RLS policies enabled
- [ ] API keys rotated from development to production

---

## Step 1: Prepare Production Environment

### 1.1: Update Environment Variables

Create `.env.production`:

```bash
# Production Supabase
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROD_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key

# Production Groq AI
EXPO_PUBLIC_GROQ_API_KEY=your_prod_groq_key

# Production Resend Email
EXPO_PUBLIC_RESEND_API_KEY=your_prod_resend_key
EXPO_PUBLIC_FROM_EMAIL=support@myinterviewapp.com
EXPO_PUBLIC_FROM_NAME=MY INTERVIEW

# Production Adzuna
EXPO_PUBLIC_ADZUNA_APP_ID=your_prod_app_id
EXPO_PUBLIC_ADZUNA_APP_KEY=your_prod_app_key

# Production RevenueCat
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_prod_xxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_prod_xxxxx
```

### 1.2: Update app.json for Production

```json
{
  "expo": {
    "name": "MY INTERVIEW",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.myinterview.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.myinterview.app",
      "versionCode": 1
    }
  }
}
```

---

## Step 2: Database Setup

### 2.1: Run Production Migrations

In Supabase Dashboard (production project):

1. Go to SQL Editor
2. Run migrations in order:
   ```sql
   -- 1. Add subscription columns
   -- Copy from: add_subscription_columns.sql
   
   -- 2. Create CV suggestions table
   -- Copy from: add_cv_suggestions_table.sql
   
   -- 3. Create success stories table
   -- Copy from: create_success_stories_table.sql
   
   -- 4. Set up RLS policies
   -- Copy from: setup_rls_policies.sql
   
   -- 5. Create indexes
   -- Copy from: create_indexes.sql
   ```

3. Verify all tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' ORDER BY table_name;
   ```

### 2.2: Enable RLS and Verify

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

---

## Step 3: Set Up EAS (Expo Application Services)

### 3.1: Install EAS CLI

```bash
npm install -g eas-cli
```

### 3.2: Log in to Expo

```bash
eas login
```

### 3.3: Configure EAS Build

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3.4: Initialize EAS Project

```bash
eas build:configure
```

---

## Step 4: Build for iOS (TestFlight)

### 4.1: Prerequisites

- [ ] Apple Developer Account ($99/year)
- [ ] App ID created in App Store Connect
- [ ] Bundle identifier matches: `com.myinterview.app`

### 4.2: Create App Store Connect Listing

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: MY INTERVIEW
   - Primary Language: English (U.S.)
   - Bundle ID: com.myinterview.app
   - SKU: myinterview-ios-001

### 4.3: Build iOS App

```bash
# Build for production
eas build --platform ios --profile production

# Or build for TestFlight internal testing
eas build --platform ios --profile preview
```

Wait 10-20 minutes for build to complete.

### 4.4: Submit to TestFlight

```bash
eas submit --platform ios
```

Or manually:
1. Download IPA from EAS dashboard
2. Open Transporter app (Mac)
3. Drag IPA file to Transporter
4. Upload to App Store Connect

### 4.5: Set Up TestFlight

1. Go to App Store Connect → My Apps → MY INTERVIEW
2. Click TestFlight tab
3. Add internal testers (up to 100)
4. Click "Enable TestFlight"
5. Share link with testers

---

## Step 5: Build for Android (Google Play)

### 5.1: Prerequisites

- [ ] Google Play Developer Account ($25 one-time)
- [ ] App created in Google Play Console
- [ ] Package name matches: `com.myinterview.app`

### 5.2: Create Google Play Console Listing

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: MY INTERVIEW
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
   - Package name: com.myinterview.app

### 5.3: Generate Upload Key

```bash
# Generate keystore for app signing
keytool -genkeypair -v -storetype PKCS12 \
  -keystore myinterview-upload-key.keystore \
  -alias myinterview-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000

# Store keystore password securely!
```

### 5.4: Build Android App

```bash
# Build AAB for production
eas build --platform android --profile production
```

Wait 10-20 minutes for build to complete.

### 5.5: Submit to Google Play (Internal Testing)

```bash
eas submit --platform android
```

Or manually:
1. Download AAB from EAS dashboard
2. Go to Google Play Console → MY INTERVIEW
3. Click "Internal testing" → "Create new release"
4. Upload AAB file
5. Add release notes
6. Click "Review release" → "Start rollout"

### 5.6: Set Up Internal Testing Track

1. Create internal testing group (up to 100 testers)
2. Add tester emails
3. Share opt-in URL with testers
4. Testers download from Play Store

---

## Step 6: Configure In-App Purchases

### 6.1: iOS - App Store Connect

1. Go to App Store Connect → MY INTERVIEW → Features → In-App Purchases
2. Click "+" → Auto-Renewable Subscriptions
3. Create Subscription Group: "Premium Membership"
4. Add Product 1:
   - Reference Name: Premium Monthly
   - Product ID: `premium_monthly`
   - Duration: 1 Month
   - Price: £7.99 (or $9.99)
5. Add Product 2:
   - Reference Name: Premium Annual
   - Product ID: `premium_annual`
   - Duration: 1 Year
   - Price: £59.99 (or $79.99)

### 6.2: Android - Google Play Console

1. Go to Google Play Console → MY INTERVIEW → Monetize → Subscriptions
2. Create subscription group: "Premium Membership"
3. Add Product 1:
   - Product ID: `premium_monthly`
   - Name: Premium Monthly
   - Billing period: 1 month
   - Price: £7.99
4. Add Product 2:
   - Product ID: `premium_annual`
   - Name: Premium Annual
   - Billing period: 1 year
   - Price: £59.99

### 6.3: Link RevenueCat to Stores

**iOS:**
1. Go to RevenueCat Dashboard → Apps → Configure
2. Add App Store Connect Shared Secret
3. Enable App Store Server Notifications

**Android:**
1. Create Service Account in Google Cloud Console
2. Download JSON credentials
3. Upload to RevenueCat Dashboard
4. Enable Real-time Developer Notifications

### 6.4: Update RevenueCat Products

```bash
# Update .env.production with production keys
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxx (production key)
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxx (production key)
```

---

## Step 7: Complete Store Listings

### 7.1: App Store (iOS)

Use details from `APP_STORE_LISTING.md`:

1. **App Information:**
   - Name: MY INTERVIEW
   - Subtitle: AI-Powered Interview Practice
   - Description: [Copy from APP_STORE_LISTING.md]
   - Keywords: interview,practice,AI,job,career,feedback
   - Support URL: https://myinterviewapp.com/support
   - Marketing URL: https://myinterviewapp.com
   - Privacy Policy: https://myinterviewapp.com/privacy

2. **Pricing & Availability:**
   - Price: Free (with in-app purchases)
   - Availability: All countries

3. **App Privacy:**
   - Fill out privacy questionnaire
   - Data collected: Email, name, usage data
   - Data linked to user: Yes
   - Data used for tracking: No

4. **Screenshots:** Upload 3-6 screenshots per device size

5. **App Review Information:**
   - Demo account: demo@myinterviewapp.com / DemoPass123!
   - Notes: [Copy from APP_STORE_LISTING.md]

### 7.2: Google Play (Android)

1. **Store listing:**
   - App name: MY INTERVIEW
   - Short description: [170 characters from APP_STORE_LISTING.md]
   - Full description: [Copy from APP_STORE_LISTING.md]
   - App icon: Upload 512x512 PNG
   - Feature graphic: 1024x500 PNG
   - Screenshots: Upload 3-8 screenshots

2. **Categorization:**
   - Category: Education
   - Content rating: Complete questionnaire (12+)
   - Target audience: 16+
   - Ads: No ads

3. **Store settings:**
   - Privacy policy: https://myinterviewapp.com/privacy
   - App access: Free (with in-app purchases)

4. **Data safety:**
   - Data collected: Email, name, usage
   - Data shared: No
   - Data encrypted: Yes
   - Users can request deletion: Yes

---

## Step 8: Testing Phase

### 8.1: Internal Testing (Week 1)

**Test with 5-10 internal testers:**
- [ ] Sign up flow works
- [ ] AI interview sessions complete successfully
- [ ] Feedback displays correctly
- [ ] Subscription purchase works
- [ ] Job search loads results
- [ ] All screens render properly
- [ ] No crashes on common flows

**Gather feedback on:**
- Bugs and crashes
- UI/UX issues
- Performance problems
- Feature requests

### 8.2: Closed Beta (Week 2-3)

**Expand to 50-100 beta testers:**
- Recruit from social media, forums
- Use TestFlight (iOS) and Internal Testing (Android)
- Collect structured feedback via Google Forms

**Monitor:**
- Crash reports (use Sentry if implemented)
- User feedback
- Analytics (if implemented)
- Server load

### 8.3: Fix Critical Issues

Priority levels:
1. **P0 - Blocks release:** Crashes, data loss, security issues
2. **P1 - High impact:** Major UI bugs, broken core features
3. **P2 - Medium impact:** Minor bugs, polish issues
4. **P3 - Low impact:** Nice-to-haves, future features

Fix P0 and P1 before production launch.

---

## Step 9: Submit for Review

### 9.1: iOS App Store Review

1. Go to App Store Connect → MY INTERVIEW → App Store tab
2. Click "+ Version or Platform" → iOS
3. Enter version: 1.0
4. Fill in "What's New" text
5. Select build from TestFlight
6. Set pricing and availability
7. Complete age rating questionnaire
8. Add screenshots
9. Click "Add for Review"
10. Click "Submit for Review"

**Review timeline:** 24-48 hours typically

**Common rejection reasons:**
- Missing privacy policy
- Incomplete app information
- Demo account not working
- Crashes during review
- Guideline violations

### 9.2: Google Play Review

1. Go to Google Play Console → MY INTERVIEW
2. Click "Production" track
3. Create new release
4. Upload AAB (same one from internal testing if no changes)
5. Add release notes
6. Complete content rating
7. Complete pricing & distribution
8. Click "Review release"
9. Click "Start rollout to Production"

**Review timeline:** Few hours to 7 days

**Common rejection reasons:**
- Missing privacy policy
- Incomplete store listing
- Misleading screenshots
- Policy violations

---

## Step 10: Launch!

### 10.1: Soft Launch (Optional)

**Release to limited region first:**
- Select UK or Canada only
- Monitor for 1 week
- Fix any critical issues
- Expand to more regions

### 10.2: Full Production Launch

**When approved:**
- [ ] App appears in stores
- [ ] Test download and installation
- [ ] Test in-app purchases with real money (small amount)
- [ ] Verify analytics tracking
- [ ] Monitor crash reports

### 10.3: Post-Launch Monitoring

**First 24 hours:**
- Check every 2-4 hours
- Monitor crash rate
- Watch user reviews
- Check server performance
- Verify purchases work

**First week:**
- Daily monitoring
- Respond to reviews
- Track key metrics
- Fix critical bugs quickly

**First month:**
- Weekly updates
- Feature improvements
- Performance optimization
- Marketing push

---

## Step 11: Marketing & Growth

### 11.1: Launch Announcement

**Social Media:**
- Twitter/X announcement
- LinkedIn post
- Facebook post
- Instagram story

**Communities:**
- Product Hunt launch
- Reddit posts (r/careeradvice, r/jobs, r/cscareerquestions)
- Hacker News "Show HN"
- IndieHackers post

### 11.2: App Store Optimization (ASO)

**Track rankings for:**
- interview practice
- AI interview coach
- mock interview
- job interview preparation

**Improve over time:**
- A/B test screenshots
- Update description based on user feedback
- Encourage 5-star reviews
- Respond to all reviews

### 11.3: Content Marketing

**Blog posts:**
- "How to Ace Your Next Interview"
- "Top 10 Interview Questions for [Industry]"
- "Interview Mistakes to Avoid"

**Video content:**
- App walkthrough on YouTube
- Interview tips TikTok series
- LinkedIn tutorial videos

---

## Troubleshooting Common Issues

### Build Fails

**Error: "Expo credentials not configured"**
```bash
eas credentials
# Select platform and configure credentials
```

**Error: "Build timed out"**
- Check app.json is valid JSON
- Ensure node_modules isn't too large
- Remove unused dependencies

### App Rejected

**iOS: "4.2 Design - Minimum Functionality"**
- Add more screenshots showing features
- Improve app description
- Add app preview video

**iOS: "2.1 Performance - App Completeness"**
- Ensure demo account works
- Fix any crashes
- Complete all placeholders

**Android: "Policy violation - User data"**
- Add data deletion capability
- Update data safety section
- Clarify privacy policy

### Purchases Not Working

**iOS:**
- Verify App Store Connect products created
- Check RevenueCat is linked
- Test in sandbox environment first

**Android:**
- Verify Google Play products created
- Check service account permissions
- Enable billing in Google Play Console

---

## Rollback Plan

If critical issues found post-launch:

### Option 1: Quick Fix
```bash
# Fix bug in code
git commit -m "fix: critical bug"

# Rebuild
eas build --platform all --profile production

# Submit new build (version 1.0.1)
eas submit --platform all
```

### Option 2: Remove from Store (Last Resort)
- iOS: Remove from sale in App Store Connect
- Android: Unpublish app in Google Play Console
- Fix issues thoroughly
- Re-submit when ready

---

## Post-Launch Checklist

- [ ] App live in both stores
- [ ] In-app purchases working
- [ ] Analytics tracking
- [ ] Crash reporting active
- [ ] Support email monitored
- [ ] Social media accounts active
- [ ] Landing page live
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] First marketing posts published
- [ ] Monitoring dashboard set up
- [ ] Backup strategy active

**Congratulations! Your app is live! 🎉**

---

## Maintenance Schedule

**Daily (First Week):**
- Check crash reports
- Monitor user reviews
- Track download numbers
- Verify purchases work

**Weekly:**
- Review analytics
- Plan feature updates
- Bug fixes
- Performance optimization

**Monthly:**
- Major feature releases
- A/B testing
- User surveys
- Refine marketing

---

## Success Metrics

**Track these KPIs:**

**Acquisition:**
- Daily downloads
- Install source
- User growth rate

**Activation:**
- Onboarding completion %
- First interview completion %

**Retention:**
- Day 1, 7, 30 retention
- Daily/Monthly Active Users

**Revenue:**
- Conversion to paid %
- MRR (Monthly Recurring Revenue)
- LTV (Lifetime Value)

**Referral:**
- App Store rating
- Review sentiment
- Social shares

---

**Need help? Contact Expo support or check documentation at https://docs.expo.dev**
