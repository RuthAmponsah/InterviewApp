# MY INTERVIEW - Data Collection & Privacy Documentation

## Overview

This document details all data collected by MY INTERVIEW, the purpose for collection, how it's stored, and third-party services involved. Use this for App Store Privacy compliance and internal reference.

---

## Data We Collect

### 1. Name ✅
| Field | Value |
|-------|-------|
| **What** | User's full name |
| **Why** | Personalize app experience ("Hello, Ruth"), display on profile |
| **Where Stored** | Supabase database, AsyncStorage (local) |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until account deletion |

---

### 2. Email Address ✅
| Field | Value |
|-------|-------|
| **What** | User's email address |
| **Why** | Account authentication, password reset, optional notifications |
| **Where Stored** | Supabase Auth |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until account deletion |

---

### 3. Audio Data ✅
| Field | Value |
|-------|-------|
| **What** | Voice recordings during voice interviews |
| **Why** | Transcribe speech to text for AI interview responses |
| **Where Stored** | Temporarily on device (~30 minutes), sent to Groq Whisper API |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Deleted after transcription (not permanently stored) |

---

### 4. Purchase History ✅
| Field | Value |
|-------|-------|
| **What** | Subscription status (free/monthly/annual), purchase dates |
| **Why** | Enable premium features, manage subscription access |
| **Where Stored** | RevenueCat (synced with App Store) |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Duration of subscription + Apple's retention policy |

---

### 5. Product Interaction (Usage Data) ✅
| Field | Value |
|-------|-------|
| **What** | Interview count, questions viewed, features used, practice streaks |
| **Why** | Progress tracking, analytics dashboard, improve user experience |
| **Where Stored** | Supabase database |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until account deletion |

---

### 6. User Content ✅
| Field | Value |
|-------|-------|
| **What** | CV text, interview transcripts, custom questions, success stories |
| **Why** | AI analysis, personalized feedback, community features |
| **Where Stored** | Supabase database |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until user deletes or account deletion |

---

### 7. Profile Photo ✅
| Field | Value |
|-------|-------|
| **What** | User's profile picture |
| **Why** | Personalization, display on profile |
| **Where Stored** | Supabase Storage (avatars bucket) |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until user changes or account deletion |

---

### 8. Job Preferences ✅
| Field | Value |
|-------|-------|
| **What** | Target job role, industry, experience level |
| **Why** | Customize interview questions, job search filters |
| **Where Stored** | Supabase database, AsyncStorage |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until account deletion |

---

## Data We Do NOT Collect

| Data Type | Reason |
|-----------|--------|
| **Phone Number** | Not required for app functionality |
| **Payment Info** | Handled by Apple/RevenueCat - we never see card details |
| **Emails/Text Messages** | We don't access user's inbox or SMS |
| **Location Data** | Not needed (job search uses typed location) |
| **Contacts** | Not accessed |
| **Browsing History** | Not tracked |
| **Search History** | Job searches not stored long-term |
| **Health Data** | Not applicable |
| **Fitness Data** | Not applicable |
| **Financial Data** | Not applicable |
| **Sensitive Info** | No racial, political, religious, sexual data |
| **Photos/Videos** | Profile photo is "User Content", not camera roll access |
| **Crash Data** | Not collected (no crash SDK) |
| **Performance Data** | Not collected (no performance SDK) |

---

## Third-Party Services

### 1. Supabase
| Field | Value |
|-------|-------|
| **Purpose** | Database, authentication, file storage |
| **Data Sent** | User account info, interview history, CV text, profile photos |
| **Privacy Policy** | https://supabase.com/privacy |
| **Data Location** | User's selected region |

---

### 2. Groq AI
| Field | Value |
|-------|-------|
| **Purpose** | AI interview conversations, CV analysis, speech transcription |
| **Data Sent** | Interview messages, CV text, audio recordings |
| **Privacy Policy** | https://groq.com/privacy-policy |
| **Data Retention** | Processed in real-time, not stored by Groq |

---

### 3. RevenueCat
| Field | Value |
|-------|-------|
| **Purpose** | Subscription management, purchase tracking |
| **Data Sent** | User ID, purchase events |
| **Privacy Policy** | https://www.revenuecat.com/privacy |
| **Note** | Does NOT receive user name or email |

---

### 4. Adzuna API
| Field | Value |
|-------|-------|
| **Purpose** | Job listings search |
| **Data Sent** | Search queries (job title, location) - NOT linked to user |
| **Privacy Policy** | https://www.adzuna.co.uk/privacy-policy.html |
| **Note** | Anonymous API calls, no user identification |

---

## Data Flow Diagram

```
User Device (App)
       │
       ├── Account Data ──────────► Supabase (Database)
       │   (name, email, preferences)
       │
       ├── Interview Chat ────────► Groq AI (Processing)
       │   (messages, CV text)         │
       │                               └── Response back to app
       │
       ├── Voice Recording ───────► Groq Whisper (Transcription)
       │   (audio file)                │
       │                               └── Text back to app
       │
       ├── Subscription ──────────► RevenueCat ◄──► App Store
       │   (user ID, purchase)
       │
       └── Job Search ────────────► Adzuna API
           (search query)              │
                                       └── Job listings back
```

---

## User Rights

### Data Access
- Users can view all their data in-app (Profile, Interview History, CV)

### Data Deletion
- Account deletion removes all user data from Supabase
- Request via Settings → Support or email

### Data Export
- "Download My Data" feature (Coming Soon)
- Users can copy CV text, view all interview history

### Data Correction
- Users can edit profile, update preferences anytime

---

## App Store Privacy Labels Summary

### Data Linked to User
- ✅ Name
- ✅ Email Address
- ✅ Audio Data
- ✅ Purchase History
- ✅ Product Interaction
- ✅ User Content

### Data NOT Collected
- ❌ Phone Number
- ❌ Payment Info
- ❌ Location
- ❌ Contacts
- ❌ Health & Fitness
- ❌ Sensitive Info
- ❌ Browsing/Search History
- ❌ Crash/Performance Data

### Tracking
- ❌ NO data used for tracking purposes
- ❌ NO third-party advertising
- ❌ NO data brokers

---

## Security Measures

1. **Encryption in Transit** - All API calls use HTTPS
2. **Encryption at Rest** - Supabase encrypts stored data
3. **Authentication** - Supabase Auth with secure tokens
4. **Row Level Security** - Users can only access their own data
5. **Temporary Audio** - Voice recordings deleted after ~30 minutes
6. **No Plain Passwords** - Passwords hashed by Supabase Auth

---

## Compliance

| Regulation | Status |
|------------|--------|
| **GDPR** | Compliant (data access, deletion, consent) |
| **CCPA** | Compliant (no selling of data) |
| **App Store Guidelines** | Compliant (privacy labels accurate) |
| **Children's Privacy** | App rated 12+, no targeting children |

---

## Contact

**Data Protection Inquiries:**
- Email: support@myinterviewapp.com
- In-App: Settings → Support

**Privacy Policy:**
- https://ruthamponsah.github.io/InterviewApp/docs/privacy

**Terms of Service:**
- https://ruthamponsah.github.io/InterviewApp/docs/terms

---

**Last Updated:** December 29, 2025
**Document Version:** 1.0
