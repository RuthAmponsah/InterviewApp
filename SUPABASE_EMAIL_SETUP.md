# Supabase Email Setup Guide

## Option 1: Use Supabase's Built-in Email Service (RECOMMENDED - Free, Simple)

### Step 1: Go to Supabase Dashboard
1. Navigate to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Email Templates**

### Step 2: Configure Email Settings
1. Click **Authentication** in the left sidebar
2. Go to **Settings** tab
3. Scroll down to **Email** section
4. You should see:
   - "Send emails with Supabase" (toggle this ON)
   - From email address (e.g., `noreply@projectid.supabase.co`)

### Step 3: Customize Email Templates
Under **Email Templates**, you can customize:

1. **Confirmation email** - Sent when user signs up
2. **Password reset email** - Sent when user requests password reset
3. **Magic link email** - For passwordless signups
4. **Change email confirmation** - When user changes their email

Click each one to edit the subject and content.

### Example: Password Reset Template
```
Subject: Reset Your Password

Hello {{ .Email }},

Click this link to reset your password:

{{ .ConfirmationURL }}

This link expires in 24 hours.

Best regards,
MY INTERVIEW Team
```

---

## Option 2: Use Custom SMTP (Gmail / SendGrid / etc.)

### Setup Steps:
1. Go to **Authentication** → **Settings**
2. Scroll to **SMTP Settings**
3. Enter your SMTP credentials:
   - SMTP Host
   - SMTP Port (usually 587 for TLS)
   - Username
   - Password
4. Enter "From email" and "From name"

### Example: Gmail SMTP
- **Host**: `smtp.gmail.com`
- **Port**: `587`
- **Username**: your-email@gmail.com
- **Password**: Your Gmail App Password (NOT regular password)

⚠️ **For Gmail**: You need an [App Password](https://support.google.com/accounts/answer/185833)

---

## Step 4: Configure in Your App

### Update EmailService to use Supabase

Replace the dummy email function with Supabase Auth email:

```typescript
// src/services/emailService.ts
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'myinterviewapp://reset-password', // Your app deep link
    });

    if (error) {
      console.error('❌ Password reset email error:', error);
      return false;
    }

    console.log('✅ Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending reset email:', error);
    return false;
  }
};
```

---

## Step 5: Test It

### In Your App:
1. Sign up a new user
2. Go to **Settings** → **Account** → **Change Password**
3. Try "Forgot Password" flow
4. Check if email is received

### In Supabase:
1. Go to **Authentication** → **Users**
2. Find your test user
3. Click the three dots (⋯) → **Send password reset email**
4. Check if email arrives

---

## Important: Deep Links for Password Reset

For password reset to work in your mobile app, configure deep links:

In `app.json`:
```json
{
  "scheme": "myinterviewapp",
  "web": {
    "redirectUrl": "myinterviewapp://"
  }
}
```

When user clicks password reset link, it should open your app to a password reset screen.

---

## Troubleshooting

### Email not sending?
- ✅ Check Supabase **Logs** (Authentication → Logs)
- ✅ Verify email address isn't rate-limited
- ✅ Check if SMTP credentials are correct (if using custom SMTP)
- ✅ Ensure "Confirm email" is enabled in Auth Settings

### Users not receiving emails?
- Check spam/junk folder
- Verify sender email isn't on blocklist
- Test with different email addresses

### Rate Limiting?
- Supabase limits emails per user to prevent abuse
- Default: ~3 emails per hour per user

---

## Next: Update Password Reset Flow

Once emails are working, update your SignIn/ForgotPassword screens to use:

```typescript
const handleForgotPassword = async (email: string) => {
  const success = await supabase.auth.resetPasswordForEmail(email);
  if (success) {
    showSuccess('Check your email for password reset link');
  }
};
```
