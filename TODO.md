# TODO

## High Priority

- [ ] **Email delivery audit**: Verify all transactional emails (sign-up confirmation, password reset, magic link) are actually landing in inboxes — check Supabase Auth → Logs → Email Logs, test with a fresh account using a non-Gmail address, and confirm SMTP provider (Resend/SendGrid) is configured and not using the default Supabase rate-limited sender.
- [ ] **App Store submission**: Update screenshots, bump build number, verify RevenueCat production key (`appl_...`) is set in `.env` before submitting.

## Medium Priority

- [ ] **Interview experience screen**: Currently marked "COMING SOON" in Settings. Build out voice avatar, difficulty selector, and AI persona options.
- [ ] **Sector packs — receipt validation**: `purchaseSectorPack` checks `nonSubscriptionTransactions` client-side. Add server-side receipt verification via RevenueCat webhook → Supabase Edge Function for security.
- [ ] **CV analysis edge function**: `supabase/functions/extract-cv-text` exists but needs testing end-to-end. Verify Groq prompt quality and file size limits.
- [ ] **Android build**: App has only been tested on iOS. Test on Android — check RevenueCat Android key, deep links, and font rendering.

## Done ✅

- [x] **Delete account — full auth deletion**: Edge Function `supabase/functions/delete-account/index.ts` created. Verifies caller JWT, then calls `admin.deleteUser(userId)` with service-role key. Client (`PrivacySecurity.tsx`) calls it after clearing DB rows.
- [x] **Push notifications**: `registerPushToken()`/`unregisterPushToken()` added to `notificationService.ts` — called when user toggles Push Notifications switch. Token saved to `user_preferences.push_token`. Edge Function `send-push` created for server-side sends via Expo Push API. **Setup:** `ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS push_token text;` then `npx supabase functions deploy send-push`.
- [x] **Success stories moderation**: Stories insert with `approved: false`. `SuccessStories.tsx` filters `.eq('approved', true)` so only approved entries show publicly. Submit message tells users to expect 1-2 day review. **Setup:** `ALTER TABLE success_stories ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;` — approve stories via Supabase Table Editor.
- [x] **Onboarding improvements**: If `jobRole` is empty on launch, Home screen shows a subtle inline banner ("Set your job role / Personalise Aya's coaching") with a "Set up" button → JobPreferences. Dismissible per session.
- [x] **Streak freeze UX**: Replaced blocking modal with a subtle inline banner (blue pill below stat cards, snowflake icon + "Use" button + dismiss X).
- [x] **Empty state illustrations**: All empty states now show a large soft navy circle with themed Ionicon (52px) + two decorative dots. Screens updated: AllFeedback, InterviewHistory, Jobs, QuestionBank, SuccessStories.
- [x] **Accessibility**: Added `accessibilityLabel` + `accessibilityRole="button"` to all icon-only touchables: bell (AppHeader), back (ScreenHeader/BackButton), bookmark/clear (Jobs), share/delete (InterviewHistory), voice mic (InterviewChat), clear/delete (QuestionBank), close transcript (AllFeedback), close (PaywallModal/AppTutorial), all dismiss buttons (Home).
- [x] **Offline queue**: Created `src/services/offlineQueue.ts`. `InterviewChat` checks connectivity before insert — queues to AsyncStorage on failure. `Home` flushes queue on focus and shows a green "X session(s) synced" banner when records upload.
- [x] **Dark mode audit**: Fixed `AboutUs.tsx` logoText (`#1E63FF` → `#1E3A6E`). All other screens already use `isDark` ternaries or `colors.*` tokens — no further issues found.
- [x] Centralised `typography.brandMark` — all inner screens use one style definition
- [x] `AppHeader` on all 4 tab screens (Home, Jobs, Settings, MyProfile)
- [x] `ScreenHeader` on all inner screens — back button no longer clashes with title
- [x] Page titles centred on all inner screens
- [x] Button colour unified to match Start Interview card (`#1E3A6E`)
- [x] Settings rows use Ionicons icon circles instead of emojis
- [x] InterviewTips, ProgressDashboard, PrivacySecurity emojis → Ionicons
- [x] Jobs page title size fixed (was 32px, now matches rest of app)
- [x] MyProfile shows back button when navigated from Settings
- [x] Subscription tier synced on Settings focus (useFocusEffect + RevenueCat)
- [x] Sector packs PDF download (Supabase Storage, all 4 URLs verified 200)
- [x] Monthly/annual package matching fixed in PaywallModal + Subscription screens
- [x] Delete account button fixed (correct table names + navigation after deletion)
- [x] MD files consolidated — removed 7 redundant files, kept README + NOTES + ENCRYPTION_COMPLIANCE + docs/
