# TODO

## High Priority

- [ ] **Delete account — full auth deletion**: Client-side code clears all DB rows and signs out, but the Supabase Auth user record itself cannot be deleted from the client. Need a Supabase Edge Function using the service-role key to call `admin.deleteUser(userId)`. Until then, users must email support@myinterview.app for full removal.
- [ ] **App Store submission**: Update screenshots, bump build number, verify RevenueCat production key (`appl_...`) is set in `.env` before submitting.
- [ ] **Push notifications**: `Notifications` screen UI exists but actual push token registration and sending is not wired up. Needs `expo-notifications` + Supabase Edge Function to store tokens and send.

## Medium Priority

- [ ] **Interview experience screen**: Currently marked "COMING SOON" in Settings. Build out voice avatar, difficulty selector, and AI persona options.
- [ ] **Sector packs — receipt validation**: `purchaseSectorPack` checks `nonSubscriptionTransactions` client-side. Add server-side receipt verification via RevenueCat webhook → Supabase Edge Function for security.
- [ ] **Success stories moderation**: Stories go straight to the DB — add an `approved` flag and admin review step before they appear publicly.
- [ ] **CV analysis edge function**: `supabase/functions/extract-cv-text` exists but needs testing end-to-end. Verify Groq prompt quality and file size limits.
- [ ] **Android build**: App has only been tested on iOS. Test on Android — check RevenueCat Android key, deep links, and font rendering.

## Low Priority / Nice to Have

- [ ] **Onboarding improvements**: Add role-selection step during sign-up so users land on a personalised Home immediately.
- [ ] **Streak freeze UX**: Currently shows a modal — consider a more subtle in-line prompt.
- [ ] **Empty state illustrations**: Replace icon-only empty states with light illustrations.
- [ ] **Accessibility**: Add `accessibilityLabel` props to all icon-only touchables (bookmark, bell, chevron buttons).
- [ ] **Offline queue**: Interview answers are posted immediately — if offline, they're lost. Add a local queue with retry.
- [ ] **Dark mode audit**: A few hardcoded hex values still exist in older screens — replace with `colors.textDark` / `colors.card` from theme.

## Done ✅

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
