# Custom SMTP Setup Guide

Your Supabase email sending has been temporarily restricted due to bounced emails. Here's how to set up a custom SMTP provider for production.

## Why This Happened
- High bounce rate from invalid/test email addresses
- Supabase shared email service protecting its reputation
- Common during development when using fake test emails

## Quick Fix for Development
✅ **Email sending is now disabled** - Authentication will work without emails
✅ **Users can sign up and sign in immediately** - No email verification required

## Setup Custom SMTP for Production

### Option 1: SendGrid (Recommended - Free tier available)
1. Sign up at https://sendgrid.com/
2. Get your API key from Settings > API Keys
3. In Supabase Dashboard:
   - Go to Project Settings > Authentication
   - Scroll to SMTP Settings
   - Enable Custom SMTP
   - Fill in:
     - Host: `smtp.sendgrid.net`
     - Port: `587`
     - Username: `apikey`
     - Password: `[Your SendGrid API Key]`
     - Sender email: `noreply@yourdomain.com`
     - Sender name: `My Interview`

### Option 2: Gmail SMTP (Easy for testing)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. In Supabase Dashboard:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `your-email@gmail.com`
   - Password: `[Your App Password]`
   - Sender email: `your-email@gmail.com`
   - Sender name: `My Interview`

## Re-enable Emails in Code

Once SMTP is set up, uncomment this in `src/screens/SignUp.tsx`:

```typescript
// Change this:
console.log('📧 Email sending temporarily disabled');

// Back to this:
const emailSent = await sendWelcomeEmail(email, name);
if (emailSent) {
  console.log('✅ Welcome email sent successfully!');
}
```

## Best Practices to Avoid Future Issues

1. **Use real email addresses for testing**
   - Don't use `test@test.com` or invalid emails
   - Use temp email services like https://temp-mail.org/ for testing

2. **Validate emails before sending**
   - Already implemented in SignUp screen ✅

3. **Monitor bounce rates**
   - Check SendGrid/Gmail dashboard regularly
   - Remove invalid emails from database

4. **Use email verification smartly**
   - For development: disable (current setup)
   - For production: enable but handle bounces gracefully

## Current Configuration

- ✅ Authentication works without emails
- ✅ Password validation: 8+ chars, 1 special character
- ✅ Database stores user info correctly
- ✅ Sign in checks email + password in database
- ⚠️ Email sending temporarily disabled

## Testing the Current Setup

1. Sign up with any email (doesn't need to exist)
2. User is created immediately
3. Sign in with same email + password
4. Everything works without email confirmation

## Re-enabling Supabase Emails

Contact Supabase support to restore email privileges:
- Explain you've set up custom SMTP
- Show you've fixed bounce rate issues
- They'll review and re-enable if satisfied
