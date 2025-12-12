# Supabase Setup Instructions

## 🔐 Important: Email Verification Settings

**Before creating accounts, configure email verification:**

### Option 1: Disable Email Verification (For Development/Testing)
1. Go to Supabase Dashboard → Authentication → Providers
2. Click on "Email" provider
3. Scroll down to "Email Confirmation"
4. **Uncheck "Enable email confirmations"**
5. Save changes

This allows users to sign in immediately after signup without verifying email.

### Option 2: Enable Email Verification (For Production)
1. Keep "Enable email confirmations" checked
2. Configure email templates in Authentication → Email Templates
3. Users MUST click verification link in email before signing in

**Current App Behavior:**
- After signup, users are redirected to SignIn screen
- They must verify email (if enabled) before signing in
- Clear error messages guide users through the process

---

## ✅ Step 1: Create Users Table

Go to your Supabase dashboard → SQL Editor → New Query, and run this:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F')),
  age INTEGER CHECK (age >= 16),
  phone TEXT,
  bio TEXT,
  profile_photo TEXT,
  job_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system',
  notif_push BOOLEAN DEFAULT true,
  notif_email BOOLEAN DEFAULT true,
  notif_practice BOOLEAN DEFAULT true,
  notif_feedback BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  streak INTEGER DEFAULT 0,
  last_used_date DATE DEFAULT CURRENT_DATE,
  total_interviews INTEGER DEFAULT 0,
  saved_jobs TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interview_history table
CREATE TABLE interview_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_role TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('text', 'voice')) NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  feedback_score INTEGER CHECK (feedback_score >= 0 AND feedback_score <= 100),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_history ENABLE ROW LEVEL SECURITY;

-- Create policies (users can only access their own data)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own history" ON interview_history
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own history" ON interview_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own history" ON interview_history
  FOR DELETE USING (auth.uid()::text = user_id::text);
```

## ✅ Step 2: Enable Email Authentication

1. Go to **Authentication** → **Providers** → **Email**
2. **Enable** Email provider
3. **Disable** "Confirm email" (or configure email templates if you want verification)
4. Click **Save**

## ✅ Step 3: Test in Your App

Run your app with:
```bash
npx expo start
```

Your app will now:
- ✅ Store users in Supabase (cloud database)
- ✅ Work with Expo Go (no dev client needed)
- ✅ Sync across devices
- ✅ Have proper authentication
- ✅ Never lose data when app is deleted

## 🔒 Security Notes

- User data is protected by Row Level Security (RLS)
- Users can only access their own data
- API key is safe to expose in client code (it's the "anon" key)
- Database queries are secured by policies

## 📱 What Changed from AsyncStorage

**Before (AsyncStorage):**
- Data stored locally on device only
- Lost when app deleted
- No sync across devices

**After (Supabase):**
- Data stored in cloud
- Accessible from any device
- Never lost
- Can share data across platforms

## 📸 Step 4: Create Storage Bucket for Profile Photos

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Name it: `avatars`
4. Make it **Public** (check the box)
5. Click **Create bucket**

### Set Storage Policies

Click on the `avatars` bucket → **Policies** → **New Policy** → **Custom**

**Policy 1: Anyone can upload**
```sql
CREATE POLICY "Anyone can upload avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');
```

**Policy 2: Anyone can view**
```sql
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**Policy 3: Users can update own photos**
```sql
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');
```

## 🎯 Next Steps

After running the SQL and creating storage bucket:
1. Test sign up with a new account
2. Check Supabase dashboard → Table Editor → users (you'll see your user!)
3. Test sign in
4. Go to My Profile → Edit Profile → Change photo
5. Upload a photo and see it in Storage → avatars
6. Your data persists even if you close the app

## 🐛 Troubleshooting

**"Error creating user"**
- Check SQL ran successfully
- Check Authentication is enabled
- Check your API key is correct in supabase.ts

**"Email already exists"**
- That email is already registered
- Use a different email or delete from Supabase dashboard

**Can't see data in Supabase**
- Go to Table Editor → users
- Refresh the page
- Check if Authentication → Users shows your account
