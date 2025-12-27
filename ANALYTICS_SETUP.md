# Analytics Setup Guide

## Option 1: Expo Analytics (Recommended - Simplest)

### Step 1: Install Dependencies
```bash
npx expo install expo-analytics
```

### Step 2: Create Analytics Service
Create `src/services/analyticsService.ts`:

```typescript
import { Analytics } from 'expo-analytics';
import Constants from 'expo-constants';

const TRACKING_ID = Constants.expoConfig?.extra?.GOOGLE_ANALYTICS_ID || 'UA-XXXXXXXXX-X';

class AnalyticsService {
  private analytics: Analytics;

  constructor() {
    this.analytics = new Analytics(TRACKING_ID);
  }

  // Track screen views
  async trackScreen(screenName: string) {
    try {
      await this.analytics.hit('screenview', { screenName });
    } catch (error) {
      console.log('Analytics error:', error);
    }
  }

  // Track custom events
  async trackEvent(category: string, action: string, label?: string, value?: number) {
    try {
      await this.analytics.event(category, action, label, value);
    } catch (error) {
      console.log('Analytics error:', error);
    }
  }

  // Key events for your app
  async trackSignUp(method: string) {
    await this.trackEvent('User', 'SignUp', method);
  }

  async trackSignIn(method: string) {
    await this.trackEvent('User', 'SignIn', method);
  }

  async trackInterviewStart(type: string) {
    await this.trackEvent('Interview', 'Start', type);
  }

  async trackInterviewComplete(type: string, duration: number) {
    await this.trackEvent('Interview', 'Complete', type, duration);
  }

  async trackSubscriptionStart(plan: string) {
    await this.trackEvent('Subscription', 'Purchase', plan);
  }

  async trackJobSearch(query: string) {
    await this.trackEvent('Jobs', 'Search', query);
  }

  async trackFeedbackView() {
    await this.trackEvent('Feedback', 'View');
  }

  async trackStorySubmit() {
    await this.trackEvent('Story', 'Submit');
  }
}

export default new AnalyticsService();
```

### Step 3: Add Google Analytics ID to .env
```bash
# Add to .env
GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
```

### Step 4: Update app.json
```json
{
  "expo": {
    "extra": {
      "GOOGLE_ANALYTICS_ID": "UA-XXXXXXXXX-X"
    }
  }
}
```

### Step 5: Track Key Events

**In SignUp.tsx:**
```typescript
import analyticsService from '../services/analyticsService';

// After successful signup
await analyticsService.trackSignUp('email');
```

**In SignIn.tsx:**
```typescript
await analyticsService.trackSignIn('email');
```

**In InterviewChat.tsx:**
```typescript
// On mount
useEffect(() => {
  analyticsService.trackInterviewStart(interviewType);
}, []);

// On completion
await analyticsService.trackInterviewComplete(interviewType, duration);
```

**In Subscription.tsx:**
```typescript
await analyticsService.trackSubscriptionStart(selectedPlan);
```

**In Jobs.tsx:**
```typescript
await analyticsService.trackJobSearch(locationFilter);
```

---

## Option 2: Firebase Analytics (More Features)

### Step 1: Install Dependencies
```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

### Step 2: Set Up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project "MY INTERVIEW"
3. Add iOS app with bundle ID: `com.myinterview.app`
4. Add Android app with package: `com.myinterview.app`
5. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

### Step 3: Configure Files
Place `google-services.json` in root and `GoogleService-Info.plist` in root.

Update `app.json`:
```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/analytics"
    ]
  }
}
```

### Step 4: Create Analytics Service
```typescript
import analytics from '@react-native-firebase/analytics';

class FirebaseAnalyticsService {
  async trackScreen(screenName: string) {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  }

  async trackSignUp(method: string) {
    await analytics().logSignUp({ method });
  }

  async trackSignIn(method: string) {
    await analytics().logLogin({ method });
  }

  async trackInterviewStart(type: string) {
    await analytics().logEvent('interview_start', { type });
  }

  async trackInterviewComplete(type: string, duration: number) {
    await analytics().logEvent('interview_complete', { 
      type, 
      duration_seconds: duration 
    });
  }

  async trackPurchase(plan: string, value: number, currency: string) {
    await analytics().logPurchase({
      value,
      currency,
      items: [{ item_id: plan, item_name: plan }],
    });
  }
}

export default new FirebaseAnalyticsService();
```

### Step 5: Track Events (Same as Option 1)

---

## Option 3: Amplitude (Best for Product Analytics)

### Step 1: Install
```bash
npm install @amplitude/analytics-react-native
```

### Step 2: Create Service
```typescript
import * as amplitude from '@amplitude/analytics-react-native';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.AMPLITUDE_API_KEY;

class AmplitudeService {
  async init() {
    await amplitude.init(API_KEY);
  }

  async trackEvent(eventName: string, properties?: any) {
    amplitude.track(eventName, properties);
  }

  async identifyUser(userId: string, email: string) {
    amplitude.setUserId(userId);
    const identify = new amplitude.Identify();
    identify.set('email', email);
    amplitude.identify(identify);
  }

  // Specific events
  async trackSignUp(method: string) {
    this.trackEvent('Sign Up', { method });
  }

  async trackInterviewStart(type: string) {
    this.trackEvent('Interview Started', { interview_type: type });
  }

  async trackInterviewComplete(type: string, score: number) {
    this.trackEvent('Interview Completed', { 
      interview_type: type,
      score 
    });
  }
}

export default new AmplitudeService();
```

### Step 3: Initialize in App.tsx
```typescript
useEffect(() => {
  amplitudeService.init();
}, []);
```

---

## Recommended Events to Track

### User Events
- ✅ Sign Up (with method)
- ✅ Sign In (with method)
- ✅ Sign Out
- ✅ Password Reset

### Interview Events
- ✅ Interview Started (with type)
- ✅ Interview Completed (with score, duration)
- ✅ Interview Abandoned (with time spent)
- ✅ Question Skipped
- ✅ Feedback Viewed

### Subscription Events
- ✅ Subscription Page Viewed
- ✅ Plan Selected
- ✅ Purchase Started
- ✅ Purchase Completed
- ✅ Purchase Failed
- ✅ Subscription Restored

### Feature Usage
- ✅ CV Uploaded
- ✅ CV Analysis Completed
- ✅ Job Search Performed
- ✅ Job Saved
- ✅ Story Submitted
- ✅ Question Bank Opened
- ✅ Tips Viewed

### Navigation
- ✅ Screen Views (all major screens)

---

## Testing Analytics

1. **Check logs in development:**
```typescript
// Add to analyticsService
if (__DEV__) {
  console.log('📊 Analytics Event:', eventName, properties);
}
```

2. **Use Firebase Debug View:**
```bash
# iOS
adb shell setprop debug.firebase.analytics.app com.myinterview.app

# Android
adb shell setprop debug.firebase.analytics.app com.myinterview.app
```

3. **Check real-time reports** in Firebase/Amplitude dashboard

---

## Recommendation

**Start with Expo Analytics** (Option 1) - simplest setup, works immediately, good for basic tracking. Upgrade to Firebase later if you need more features.
