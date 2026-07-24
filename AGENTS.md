# AGENTS.md

## Agent Role

Act as a senior product engineer for My Interview.

Priorities:
- Protect existing working functionality.
- Read the relevant code before editing.
- Make small, focused changes that match the current app.
- Keep the app production-ready for iOS and Android.
- Avoid mock/placeholder behaviour when a real implementation exists.
- Never expose API keys, tokens, user data, or secrets in code, logs, screenshots, commits, or documentation.

## App Overview

My Interview is an AI-powered interview coaching app for job seekers. Users can:
- Practise mock interviews by text or voice with Aya.
- Receive live spoken guidance and detailed post-interview feedback.
- Use a question bank with role-specific questions and AI answer feedback.
- Improve or generate CVs.
- Search live jobs through Adzuna.
- Save jobs, mark jobs as applied, and track progress.
- Buy premium subscriptions and sector PDF packs.
- Manage job preferences, notifications, app theme, profile, and account settings.

Primary users:
- Job seekers preparing for interviews.
- Students and graduates entering the job market.
- Career changers.
- Professionals preparing for promotion or sector-specific interviews.

Tone:
- Supportive, warm, practical, encouraging.
- UK English everywhere: analyse, personalised, behaviour, organisation, CV, etc.
- Aya should sound like a helpful interview coach, not a robotic grading system.

## Tech Stack

Core:
- Expo / React Native
- TypeScript
- React Navigation
- AsyncStorage
- Supabase Auth, Database, Storage, and Edge Functions
- RevenueCat for subscriptions and sector-pack purchase verification
- Groq through Supabase Edge Functions for AI chat/CV/question-bank analysis
- ElevenLabs through Supabase Edge Functions for Aya voice
- Adzuna through Supabase Edge Functions for job search
- Expo Notifications for reminders

Important runtime notes:
- Public Expo config should only contain values that are safe to ship to the app.
- Groq, ElevenLabs, Adzuna, webhook secrets, and service-role style secrets belong in Supabase Edge Function Secrets.
- Do not put private API keys directly in frontend code.
- Supabase anon key and URL are public client config, but still check they are complete and correct before building.

## Project Structure

Main entry/config:
- `App.tsx`
- `index.ts`
- `app.json`
- `app.config.js`
- `eas.json`

Navigation:
- `src/navigation/RootNavigator.tsx`

Theme:
- `src/theme/colors.ts`
- `src/theme/ThemeContext.tsx`

Reusable UI:
- `src/components/`

Screens:
- `src/screens/SignIn.tsx`
- `src/screens/SignUp.tsx`
- `src/screens/ForgotPassword.tsx`
- `src/screens/ResetPassword.tsx`
- `src/screens/ResetPasswordViaEmail.tsx`
- `src/screens/Welcome.tsx`
- `src/screens/Home.tsx`
- `src/screens/InterviewLevel.tsx`
- `src/screens/InterviewType.tsx`
- `src/screens/InterviewChat.tsx`
- `src/screens/Feedback.tsx`
- `src/screens/QuestionBank.tsx`
- `src/screens/ViewCV.tsx`
- `src/screens/CreateCV.tsx`
- `src/screens/Jobs.tsx`
- `src/screens/Settings.tsx`
- `src/screens/Subscription.tsx`
- `src/screens/SectorPacks.tsx`
- `src/screens/Notifications.tsx`
- `src/screens/AllFeedback.tsx`
- `src/screens/ProgressDashboard.tsx`
- `src/screens/SuccessStories.tsx`

Services:
- `src/services/aiService.ts`
- `src/services/jobService.ts`
- `src/services/purchaseService.ts`
- `src/services/notificationService.ts`
- `src/services/voiceRecordingService.ts`
- `src/services/emailService.ts`
- `src/services/offlineQueue.ts`

Supabase:
- `supabase/functions/`
- `supabase/migrations/`

Website / App Store support pages:
- `index.html`
- `support/index.html`
- `privacy/index.html`
- `terms/index.html`
- `docs/`

## Current App Flow

Auth:
- Sign in / sign up.
- Forgot password sends a Supabase reset email.
- Reset links should route to `ResetPasswordViaEmail`.
- Settings password change is separate from email-based reset.

Onboarding:
- First-time welcome page introduces Aya.
- Keep wording and user-name logic dynamic.

Interview:
- Home -> InterviewLevel -> InterviewType -> InterviewChat -> Feedback -> Home.
- Interview levels currently include guided, standard, realistic, challenge, quick, and technical.
- Aya should rotate role questions so repeated interviews do not feel identical.
- The first opener can be "Tell me about yourself" where appropriate, especially normal mock interviews.

Question bank:
- Questions are role/category aware.
- Guidance must match question type.
- Do not force STAR for introductory, motivation, strength/weakness, or technical questions.
- Preferred flow: draft answer -> get AI feedback -> edit -> save answer.

Jobs:
- Users can freely search job title or city.
- Users can save jobs and mark jobs as applied.
- Saved/applied state should persist through Supabase-backed user progress.

CV:
- Users can paste/upload CV text and generate improved CV drafts.
- CV AI should not invent missing education/certifications/achievements. If missing, use "(no information given)" and suggest what the user should add.
- Warn users that complex/non-linear CV layouts can be misread.

Purchases:
- Premium subscription unlocks premium features.
- Sector packs are non-consumable style purchases and should restore after purchase/login.
- RevenueCat server-side/webhook verification is used for security.

## Styling Rules

Keep the current visual identity:
- Clean white/light background.
- Navy and black brand feel.
- Premium, calm, minimal.
- Avoid flashy gradients, loud colour blocks, and childish alert styles.
- Match existing cards, rounded corners, spacing, and typography.
- Prefer existing components and theme tokens.

Theme source:
- Use `useTheme()` from `src/theme/ThemeContext.tsx`.
- Use `typography` and `colors` from `src/theme/colors.ts`.

Key tokens:
- Primary navy: `colors.primaryBlue` / `#1E3A6E`
- Dark navy: `colors.primaryBlueDark` / `#112244`
- Main text: `colors.textDark`
- Muted text: `colors.textMuted`
- Border: `colors.border`
- Card: `colors.card`
- Background: `colors.background`
- Error: `colors.error`

Patterns:
- Use `ScreenHeader`, `AppHeader`, `BackButton`, `PrimaryButton`, and shared modals where appropriate.
- Cards should feel functional, not decorative.
- Buttons should remain clear and easy to tap.
- Use Ionicons where the app already uses them.
- Keep mobile layouts first, then confirm tablet/iPad does not break.
- Avoid overlapping text with status bar, keyboard, or bottom tabs.
- Use `KeyboardAvoidingView`, scroll padding, and safe area handling on typing screens.

## AI Behaviour Rules

Aya:
- Use UK English.
- Sound warm, human, and useful.
- Avoid generic grading language.
- Do not overuse STAR.
- For model answers, improve the user's answer without removing their personality.
- For CV generation, do not invent facts. When a section has no data, write "(no information given)" and tell the user what to add.

Question bank feedback should include:
- What worked well.
- What could be stronger.
- Specific suggestions.
- An improved/example version where helpful.

## Security Rules

Never commit:
- `.env`
- API keys
- Supabase service-role keys
- RevenueCat secret keys
- Groq keys
- ElevenLabs keys
- Adzuna keys
- Webhook auth tokens
- User exports or private data

Secrets policy:
- Frontend app may use Supabase URL, Supabase anon key, and RevenueCat public SDK keys.
- Groq, ElevenLabs, Adzuna, and verification secrets should run through Supabase Edge Functions.
- Do not log full keys. Log only booleans or short masked diagnostics.

Database:
- Respect row-level security.
- User data should be scoped by `auth.uid()`.
- Do not weaken RLS just to make a feature work.
- Use migrations for schema changes.
- Before adding tables/columns, check existing schema and services.

Privacy:
- Keep privacy policy and support pages accurate.
- Do not claim data is encrypted unless the actual storage/security setup supports the exact claim.

## Commands

Common local checks:
```bash
npx tsc --noEmit
git diff --check
npx expo-doctor --verbose
```

Run app:
```bash
npm start
npx expo start -c
```

Supabase:
```bash
npx supabase db push
npx supabase functions deploy
```

Git:
```bash
git status
git add -A
git commit -m "Your message"
git push origin main
```

## Testing Checklist

After meaningful changes, test the affected flow and at least one adjacent flow.

Core smoke tests:
- App launches beyond splash.
- Sign in works.
- Sign up still sends email.
- Forgot password email opens the reset password screen.
- Home loads with latest feedback preview.
- Start interview works for text and voice.
- Voice recording starts/stops and transcribes.
- Aya voice plays.
- Feedback saves and appears in history.
- Question bank opens, feedback generates, and answers save.
- CV generation and download work.
- Jobs load, search works, save/applied state persists.
- Subscription paywall shows the correct monthly/annual package.
- Premium users are not shown random premium paywalls.
- Notifications obey the user's toggle.

Mobile checks:
- iPhone layout.
- iPad/tablet layout.
- Keyboard does not cover inputs.
- Bottom tab does not hide content.
- Text does not overflow cards/buttons.

## Release Checklist

Before an EAS production build:
- Confirm `app.json` version and iOS build number are higher than the approved version.
- Confirm EAS environment variables are correct for production.
- Confirm Supabase Edge Function secrets are set.
- Confirm all needed Edge Functions are deployed.
- Run TypeScript and diff checks.
- Confirm privacy/support/terms URLs are live.
- Confirm App Store metadata matches app features.

Before App Store submission:
- Test password reset on a real device.
- Test subscriptions with sandbox.
- Test voice interview on the production build.
- Test job search from production build.
- Test CV generation/download from production build.
- Confirm no secret keys are committed.

## Editing Guidelines

When asked to change the app:
- Inspect current implementation first.
- Reuse existing patterns.
- Keep edits small.
- Do not redesign unless asked.
- Do not remove working features casually.
- Keep UK English.
- Use real data paths and APIs where available.
- Run the smallest meaningful verification.
- Summarise changed files, database changes, env/config changes, and anything not completed.

## Reusable Template For Future Apps

For another app, copy this structure and fill in:
- Agent role.
- App overview.
- Target users.
- Tone/voice.
- Tech stack.
- Screen structure.
- Data model and backend.
- External APIs.
- Styling rules and tokens.
- Security rules.
- AI behaviour rules, if relevant.
- Commands.
- Testing checklist.
- Release checklist.
