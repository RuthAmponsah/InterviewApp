# MY INTERVIEW - AI-Powered Interview Practice App

A React Native mobile application built with Expo that helps users prepare for job interviews using AI-powered conversational practice, CV analysis, and job search integration.

## 🚀 Features

- **AI Interview Practice**: Text and voice-based mock interviews with AI feedback
- **CV Upload & Analysis**: Upload your CV for AI-powered analysis and improvement suggestions
- **Interview History**: Track your practice sessions and progress over time
- **Question Bank**: Access hundreds of common interview questions organized by category
- **Job Search**: Integrated Adzuna API for job listings
- **Success Stories**: Learn from others' interview experiences
- **Progress Dashboard**: Visualize your improvement with detailed analytics
- **Subscription Model**: Free tier (5 interviews/month) with premium unlimited access
- **Dark Mode**: Full theme support for comfortable viewing
- **Offline Detection**: Works gracefully without internet connection

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **iOS Simulator** (Mac only) or **Android Studio** (for Android development)
- **Expo Go app** (for testing on physical devices) - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd InterviewApp
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory by copying the example:
```bash
cp .env.example .env
```

Then, add your API keys to the `.env` file:

```env
# Supabase Configuration (REQUIRED)
# Get from: https://supabase.com/dashboard/project/_/settings/api
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq AI Configuration (REQUIRED)
# Get free API key from: https://console.groq.com/keys
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key

# Adzuna Job Search API (OPTIONAL - for job search feature)
# Sign up at: https://developer.adzuna.com/
EXPO_PUBLIC_ADZUNA_APP_ID=your_adzuna_app_id
EXPO_PUBLIC_ADZUNA_APP_KEY=your_adzuna_app_key

# RevenueCat Configuration (OPTIONAL - for in-app purchases)
# Get from: https://app.revenuecat.com
EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_revenuecat_ios_key
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your_revenuecat_android_key
```

### 4. Configure Supabase Database

Run the following SQL scripts in your Supabase SQL Editor:

```bash
# In Supabase Dashboard > SQL Editor, run these files in order:
1. add_subscription_columns.sql
2. add_cv_suggestions_table.sql
3. create_success_stories_table.sql
4. grant_permissions.sql
5. fix_storage_policy.sql
```

## 🚀 Running the App

### Start the development server
```bash
npm start
# or
expo start
```

### Run on iOS Simulator (Mac only)
```bash
npm run ios
# or press 'i' in the terminal after running npm start
```

### Run on Android Emulator
```bash
npm run android
# or press 'a' in the terminal after running npm start
```

### Run on Physical Device
1. Install **Expo Go** on your iOS or Android device
2. Scan the QR code displayed in the terminal or browser
3. The app will load on your device

## 📁 Project Structure

```
InterviewApp/
├── src/
│   ├── components/       # Reusable UI components
│   ├── config/          # Configuration files (Supabase, etc.)
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # App screens/pages
│   ├── services/        # API services (AI, Email, Jobs, etc.)
│   └── theme/           # Theme configuration and colors
├── assets/              # Images, fonts, and static assets
├── .env                 # Environment variables (DO NOT COMMIT)
├── .env.example         # Example environment variables
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## 🔑 Required API Keys

### 1. **Supabase** (REQUIRED)
- **Purpose**: Database, authentication, and file storage
- **Sign up**: https://supabase.com
- **Free tier**: Yes (500MB database, 50,000 monthly active users)
- **Setup**:
  1. Create a new project
  2. Go to Project Settings > API
  3. Copy `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
  4. Copy `anon/public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 2. **Groq** (REQUIRED)
- **Purpose**: AI-powered interview conversations and CV analysis
- **Sign up**: https://console.groq.com
- **Free tier**: Yes (14,000 requests/day with Llama models)
- **Setup**:
  1. Create an account
  2. Go to API Keys
  3. Create new key → `EXPO_PUBLIC_GROQ_API_KEY`

### 3. **Adzuna** (OPTIONAL - for job search)
- **Purpose**: Job listing integration
- **Sign up**: https://developer.adzuna.com
- **Free tier**: Yes (250 calls/month)
- **Setup**:
  1. Register for developer account
  2. Copy App ID → `EXPO_PUBLIC_ADZUNA_APP_ID`
  3. Copy API Key → `EXPO_PUBLIC_ADZUNA_APP_KEY`

### 4. **RevenueCat** (OPTIONAL - for production subscriptions)
- **Purpose**: In-app purchase management
- **Sign up**: https://app.revenuecat.com
- **Free tier**: Yes (up to $10k monthly tracked revenue)
- **Setup**:
  1. Create project
  2. Add iOS and/or Android app
  3. Copy public API keys → `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

## 🧪 Testing

- Test accounts can be created directly in the app (Sign Up screen)
- Use a test Supabase project for development
- For subscription testing, use RevenueCat sandbox/test mode

## 🔒 Security Notes

- **NEVER commit your `.env` file** - it's already in `.gitignore`
- All API keys are loaded via `expo-constants` and environment variables
- Production keys should be stored in your deployment environment variables
- Review `ENV_SETUP.md` for detailed security setup

## 📦 Building for Production

### iOS (requires Mac)
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

For detailed deployment instructions, see `DEPLOYMENT_CHECKLIST.md`.

## 🐛 Troubleshooting

### App won't start
```bash
# Clear cache and restart
expo start -c
```

### Dependencies issues
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install
```

### Environment variables not loading
- Ensure `.env` file exists in project root
- Restart Expo dev server after changing `.env`
- Check `app.json` has `extra` config section

### Supabase connection issues
- Verify your Supabase URL and anon key are correct
- Check Supabase project is active and running
- Ensure RLS policies are properly configured

## 📄 Additional Documentation

- `DEPLOYMENT_CHECKLIST.md` - Complete pre-production checklist
- `ENV_SETUP.md` - Detailed environment variable setup
- `SUPABASE_SETUP.md` - Supabase configuration guide
- `AI_SETUP.md` - AI service configuration
- `EMAIL_SETUP.md` - Email service setup
- `PAYMENT_SETUP.md` - Subscription and payment setup

## 📝 License

Proprietary - All rights reserved

## 👥 Support

For issues or questions:
1. Check existing documentation files
2. Review `DEPLOYMENT_CHECKLIST.md` for common tasks
3. Contact the development team

## 🎯 App Store Information

- **Bundle ID**: com.myinterview.app
- **Package Name**: com.myinterview.app
- **Age Rating**: 16+
- **Category**: Productivity / Education

---

**Version**: 1.0.0  
**Last Updated**: December 2025
