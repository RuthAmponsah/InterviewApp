# Email Confirmation Flow Setup

This enables the new signup flow:
1. User signs up → Check email
2. User confirms email
3. User logs in → Onboarding → Tutorial

## Step 1: Enable Email Confirmation in Supabase

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: **Authentication** → **Settings**
4. Find: **"Confirm email"** setting
5. Toggle it **ON**

This will require users to verify their email before they can sign in.

---

## Step 2: Enable Email Service

Choose ONE of these:

### Option A: Supabase Built-in (Easiest)
1. In same **Settings** page, scroll to **Email** section
2. Toggle ON: **"Send emails with Supabase"**
3. Click **Save**

### Option B: Custom SMTP (Gmail/SendGrid)
1. In **Settings**, toggle OFF: "Send emails with Supabase"
2. Configure SMTP credentials below it
3. Click **Save**

---

## Step 3: Customize Email Template (Optional)

1. Go to: **Authentication** → **Email Templates**
2. Click on **"Confirmation"** template
3. Replace with HTML from [EMAIL_TEMPLATE_CONFIRMATION.html](EMAIL_TEMPLATE_CONFIRMATION.html)
4. Click **Save**

The confirmation email will automatically be sent when users sign up.

---

## Step 4: Test the Flow

1. Open your app
2. Click **Sign Up**
3. Fill in details and click **Sign up**
4. You should see: "Check your email to verify your account, then sign in"
5. Redirects to **Login page**
6. Check your inbox for confirmation email
7. Click the link in the email
8. Go back to app and **Sign In**
9. You should now see **Onboarding** → **Tutorial**

✅ Done! The flow is now set up.

---

## What Happens At Each Step

### Sign Up Screen
- User enters name, email, password
- Account created in database
- **Confirmation email sent** (via Supabase)
- Shows: "Check your email to verify your account"
- Redirects to login in 1.5 seconds

### Email Confirmation
- User receives email with verification link
- Clicks link
- Account marked as verified in Supabase Auth

### Sign In Screen
- Email not confirmed? Shows error: "Email not verified, check your email"
- Email confirmed? Logs in successfully
- Stores session in AsyncStorage
- Automatically shows:
  - **Onboarding walkthrough** (first time)
  - **Welcome tutorial** (first time)

### Home Screen (After Tutorial)
- User can start practicing interviews
- Onboarding won't show again for this user

---

## Troubleshooting

### "Confirm email" toggle not visible?
- You're probably on an older Supabase version
- Go to **Authentication** → scroll down, look for "Email" settings

### Emails not sending?
- Check: **Authentication** → **Logs** for errors
- Verify you enabled either Supabase emails OR SMTP
- Check email isn't being rate-limited

### User can sign in without confirming email?
- Verify "Confirm email" is toggled **ON**
- Save settings
- Try signing up again

### User confirms email but still can't sign in?
- Wait a few moments for confirmation to process
- Try signing in again

---

## Current Flow Chart

```
Sign Up Screen
    ↓
Create Auth Account ✅
Create Profile (via trigger) ✅
Send Confirmation Email ✅
    ↓
Login Page
(Show "Check email" message)
    ↓
User Clicks Email Link
    ↓
Email Confirmed in Supabase ✅
    ↓
Sign In Screen
    ↓
Enter Email & Password
    ↓
Login Successful ✅
    ↓
Onboarding Walkthrough 🎯
    ↓
Welcome Tutorial 🎓
    ↓
Home Screen ✅
```

---

## Settings Summary

After setup, you should have:

✅ **Authentication** → **Settings** → **Confirm email**: ON
✅ **Authentication** → **Settings** → **Email** (Supabase built-in): ON
   OR
✅ **Authentication** → **Settings** → **SMTP** (Gmail/SendGrid): Configured
✅ **Authentication** → **Email Templates** → **Confirmation**: Customized

That's all! Users will now follow the email confirmation flow.
