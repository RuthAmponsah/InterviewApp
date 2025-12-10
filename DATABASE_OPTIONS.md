# Database Options for Authentication & User Data

## Current Implementation
- **AsyncStorage** (local device storage only)
- ✅ Works offline
- ✅ No backend required
- ❌ Data lost if app is deleted
- ❌ Can't sync across devices
- ❌ Not suitable for multiple users

---

## Recommended Database Solutions

### 🔥 **1. Firebase (RECOMMENDED - Best for Most Apps)**

**Why Firebase:**
- Free tier includes 50,000 daily reads, 20,000 writes
- Built-in authentication (email/password, Google, Apple)
- Real-time database or Firestore
- Works with React Native via `@react-native-firebase/app`
- Handles security automatically
- Cloud storage for profile photos

**Setup Time:** ~30 minutes

**Installation:**
```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npx expo install expo-dev-client
```

**Code Example:**
```typescript
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Sign Up
const signUp = async (email: string, password: string, name: string) => {
  const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  await firestore().collection('users').doc(userCredential.user.uid).set({
    name,
    email,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

// Sign In
const signIn = async (email: string, password: string) => {
  await auth().signInWithEmailAndPassword(email, password);
};

// Check Auth State
auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
```

**Pros:**
- ✅ Free tier is generous
- ✅ Easy setup with good documentation
- ✅ Built-in security rules
- ✅ Automatic scaling
- ✅ Real-time data sync
- ✅ Works on iOS and Android

**Cons:**
- ⚠️ Requires Expo dev client (can't use Expo Go)
- ⚠️ Vendor lock-in

---

### 🎯 **2. Supabase (Open Source Firebase Alternative)**

**Why Supabase:**
- PostgreSQL database (more powerful)
- Open source, can self-host
- REST and real-time APIs
- Row-level security
- Free tier: 50,000 monthly active users

**Setup Time:** ~45 minutes

**Installation:**
```bash
npm install @supabase/supabase-js
```

**Code Example:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY');

// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Query Database
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

**Pros:**
- ✅ Works with Expo Go (no dev client needed)
- ✅ PostgreSQL (SQL queries)
- ✅ Open source
- ✅ Good free tier

**Cons:**
- ⚠️ Slightly more complex setup than Firebase
- ⚠️ Smaller community

---

### ☁️ **3. AWS Amplify**

**Why AWS Amplify:**
- AWS ecosystem integration
- GraphQL API
- Authentication via Cognito
- Generous free tier

**Setup Time:** ~1 hour

**Installation:**
```bash
npm install aws-amplify @aws-amplify/react-native
```

**Pros:**
- ✅ Powerful AWS integrations
- ✅ GraphQL support
- ✅ Enterprise-grade

**Cons:**
- ⚠️ Steeper learning curve
- ⚠️ Complex setup
- ⚠️ Can get expensive at scale

---

### 🚀 **4. MongoDB Realm (for Offline-First Apps)**

**Why Realm:**
- Offline-first database
- Automatic sync when online
- Fast local queries
- Good for mobile-first apps

**Setup Time:** ~1 hour

**Installation:**
```bash
npm install realm @realm/react
```

**Pros:**
- ✅ Excellent offline support
- ✅ Fast local queries
- ✅ Automatic sync

**Cons:**
- ⚠️ More complex than Firebase
- ⚠️ Requires Expo dev client

---

### 💰 **5. Custom Backend (Node.js + PostgreSQL/MongoDB)**

**Why Custom:**
- Full control
- Can use any hosting provider
- No vendor lock-in

**Tech Stack:**
- Backend: Express.js or NestJS
- Database: PostgreSQL or MongoDB
- Hosting: Railway, Render, Heroku, DigitalOcean

**Setup Time:** ~4-8 hours

**Pros:**
- ✅ Complete control
- ✅ Any features you want
- ✅ No limits

**Cons:**
- ⚠️ Most time-consuming
- ⚠️ Need to manage security yourself
- ⚠️ Maintenance required

---

## 📊 Comparison Table

| Feature | Firebase | Supabase | AWS Amplify | Realm | Custom Backend |
|---------|----------|----------|-------------|-------|----------------|
| **Setup Time** | 30 min | 45 min | 1 hour | 1 hour | 4-8 hours |
| **Free Tier** | ✅ Generous | ✅ Good | ✅ Good | ⚠️ Limited | Depends |
| **Expo Go Support** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Offline Support** | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic | ✅ Excellent | Depends |
| **Real-time** | ✅ | ✅ | ✅ | ✅ | ⚠️ DIY |
| **Auth Built-in** | ✅ | ✅ | ✅ | ✅ | ❌ DIY |
| **Learning Curve** | Easy | Medium | Hard | Medium | Hard |
| **Best For** | Most apps | Open source fans | AWS users | Offline-first | Custom needs |

---

## 🎯 My Recommendation for Your App

### **Use Firebase** if:
- ✅ You want to launch quickly (30 min setup)
- ✅ You don't mind using Expo dev client
- ✅ You want built-in authentication
- ✅ Free tier is enough (likely yes for MVP)

### **Use Supabase** if:
- ✅ You want to keep using Expo Go
- ✅ You prefer open source
- ✅ You like SQL databases

### **Stick with AsyncStorage** if:
- ✅ Single-user app (personal use only)
- ✅ No need to sync across devices
- ✅ Quick prototype/demo
- ✅ Don't need backend yet

---

## 🚀 Quick Start with Firebase (Step-by-Step)

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Name it "InterviewApp"
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Authentication
1. In Firebase console, click "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" sign-in method

### 3. Create Firestore Database
1. Click "Firestore Database"
2. Click "Create Database"
3. Start in "Test Mode" (change later)
4. Choose region (europe-west2 for UK)

### 4. Get Firebase Config
1. Click Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click iOS/Android icon
4. Copy the config object

### 5. Install Firebase in Your App
```bash
cd /Users/ruthrocwel/InterviewApp
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npx expo install expo-dev-client
```

### 6. Create firebase.ts Config File
```typescript
// src/config/firebase.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export { auth, firestore };

// Collections
export const usersCollection = firestore().collection('users');
export const jobsCollection = firestore().collection('jobs');
```

### 7. Update SignUp Screen
See implementation in `src/screens/SignUp.tsx`

### 8. Update SignIn Screen
See implementation in `src/screens/SignIn.tsx`

---

## 📝 Database Schema Suggestion

### Users Collection
```typescript
{
  id: string;           // Auto-generated
  email: string;        // unique
  name: string;
  gender: 'M' | 'F';
  age: number;
  phone?: string;
  bio?: string;
  profilePhoto?: string; // URL or storage path
  jobRole?: string;
  createdAt: timestamp;
  lastLogin: timestamp;
}
```

### UserProgress Collection
```typescript
{
  userId: string;       // Reference to user
  streak: number;
  lastUsedDate: string;
  totalInterviews: number;
  savedJobs: string[];  // Array of job IDs
}
```

### UserPreferences Collection
```typescript
{
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    practice: boolean;
    feedback: boolean;
  };
}
```

---

## 🔒 Security Best Practices

1. **Never store passwords in plain text** (Firebase handles this)
2. **Use Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
3. **Validate email on sign-up**
4. **Use HTTPS only**
5. **Keep API keys in environment variables** (`.env` file)

---

## 💡 Next Steps

1. **Try it locally first** - Current AsyncStorage implementation works
2. **Choose a database** when you need:
   - Multi-device sync
   - Multiple users
   - Cloud backups
   - Real user authentication
3. **Start with Firebase free tier** - Easiest migration path
4. **Can always migrate later** - Your data structure is already good

---

Need help setting up Firebase or another database? Let me know!
