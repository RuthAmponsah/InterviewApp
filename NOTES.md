# MY INTERVIEW — Dev Notes

> Single reference for all technical decisions, configs, and known issues.

---

## Tech Stack

- **React Native** / Expo SDK ~53
- **Backend**: Supabase (project: `urewxbnmubmkceuplctd.supabase.co`)
- **AI**: Groq API (LLaMA models)
- **Payments**: RevenueCat v5 (`react-native-purchases`)
- **Navigation**: `@react-navigation/native-stack` + bottom tabs
- **Bundle ID**: `com.myinterview.app`
- **Deep link scheme**: `interviewapp://`

---

## Environment Variables (`.env`)

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GROQ_API_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...   # must start with appl_ for production
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
EXPO_PUBLIC_ADZUNA_APP_ID=
EXPO_PUBLIC_ADZUNA_API_KEY=
```

---

## Database Tables (Supabase)

| Table | Key columns |
|-------|-------------|
| `users` | `id`, `email`, `name`, `job_role`, `profile_photo_url` |
| `user_preferences` | `user_id`, `subscription_tier`, `purchased_packs`, `subscription_expires_at` |
| `interview_history` | `user_id`, `job_role`, `feedback_score`, `created_at` |
| `question_answers` | `user_id`, `interview_id`, `question`, `answer` |
| `custom_questions` | `user_id`, `question`, `category` |
| `success_stories` | `user_email`, `name`, `role`, `company`, `story` |
| `user_cvs` | `user_id`, `file_name`, `extracted_text`, `analyzed` |

---

## Subscription / RevenueCat

- **Free tier**: 2 interviews/month
- **Monthly**: `MONTHLY` packageType or identifier contains `monthly`
- **Annual**: `ANNUAL` packageType or identifier contains `annual`
- Entitlement name: `premium`
- Sector pack product IDs: `myinterview_nhs_care_v2`, `myinterview_graduate_v2`, `myinterview_retail_v2`, `myinterview_management_v2`
- Sector pack receipt validation:
  - RevenueCat webhook URL: `https://urewxbnmubmkceuplctd.supabase.co/functions/v1/revenuecat-webhook`
  - RevenueCat webhook should send `Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH_TOKEN>`
  - Supabase Edge Function secrets required:
    - `REVENUECAT_WEBHOOK_AUTH_TOKEN`
    - `REVENUECAT_SECRET_API_KEY`
  - App restore flow calls `sync-sector-packs`, which verifies purchases server-side against RevenueCat before updating `user_preferences.purchased_packs`.
- ⚠️ Use **production** key (`appl_...`) for App Store builds — test key will fail Apple review

---

## Sector Packs (PDF Downloads)

PDFs live in Supabase Storage bucket `sector-packs` (public):

```
https://urewxbnmubmkceuplctd.supabase.co/storage/v1/object/public/sector-packs/nhs-care.pdf
https://urewxbnmubmkceuplctd.supabase.co/storage/v1/object/public/sector-packs/graduate.pdf
https://urewxbnmubmkceuplctd.supabase.co/storage/v1/object/public/sector-packs/retail.pdf
https://urewxbnmubmkceuplctd.supabase.co/storage/v1/object/public/sector-packs/management.pdf
```

---

## Encryption Compliance (App Store)

`app.json` has `"ITSAppUsesNonExemptEncryption": false` — exempt because:
- Only uses HTTPS/TLS (standard OS networking)
- No custom encryption algorithms
- No VPN/authentication token storage beyond standard Keychain

---

## Email / Deep Link Setup

Password reset uses deep link: `interviewapp://reset-password?token=...`

Supabase email template redirect URL must be set to:
```
interviewapp://reset-password
```

For universal links (Apple), the `apple-app-site-association` file must be served at `/.well-known/` on your domain.

---

## Apple App Review — Past Rejections

| Issue | Fix |
|-------|-----|
| Gender field required | Make gender optional in SignUp |
| Missing privacy labels | Declare all data types in App Store Connect |
| Missing `NSCameraUsageDescription` | Add to Info.plist |
| RevenueCat not working on iPad | Was using test API key — switch to `appl_...` production key |

---

## CV Feature (AI Analysis)

- Edge function: `supabase/functions/extract-cv-text`
- Flow: User uploads PDF → `extract-cv-text` extracts text → Groq analyses vs job role → returns suggestions
- Storage bucket: `user-cvs` (private, RLS enabled)
- Table: `user_cvs` (see above)

---

## Delete Account

Client deletes rows from all user tables then signs out. Auth user itself requires manual deletion via Supabase Dashboard or a service-role Edge Function (client cannot call `admin.deleteUser`). Contact: `support@myinterview.app`.

---

## Running the App

```bash
npm install
npx expo start          # start dev server
npx expo run:ios        # build + run iOS simulator
npx tsc --noEmit        # TypeScript check
```
