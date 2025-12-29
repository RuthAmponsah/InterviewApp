# TODO NEXT - December 28, 2025

## 🎯 REMAINING TASKS TO LAUNCH

Everything below is what's left to do. Tasks are ordered by priority.

---

## ✅ STEP 1: Developer Accounts (SUBMITTED - AWAITING APPROVAL)

### 1.1 Apple Developer Account ⏳ PENDING APPROVAL
**Cost:** $99/year | **Status:** Submitted, waiting 24-48 hours

- [x] Go to: https://developer.apple.com/programs/enroll/
- [x] Sign in with Apple ID
- [x] Enroll as Individual
- [x] Pay the $99 annual fee
- [x] Wait for approval (usually 24-48 hours)

**Why needed:**
- Required to publish on App Store
- Required to build with EAS (native features)
- Required to set up in-app purchases

---

### 1.2 Google Play Developer Account ⏳ PENDING APPROVAL
**Cost:** $25 one-time | **Status:** Submitted, waiting 1-2 days

- [x] Go to: https://play.google.com/console/signup
- [x] Sign in with Google account
- [x] Pay the $25 one-time fee
- [x] Complete identity verification
- [x] Wait for approval

**Why needed:**
- Required to publish on Google Play Store
- Required to set up in-app purchases

---

## ⏳ EMAIL VERIFICATION (RESEND) - PENDING DNS PROPAGATION

### Domain Verification Status
- [x] Resend account created
- [x] Domain added to Resend
- [x] DNS records added to Squarespace
- [ ] Wait for DNS propagation (can take up to 48 hours)
- [ ] Verify domain in Resend dashboard
- [ ] Update emailService.ts with production FROM email

**Check status:** https://resend.com/domains

---

## 🟡 STEP 2: App Store Connect Setup (AFTER APPLE APPROVAL)

### 2.1 Create App Record
1. Go to: https://appstoreconnect.apple.com/
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform:** iOS
   - **Name:** MY INTERVIEW
   - **Primary Language:** English (UK)
   - **Bundle ID:** `com.myinterview.app`
   - **SKU:** `myinterview-ios-001`

### 2.2 Upload App Information
Copy from `APP_STORE_LISTING.md`:
- **Subtitle:** AI-Powered Interview Practice Coach
- **Description:** (full description in APP_STORE_LISTING.md)
- **Keywords:** interview practice, job interview, AI coach, interview tips, career, job search, mock interview, interview questions, UK jobs, employment
- **Support URL:** https://ruthamponsah.github.io/InterviewApp/docs/
- **Privacy Policy URL:** https://ruthamponsah.github.io/InterviewApp/docs/privacy

### 2.3 Upload Screenshots
**Required sizes** (create in Figma or screenshot from simulator):
- iPhone 6.7" (1290 x 2796px) - iPhone 14/15 Pro Max
- iPhone 6.5" (1284 x 2778px) - iPhone 11/12/13 Pro Max
- iPhone 5.5" (1242 x 2208px) - iPhone 8 Plus

**Screenshots to create:**
1. Welcome/Onboarding screen
2. Interview chat in action
3. AI feedback/scoring
4. Job search results
5. Progress dashboard

### 2.4 Set Age Rating
1. Go to **App Information** → **Age Rating**
2. Answer questionnaire:
   - No violence, gambling, drugs, etc.
   - Contains user-generated content (interview responses)
3. Result should be **12+**

### 2.5 Set Up In-App Purchases
1. Go to **In-App Purchases** → **Create**
2. Create **Auto-Renewable Subscription**:
   - Reference Name: `Premium Monthly`
   - Product ID: `premium_monthly`
   - Price: £7.99/month
3. Create another:
   - Reference Name: `Premium Annual`  
   - Product ID: `premium_annual`
   - Price: £59.99/year (save 37%)
4. Create **Subscription Group**: `MY INTERVIEW Premium`
5. Add both products to the group

---

## 🔴 STEP 3: Google Play Console Setup

### 3.1 Create App
1. Go to: https://play.google.com/console/
2. Click **Create app**
3. Fill in:
   - **App name:** MY INTERVIEW
   - **Default language:** English (United Kingdom)
   - **App or game:** App
   - **Free or paid:** Free (with in-app purchases)

### 3.2 Complete Store Listing
Copy from `APP_STORE_LISTING.md`:
- **Short description:** (80 chars max)
- **Full description:** (4000 chars max)
- **App icon:** 512x512 PNG

### 3.3 Upload Graphics
**Required:**
- **Feature graphic:** 1024 x 500px (banner image)
- **Screenshots:** 
  - Phone: minimum 2, max 8 (16:9 ratio recommended)
  - 7" tablet: optional but recommended
  - 10" tablet: optional but recommended

### 3.4 Complete Content Rating
1. Go to **Content rating** → **Start questionnaire**
2. Answer questions about your app content
3. Should get **Everyone 10+** or **Teen**

### 3.5 Set Up In-App Purchases
1. Go to **Monetize** → **Products** → **Subscriptions**
2. Create subscription:
   - Product ID: `premium_monthly`
   - Name: Premium Monthly
   - Price: £7.99
3. Create another:
   - Product ID: `premium_annual`
   - Name: Premium Annual
   - Price: £59.99

---

## � STEP 4: RevenueCat Production Setup (CAN START NOW!)

### 4.0 Create RevenueCat Account (DO NOW)
1. Go to: https://www.revenuecat.com/
2. Click **Sign Up** (free tier available)
3. Create a new **Project** called "MY INTERVIEW"
4. Note your project ID

### 4.1 Link App Store Connect (AFTER APPLE APPROVAL)
1. Go to: https://app.revenuecat.com/
2. Navigate to your project → **Apps**
3. Click **+ New** → **App Store**
4. Enter:
   - **App name:** MY INTERVIEW iOS
   - **Bundle ID:** `com.myinterview.app`
   - **App Store Connect App-Specific Shared Secret:** 
     (Get from App Store Connect → App → App Information → App-Specific Shared Secret)

### 4.2 Link Google Play (AFTER GOOGLE APPROVAL)
1. In RevenueCat → **Apps** → **+ New** → **Google Play**
2. Enter:
   - **App name:** MY INTERVIEW Android
   - **Package name:** `com.myinterview.app`
3. Upload service account JSON:
   - In Google Play Console → **Setup** → **API access**
   - Create service account with Financial Data access
   - Download JSON key
   - Upload to RevenueCat

### 4.3 Configure Products (AFTER STORE PRODUCTS CREATED)
1. In RevenueCat → **Products**
2. Add App Store product: `premium_monthly`
3. Add App Store product: `premium_annual`
4. Add Google Play product: `premium_monthly`
5. Add Google Play product: `premium_annual`

### 4.4 Get Production API Keys
1. In RevenueCat → **API Keys**
2. Copy **iOS Production API Key**
3. Copy **Android Production API Key**
4. Update your `.env` file:
```
REVENUECAT_IOS_KEY=your_production_ios_key
REVENUECAT_ANDROID_KEY=your_production_android_key
```

**RevenueCat Docs:** https://docs.revenuecat.com/docs/getting-started

---

## 🟡 STEP 5: Build & Submit

### 5.1 Build for iOS
```bash
# Install EAS CLI if not already
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS App Store
eas build --platform ios --profile production
```

### 5.2 Submit to App Store
```bash
# Submit build to App Store Connect
eas submit --platform ios
```
Or manually upload via Transporter app.

### 5.3 Build for Android
```bash
# Build for Google Play
eas build --platform android --profile production
```

### 5.4 Submit to Google Play
```bash
# Submit build to Google Play
eas submit --platform android
```
Or manually upload the .aab file in Google Play Console.

---

## 🟡 STEP 6: Testing Before Launch

### 6.1 TestFlight Testing (iOS)
1. In App Store Connect → **TestFlight**
2. Add internal testers (your Apple ID email)
3. Install TestFlight app on your iPhone
4. Test the build thoroughly

### 6.2 Internal Testing (Android)
1. In Google Play Console → **Testing** → **Internal testing**
2. Create a release with your .aab
3. Add tester emails
4. Test via Google Play

### 6.3 Test Checklist
- [ ] Sign up new account
- [ ] Complete onboarding
- [ ] Start text interview
- [ ] Start voice interview (test mic recording)
- [ ] End interview and see score
- [ ] View interview history
- [ ] Upload CV and get analysis
- [ ] Generate improved CV
- [ ] Search for jobs
- [ ] View job details
- [ ] Submit feedback
- [ ] Edit profile
- [ ] Change password
- [ ] Test dark mode
- [ ] Test subscription purchase (use sandbox account)
- [ ] Test subscription restore

---

## 🟢 STEP 7: Optional Enhancements (Post-Launch)

### 7.1 Add Crash Reporting (Sentry)
**Guide:** `SENTRY_SETUP.md`
```bash
npx expo install @sentry/react-native
```

### 7.2 Add Analytics
**Guide:** `ANALYTICS_SETUP.md`
- Already configured with Expo Analytics
- Just needs events tracked in key screens

### 7.3 Native Voice Recognition (v2.0)
Once you have Apple Developer account:
```bash
npx expo install expo-speech-recognition
eas build --platform ios
```
Benefits: Faster, offline, no API costs

### 7.4 Features for v1.1
- CV DOCX Export
- Download My Data
- Sector Packs purchasing
- Interview difficulty settings
- Push notifications

---

## 📋 QUICK LINKS

| Resource | URL |
|----------|-----|
| Apple Developer | https://developer.apple.com/programs/enroll/ |
| App Store Connect | https://appstoreconnect.apple.com/ |
| Google Play Console | https://play.google.com/console/ |
| RevenueCat Dashboard | https://app.revenuecat.com/ |
| RevenueCat Docs | https://docs.revenuecat.com/docs/getting-started |
| Expo EAS Docs | https://docs.expo.dev/build/introduction/ |
| Supabase Dashboard | https://supabase.com/dashboard |
| Your Privacy Policy | https://ruthamponsah.github.io/InterviewApp/docs/privacy |
| Your Terms of Service | https://ruthamponsah.github.io/InterviewApp/docs/terms |

---

## 💰 COSTS SUMMARY

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Program | $99 | Annual |
| Google Play Developer | $25 | One-time |
| Groq API | Free tier | Per usage |
| Supabase | Free tier | Per usage |
| Adzuna Jobs API | Free tier | Per usage |
| RevenueCat | Free (up to $2500 MTR) | Per revenue |
| **Total to Launch** | **~$124** | |

---

## ✅ ALREADY COMPLETED

- ✅ Core app functionality
- ✅ Voice interviews with Groq Whisper
- ✅ Text interviews with AI
- ✅ CV upload and analysis
- ✅ Job search integration
- ✅ User authentication
- ✅ Database setup with RLS
- ✅ Environment variables configured
- ✅ Privacy policy & terms created
- ✅ App icons and splash screen
- ✅ Dark mode support
- ✅ RevenueCat test integration
- ✅ App Store listing content prepared

---

**You're 90% done! Just need the developer accounts and store submissions.** 🚀
