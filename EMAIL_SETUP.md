# Email Setup Guide - Resend API

## ✅ Current Status
Email service is configured to use **Resend** - a modern, developer-friendly email API.

## 🚀 Quick Setup (5 minutes)

### Step 1: Sign Up for Resend
1. Go to: https://resend.com/
2. Click "Sign Up" (free account)
3. Verify your email
4. Log in to dashboard

### Step 2: Get Your API Key
1. In Resend dashboard, click "API Keys" in sidebar
2. Click "Create API Key"
3. Name it: `MY INTERVIEW App`
4. Permissions: Select "Sending access"
5. Click "Add"
6. **Copy the API key** (starts with `re_...`)

re_NYxDBDSk_NpyNRUurANca4yx1s1uvQBvn

### Step 3: Add API Key to App
1. Open: `src/services/emailService.ts`
2. Line 5, replace:
   ```typescript
   const RESEND_API_KEY = 'YOUR_RESEND_API_KEY';
   ```
   With:
   ```typescript
   const RESEND_API_KEY = 're_your_actual_key_here';
   ```
3. Save the file

### Step 4: Test It! (Optional)
Add this to any screen temporarily:
```typescript
import { testEmailConfiguration } from '../services/emailService';

// In a button or useEffect:
await testEmailConfiguration();
```

Check console - should see: ✅ Email configuration working!

## 📧 How It Works

### Free Tier Limits
- **3,000 emails per month**
- **100 emails per day**
- Perfect for development and small apps!

### Testing Email
During development, use `onboarding@resend.dev` as the FROM email (already set).

For production with your own domain:
1. Add your domain in Resend dashboard
2. Add DNS records they provide
3. Update `FROM_EMAIL` in `emailService.ts`:
   ```typescript
   const FROM_EMAIL = 'noreply@yourdomain.com';
   ```

### What Gets Sent
✅ **Welcome Email** - Sent when user signs up
- Beautiful HTML design
- Links to app features
- Personalized with user's name

✅ **Verification Email** (optional) - For email verification
- Secure verification link
- 24-hour expiry

## 🎨 Email Template

The welcome email includes:
- 🎤 Practice with Aya (AI coach)
- 💼 Browse Jobs
- 📊 Track Progress
- Beautiful gradient header
- Mobile-responsive design

## 🔧 Troubleshooting

### "Email not configured" in console
- Check RESEND_API_KEY is set correctly
- Make sure there are no quotes or spaces around the key

### "401 Unauthorized"
- API key is invalid or expired
- Generate a new API key in Resend dashboard

### "403 Forbidden"  
- API key doesn't have sending permissions
- Create new key with "Sending access"

### "Domain not verified"
- Using custom domain without verification
- Either verify domain OR use `onboarding@resend.dev` for testing

### Emails not arriving
- Check spam folder
- Use `delivered@resend.dev` for testing (Resend test inbox)
- Check Resend dashboard > Logs to see delivery status

## 🔐 Security Best Practices

### ⚠️ IMPORTANT: Keep API Key Secret
- Never commit API key to GitHub
- Add `.env` file for production:
  ```
  RESEND_API_KEY=re_your_key
  ```
- Use environment variables:
  ```typescript
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  ```

### For Production
1. Move API key to environment variable
2. Use your verified domain
3. Enable email verification (optional)
4. Monitor Resend dashboard for bounces
5. Set up webhooks for delivery tracking

## 📊 Monitoring

Check email delivery in Resend dashboard:
- **Logs** - See all sent emails
- **Analytics** - Open rates, click rates
- **Webhooks** - Real-time delivery events

## 🆚 Why Resend Over Others?

| Feature | Resend | SendGrid | Mailgun | EmailJS |
|---------|--------|----------|---------|---------|
| Free Tier | 3,000/mo | 100/day | 5,000/mo | 200/mo |
| React Native | ✅ REST API | ✅ | ✅ | ❌ Browser only |
| Easy Setup | ✅ 5 min | ⚠️ 15 min | ⚠️ 15 min | ⚠️ 10 min |
| Beautiful UI | ✅ | ⚠️ Complex | ⚠️ Complex | ✅ |
| Developer Experience | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## 📱 Current App Behavior

### With API Key Configured:
- ✅ User signs up
- ✅ Welcome email sent immediately
- ✅ Console shows: "✅ Email sent successfully!"
- ✅ User can sign in right away

### Without API Key:
- ✅ User signs up
- ℹ️ Console shows: "📧 Email not configured"
- ✅ Signup still completes successfully
- ✅ User can sign in right away

**No blocking!** The app works perfectly whether emails are configured or not.

## 🎯 Next Steps

1. Get Resend API key (takes 2 minutes)
2. Add to `emailService.ts`
3. Test signup with your real email
4. Check your inbox for beautiful welcome email! 🎉

## 💡 Pro Tips

- Test with `delivered@resend.dev` - it always works
- Check Resend Logs tab to debug delivery issues
- Keep free tier - 3,000/month is plenty for most apps
- Upgrade only when you hit limits

## 📞 Need Help?

- Resend Docs: https://resend.com/docs
- Resend Support: https://resend.com/support
- Already integrated - just needs API key!
