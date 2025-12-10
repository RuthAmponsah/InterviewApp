# Email Verification Setup Guide

## Current Implementation

The app now includes email sending infrastructure that's ready to use. Currently in **simulation mode** (logs to console instead of sending real emails).

---

## 🚀 Quick Setup Options

### Option 1: EmailJS (Easiest - 10 minutes)

**Best for:** Quick setup, no backend needed, free tier available

#### Step 1: Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for free account
3. Verify your email

#### Step 2: Add Email Service
1. Go to "Email Services" tab
2. Click "Add New Service"
3. Choose Gmail, Outlook, or other provider
4. Connect your email account
5. Copy the **Service ID**

#### Step 3: Create Email Template
1. Go to "Email Templates" tab
2. Click "Create New Template"
3. Use this template:

```
Subject: Welcome to My Interview! 🎉

Hi {{to_name}},

Welcome to My Interview! We're thrilled to have you join our community of confident job seekers.

Your account has been successfully created. Here's what you can do next:

✅ Complete your profile
🎯 Set your job preferences  
💼 Browse job listings
🗣️ Start practicing with Aya, your AI interview coach

Aya is here to help you prepare for interviews, practice answering questions, and build the confidence you need to land your dream job.

Ready to get started? Open the app and begin your journey to interview success!

Best of luck,
The My Interview Team

---
Need help? Contact us at support@myinterview.com
```

4. Copy the **Template ID**

#### Step 4: Get Public Key
1. Go to "Account" → "General"
2. Copy your **Public Key**

#### Step 5: Update Your Code
Edit `/src/services/emailService.ts`:

```typescript
const EMAILJS_SERVICE_ID = 'service_abc123'; // Your Service ID
const EMAILJS_TEMPLATE_ID = 'template_xyz789'; // Your Template ID
const EMAILJS_PUBLIC_KEY = 'your_public_key_here'; // Your Public Key
```

#### Step 6: Enable Email Sending
Uncomment the actual send code in `emailService.ts`:

```typescript
// Remove the comments around these lines:
const response = await emailjs.send(
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  templateParams,
  EMAILJS_PUBLIC_KEY
);

return response.status === 200;
```

**Done! Emails will now send when users sign up.**

---

### Option 2: Firebase (Recommended for Production)

**Best for:** Full authentication system, scalable, professional

#### Setup Steps:

1. **Install Firebase**
```bash
npm install @react-native-firebase/app @react-native-firebase/auth
npx expo install expo-dev-client
```

2. **Create Firebase Project**
- Go to https://console.firebase.google.com
- Create new project
- Enable Authentication → Email/Password

3. **Update SignUp.tsx**
```typescript
import auth from '@react-native-firebase/auth';

const handleSignUp = async () => {
  try {
    // Create user with Firebase
    const userCredential = await auth().createUserWithEmailAndPassword(
      email, 
      password
    );
    
    // Send verification email (built-in!)
    await userCredential.user.sendEmailVerification({
      handleCodeInApp: true,
      url: 'https://myinterviewapp.com',
    });
    
    // Update profile
    await userCredential.user.updateProfile({
      displayName: name,
    });
    
    Alert.alert(
      'Welcome!',
      'A verification email has been sent to ' + email
    );
    
    navigation.replace('Welcome');
  } catch (error) {
    console.error(error);
  }
};
```

**Benefits:**
- ✅ Built-in email verification
- ✅ Password reset emails automatic
- ✅ Secure authentication
- ✅ Free tier includes 50,000 users
- ✅ Professional email templates

---

### Option 3: SendGrid (Professional Email Service)

**Best for:** High volume, advanced features, email analytics

#### Setup:

1. **Install SendGrid**
```bash
npm install @sendgrid/mail
```

2. **Create Backend API** (Node.js/Express)
```javascript
// server.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/send-welcome-email', async (req, res) => {
  const { email, name } = req.body;
  
  const msg = {
    to: email,
    from: 'noreply@myinterview.com',
    subject: 'Welcome to My Interview! 🎉',
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Your account has been created successfully.</p>
      <p>Start practicing with Aya today!</p>
    `,
  };
  
  try {
    await sgMail.send(msg);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});
```

3. **Call from App**
```typescript
const response = await fetch('https://your-api.com/send-welcome-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, name }),
});
```

---

## 📧 Email Template Best Practices

### Welcome Email Should Include:

✅ **Warm greeting** with user's name  
✅ **Confirmation** that account was created  
✅ **Next steps** - what to do first  
✅ **Key features** - what they can do in the app  
✅ **Support contact** - how to get help  
✅ **Professional signature**  

### Example Professional Template:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E63FF; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .button { background: #1E63FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to My Interview!</h1>
    </div>
    
    <div class="content">
      <h2>Hi {{userName}},</h2>
      
      <p>Welcome to My Interview! We're thrilled to have you join our community of confident job seekers.</p>
      
      <p><strong>Your account has been successfully created.</strong></p>
      
      <p>Here's what you can do next:</p>
      <ul>
        <li>✅ Complete your profile</li>
        <li>🎯 Set your job preferences</li>
        <li>💼 Browse job listings</li>
        <li>🗣️ Practice with Aya, your AI coach</li>
      </ul>
      
      <a href="myinterview://home" class="button">Get Started</a>
      
      <p>Need help? We're here for you at <a href="mailto:support@myinterview.com">support@myinterview.com</a></p>
      
      <p>Best of luck,<br>The My Interview Team</p>
    </div>
    
    <div class="footer">
      <p>© 2025 My Interview. All rights reserved.</p>
      <p>You received this email because you signed up for My Interview.</p>
    </div>
  </div>
</body>
</html>
```

---

## 🔒 Email Verification Flow

For real verification (requires backend):

### 1. Sign Up
```typescript
// Generate verification token
const token = generateSecureToken(); // UUID or JWT

// Save to database
await saveUser({
  email,
  name,
  verified: false,
  verificationToken: token,
  tokenExpiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
});

// Send email with verification link
await sendVerificationEmail(email, name, token);
```

### 2. Email Contains Link
```
Click here to verify your email:
https://myinterview.com/verify?token=abc123xyz
```

### 3. User Clicks Link
- Opens app or web page
- Backend validates token
- Marks account as verified
- Redirects to app

### 4. App Checks Verification
```typescript
const user = await getUser(email);
if (!user.verified) {
  Alert.alert('Please verify your email', 'Check your inbox for verification link');
  return;
}
```

---

## 🎨 Current Implementation Details

### What Happens Now on Sign Up:

1. ✅ User fills in name, email, password, age, gender
2. ✅ Validation checks (age 16+, gender F/M, email format)
3. ✅ Data saved to AsyncStorage
4. ✅ Welcome email function called
5. ✅ Success message shown: "Welcome [Name]! 🎉"
6. ✅ Email confirmation displayed
7. ✅ Navigation to Welcome screen

### Console Output:
```
📧 Welcome email would be sent to: user@example.com
Email content: [Full welcome message]
✅ Welcome email sent successfully!
```

### Modal Message:
```
Welcome Ruth! 🎉

Your account has been created successfully.

A welcome email has been sent to ruth@example.com.

Let's get started with your interview preparation!
```

---

## 📊 Comparison: Email Services

| Feature | EmailJS | Firebase | SendGrid | Custom Backend |
|---------|---------|----------|----------|----------------|
| **Setup Time** | 10 min | 30 min | 45 min | 2-4 hours |
| **Cost (Free Tier)** | 200/month | Unlimited | 100/day | Depends |
| **Verification** | Manual | Built-in ✅ | Custom | Custom |
| **Templates** | Yes | Basic | Advanced | Full control |
| **Analytics** | Limited | Basic | Advanced | Custom |
| **Scalability** | Low | High | Very High | High |
| **Best For** | Quick MVP | Full auth | High volume | Custom needs |

---

## 🎯 Recommended Path

1. **Right Now (MVP):** Keep current simulation - it shows the UX flow
2. **Quick Demo:** Set up EmailJS (10 minutes) - shows real emails
3. **Production:** Use Firebase Authentication - professional, scalable
4. **High Scale:** Add SendGrid when you have 1000+ users

---

## 🐛 Troubleshooting

### Emails Not Sending?

1. **Check console logs** - see error messages
2. **Verify API keys** - correct Service ID, Template ID, Public Key
3. **Email provider settings** - allow less secure apps (Gmail)
4. **Check spam folder** - emails might be filtered
5. **EmailJS quota** - free tier has limits

### Common Errors:

**"Invalid API key"** → Check Service ID and Public Key  
**"Template not found"** → Verify Template ID  
**"Connection refused"** → Check internet connection  
**"Quota exceeded"** → Upgrade EmailJS plan or use different service  

---

## 📞 Need Help?

- **EmailJS Docs:** https://www.emailjs.com/docs/
- **Firebase Auth:** https://firebase.google.com/docs/auth
- **SendGrid Docs:** https://docs.sendgrid.com/

Current implementation is working and ready - just needs API keys to send real emails!
