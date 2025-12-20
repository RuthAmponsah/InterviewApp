# Adzuna API Setup Guide

## 1. Create Your Free Account

1. Go to: https://developer.adzuna.com/
2. Click "Sign Up" (top right)
3. Fill in your details
4. Verify your email

## 2. Get Your API Credentials

1. Log in to your Adzuna developer account
2. Go to "My Applications" or "API Keys"
3. You'll see:
   - **App ID** (like: `12345678`)
   - **API Key** (like: `abc123def456ghi789jkl0`)

## 3. Add Credentials to Your App

Open: `src/services/jobService.ts`

Replace these lines (around line 4-5):

```typescript
const ADZUNA_APP_ID = 'YOUR_APP_ID'; // Replace with your Adzuna App ID
const ADZUNA_APP_KEY = 'YOUR_APP_KEY'; // Replace with your Adzuna App Key
```

With your actual credentials:

```typescript
const ADZUNA_APP_ID = '12345678'; // Your actual App ID
const ADZUNA_APP_KEY = 'abc123def456ghi789jkl0'; // Your actual API Key
```

## 4. Save and Restart

1. Save the file
2. Restart your Expo app
3. Navigate to the Jobs screen
4. You should see real UK job listings!

## Free Tier Limits

- **250 API calls per month**
- **1 call per second**
- Perfect for development and testing

## What Happens Without API Keys?

- The app shows demo/mock data
- You'll see "⚠️ Using demo data" in the subtitle
- Everything still works, just with fake jobs

## Troubleshooting

**"API error: 401"** → Check your App ID and API Key are correct

**"API error: 429"** → You've hit the rate limit (250/month or 1/second)

**No jobs showing** → Check your internet connection, or category might have no results

## Next Steps (Optional)

Want to customize the search?

Edit `src/services/jobService.ts`:
- Change `where: 'uk'` to a specific city like `'london'` or `'manchester'`
- Adjust `results_per_page` (default: 20)
- Add more category mappings in `CATEGORY_MAP`

## Example Categories You Can Add

```typescript
'Project Manager': 'it-jobs',
'Accounting': 'accounting-finance-jobs',
'Healthcare': 'healthcare-nursing-jobs',
'Teaching': 'teaching-jobs',
```

See full list: https://developer.adzuna.com/docs/search
