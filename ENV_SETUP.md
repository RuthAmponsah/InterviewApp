# Environment Variables Setup Guide

## Overview
All API keys and sensitive configuration have been moved to environment variables for security.

## Setup Instructions

### 1. Copy the example file
```bash
cp .env.example .env
```

### 2. Fill in your API keys in `.env`
Open the `.env` file and replace all placeholder values with your actual API keys.

### 3. Get your API keys

#### Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### Groq AI
1. Go to https://console.groq.com/keys
2. Create a new API key
3. Copy it to `EXPO_PUBLIC_GROQ_API_KEY`

#### Adzuna Jobs API
1. Sign up at https://developer.adzuna.com/
2. Create an application
3. Copy:
   - Application ID → `EXPO_PUBLIC_ADZUNA_APP_ID`
   - Application Key → `EXPO_PUBLIC_ADZUNA_APP_KEY`

#### RevenueCat
1. Go to https://app.revenuecat.com/
2. Select your project
3. Go to Settings → API keys
4. Copy:
   - iOS key → `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
   - Android key → `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

### 4. Restart Expo
After updating your `.env` file, restart the Expo development server:
```bash
# Stop the current server (Ctrl+C)
# Then start again
npx expo start -c
```

## Important Notes

⚠️ **NEVER commit the `.env` file to Git!**
- The `.env` file is already in `.gitignore`
- Only commit `.env.example` (without real keys)
- Share API keys securely with team members (1Password, LastPass, etc.)

✅ **For production builds:**
- Use different API keys for production vs development
- Set environment variables in your CI/CD pipeline
- Use Expo's EAS Secrets for production builds

## Troubleshooting

### "API key not found" warnings
- Make sure `.env` file exists in the project root
- Check that variable names match exactly (including `EXPO_PUBLIC_` prefix)
- Restart Expo with `-c` flag to clear cache

### Environment variables not updating
```bash
# Clear Expo cache and restart
npx expo start -c
```

### Checking if variables are loaded
Add this to any file temporarily:
```typescript
import Constants from 'expo-constants';
console.log('Env vars:', Constants.expoConfig?.extra);
```

## File Structure
```
/Users/ruthrocwel/InterviewApp/
├── .env                    # Your actual API keys (NEVER commit!)
├── .env.example           # Template with placeholders (safe to commit)
├── .gitignore            # Includes .env
├── app.json              # Configured to load env vars
└── src/
    ├── config/
    │   └── supabase.ts    # Uses Constants.expoConfig.extra
    └── services/
        ├── aiService.ts   # Uses Constants.expoConfig.extra
        ├── emailService.ts
        ├── jobService.ts
        └── purchaseService.ts
```

## Benefits
✅ API keys not exposed in code
✅ Easy to change keys without code changes
✅ Different keys for dev/staging/production
✅ Team members use their own keys
✅ Safe to commit code to public repositories
