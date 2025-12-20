# App Permissions Review - MY INTERVIEW

## Overview
This document outlines all permissions requested by the MY INTERVIEW app, their purpose, and privacy implications.

---

## 📱 Required Permissions

### 1. **Photo Library Access** (iOS: NSPhotoLibraryUsageDescription / Android: READ_MEDIA_IMAGES)
- **When requested**: When user taps "Change profile photo" in Edit Profile screen
- **Purpose**: Allow users to select a profile photo from their device's photo library
- **Code location**: `src/screens/EditProfile.tsx` (line 69)
- **Privacy note**: Only accessed when explicitly requested by user
- **Can user decline**: Yes - profile photo remains optional

### 2. **Notifications** (iOS: User Notifications / Android: POST_NOTIFICATIONS)
- **When requested**: When user enables push notifications in Notifications screen
- **Purpose**: Send interview reminders, progress updates, and streak maintenance alerts
- **Code location**: `src/services/notificationService.ts` (line 19-23)
- **Privacy note**: User has full control via Settings screen
- **Can user decline**: Yes - app functions fully without notifications

### 3. **Internet Access** (Android: INTERNET, ACCESS_NETWORK_STATE)
- **When requested**: On app launch (automatically granted)
- **Purpose**: 
  - AI interview feedback generation (Groq API)
  - User authentication (Supabase)
  - Job search (Adzuna API)
  - Subscription management (RevenueCat)
- **Code location**: Multiple services (aiService, jobService, supabase config)
- **Privacy note**: Required for core app functionality
- **Can user decline**: No - app cannot function offline for interviews

### 4. **Audio Playback** (iOS: Audio Session / Android: Implicit)
- **When requested**: When user enables voice mode in interviews
- **Purpose**: Text-to-speech playback of AI interview questions
- **Code location**: `src/services/aiService.ts` (line 190, 220)
- **Privacy note**: Does not record audio, only plays AI responses
- **Can user decline**: Yes - text mode is alternative option

---

## 🚫 Permissions NOT Required

The app explicitly **does NOT** request:
- ❌ **Microphone/Audio Recording** - Voice responses are text-only, no recording
- ❌ **Camera** - No photo capture within app
- ❌ **Location** - Not needed for interview practice
- ❌ **Contacts** - No social features requiring contact access
- ❌ **Calendar** - Interview reminders via notifications only
- ❌ **Bluetooth** - Not used
- ❌ **Phone/Call Logs** - Not used
- ❌ **SMS** - Not used

---

## 📋 Store Listing Privacy Declaration

### Apple App Store Privacy Labels

**Data Collected:**
- **Contact Info**: Email address (for account creation)
- **User Content**: Interview answers, profile information (name, role)
- **Usage Data**: Interview history, progress metrics
- **Identifiers**: User ID (for RevenueCat subscriptions)

**Data Not Collected:**
- Voice recordings
- Precise location
- Browsing history
- Photos (profile photos stored locally only)

**Data Linked to User:**
- Email, interview answers, progress history

**Data Not Linked to User:**
- Crash logs, performance data (if analytics added)

---

### Google Play Data Safety Section

**Location**: Not collected
**Personal Info**: Name, email address
**Financial Info**: Purchase history (via Google Play)
**Photos**: Not collected (library access for profile photo only)
**Audio**: Not collected
**User Content**: Interview answers, feedback

**Data Security:**
- Data encrypted in transit (HTTPS)
- Data encrypted at rest (Supabase encryption)
- Users can request data deletion
- Users can export their data (GDPR compliant)

**Data Usage:**
- App functionality (AI feedback generation)
- Account management
- Fraud prevention, security, compliance

**Data Sharing:**
- Not shared with third parties for advertising
- AI processing via Groq (interview feedback only)
- Payment processing via App Store/Google Play

---

## 🔐 Privacy Best Practices Implemented

✅ **Minimal Permissions**: Only request what's necessary
✅ **Runtime Requests**: Permissions requested in context (when user needs feature)
✅ **Clear Purpose**: Each permission has explanation in code
✅ **User Control**: All optional permissions can be declined
✅ **Data Export**: Users can download all their data (GDPR)
✅ **Data Deletion**: Users can delete account and all data
✅ **No Audio Recording**: Explicitly avoided to reduce privacy concerns
✅ **Secure Storage**: All API keys to be moved to environment variables before production

---

## ⚠️ Before App Store Submission

### iOS (app.json updates needed):
```json
"ios": {
  "infoPlist": {
    "NSPhotoLibraryUsageDescription": "MY INTERVIEW needs access to your photo library to let you choose a profile photo.",
    "NSUserNotificationsUsageDescription": "MY INTERVIEW would like to send you interview reminders and progress updates.",
    "NSMicrophoneUsageDescription": "This app does not use microphone access."
  }
}
```

### Android (app.json updates needed):
```json
"android": {
  "permissions": [
    "INTERNET",
    "ACCESS_NETWORK_STATE",
    "POST_NOTIFICATIONS",
    "READ_MEDIA_IMAGES"
  ],
  "blockedPermissions": [
    "RECORD_AUDIO",
    "CAMERA",
    "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION"
  ]
}
```

---

## 📞 User Communication

**In-App Privacy Section**: ✅ Implemented in Settings → Privacy & Security
**Privacy Policy**: ✅ Available in-app with full UK GDPR compliance
**Terms of Service**: ✅ Available in-app
**Data Export**: ✅ Users can download JSON file with all data
**Account Deletion**: ✅ Users can delete account and data (30-day retention)

---

## 🔍 Compliance Checklist

- [x] UK GDPR compliant (right to access, delete, export)
- [x] Age requirement clearly stated (16+)
- [x] No children's data collected (not targeting under 13)
- [x] Privacy Policy accessible before signup
- [x] Clear data usage explanations
- [x] User consent for data processing
- [x] Secure data storage (Supabase encryption)
- [x] No sale of user data to third parties
- [ ] Move API keys to environment variables (CRITICAL before production)

---

**Last Updated**: December 20, 2025
**Reviewed By**: Development Team
**Next Review**: Before App Store submission
