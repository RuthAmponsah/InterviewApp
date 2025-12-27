# Fix Supabase Email Confirmation Issue

## Problem
New users can't log in after signing up because Supabase requires email confirmation by default.

## Solution
Disable email confirmation in Supabase dashboard:

### Steps:
1. Go to your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Click **Authentication** in the left sidebar
3. Click **Settings** tab (or **Providers** then scroll down)
4. Find **Email confirmations** section
5. **DISABLE** "Enable email confirmations"
6. Click **Save**

### Alternative (if you want to keep email confirmation):
If you want to require email verification in production, you need to:

1. **Set up email templates** in Supabase:
   - Go to Authentication > Email Templates
   - Customize the "Confirm signup" template
   - Set a proper redirect URL

2. **Update the app** to handle unconfirmed accounts:
   - Show "Please verify your email" message after signup
   - Add "Resend verification email" button
   - Handle the email confirmation flow

### Current Status:
- ✅ SignUp creates Supabase Auth account
- ✅ SignIn checks Supabase Auth first
- ⚠️ Email confirmation is likely enabled (blocking logins)
- ✅ Legacy account fallback implemented for old accounts

### Testing:
After disabling email confirmation:
1. Create a new account with a test email
2. You should be able to log in immediately
3. The account will have a proper Supabase Auth session
4. RLS policies will work correctly
