# Development Archive
## Project: MY INTERVIEW App

**Created:** $(date +"%B %d, %Y")  
**Purpose:** Archive of development files, SQL migrations, and setup guides  
**Note:** This file consolidates all development documentation and SQL scripts that were used during app development

---

## Table of Contents

1. [SQL Migration Scripts](#sql-migration-scripts)
2. [Setup & Configuration Guides](#setup--configuration-guides)
3. [Feature Documentation](#feature-documentation)
4. [Deployment & Process Documentation](#deployment--process-documentation)
5. [Email Templates](#email-templates)
6. [Test Files](#test-files)
7. [Other Documentation](#other-documentation)

---

# SQL Migration Scripts

## SUPABASE_MIGRATIONS_COMPLETE.sql
```sql
-- COMPLETE SUPABASE MIGRATION GUIDE FOR MY INTERVIEW APP
-- Run these in Supabase SQL Editor in this order

-- ============================================
-- 1. SUBSCRIPTION COLUMNS (if not already done)
-- ============================================
-- ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
-- ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;


-- ============================================
-- 2. CV SUGGESTIONS TABLE (if not already done)
-- ============================================
-- CREATE TABLE IF NOT EXISTS cv_suggestions (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     category TEXT NOT NULL,
--     suggestion TEXT NOT NULL,
--     completed BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW()
-- );
-- CREATE INDEX IF NOT EXISTS idx_cv_suggestions_user_id ON cv_suggestions(user_id);


-- ============================================
-- 3. SUCCESS STORIES TABLE (if not already done)
-- ============================================
-- CREATE TABLE IF NOT EXISTS success_stories (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     title TEXT NOT NULL,
--     description TEXT NOT NULL,
--     company TEXT,
--     role TEXT,
--     date TIMESTAMP DEFAULT NOW(),
--     votes INT DEFAULT 0,
--     created_at TIMESTAMP DEFAULT NOW()
-- );


-- ============================================
-- 4. INTERVIEW HISTORY TRANSCRIPT COLUMN (if not already done)
-- ============================================
-- ALTER TABLE interview_history
-- ADD COLUMN IF NOT EXISTS transcript TEXT;
-- COMMENT ON COLUMN interview_history.transcript IS 'JSON array of interview messages';


-- ============================================
-- 5. USER CVS TABLE (NEW - RUN THIS!)
-- ============================================
CREATE TABLE IF NOT EXISTS user_cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    extracted_text TEXT,
    original_content BYTEA,
    file_size INT,
    mime_type TEXT DEFAULT 'application/pdf',
    analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_cvs_user_id ON user_cvs(user_id);

ALTER TABLE user_cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CV"
ON user_cvs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CV"
ON user_cvs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CV"
ON user_cvs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CV"
ON user_cvs FOR DELETE
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_user_cvs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_cvs_updated_at
BEFORE UPDATE ON user_cvs
FOR EACH ROW
EXECUTE FUNCTION update_user_cvs_updated_at();


-- ============================================
-- 6. STORAGE BUCKET SETUP (via dashboard, not SQL)
-- ============================================
-- You need to create this in Supabase Dashboard:
-- Storage → Create a new bucket
-- Name: user-cvs
-- Privacy: Private (RLS handles access control)


-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check if all tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_cvs', 'cv_suggestions', 'success_stories', 'interview_history');

-- Check user_cvs table structure:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_cvs' 
ORDER BY ordinal_position;
```

## add_cv_suggestions_table.sql
```sql
-- Create cv_suggestions table for storing AI-generated CV improvement suggestions
-- This table tracks suggestions and whether users have completed them

CREATE TABLE IF NOT EXISTS cv_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL,
    suggestion TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_cv_suggestions_user_id ON cv_suggestions(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_cv_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cv_suggestions_updated_at
BEFORE UPDATE ON cv_suggestions
FOR EACH ROW
EXECUTE FUNCTION update_cv_suggestions_updated_at();

-- Grant permissions (adjust based on your Supabase setup)
-- GRANT ALL ON cv_suggestions TO authenticated;
-- GRANT ALL ON cv_suggestions TO service_role;

-- Example query to view suggestions for a user:
-- SELECT * FROM cv_suggestions WHERE user_id = '<user_id>' ORDER BY created_at DESC;

-- Example query to mark suggestion as complete:
-- UPDATE cv_suggestions SET completed = TRUE WHERE id = '<suggestion_id>';
```

## add_feedback_column.sql
```sql
-- Add feedback column to interview_history table
ALTER TABLE interview_history
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add a comment explaining the column
COMMENT ON COLUMN interview_history.feedback IS 'AI-generated feedback based on interview performance metrics';
```

## add_gender_to_success_stories.sql
```sql
-- Add gender column to success_stories table
ALTER TABLE success_stories 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'other';

-- Update Sarah Thompson's story with gender
UPDATE success_stories 
SET gender = 'female' 
WHERE user_email = 'sarah.thompson@example.com';
```

## add_password_column.sql
```sql
-- Add password column to users table
-- Run this in your Supabase SQL Editor

-- Add the password column (nullable at first to not break existing users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add check constraints for password requirements:
-- 1. At least 8 characters long
-- 2. Contains at least one special character
ALTER TABLE users 
ADD CONSTRAINT password_min_length 
CHECK (password IS NULL OR LENGTH(password) >= 8);

ALTER TABLE users 
ADD CONSTRAINT password_has_special_char 
CHECK (password IS NULL OR password ~ '[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;`~]');

-- Optional: If you want to make password required for all new users going forward
-- (Don't run this if you have existing users without passwords)
-- ALTER TABLE users 
-- ALTER COLUMN password SET NOT NULL;

-- View the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';
```

## add_subscription_columns.sql
```sql
-- Add subscription and interview tracking columns to user_preferences

-- Add subscription status (free, monthly, annual)
ALTER TABLE user_preferences
ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'monthly', 'annual'));

-- Add interview count for current month
ALTER TABLE user_preferences
ADD COLUMN interviews_this_month INTEGER DEFAULT 0;

-- Add last interview date to track monthly reset
ALTER TABLE user_preferences
ADD COLUMN last_interview_date TIMESTAMP;

-- Add subscription expiry date
ALTER TABLE user_preferences
ADD COLUMN subscription_expires_at TIMESTAMP;

-- Add purchased sector packs as JSON array
ALTER TABLE user_preferences
ADD COLUMN purchased_packs JSONB DEFAULT '[]'::jsonb;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
  AND column_name IN ('subscription_tier', 'interviews_this_month', 'last_interview_date', 'subscription_expires_at', 'purchased_packs')
ORDER BY column_name;
```

## add_test_user.sql
```sql
-- Add test user to users table
-- Run this in your Supabase SQL Editor

-- First, create a test auth user (replace with your actual auth user ID if you have one)
-- Or insert directly into users table with a UUID

-- Option 1: Insert with a new UUID (generates automatically)
INSERT INTO users (id, email, name, gender, age, password, created_at)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  'Test User',
  'F',
  25,
  'Test@123',  -- Password with 8+ chars and special char
  NOW()
);

-- Option 2: Insert multiple test users at once
INSERT INTO users (id, email, name, gender, age, password, created_at)
VALUES 
  (gen_random_uuid(), 'ava@test.com', 'Ava Johnson', 'F', 28, 'Password@1', NOW()),
  (gen_random_uuid(), 'john@test.com', 'John Smith', 'M', 32, 'Secure@99', NOW()),
  (gen_random_uuid(), 'sarah@test.com', 'Sarah Lee', 'F', 24, 'Strong#2024', NOW());

-- View all users to confirm
SELECT id, email, name, gender, age, created_at 
FROM users 
ORDER BY created_at DESC;

-- Optional: Add user preferences for the test user
-- (Replace 'test@example.com' with your actual email)
INSERT INTO user_preferences (user_id, theme, notif_push, notif_email, notif_practice, notif_feedback)
SELECT id, 'system', true, true, true, true
FROM users
WHERE email = 'test@example.com'
AND NOT EXISTS (
  SELECT 1 FROM user_preferences WHERE user_id = users.id
);

-- Optional: Add user progress for the test user
INSERT INTO user_progress (user_id, streak, total_interviews)
SELECT id, 0, 0
FROM users
WHERE email = 'test@example.com'
AND NOT EXISTS (
  SELECT 1 FROM user_progress WHERE user_id = users.id
);

-- Now you can sign in with:
-- Email: test@example.com
-- Password: Test@123
```

## add_transcript_column.sql
```sql
-- Add transcript column to interview_history table
-- Run this in Supabase SQL Editor

ALTER TABLE interview_history
ADD COLUMN IF NOT EXISTS transcript TEXT;

-- The transcript will store the full conversation in JSON format
-- Example: [{"from": "ai", "text": "..."}, {"from": "user", "text": "..."}]

COMMENT ON COLUMN interview_history.transcript IS 'JSON array of interview messages';
```

## check_migration_status.sql
```sql
-- Database Migration Status Check
-- Run this in Supabase SQL Editor to see what's already done

-- ================================================
-- CHECK 1: Subscription Columns in user_preferences
-- ================================================
SELECT 
  'Subscription Columns' as check_name,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ COMPLETE'
    ELSE '❌ MISSING: ' || (5 - COUNT(*))::text || ' columns'
  END as status
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
  AND column_name IN ('subscription_tier', 'interviews_this_month', 'last_interview_date', 'subscription_expires_at', 'purchased_packs');

-- ================================================
-- CHECK 2: CV Suggestions Table Exists
-- ================================================
SELECT 
  'cv_suggestions table' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cv_suggestions')
    THEN '✅ COMPLETE'
    ELSE '❌ MISSING - Need to run add_cv_suggestions_table.sql'
  END as status;

-- ================================================
-- CHECK 3: Success Stories Table Exists
-- ================================================
SELECT 
  'success_stories table' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'success_stories')
    THEN '✅ COMPLETE'
    ELSE '❌ MISSING - Need to run create_success_stories_table.sql'
  END as status;

-- ================================================
-- CHECK 4: RLS Enabled on All Tables
-- ================================================
SELECT 
  'RLS Policies' as check_name,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ COMPLETE (all tables have RLS)'
    ELSE '⚠️ PARTIAL - Only ' || COUNT(*) || ' tables have RLS enabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;

-- ================================================
-- CHECK 5: Performance Indexes Created
-- ================================================
SELECT 
  'Performance Indexes' as check_name,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✅ COMPLETE'
    ELSE '⚠️ PARTIAL - Only ' || COUNT(*) || ' indexes found (need ~8-10)'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';

-- ================================================
-- DETAILED TABLE LIST
-- ================================================
SELECT 
  '--- All Tables ---' as section,
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = information_schema.tables.table_name 
        AND rowsecurity = true
    ) THEN '✅ RLS enabled'
    ELSE '❌ RLS not enabled'
  END as rls_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ================================================
-- DETAILED INDEX LIST
-- ================================================
SELECT 
  '--- All Indexes ---' as section,
  tablename,
  indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- ================================================
-- RLS POLICIES COUNT
-- ================================================
SELECT 
  '--- RLS Policy Count by Table ---' as section,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

## check_transcript_data.sql
```sql
-- Check if transcript column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interview_history' AND column_name = 'transcript';

-- Count interviews and transcripts
SELECT 
  COUNT(*) as total_interviews,
  COUNT(transcript) as interviews_with_transcript,
  COUNT(feedback) as interviews_with_feedback
FROM interview_history;

-- Show sample data (first 3 records)
SELECT 
  id, 
  user_id,
  job_role, 
  created_at,
  CASE WHEN transcript IS NULL THEN 'NULL' 
       WHEN transcript = '' THEN 'EMPTY_STRING'
       ELSE 'HAS_DATA (' || LENGTH(transcript) || ' chars)' END as transcript_status,
  LEFT(transcript, 100) as transcript_preview,
  CASE WHEN feedback IS NULL THEN 'NULL' ELSE 'HAS_FEEDBACK' END as feedback_status
FROM interview_history
ORDER BY created_at DESC
LIMIT 5;
```

## create_auth_trigger.sql
```sql
-- Create a trigger to automatically create user profile on auth signup
-- This runs as the database owner (bypasses RLS)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- No-op: profile row is created from the app after signup
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## create_indexes.sql
```sql
-- Create indexes for better query performance
-- Run this in Supabase SQL Editor

-- ================================================
-- FOREIGN KEY INDEXES
-- ================================================

-- Index on user_preferences.user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
ON user_preferences(user_id);

-- Index on user_progress.user_id
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id 
ON user_progress(user_id);

-- Index on interview_history.user_id
CREATE INDEX IF NOT EXISTS idx_interview_history_user_id 
ON interview_history(user_id);

-- Index on cv_suggestions.user_id (already created in migration)
CREATE INDEX IF NOT EXISTS idx_cv_suggestions_user_id 
ON cv_suggestions(user_id);

-- ================================================
-- SORTING/FILTERING INDEXES
-- ================================================

-- Index on interview_history.created_at for chronological sorting
CREATE INDEX IF NOT EXISTS idx_interview_history_created_at 
ON interview_history(created_at DESC);

-- Index on success_stories.created_at (already created in migration)
CREATE INDEX IF NOT EXISTS idx_success_stories_created_at 
ON success_stories(created_at DESC);

-- ================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ================================================

-- Index for subscription queries (user + tier + expiry)
CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription 
ON user_preferences(user_id, subscription_tier, subscription_expires_at);

-- Index for interview limit checks (user + monthly tracking)
CREATE INDEX IF NOT EXISTS idx_user_preferences_interview_limit 
ON user_preferences(user_id, interviews_this_month, last_interview_date);

-- Index for completed CV suggestions
CREATE INDEX IF NOT EXISTS idx_cv_suggestions_completed 
ON cv_suggestions(user_id, completed);

-- ================================================
-- VERIFICATION
-- ================================================

-- List all indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage (run after app has been used for a while)
SELECT 
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## create_question_tables.sql
```sql
-- Create question_answers table to store user answers to practice questions
CREATE TABLE IF NOT EXISTS question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL, -- Can be 'standard_question_id' or 'custom_question_id'
  question_text TEXT NOT NULL, -- Store the full question text for record-keeping
  answer TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'standard', -- 'standard' or 'custom'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Add index for faster queries
  UNIQUE(user_id, question_id, created_at)
);

-- Create custom_questions table to store user-created questions
CREATE TABLE IF NOT EXISTS custom_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for question_answers
CREATE INDEX idx_question_answers_user_id ON question_answers(user_id);
CREATE INDEX idx_question_answers_created_at ON question_answers(created_at DESC);

-- Create index for custom_questions
CREATE INDEX idx_custom_questions_user_id ON custom_questions(user_id);

-- Enable Row Level Security
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own answers
CREATE POLICY question_answers_user_policy ON question_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY question_answers_insert_policy ON question_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY question_answers_update_policy ON question_answers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY question_answers_delete_policy ON question_answers
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: Users can only see/manage their own custom questions
CREATE POLICY custom_questions_user_policy ON custom_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY custom_questions_insert_policy ON custom_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY custom_questions_update_policy ON custom_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY custom_questions_delete_policy ON custom_questions
  FOR DELETE USING (auth.uid() = user_id);
```

## create_success_stories_table.sql
```sql
-- Create success_stories table
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  story TEXT NOT NULL,
  interview_count INTEGER DEFAULT 0,
  timeframe TEXT,
  gender TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_success_stories_created_at 
ON success_stories(created_at DESC);

-- Enable Row Level Security
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read success stories (public access)
CREATE POLICY "Anyone can view success stories" 
ON success_stories 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own stories
CREATE POLICY "Users can create success stories" 
ON success_stories 
FOR INSERT 
WITH CHECK (true);

-- Allow users to update their own stories
CREATE POLICY "Users can update their own stories" 
ON success_stories 
FOR UPDATE 
USING (user_email = auth.jwt()->>'email');

-- Allow users to delete their own stories
CREATE POLICY "Users can delete their own stories" 
ON success_stories 
FOR DELETE 
USING (user_email = auth.jwt()->>'email');

-- Insert the default Sarah Thompson story
INSERT INTO success_stories (user_email, name, role, company, story, interview_count, timeframe, gender)
VALUES (
  'sarah.thompson@example.com',
  'Sarah Thompson',
  'Marketing Assistant',
  'Local Marketing Agency',
  'I was really nervous about my first proper job interview after graduating. I practiced with the app for about 2 weeks, going through common questions like ''Why do you want this role?'' and ''What are your strengths?''. It helped me feel more confident and less anxious. When the actual interview came, I felt prepared and managed to stay calm. I got the job offer a week later!',
  12,
  '2 weeks',
  'female'
);
```

## create_user_cvs_table.sql
```sql
-- Create user_cvs table to store CV file metadata and extracted text
CREATE TABLE IF NOT EXISTS user_cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase Storage
    extracted_text TEXT, -- Extracted CV text for analysis
    original_content BYTEA, -- Original file content (for PDF/DOCX)
    file_size INT,
    mime_type TEXT DEFAULT 'application/pdf',
    analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id) -- Only one active CV per user
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_cvs_user_id ON user_cvs(user_id);

-- Set up RLS policies
ALTER TABLE user_cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CV"
ON user_cvs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CV"
ON user_cvs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CV"
ON user_cvs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CV"
ON user_cvs FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_cvs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_cvs_updated_at
BEFORE UPDATE ON user_cvs
FOR EACH ROW
EXECUTE FUNCTION update_user_cvs_updated_at();

-- Create Supabase Storage bucket for CVs (run separately via dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-cvs', 'user-cvs', false);
```

## fix_interview_history_rls.sql
```sql
-- Fix interview_history RLS policy to allow inserts
-- This addresses the "new row violates row-level security policy" error

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own interviews" ON interview_history;

-- Create more permissive INSERT policy
-- This allows authenticated users to insert records where user_id matches their UUID
-- Even if auth.uid() doesn't match (for custom auth implementations)
CREATE POLICY "Users can insert own interviews"
ON interview_history FOR INSERT
WITH CHECK (
  -- Either the auth.uid() matches OR the user is authenticated and inserting their own user_id
  auth.uid() = user_id 
  OR 
  (auth.role() = 'authenticated' AND user_id IS NOT NULL)
);

-- Alternative: If you want to completely bypass RLS for inserts (less secure but works)
-- Uncomment this and comment out the policy above if the above doesn't work:
-- CREATE POLICY "Users can insert own interviews"
-- ON interview_history FOR INSERT
-- WITH CHECK (true);

-- To apply this, run in your Supabase SQL Editor:
-- 1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 2. Paste this entire file
-- 3. Click "Run"
```

## fix_question_rls_policies.sql
```sql
-- Fix RLS policies for question_answers and custom_questions
-- These policies allow any authenticated user to insert/update/delete their own data

-- Drop existing policies
DROP POLICY IF EXISTS question_answers_user_policy ON question_answers;
DROP POLICY IF EXISTS question_answers_insert_policy ON question_answers;
DROP POLICY IF EXISTS question_answers_update_policy ON question_answers;
DROP POLICY IF EXISTS question_answers_delete_policy ON question_answers;
DROP POLICY IF EXISTS question_answers_select_policy ON question_answers;
DROP POLICY IF EXISTS custom_questions_user_policy ON custom_questions;
DROP POLICY IF EXISTS custom_questions_insert_policy ON custom_questions;
DROP POLICY IF EXISTS custom_questions_update_policy ON custom_questions;
DROP POLICY IF EXISTS custom_questions_delete_policy ON custom_questions;
DROP POLICY IF EXISTS custom_questions_select_policy ON custom_questions;

-- Create new policies for question_answers
-- SELECT: Users can only see their own answers
CREATE POLICY question_answers_select_policy ON question_answers
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- INSERT: Allow any authenticated user to insert (they provide their own user_id)
CREATE POLICY question_answers_insert_policy ON question_answers
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can only update their own answers
CREATE POLICY question_answers_update_policy ON question_answers
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- DELETE: Users can only delete their own answers
CREATE POLICY question_answers_delete_policy ON question_answers
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Create new policies for custom_questions
-- SELECT: Users can only see their own questions
CREATE POLICY custom_questions_select_policy ON custom_questions
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- INSERT: Allow any authenticated user to insert their own questions
CREATE POLICY custom_questions_insert_policy ON custom_questions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can only update their own questions
CREATE POLICY custom_questions_update_policy ON custom_questions
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- DELETE: Users can only delete their own questions
CREATE POLICY custom_questions_delete_policy ON custom_questions
  FOR DELETE
  USING (auth.uid()::text = user_id::text);
```

## fix_storage_policy.sql
```sql
-- Fix Storage RLS Policy for Profile Photos
-- Run this in Supabase SQL Editor to allow users to upload profile photos

-- IMPORTANT: You must also make the bucket PUBLIC in Supabase Dashboard:
-- 1. Go to Storage → Buckets
-- 2. Click on 'avatars' bucket
-- 3. Click the three dots (...) menu → Edit bucket
-- 4. Toggle "Public bucket" to ON
-- 5. Save

-- Create the avatars bucket if it doesn't exist (run in Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;

-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow everyone to view profile photos (public read)
CREATE POLICY "Users can view all profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own photos
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

## fix_users_rls.sql
```sql
-- Fix RLS policy for users table - add proper UUID type casting

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Recreate with proper type casting
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid()::uuid = id);

CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid()::uuid = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::uuid = id);

-- Verify policies are in place
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

## grant_permissions.sql
```sql
-- Grant full permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify current permissions
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE grantee IN ('anon', 'authenticated') 
    AND table_schema = 'public'
ORDER BY table_name, grantee;
```

## remove_password_column.sql
```sql
-- Remove password column from users table (OPTIONAL - only run after migrating all users)
-- Passwords are handled by Supabase Auth, no need to store them separately
-- This also fixes the security issue of storing passwords in the database

-- ⚠️ IMPORTANT: Before running this, make sure:
-- 1. All existing users have been migrated to Supabase Auth (auth.users table)
-- 2. The SignIn.tsx has fallback login for legacy accounts (already implemented)
-- 3. You're ready to force all users to use proper Supabase Auth

-- For now, KEEP the password column to support legacy accounts
-- Uncomment the line below when ready to remove it:
-- ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Add comment to table
COMMENT ON TABLE users IS 'User profiles. Authentication is handled by Supabase Auth (auth.users table), this table stores additional profile data. Legacy accounts may have password column for backward compatibility.';
```

## setup_rls_policies.sql
```sql
-- Comprehensive RLS Setup for MY INTERVIEW App
-- Run this in Supabase SQL Editor to set up all Row Level Security policies

-- ================================================
-- 1. USERS TABLE
-- ================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (signup)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- ================================================
-- 2. USER_PREFERENCES TABLE
-- ================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ================================================
-- 3. USER_PROGRESS TABLE
-- ================================================

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ================================================
-- 4. INTERVIEW_HISTORY TABLE
-- ================================================

ALTER TABLE interview_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own interview history
CREATE POLICY "Users can view own interviews"
ON interview_history FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own interviews
CREATE POLICY "Users can insert own interviews"
ON interview_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own interviews
CREATE POLICY "Users can update own interviews"
ON interview_history FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own interviews
CREATE POLICY "Users can delete own interviews"
ON interview_history FOR DELETE
USING (auth.uid() = user_id);

-- ================================================
-- 5. CV_SUGGESTIONS TABLE
-- ================================================

ALTER TABLE cv_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own CV suggestions
CREATE POLICY "Users can view own cv_suggestions"
ON cv_suggestions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own CV suggestions
CREATE POLICY "Users can insert own cv_suggestions"
ON cv_suggestions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own CV suggestions
CREATE POLICY "Users can update own cv_suggestions"
ON cv_suggestions FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own CV suggestions
CREATE POLICY "Users can delete own cv_suggestions"
ON cv_suggestions FOR DELETE
USING (auth.uid() = user_id);

-- ================================================
-- 6. SUCCESS_STORIES TABLE (Already has RLS)
-- ================================================
-- Success stories already has policies in create_success_stories_table.sql
-- Policies:
-- - Anyone can view success stories (public read)
-- - Authenticated users can insert stories
-- - Users can update/delete their own stories

-- ================================================
-- VERIFICATION
-- ================================================

-- View all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## update_premium_user.sql
```sql
-- Clean up unused columns from user_progress (we use user_preferences instead)
ALTER TABLE user_progress 
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_end_date;

DROP INDEX IF EXISTS idx_user_progress_subscription;

-- Add subscription tracking columns to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster subscription queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription ON user_preferences(subscription_tier);

-- Make ruth@gmail.com a premium user
UPDATE user_preferences 
SET subscription_tier = 'annual',
    subscription_expires_at = '2026-12-31 23:59:59'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'ruth@gmail.com'
);

-- Verify the update
SELECT 
  u.email,
  up.subscription_tier,
  up.subscription_expires_at,
  up.interviews_this_month
FROM auth.users u
JOIN user_preferences up ON u.id = up.user_id
WHERE u.email = 'ruth@gmail.com';
```

## verify_transcript_column.sql
```sql
-- Verify transcript column exists and check data
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'interview_history' 
AND column_name = 'transcript';

-- Count interviews with transcripts
SELECT 
  COUNT(*) as total_interviews,
  COUNT(transcript) as with_transcripts,
  COUNT(transcript) FILTER (WHERE transcript IS NOT NULL AND transcript != '') as with_content
FROM interview_history;

-- Sample data to check format
SELECT id, job_role, created_at, LENGTH(transcript) as transcript_length, LEFT(transcript, 100) as transcript_sample
FROM interview_history
WHERE transcript IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```


---

# Setup & Configuration Guides

## ADZUNA_API_SETUP.md
# Adzuna API Setup Guide

## 1. Create Your Free Account

1. Go to: https://developer.adzuna.com/
2. Click "Sign Up" (top right)
3. Fill in your details
4. Verify your email

## 2. Get Your API Credentials

1. Log in to your Adzuna developer account
2. Go to "My Applications" or "API Keys"
3. You'll see:
   - **App ID** (like: `12345678`)
   - **API Key** (like: `abc123def456ghi789jkl0`)

## 3. Add Credentials to Your App

Open: `src/services/jobService.ts`

Replace these lines (around line 4-5):

```typescript
const ADZUNA_APP_ID = 'YOUR_APP_ID'; // Replace with your Adzuna App ID
const ADZUNA_APP_KEY = 'YOUR_APP_KEY'; // Replace with your Adzuna App Key
```

With your actual credentials:

```typescript
const ADZUNA_APP_ID = '12345678'; // Your actual App ID
const ADZUNA_APP_KEY = 'abc123def456ghi789jkl0'; // Your actual API Key
```

## 4. Save and Restart

1. Save the file
2. Restart your Expo app
3. Navigate to the Jobs screen
4. You should see real UK job listings!

## Free Tier Limits

- **250 API calls per month**
- **1 call per second**
- Perfect for development and testing

## What Happens Without API Keys?

- The app shows demo/mock data
- You'll see "⚠️ Using demo data" in the subtitle
- Everything still works, just with fake jobs

## Troubleshooting

**"API error: 401"** → Check your App ID and API Key are correct

**"API error: 429"** → You've hit the rate limit (250/month or 1/second)

**No jobs showing** → Check your internet connection, or category might have no results

## Next Steps (Optional)

Want to customize the search?

Edit `src/services/jobService.ts`:
- Change `where: 'uk'` to a specific city like `'london'` or `'manchester'`
- Adjust `results_per_page` (default: 20)
- Add more category mappings in `CATEGORY_MAP`

## Example Categories You Can Add

```typescript
'Project Manager': 'it-jobs',
'Accounting': 'accounting-finance-jobs',
'Healthcare': 'healthcare-nursing-jobs',
'Teaching': 'teaching-jobs',
```

See full list: https://developer.adzuna.com/docs/search


## AI_SETUP.md
# AI Interview Coach Setup with Groq

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Free Groq API Key

1. Go to **https://console.groq.com/**
2. Sign up with Google/GitHub (it's free!)
3. Click on **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Give it a name like "Interview App"
6. Copy the key (starts with `gsk_...`)

### Step 2: Add Your API Key

Open `src/services/aiService.ts` and replace this line:

```typescript
const GROQ_API_KEY = "YOUR_GROQ_API_KEY_HERE";
```

With your actual key:

```typescript
const GROQ_API_KEY = "gsk_your_actual_key_here";
```

### Step 3: Test It!

Run your app and start an interview. Aya will now respond intelligently using AI!

---

## ✨ Features

- **Real AI Responses**: Uses Llama 3.1 70B model via Groq
- **Context-Aware**: Remembers the conversation and job role
- **Super Fast**: Groq responses are nearly instant
- **Free Tier**: Plenty of free requests for development
- **Interview-Specific**: Trained to ask relevant interview questions

---

## 🎯 How It Works

1. When user starts interview, AI is initialized with their job role
2. Each message is sent to Groq with full conversation history
3. AI responds as "Aya" - an empathetic interview coach
4. Responses are kept concise (2-3 sentences)
5. AI asks follow-up questions and provides feedback

---

## 🔧 Customization

### Change AI Model

In `aiService.ts`, change the model:

```typescript
model: "llama-3.1-8b-instant", // Faster, less detailed
model: "llama-3.1-70b-versatile", // Current (best balance)
model: "mixtral-8x7b-32768", // Alternative option
```

### Adjust Response Length

Change `max_tokens`:

```typescript
max_tokens: 150, // Shorter responses
max_tokens: 200, // Current
max_tokens: 300, // Longer responses
```

### Modify AI Personality

Edit the system prompt in `initializeInterviewChat()` to change Aya's behavior, tone, or focus areas.

---

## 💰 Cost & Limits

**Groq Free Tier:**
- 14,400 requests per day
- 6,000 requests per minute
- More than enough for development and small apps!

**For Production:**
- Consider adding rate limiting
- Monitor usage in Groq console
- Upgrade to paid plan if needed

---

## 🐛 Troubleshooting

**"Error calling Groq AI"**
- Check your API key is correct
- Verify you have internet connection
- Check Groq console for rate limit issues

**Slow responses**
- Switch to faster model: `llama-3.1-8b-instant`
- Check your internet connection
- Groq should be very fast (< 1 second typically)

**Generic responses**
- Make sure job role is set in user preferences
- Check the system prompt is loading correctly
- Try adjusting the temperature (0.7 = creative, 0.3 = focused)

---

## 🔄 Alternative AI Providers

If you want to switch from Groq later:

### OpenAI (Best quality)
```bash
npm install openai
```

### Anthropic Claude (Best for instructions)
```bash
npm install @anthropic-ai/sdk
```

### Google Gemini (Free tier)
```bash
npm install @google/generative-ai
```

The `aiService.ts` structure makes it easy to swap providers!

---

## 📝 Environment Variables (Optional)

For production, use environment variables instead of hardcoding:

1. Install expo-constants:
```bash
npx expo install expo-constants
```

2. Create `app.config.js`:
```javascript
export default {
  extra: {
    groqApiKey: process.env.GROQ_API_KEY,
  },
};
```

3. Update `aiService.ts`:
```typescript
import Constants from 'expo-constants';
const GROQ_API_KEY = Constants.expoConfig?.extra?.groqApiKey;
```

4. Create `.env` file:
```
GROQ_API_KEY=gsk_your_key_here
```

---

## ✅ Next Steps

1. Get your Groq API key
2. Add it to `aiService.ts`
3. Test the interview chat
4. Customize the AI personality if needed
5. Consider adding voice mode later!

**Need help?** Check the Groq docs: https://console.groq.com/docs


## ANALYTICS_SETUP.md
# Analytics Setup Guide

## Option 1: Expo Analytics (Recommended - Simplest)

### Step 1: Install Dependencies
```bash
npx expo install expo-analytics
```

### Step 2: Create Analytics Service
Create `src/services/analyticsService.ts`:

```typescript
import { Analytics } from 'expo-analytics';
import Constants from 'expo-constants';

const TRACKING_ID = Constants.expoConfig?.extra?.GOOGLE_ANALYTICS_ID || 'UA-XXXXXXXXX-X';

class AnalyticsService {
  private analytics: Analytics;

  constructor() {
    this.analytics = new Analytics(TRACKING_ID);
  }

  // Track screen views
  async trackScreen(screenName: string) {
    try {
      await this.analytics.hit('screenview', { screenName });
    } catch (error) {
      console.log('Analytics error:', error);
    }
  }

  // Track custom events
  async trackEvent(category: string, action: string, label?: string, value?: number) {
    try {
      await this.analytics.event(category, action, label, value);
    } catch (error) {
      console.log('Analytics error:', error);
    }
  }

  // Key events for your app
  async trackSignUp(method: string) {
    await this.trackEvent('User', 'SignUp', method);
  }

  async trackSignIn(method: string) {
    await this.trackEvent('User', 'SignIn', method);
  }

  async trackInterviewStart(type: string) {
    await this.trackEvent('Interview', 'Start', type);
  }

  async trackInterviewComplete(type: string, duration: number) {
    await this.trackEvent('Interview', 'Complete', type, duration);
  }

  async trackSubscriptionStart(plan: string) {
    await this.trackEvent('Subscription', 'Purchase', plan);
  }

  async trackJobSearch(query: string) {
    await this.trackEvent('Jobs', 'Search', query);
  }

  async trackFeedbackView() {
    await this.trackEvent('Feedback', 'View');
  }

  async trackStorySubmit() {
    await this.trackEvent('Story', 'Submit');
  }
}

export default new AnalyticsService();
```

### Step 3: Add Google Analytics ID to .env
```bash
# Add to .env
GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
```

### Step 4: Update app.json
```json
{
  "expo": {
    "extra": {
      "GOOGLE_ANALYTICS_ID": "UA-XXXXXXXXX-X"
    }
  }
}
```

### Step 5: Track Key Events

**In SignUp.tsx:**
```typescript
import analyticsService from '../services/analyticsService';

// After successful signup
await analyticsService.trackSignUp('email');
```

**In SignIn.tsx:**
```typescript
await analyticsService.trackSignIn('email');
```

**In InterviewChat.tsx:**
```typescript
// On mount
useEffect(() => {
  analyticsService.trackInterviewStart(interviewType);
}, []);

// On completion
await analyticsService.trackInterviewComplete(interviewType, duration);
```

**In Subscription.tsx:**
```typescript
await analyticsService.trackSubscriptionStart(selectedPlan);
```

**In Jobs.tsx:**
```typescript
await analyticsService.trackJobSearch(locationFilter);
```

---

## Option 2: Firebase Analytics (More Features)

### Step 1: Install Dependencies
```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

### Step 2: Set Up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project "MY INTERVIEW"
3. Add iOS app with bundle ID: `com.myinterview.app`
4. Add Android app with package: `com.myinterview.app`
5. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

### Step 3: Configure Files
Place `google-services.json` in root and `GoogleService-Info.plist` in root.

Update `app.json`:
```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/analytics"
    ]
  }
}
```

### Step 4: Create Analytics Service
```typescript
import analytics from '@react-native-firebase/analytics';

class FirebaseAnalyticsService {
  async trackScreen(screenName: string) {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  }

  async trackSignUp(method: string) {
    await analytics().logSignUp({ method });
  }

  async trackSignIn(method: string) {
    await analytics().logLogin({ method });
  }

  async trackInterviewStart(type: string) {
    await analytics().logEvent('interview_start', { type });
  }

  async trackInterviewComplete(type: string, duration: number) {
    await analytics().logEvent('interview_complete', { 
      type, 
      duration_seconds: duration 
    });
  }

  async trackPurchase(plan: string, value: number, currency: string) {
    await analytics().logPurchase({
      value,
      currency,
      items: [{ item_id: plan, item_name: plan }],
    });
  }
}

export default new FirebaseAnalyticsService();
```

### Step 5: Track Events (Same as Option 1)

---

## Option 3: Amplitude (Best for Product Analytics)

### Step 1: Install
```bash
npm install @amplitude/analytics-react-native
```

### Step 2: Create Service
```typescript
import * as amplitude from '@amplitude/analytics-react-native';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.AMPLITUDE_API_KEY;

class AmplitudeService {
  async init() {
    await amplitude.init(API_KEY);
  }

  async trackEvent(eventName: string, properties?: any) {
    amplitude.track(eventName, properties);
  }

  async identifyUser(userId: string, email: string) {
    amplitude.setUserId(userId);
    const identify = new amplitude.Identify();
    identify.set('email', email);
    amplitude.identify(identify);
  }

  // Specific events
  async trackSignUp(method: string) {
    this.trackEvent('Sign Up', { method });
  }

  async trackInterviewStart(type: string) {
    this.trackEvent('Interview Started', { interview_type: type });
  }

  async trackInterviewComplete(type: string, score: number) {
    this.trackEvent('Interview Completed', { 
      interview_type: type,
      score 
    });
  }
}

export default new AmplitudeService();
```

### Step 3: Initialize in App.tsx
```typescript
useEffect(() => {
  amplitudeService.init();
}, []);
```

---

## Recommended Events to Track

### User Events
- ✅ Sign Up (with method)
- ✅ Sign In (with method)
- ✅ Sign Out
- ✅ Password Reset

### Interview Events
- ✅ Interview Started (with type)
- ✅ Interview Completed (with score, duration)
- ✅ Interview Abandoned (with time spent)
- ✅ Question Skipped
- ✅ Feedback Viewed

### Subscription Events
- ✅ Subscription Page Viewed
- ✅ Plan Selected
- ✅ Purchase Started
- ✅ Purchase Completed
- ✅ Purchase Failed
- ✅ Subscription Restored

### Feature Usage
- ✅ CV Uploaded
- ✅ CV Analysis Completed
- ✅ Job Search Performed
- ✅ Job Saved
- ✅ Story Submitted
- ✅ Question Bank Opened
- ✅ Tips Viewed

### Navigation
- ✅ Screen Views (all major screens)

---

## Testing Analytics

1. **Check logs in development:**
```typescript
// Add to analyticsService
if (__DEV__) {
  console.log('📊 Analytics Event:', eventName, properties);
}
```

2. **Use Firebase Debug View:**
```bash
# iOS
adb shell setprop debug.firebase.analytics.app com.myinterview.app

# Android
adb shell setprop debug.firebase.analytics.app com.myinterview.app
```

3. **Check real-time reports** in Firebase/Amplitude dashboard

---

## Recommendation

**Start with Expo Analytics** (Option 1) - simplest setup, works immediately, good for basic tracking. Upgrade to Firebase later if you need more features.


## CUSTOM_SMTP_SETUP.md
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


## EMAIL_CONFIRMATION_FLOW_SETUP.md
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


## EMAIL_VERIFICATION_SETUP.md
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


## ENV_SETUP.md
# Environment Variables Setup Guide

## Overview
All API keys and sensitive configuration have been moved to environment variables for security.

## Setup Instructions

### 1. Copy the example file
```bash
cp .env.example .env
```

### 2. Fill in your API keys in `.env`
Open the `.env` file and replace all placeholder values with your actual API keys.

### 3. Get your API keys

#### Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### Groq AI
1. Go to https://console.groq.com/keys
2. Create a new API key
3. Copy it to `EXPO_PUBLIC_GROQ_API_KEY`

#### Adzuna Jobs API
1. Sign up at https://developer.adzuna.com/
2. Create an application
3. Copy:
   - Application ID → `EXPO_PUBLIC_ADZUNA_APP_ID`
   - Application Key → `EXPO_PUBLIC_ADZUNA_APP_KEY`

#### RevenueCat
1. Go to https://app.revenuecat.com/
2. Select your project
3. Go to Settings → API keys
4. Copy:
   - iOS key → `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
   - Android key → `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

### 4. Restart Expo
After updating your `.env` file, restart the Expo development server:
```bash
# Stop the current server (Ctrl+C)
# Then start again
npx expo start -c
```

## Important Notes

⚠️ **NEVER commit the `.env` file to Git!**
- The `.env` file is already in `.gitignore`
- Only commit `.env.example` (without real keys)
- Share API keys securely with team members (1Password, LastPass, etc.)

✅ **For production builds:**
- Use different API keys for production vs development
- Set environment variables in your CI/CD pipeline
- Use Expo's EAS Secrets for production builds

## Troubleshooting

### "API key not found" warnings
- Make sure `.env` file exists in the project root
- Check that variable names match exactly (including `EXPO_PUBLIC_` prefix)
- Restart Expo with `-c` flag to clear cache

### Environment variables not updating
```bash
# Clear Expo cache and restart
npx expo start -c
```

### Checking if variables are loaded
Add this to any file temporarily:
```typescript
import Constants from 'expo-constants';
console.log('Env vars:', Constants.expoConfig?.extra);
```

## File Structure
```
/Users/ruthrocwel/InterviewApp/
├── .env                    # Your actual API keys (NEVER commit!)
├── .env.example           # Template with placeholders (safe to commit)
├── .gitignore            # Includes .env
├── app.json              # Configured to load env vars
└── src/
    ├── config/
    │   └── supabase.ts    # Uses Constants.expoConfig.extra
    └── services/
        ├── aiService.ts   # Uses Constants.expoConfig.extra
        ├── emailService.ts
        ├── jobService.ts
        └── purchaseService.ts
```

## Benefits
✅ API keys not exposed in code
✅ Easy to change keys without code changes
✅ Different keys for dev/staging/production
✅ Team members use their own keys
✅ Safe to commit code to public repositories


## GITHUB_PAGES_SETUP.md
# GitHub Pages Setup - MY INTERVIEW App

## ✅ COMPLETED

### Files Created
- **docs/privacy.md** - Full UK GDPR-compliant privacy policy
- **docs/terms.md** - Comprehensive terms of service with subscription details
- **app.json** - Updated with GitHub Pages URLs

### URLs Configured
- Privacy Policy: `https://ruthamponsah.github.io/InterviewApp/docs/privacy`
- Terms of Service: `https://ruthamponsah.github.io/InterviewApp/docs/terms`

## 🔧 Next Step: Enable GitHub Pages

### How to Enable (5 minutes)

1. **Go to GitHub Repository Settings**
   - Visit: https://github.com/RuthAmponsah/InterviewApp
   - Click **Settings** tab (top right)

2. **Navigate to Pages Section**
   - Scroll down left sidebar
   - Click **Pages** under "Code and automation"

3. **Configure Source**
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
   - Click **Save**

4. **Wait for Deployment (2-5 minutes)**
   - GitHub will build and deploy your site
   - You'll see a green banner: "Your site is published at https://ruthamponsah.github.io/InterviewApp/"

5. **Verify URLs Work**
   - Privacy: https://ruthamponsah.github.io/InterviewApp/docs/privacy
   - Terms: https://ruthamponsah.github.io/InterviewApp/docs/terms

### ✅ Already Done
- ✅ Files created and committed
- ✅ Files pushed to GitHub
- ✅ URLs added to app.json
- ✅ Markdown files properly formatted

### 📱 Usage in App Stores

**App Store Connect**
- Add privacy policy URL during app submission
- Add to app description or metadata

**Google Play Console**
- Required field in "Store presence" → "Privacy policy"
- Copy-paste URL: https://ruthamponsah.github.io/InterviewApp/docs/privacy

**In-App Links**
- Settings → Privacy & Security → "Privacy Policy"
- Settings → Terms & Conditions
- Already shows placeholder text, will link to URLs when tapped

## 🎨 Optional: Custom Domain (Later)

If you want a custom domain like `https://myinterviewapp.com/privacy`:

1. Purchase domain (e.g., Namecheap, Google Domains)
2. Add CNAME file to docs/ folder with your domain
3. Configure DNS records
4. Update URLs in app.json

**Not required for launch** - GitHub Pages URLs are perfectly acceptable for app store submissions.

## 📊 Analytics (Optional)

GitHub Pages doesn't provide analytics. To track policy page views, you can:
- Add Google Analytics to markdown files (convert to HTML)
- Use simple-analytics.com
- Check GitHub Actions deploy logs

## 🔒 Security

- ✅ GitHub Pages serves over HTTPS (required by stores)
- ✅ No user data collected on policy pages
- ✅ Static pages only (no server-side code)

## ✅ Checklist

- [x] Create privacy.md and terms.md
- [x] Commit and push files to GitHub
- [x] Add URLs to app.json
- [ ] Enable GitHub Pages in repo settings (DO THIS NOW)
- [ ] Verify URLs load correctly after deployment
- [ ] Test links from App Store Connect
- [ ] Test links from Google Play Console

## 🆘 Troubleshooting

### URLs Return 404
- Wait 5 minutes for initial deployment
- Check GitHub Pages is enabled in repo settings
- Verify branch is set to `main`
- Verify files exist in docs/ folder on GitHub

### Markdown Not Rendering
- GitHub Pages automatically renders .md files as HTML
- No additional configuration needed
- Links and formatting will work automatically

### Custom 404 Page (Optional)
Create `docs/404.md` for custom error page:
```markdown
# Page Not Found

The page you're looking for doesn't exist.

[Return to Privacy Policy](/InterviewApp/docs/privacy) | [Terms of Service](/InterviewApp/docs/terms)
```

---

**Status**: Ready to enable GitHub Pages ✅  
**Time Required**: 5 minutes  
**Action Required**: Enable Pages in repo settings


## PAYMENT_SETUP.md
# RevenueCat Payment Integration Setup

## 🎯 Overview

Your app now supports **real in-app purchases** via RevenueCat for:
- Subscriptions (Monthly £7.99, Annual £59.99)
- One-time sector packs (£9.99-£19.99)

RevenueCat handles:
- ✅ iOS App Store billing
- ✅ Google Play billing  
- ✅ Receipt validation
- ✅ Subscription management
- ✅ Cross-platform purchases

---

## 📋 Setup Steps

### 1. Create RevenueCat Account

1. Go to https://www.revenuecat.com/
2. Sign up for free account
3. Create a new app project
4. Note your **API keys** (iOS & Android)

### 2. Configure App Store Connect (iOS)

1. **Create App in App Store Connect:**
   - Go to https://appstoreconnect.apple.com/
   - Create your app listing
   - Note your **Bundle ID**

2. **Create In-App Purchases:**
   
   **Subscriptions:**
   - Type: Auto-Renewable Subscription
   - Group: Create "Premium" subscription group
   
   Products:
   ```
   Product ID: premium_monthly
   Price: £7.99 (GBP)
   Duration: 1 Month
   
   Product ID: premium_annual
   Price: £59.99 (GBP)
   Duration: 1 Year
   ```

   **Sector Packs (Non-Consumable):**
   ```
   Product ID: pack_nhs_care
   Price: £14.99 (GBP)
   
   Product ID: pack_graduate
   Price: £19.99 (GBP)
   
   Product ID: pack_retail
   Price: £9.99 (GBP)
   
   Product ID: pack_management
   Price: £14.99 (GBP)
   ```

3. **Link to RevenueCat:**
   - In RevenueCat dashboard → Project Settings → Apple App Store
   - Upload your App Store Connect API Key
   - Enter Bundle ID

### 3. Configure Google Play Console (Android)

1. **Create App in Google Play Console:**
   - Go to https://play.google.com/console/
   - Create your app listing
   - Note your **Package Name**

2. **Create In-App Products:**
   
   Same Product IDs as iOS:
   - `premium_monthly` - £7.99
   - `premium_annual` - £59.99
   - `pack_nhs_care` - £14.99
   - `pack_graduate` - £19.99
   - `pack_retail` - £9.99
   - `pack_management` - £14.99

3. **Link to RevenueCat:**
   - In RevenueCat dashboard → Project Settings → Google Play
   - Upload Service Account JSON key
   - Enter Package Name

### 4. Configure RevenueCat Offerings

1. **In RevenueCat Dashboard → Offerings:**

2. **Create "Default" Offering:**
   
   **Packages:**
   ```
   Package Identifier: monthly
   Product: premium_monthly
   
   Package Identifier: annual
   Product: premium_annual
   ```

3. **Create Entitlement:**
   - Name: `premium`
   - Attach both products to this entitlement

### 5. Update App Code

Edit [src/services/purchaseService.ts](src/services/purchaseService.ts):

```typescript
// Replace these with your actual keys
const REVENUECAT_IOS_KEY = 'appl_xxxxxxxxxxxxxxxx';
const REVENUECAT_ANDROID_KEY = 'goog_xxxxxxxxxxxxxxxx';
```

### 6. Initialize RevenueCat in App

Edit [App.tsx](App.tsx):

```typescript
import { initializePurchases } from './src/services/purchaseService';

export default function App() {
  useEffect(() => {
    initializePurchases();
  }, []);
  
  // ...rest of your code
}
```

### 7. Update app.json

Add required permissions:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-purchases",
        {
          "enablePendingPurchases": true
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "SKAdNetworkItems": [
          {
            "SKAdNetworkIdentifier": "cstr6suwn9.skadnetwork"
          }
        ]
      }
    }
  }
}
```

---

## 🧪 Testing

### Test Purchases (Sandbox)

**iOS:**
1. Settings → App Store → Sandbox Account
2. Create test account in App Store Connect
3. Use test account to purchase

**Android:**
1. Google Play Console → License Testing
2. Add your Gmail as test account
3. Use that account to purchase

### Test in Your App

1. Run: `npx expo run:ios` or `npx expo run:android`
2. Go to Settings → Subscription
3. Click "Start Annual Plan"
4. Use sandbox/test account to complete purchase
5. Should update database and unlock unlimited interviews

---

## 💰 Pricing & Fees

**RevenueCat Free Tier:**
- Up to $2,500 monthly tracked revenue
- Unlimited purchases
- All features included

**App Store Fees (iOS):**
- 30% commission first year
- 15% after 1 year subscription

**Google Play Fees (Android):**
- 30% commission first year
- 15% after 1 year subscription

---

## 🔐 Security

✅ **Server-Side Validation:**
- RevenueCat validates all receipts
- Prevents fraud and piracy
- Updates happen in real-time

✅ **Database Updates:**
- Only updated after successful purchase
- Stores subscription expiry dates
- Handles renewals automatically

---

## 🚀 Going Live

### Before Production:

1. ✅ Test all purchase flows
2. ✅ Test restore purchases
3. ✅ Test subscription cancellation
4. ✅ Add privacy policy URL
5. ✅ Add terms of service URL
6. ✅ Submit for App Store review
7. ✅ Submit for Google Play review

### After Approval:

1. Switch from sandbox to production in RevenueCat
2. Monitor purchases in RevenueCat dashboard
3. Check Supabase for correct subscription_tier updates

---

## 📊 Analytics

RevenueCat provides:
- Active subscriptions count
- Monthly recurring revenue (MRR)
- Churn rate
- Trial conversion rate
- Refund rate

Access at: https://app.revenuecat.com/charts

---

## ❓ Troubleshooting

**"No products found":**
- Check product IDs match exactly
- Wait 2-4 hours after creating products
- Ensure products are approved/active

**"Purchase failed":**
- Check sandbox account is signed in
- Verify Bundle ID / Package Name matches
- Check RevenueCat API keys are correct

**"Already purchased":**
- Use "Restore Purchases" button
- Or delete and reinstall app in sandbox

---

## 📚 Resources

- RevenueCat Docs: https://docs.revenuecat.com/
- iOS IAP Guide: https://developer.apple.com/in-app-purchase/
- Android IAP Guide: https://developer.android.com/google/play/billing

---

## ✅ Current Status

- ✅ RevenueCat SDK installed
- ✅ Purchase service created
- ✅ Subscription screen updated
- ✅ Sector packs screen updated
- ⏳ RevenueCat keys needed (add yours)
- ⏳ App Store products needed
- ⏳ Google Play products needed

**Next:** Add your RevenueCat API keys and create products in app stores!


## REVENUECAT_SETUP.md
# RevenueCat Setup Guide

## ✅ Current Status
- API Key configured: `test_oNKpBYbmxgLxjwwwHVhOfIfIFhP`
- App code already integrated with RevenueCat SDK
- Service layer configured in `src/services/purchaseService.ts`
- Subscription screen ready to display offerings

## 📋 Next Steps to Complete Setup

### 1. Create Products in RevenueCat Dashboard

Go to your RevenueCat project: https://app.revenuecat.com

#### Create Monthly Subscription:
1. Click "Products" in left sidebar
2. Click "New Product"
3. Fill in:
   - **Product ID**: `premium_monthly` (must match your store product ID)
   - **Display Name**: Premium Monthly
   - **Description**: Unlimited interview practice
   - **Type**: Subscription
   - **Duration**: 1 month

#### Create Annual Subscription:
1. Click "New Product" again
2. Fill in:
   - **Product ID**: `premium_annual` (must match your store product ID)
   - **Display Name**: Premium Annual
   - **Description**: Unlimited interview practice - Best Value!
   - **Type**: Subscription
   - **Duration**: 1 year

### 2. Create Entitlement

1. Click "Entitlements" in left sidebar
2. Click "New Entitlement"
3. Fill in:
   - **Identifier**: `premium`
   - **Display Name**: Premium Access
4. Click "Create"
5. Add products to this entitlement:
   - Click the entitlement you just created
   - Click "Add Product"
   - Add both `premium_monthly` and `premium_annual`

### 3. Create Offering

1. Click "Offerings" in left sidebar
2. Click "New Offering"
3. Fill in:
   - **Identifier**: `default`
   - **Display Name**: Default Offering
4. Click "Create"
5. Add packages:
   - Click "Add Package"
   - **Package Identifier**: `monthly`
   - **Product**: Select `premium_monthly`
   - **Position**: 1
   
   - Click "Add Package" again
   - **Package Identifier**: `annual`
   - **Product**: Select `premium_annual`
   - **Position**: 2

6. Set as current offering (toggle switch)

### 4. Set Up App Store Connect (iOS)

1. In RevenueCat dashboard, go to "Apps"
2. Click your iOS app (or create one)
3. Fill in:
   - **Bundle ID**: `com.myinterviewapp` (or your actual bundle ID)
   - **Shared Secret**: Get from App Store Connect
   
4. In App Store Connect:
   - Go to your app
   - Features > In-App Purchases
   - Create subscriptions:
     - `premium_monthly` - Auto-renewable subscription - £7.99/month
     - `premium_annual` - Auto-renewable subscription - £59.99/year
   - Create Subscription Group if needed

### 5. Set Up Google Play (Android)

1. In RevenueCat dashboard, go to "Apps"
2. Click your Android app (or create one)
3. Fill in:
   - **Package Name**: `com.myinterviewapp` (or your actual package name)
   - **Service Account JSON**: Upload from Google Play Console
   
4. In Google Play Console:
   - Go to your app
   - Monetize > Subscriptions
   - Create subscriptions:
     - `premium_monthly` - £7.99/month
     - `premium_annual` - £59.99/year

### 6. Test the Integration

1. Install the app on a device
2. Navigate to Subscription screen
3. You should see both Monthly and Annual plans with prices
4. Try making a test purchase (use test account)
5. Verify subscription syncs to your database

## 🧪 Testing

### iOS Testing
1. Add sandbox test account in App Store Connect
2. Sign out of App Store on device
3. When prompted during purchase, sign in with test account
4. Purchase will complete without charging

### Android Testing
1. Add license tester in Google Play Console
2. Use test Gmail account
3. Purchases will complete without charging

## 🔍 Troubleshooting

### Products not showing in app
- Verify products are in "default" offering
- Check product identifiers match exactly
- Restart app after creating products

### Purchase fails
- Check API key is correct
- Verify App Store Connect / Google Play products exist
- Check bundle ID / package name matches

### Subscription not syncing to database
- Check `syncSubscriptionStatus()` in purchaseService.ts
- Verify entitlement identifier is "premium"
- Check database has `subscription_tier` and `subscription_expires_at` columns

## 📚 Documentation

- RevenueCat Docs: https://docs.revenuecat.com
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console

## 🎯 Current Configuration

```typescript
// Product IDs (must match store products)
- premium_monthly
- premium_annual

// Entitlement ID (must match in code)
- premium

// Offering ID
- default

// App Bundle IDs
- iOS: com.myinterviewapp
- Android: com.myinterviewapp
```

## ✅ Checklist

- [ ] Create products in RevenueCat
- [ ] Create entitlement "premium"
- [ ] Create offering "default"
- [ ] Add products to offering
- [ ] Set up App Store Connect subscriptions
- [ ] Set up Google Play subscriptions
- [ ] Link App Store Connect to RevenueCat
- [ ] Link Google Play to RevenueCat
- [ ] Test purchase on iOS device
- [ ] Test purchase on Android device
- [ ] Verify subscription syncs to database
- [ ] Test restore purchases
- [ ] Test subscription expiry handling

---

**Note**: You're currently using a test API key. When ready for production:
1. Create production project in RevenueCat
2. Get production API keys
3. Update `.env` file with production keys
4. Rebuild app for production


## SENTRY_SETUP.md
# Crash Reporting Setup - Sentry

## Why Sentry?
- Catch crashes before users report them
- See exact error with stack trace
- Know which users are affected
- Track error frequency and trends
- Free tier: 5,000 errors/month

## Step 1: Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for free account
3. Create new project: "MY INTERVIEW"
4. Select platform: **React Native**
5. Copy your DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

## Step 2: Install Sentry SDK

```bash
npx expo install @sentry/react-native
```

## Step 3: Create Sentry Service

Create `src/services/errorService.ts`:

```typescript
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = Constants.expoConfig?.extra?.SENTRY_DSN;

class ErrorService {
  init() {
    if (!__DEV__) {
      Sentry.init({
        dsn: SENTRY_DSN,
        enableInExpoDevelopment: false,
        debug: false,
        environment: __DEV__ ? 'development' : 'production',
        tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
      });
    }
  }

  // Identify user (call after login)
  setUser(userId: string, email: string) {
    Sentry.setUser({
      id: userId,
      email,
    });
  }

  // Clear user (call on logout)
  clearUser() {
    Sentry.setUser(null);
  }

  // Add context to errors
  setContext(key: string, value: any) {
    Sentry.setContext(key, value);
  }

  // Add breadcrumb (track user actions leading to error)
  addBreadcrumb(message: string, category: string, data?: any) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }

  // Manually capture error
  captureError(error: Error, context?: any) {
    if (context) {
      Sentry.setContext('errorContext', context);
    }
    Sentry.captureException(error);
  }

  // Capture message (non-error events)
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    Sentry.captureMessage(message, level);
  }
}

export default new ErrorService();
```

## Step 4: Add DSN to Environment

**Add to `.env`:**
```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Update `app.json`:**
```json
{
  "expo": {
    "extra": {
      "SENTRY_DSN": "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
    }
  }
}
```

## Step 5: Initialize in App.tsx

```typescript
import errorService from './src/services/errorService';

export default function App() {
  useEffect(() => {
    // Initialize Sentry
    errorService.init();
  }, []);

  // ... rest of your app
}
```

## Step 6: Set User Context After Login

**In SignIn.tsx and SignUp.tsx:**
```typescript
import errorService from '../services/errorService';

// After successful login
const userId = user.id;
const email = user.email;

errorService.setUser(userId, email);
```

**In SignOut/Logout:**
```typescript
errorService.clearUser();
```

## Step 7: Add Error Boundaries

Create `src/components/ErrorBoundary.tsx`:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We've been notified and are working on a fix.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
```

**Wrap your app in App.tsx:**
```typescript
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NavigationContainer>
          {/* ... */}
        </NavigationContainer>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

## Step 8: Add Breadcrumbs for User Actions

Track user actions to understand what led to errors:

```typescript
// In navigation
errorService.addBreadcrumb('Navigated to Interview', 'navigation', { screen: 'InterviewChat' });

// In API calls
errorService.addBreadcrumb('API call started', 'api', { endpoint: '/interview/start' });

// In user actions
errorService.addBreadcrumb('Started interview', 'user-action', { type: 'technical' });
```

## Step 9: Catch and Report Errors

**Example in API calls:**
```typescript
try {
  const response = await supabase.from('interviews').insert(data);
} catch (error) {
  console.error('Failed to save interview:', error);
  errorService.captureError(error as Error, {
    action: 'save_interview',
    interviewType: data.type,
  });
  throw error;
}
```

**Example in async operations:**
```typescript
const handleStartInterview = async () => {
  try {
    await startInterview();
  } catch (error) {
    Alert.alert('Error', 'Failed to start interview');
    errorService.captureError(error as Error, {
      screen: 'InterviewType',
      action: 'start_interview',
    });
  }
};
```

## Step 10: Test Sentry Integration

Add a test button (remove before production):

```typescript
import errorService from '../services/errorService';

// In a test screen
<Button 
  title="Test Sentry Error" 
  onPress={() => {
    errorService.captureError(new Error('Test error from app'), {
      test: true,
      screen: 'Home'
    });
  }} 
/>
```

Check Sentry dashboard to see the error appear.

## Best Practices

### DO:
- ✅ Capture errors in API calls
- ✅ Capture errors in async operations
- ✅ Add user context after login
- ✅ Add breadcrumbs for important actions
- ✅ Set context for errors (screen, action, etc)

### DON'T:
- ❌ Capture errors in development (already disabled)
- ❌ Log sensitive data (passwords, tokens)
- ❌ Capture expected errors (validation, network timeouts)
- ❌ Over-breadcrumb (only important actions)

## Monitoring in Production

1. **Check Sentry dashboard daily** for new errors
2. **Set up alerts** for high-frequency errors
3. **Review stack traces** to identify root cause
4. **Track affected users** to prioritize fixes
5. **Monitor error trends** over time

## Sentry Dashboard Features

- **Issues**: See all errors grouped by type
- **Performance**: Monitor app performance
- **Releases**: Track errors by version
- **Alerts**: Get notified of critical errors
- **Users**: See which users are affected

---

## Cost

- **Free tier**: 5,000 errors/month
- **Paid tier**: $26/month for 50,000 errors/month
- Start free, upgrade if needed


## SUBSCRIPTION_SETUP.md
# Subscription & Monetization Setup

## ✅ What's Been Added

### 1. **Freemium Model**
- **Free Tier:** 5 AI mock interviews per month
- **Paid Tiers:**
  - Monthly: £7.99/month
  - Annual: £59.99/year (save 37%)

### 2. **Sector-Specific Packs**
One-time purchases:
- NHS & Care Interviews - £14.99
- Graduate & Assessment Centre - £19.99
- Retail & Customer Service - £9.99
- Management & Leadership - £14.99

### 3. **New Screens Created**
- [Subscription.tsx](src/screens/Subscription.tsx) - Beautiful paywall with gradient header
- [SectorPacks.tsx](src/screens/SectorPacks.tsx) - Sector pack purchases
- Both support light/dark mode automatically

### 4. **Settings Updated**
- Shows "FREE" badge on Subscription row
- Added helper text for subscription and packs
- Quick access to both screens

---

## 🔧 Setup Required

### Step 1: Add Database Columns

Run this SQL in **Supabase SQL Editor**:

```sql
-- Copy from add_subscription_columns.sql
ALTER TABLE user_preferences
ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'monthly', 'annual'));

ALTER TABLE user_preferences
ADD COLUMN interviews_this_month INTEGER DEFAULT 0;

ALTER TABLE user_preferences
ADD COLUMN last_interview_date TIMESTAMP;

ALTER TABLE user_preferences
ADD COLUMN subscription_expires_at TIMESTAMP;

ALTER TABLE user_preferences
ADD COLUMN purchased_packs JSONB DEFAULT '[]'::jsonb;
```

### Step 2: Test the Screens

1. **View Subscription Screen:**
   - Go to Settings → Subscription
   - See monthly/annual pricing
   - Click "Start Annual Plan" (mock purchase)

2. **View Sector Packs:**
   - Go to Settings → Sector Packs
   - See all 4 packs
   - Click "Buy Now" on any pack (mock purchase)

### Step 3: Integrate Real Payments (Later)

For production, integrate with:

**Option A: RevenueCat (Recommended for mobile)**
- Handles iOS App Store & Google Play billing
- Simplifies subscription management
- Free up to $2,500/month
- https://www.revenuecat.com/

**Option B: Stripe**
- More control, more complex
- Good for web + mobile
- Requires more backend setup

---

## 📝 Mock Data Currently

Right now, subscriptions are **mocked**:
- Clicking "Subscribe" shows alert and navigates back
- Clicking "Buy Pack" shows alert and marks as purchased
- No actual payment processing

When ready for production:
1. Set up payment provider
2. Replace `handleSubscribe()` and `handlePurchase()` functions
3. Update subscription status in database
4. Implement server-side verification

---

## 🎨 UI Design

Styled like Flo app:
- Gradient header (purple/pink for light, dark blues for dark mode)
- Clean card-based design
- "BEST VALUE" and "POPULAR" badges
- Smooth transitions
- Professional pricing display

---

## 🚀 Next Steps

1. ✅ Run SQL to add columns
2. ✅ Test both screens in app
3. ⏳ Enforce 5-interview limit (coming next)
4. ⏳ Show paywall when limit hit
5. ⏳ Track interview count per month
6. ⏳ Integrate real payment provider (production)

---

## 💡 Tips

- Free users see "2 interviews per month" in Settings
- Premium users see "Unlimited interviews"
- Sector packs work for both free and premium users
- Annual plan has 37% discount to encourage commitment
- UK pricing (£ GBP) for psychological appeal to UK students


## SUPABASE_EMAIL_SETUP.md
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


## SUPABASE_SETUP.md
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


## DATABASE_SETUP_GUIDE.md
# Database Setup Guide - Supabase

## Current Database Schema

Your app uses the following tables in Supabase:

### 1. **users** (Core user data)
- `id` (UUID, Primary Key)
- `email` (TEXT)
- `name` (TEXT)
- `gender` (TEXT) - 'M' or 'F'
- `age` (INTEGER)
- `password` (TEXT)
- `job_role` (TEXT)
- `profile_photo` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 2. **user_preferences** (Settings & subscription)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `theme` (TEXT) - 'light', 'dark', 'system'
- `notif_push` (BOOLEAN)
- `notif_email` (BOOLEAN)
- `notif_practice` (BOOLEAN)
- `notif_feedback` (BOOLEAN)
- `subscription_tier` (TEXT) - 'free', 'monthly', 'annual'
- `interviews_this_month` (INTEGER)
- `last_interview_date` (TIMESTAMP)
- `subscription_expires_at` (TIMESTAMP)
- `purchased_packs` (JSONB)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 3. **user_progress** (Gamification & saved jobs)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `streak` (INTEGER)
- `total_interviews` (INTEGER)
- `saved_jobs` (TEXT[]) - Array of job IDs
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 4. **interview_history** (Interview sessions)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `job_role` (TEXT)
- `date` (DATE)
- `duration_minutes` (INTEGER)
- `feedback` (TEXT) - AI-generated feedback
- `created_at` (TIMESTAMPTZ)

### 5. **cv_suggestions** (CV improvement tracking)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `category` (VARCHAR(100))
- `suggestion` (TEXT)
- `completed` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 6. **success_stories** (User testimonials)
- `id` (UUID, Primary Key)
- `user_email` (TEXT)
- `name` (TEXT)
- `role` (TEXT)
- `company` (TEXT)
- `story` (TEXT)
- `interview_count` (INTEGER)
- `timeframe` (TEXT)
- `gender` (TEXT) - 'male', 'female', 'other'
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## Step-by-Step Setup Instructions

### Step 1: Run Existing Migrations

Execute these SQL files in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql):

#### 1.1: Add Subscription Columns
```bash
# File: add_subscription_columns.sql
```
This adds:
- `subscription_tier` (free/monthly/annual)
- `interviews_this_month` (for limits)
- `last_interview_date` (for monthly reset)
- `subscription_expires_at`
- `purchased_packs` (JSON array)

**Run this in Supabase SQL Editor:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `add_subscription_columns.sql`
3. Paste and click "Run"
4. Verify: You should see "Success. No rows returned"

#### 1.2: Create CV Suggestions Table
```bash
# File: add_cv_suggestions_table.sql
```
This creates:
- `cv_suggestions` table
- Index on `user_id`
- `updated_at` trigger

**Run this in Supabase SQL Editor:**
1. Copy contents of `add_cv_suggestions_table.sql`
2. Paste and click "Run"
3. Verify table exists: Go to Table Editor → cv_suggestions

#### 1.3: Create Success Stories Table
```bash
# File: create_success_stories_table.sql
```
This creates:
- `success_stories` table with RLS policies
- Public read access
- Authenticated write access
- Example Sarah Thompson story

**Run this in Supabase SQL Editor:**
1. Copy contents of `create_success_stories_table.sql`
2. Paste and click "Run"
3. Verify: Go to Table Editor → success_stories → should see Sarah's story

---

### Step 2: Set Up Row Level Security (RLS)

RLS ensures users can only access their own data. Here's the comprehensive RLS setup:

#### 2.1: Users Table RLS

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own data (signup)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);
```

#### 2.2: User Preferences RLS

```sql
-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### 2.3: User Progress RLS

```sql
-- Enable RLS on user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY "Users can view own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### 2.4: Interview History RLS

```sql
-- Enable RLS on interview_history
ALTER TABLE interview_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own interview history
CREATE POLICY "Users can view own interviews"
ON interview_history FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own interviews
CREATE POLICY "Users can insert own interviews"
ON interview_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own interviews
CREATE POLICY "Users can update own interviews"
ON interview_history FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own interviews
CREATE POLICY "Users can delete own interviews"
ON interview_history FOR DELETE
USING (auth.uid() = user_id);
```

#### 2.5: CV Suggestions RLS

```sql
-- Enable RLS on cv_suggestions
ALTER TABLE cv_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can read their own CV suggestions
CREATE POLICY "Users can view own cv_suggestions"
ON cv_suggestions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own CV suggestions
CREATE POLICY "Users can insert own cv_suggestions"
ON cv_suggestions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own CV suggestions
CREATE POLICY "Users can update own cv_suggestions"
ON cv_suggestions FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own CV suggestions
CREATE POLICY "Users can delete own cv_suggestions"
ON cv_suggestions FOR DELETE
USING (auth.uid() = user_id);
```

#### 2.6: Success Stories RLS (Already Set Up ✅)
Success stories table already has RLS policies:
- ✅ Public read access
- ✅ Authenticated insert
- ✅ User can update/delete own stories

---

### Step 3: Create Indexes for Performance

```sql
-- Index on user_preferences.user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
ON user_preferences(user_id);

-- Index on user_progress.user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id 
ON user_progress(user_id);

-- Index on interview_history.user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_interview_history_user_id 
ON interview_history(user_id);

-- Index on interview_history.created_at for sorting
CREATE INDEX IF NOT EXISTS idx_interview_history_created_at 
ON interview_history(created_at DESC);

-- Index on cv_suggestions.user_id (already created in migration)
-- Index on success_stories.created_at (already created in migration)

-- Composite index for subscription queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription 
ON user_preferences(user_id, subscription_tier, subscription_expires_at);
```

---

### Step 4: Set Up Database Backups

#### Automatic Backups (Supabase Pro Plan)
Supabase Pro includes:
- Daily backups (retained for 7 days)
- Point-in-time recovery

**To enable:**
1. Go to Supabase Dashboard → Settings → Billing
2. Upgrade to Pro plan ($25/month)
3. Backups are automatic

#### Manual Backup Script (Free Tier)

Create `backup_database.sh`:
```bash
#!/bin/bash
# Manual database backup script

# Set your Supabase project details
PROJECT_REF="urewxbnmubmkceuplctd"
DB_PASSWORD="your_postgres_password"

# Create backup directory
mkdir -p backups
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"

# Download backup using pg_dump
pg_dump "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" > $BACKUP_FILE

echo "Backup saved to $BACKUP_FILE"

# Keep only last 7 backups
ls -t backups/backup_*.sql | tail -n +8 | xargs rm -f
```

**Usage:**
```bash
chmod +x backup_database.sh
./backup_database.sh
```

---

### Step 5: Database Monitoring

#### Enable Supabase Monitoring

1. Go to Dashboard → Reports
2. Monitor:
   - Database size
   - Query performance
   - Connection count
   - Table sizes

#### Set Up Alerts

1. Go to Dashboard → Settings → API
2. Enable "Database Webhooks"
3. Set up alerts for:
   - Database size > 80% of limit
   - High connection count
   - Slow queries

#### Query Performance Monitoring

```sql
-- Find slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Find table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Find missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1;
```

---

## Verification Checklist

After completing setup, verify everything works:

### ✅ Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- users
- user_preferences
- user_progress
- interview_history
- cv_suggestions
- success_stories

### ✅ RLS Policies Active
```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Should see policies for all tables.

### ✅ Indexes Created
```sql
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Should see indexes on foreign keys and frequently queried columns.

### ✅ Test Data Access

Test as a logged-in user:
1. Sign up in your app
2. Create an interview
3. Check if it appears in interview_history
4. Try accessing another user's data (should fail)

---

## Production Readiness Checklist

- [ ] All migrations run successfully
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance
- [ ] Backup strategy configured
- [ ] Monitoring enabled
- [ ] Test user data isolation (RLS working)
- [ ] Verify success_stories public access
- [ ] Check subscription columns exist
- [ ] Verify CV suggestions table exists
- [ ] Document database password securely

---

## Common Issues & Solutions

### Issue: "permission denied for table X"
**Solution:** Check RLS policies are created and user is authenticated

### Issue: Queries are slow
**Solution:** Run index creation SQL, check pg_stat_statements for slow queries

### Issue: Can't access data after RLS enabled
**Solution:** Verify `auth.uid()` matches the user_id in the policy

### Issue: Success stories not visible
**Solution:** Check public read policy exists: `USING (true)`

---

## Next Steps After Database Setup

1. ✅ Test all CRUD operations in your app
2. ✅ Verify subscription tier changes work
3. ✅ Test interview limits for free users
4. ✅ Verify CV suggestions save and load
5. ✅ Check success stories display for all users
6. ✅ Run backup script to test backups
7. ✅ Monitor database size and performance

---

## Support Resources

- Supabase Docs: https://supabase.com/docs
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Performance Tuning: https://supabase.com/docs/guides/database/performance
- Backups: https://supabase.com/docs/guides/platform/backups



---

# Feature Documentation

## CV_IMPROVEMENT_FEATURE.md
# CV Improvement Feature

## 🎨 Overview
Aya can now not only analyze your CV and provide suggestions, but also **generate a complete improved version** of your CV that's ready to use!

## ✨ New Features

### 1. AI-Powered CV Rewriting
- **Function**: `improveCV()` in `aiService.ts`
- Uses Groq's llama-3.3-70b-versatile model
- Rewrites entire CV with:
  - Better formatting and structure
  - Stronger action verbs
  - Quantifiable achievements
  - ATS-optimized keywords for your target role
  - Professional tone and language
  - Improved readability

### 2. Generate Improved CV Button
- Appears after CV analysis is complete
- Shows "Generating..." loading state
- Calls AI to produce enhanced CV text
- **Auto-checks all suggestions** when improved version is created

### 3. Improved CV Display Section
- Clean, scrollable view of the enhanced CV
- Maximum height container with nested scrolling
- Professional formatting with proper spacing
- Dark mode support

### 4. Copy to Clipboard
- One-click copy button
- Success feedback (icon changes to checkmark, button turns green)
- Shows "Copied!" confirmation alert
- Reset after 3 seconds for re-copying

### 5. Coming Soon Banner
- "Download as DOCX file" feature marked as coming soon
- Sets user expectations for future enhancement

## 🔄 User Flow

1. **Upload/Paste CV** → User adds their CV content
2. **Analyze with Aya** → AI provides 6-8 specific suggestions
3. **Generate Improved CV** ✨ → AI rewrites entire CV with improvements
4. **All suggestions auto-checked** ✓ → Progress bar shows 100% complete
5. **Copy to Clipboard** → User copies improved CV with one tap
6. **Paste anywhere** → Ready to use in job applications

## 📂 Files Modified

### aiService.ts
- Added `improveCV()` function
- Takes CV content and job role as parameters
- Returns improved CV as plain text string
- Max 3000 tokens for complete CV generation

### ViewCV.tsx
**New State Variables:**
- `improvedCV`: Stores the AI-generated improved CV text
- `improving`: Loading state for generation process
- `copied`: Tracks if user has copied to clipboard

**New Functions:**
- `handleImproveCV()`: Generates improved CV and auto-checks suggestions
- `handleCopyImprovedCV()`: Copies to clipboard with feedback

**New UI Components:**
- "Generate Improved CV ✨" button (appears after analysis)
- Improved CV display section with scrollable container
- "Coming Soon: Download as DOCX" banner
- Copy button with success state

**New Styles:**
- `improvedSection`: Container for improved CV area
- `improvedHeader`: Title with sparkles icon
- `comingSoonBanner`: Grey banner for DOCX notice
- `improvedCVContainer`: Scrollable CV display
- `copyButton`: Copy to clipboard button
- `copyButtonSuccess`: Green success state

### DEPLOYMENT_CHECKLIST.md
**Updated:**
- Added CV Improvement Generator to completed features
- Added CV DOCX Export to "Features to Complete" section
- Updated testing flow to include generate → copy workflow

## 🎯 Technical Details

### AI Prompt Strategy
The `improveCV()` function instructs the AI to:
- Keep all factual information (names, dates, companies)
- Only enhance writing and presentation
- Output plain text (not markdown) for easy copying
- Focus on readability and ATS optimization
- Make it specific to the target job role

### Suggestion Auto-Completion
When user clicks "Generate Improved CV":
1. AI generates the improved version
2. All suggestions are marked as `completed: true` in database
3. Local state updated to show checkmarks
4. Progress bar animates to 100%
5. Shows user that AI implemented all improvements

### Copy Functionality
Uses `expo-clipboard` package:
- `setStringAsync()` for reliable copying
- Works on iOS and Android
- Success feedback with visual changes
- Auto-reset after 3 seconds

## 🚀 Future Enhancement: DOCX Export

**Planned Feature:**
- Library options: `docx`, `react-native-docx-generator`, or server-side generation
- Generate formatted Word document with:
  - Professional fonts (Arial, Calibri)
  - Section headers
  - Bullet points
  - Proper spacing
  - Ready-to-print formatting
- Download button next to copy button
- Save directly to device

**Implementation Notes:**
- May require native modules (development build, not Expo Go)
- Alternative: Server-side generation with API endpoint
- Consider: AWS Lambda + docx library for scalable generation

## 📱 User Experience

### Before This Feature
- User gets suggestions but must manually rewrite CV
- Time-consuming to implement all suggestions
- Risk of missing some improvements

### After This Feature
- AI does the rewriting work automatically
- One-click copy for immediate use
- Suggestions auto-marked as complete
- Clear progress tracking
- Professional results in seconds

## 🎓 Benefits

1. **Time-Saving**: Instant CV improvements vs. manual rewriting
2. **Professional Quality**: AI writes with expertise
3. **Role-Specific**: Optimized for user's target job
4. **Easy to Use**: One click to generate, one click to copy
5. **ATS-Friendly**: Keywords and formatting for applicant tracking systems
6. **Progress Tracking**: Auto-checks suggestions when applied

## 📊 Success Metrics to Track

- % of users who click "Generate Improved CV" after analysis
- Time from analysis to generation (API latency)
- Copy button click rate
- User feedback on improved CVs
- Job application success rates (if trackable)

---

**Status**: ✅ Fully implemented and ready to test
**Next Step**: Add DOCX export capability (marked as "Coming Soon")


## VOICE_RECOGNITION_IMPLEMENTATION.md
# Voice Recognition Implementation Guide

## What's Happening Now:
1. ✅ EAS CLI installed
2. ✅ expo-speech-recognition installed  
3. ✅ EAS project configured
4. ⏳ Building iOS development client (will take ~10-15 minutes)

## After Build Completes:

### Step 1: Install the Development Client
- Download the .ipa file from EAS
- Install on your iPhone using the link EAS provides
- OR scan QR code to install directly

### Step 2: We'll Update InterviewChat.tsx
Add voice recognition with these features:
- Push-to-hold microphone button
- Real-time speech transcription
- Visual feedback when listening
- Automatic question flow

### Step 3: Enable Voice Mode
- Update InterviewType.tsx to enable "Vocal interview" button
- Remove "Coming Soon" label

### Step 4: Test
- Open the development client (not Expo Go)
- Start a voice interview
- Hold mic button and speak
- Verify transcription works
- Check feedback saves correctly

## Technical Details:

### expo-speech-recognition API:
```typescript
import * as ExpoSpeechRecognition from 'expo-speech-recognition';

// Request permissions
const { granted } = await ExpoSpeechRecognition.requestPermissionsAsync();

// Start listening
ExpoSpeechRecognition.start({
  lang: 'en-US',
  interimResults: true,
  maxAlternatives: 1,
});

// Handle results
ExpoSpeechRecognition.addSpeechRecognitionListener((event) => {
  if (event.isFinal) {
    console.log('Final transcript:', event.results[0].transcript);
  }
});

// Stop listening
ExpoSpeechRecognition.stop();
```

### UI Changes:
- Microphone button (hold to speak)
- Listening indicator (animated)
- Transcript preview
- Auto-send on speech end

## Current Status:
- Waiting for 2FA verification
- Build will take 10-15 minutes after verification
- You'll get a link to install the app
- Then we implement the voice code


## TYPOGRAPHY_UPDATE.md
# Global Typography Update

## Overview
Applied consistent typography standards across the entire app, matching the improved font styling from the Welcome screen.

## Typography Standards (src/theme/colors.ts)

### Headings
- **heading**: 32px, weight 700, letterSpacing 0.3, lineHeight 38
- **headingMedium**: 24px, weight 700, letterSpacing 0.3, lineHeight 30
- **headingSmall**: 20px, weight 600, letterSpacing 0.2, lineHeight 26

### Body Text
- **body**: 20px, weight 400, letterSpacing 0.2, lineHeight 34
- **bodyMedium**: 16px, weight 400, letterSpacing 0.2, lineHeight 24
- **bodySmall**: 14px, weight 400, letterSpacing 0.2, lineHeight 20

### Labels & Captions
- **label**: 15px, weight 500, letterSpacing 0.1
- **caption**: 12px, weight 400, letterSpacing 0.1

## Updated Files

### Core Components (2 files)
✅ TextInputField.tsx - Input labels and text
✅ PrimaryButton.tsx - Button text

### All Screens (20 files)
✅ Home.tsx
✅ Jobs.tsx
✅ Settings.tsx
✅ Welcome.tsx (already had correct fonts)
✅ SignIn.tsx
✅ SignUp.tsx
✅ MyProfile.tsx
✅ EditProfile.tsx
✅ ChangePassword.tsx
✅ Notifications.tsx
✅ Support.tsx
✅ AboutUs.tsx
✅ ForgotPassword.tsx
✅ InterviewType.tsx
✅ InterviewChat.tsx
✅ InterviewExperience.tsx
✅ JobPreferences.tsx
✅ PrivacySecurity.tsx
✅ HelpCentre.tsx
✅ Feedback.tsx
✅ AppCustomisation.tsx

## Usage Pattern

Instead of hardcoded values:
```tsx
title: {
  fontSize: 24,
  fontWeight: '700',
}
```

Use typography spreads:
```tsx
title: {
  ...typography.headingMedium,
  color: colors.textDark,
}
```

## Benefits
- ✅ Consistent font sizing across all screens
- ✅ Improved readability with letter spacing
- ✅ Better line heights for multi-line text
- ✅ Easy to update fonts globally in future
- ✅ Maintains dark/light mode color support
- ✅ Professional, polished appearance

## Testing
- No TypeScript errors
- All imports verified
- Typography applied to 20 screens + 2 components


## CV_IMPROVEMENT_TESTING.md
# Testing the CV Improvement Feature

## 🧪 How to Test

### Prerequisites
1. Make sure you've run the SQL migration: `add_cv_suggestions_table.sql` in Supabase
2. Restart the Expo app: `npx expo start -c` (clear cache)
3. Have a CV ready to paste (at least 50 characters)
4. Set a target job role in Job Preferences

### Test Steps

#### 1. Upload/Paste CV
1. Navigate to "My Profile" → "View CV"
2. Paste your CV content into the text input field
3. Verify: Text appears in the input box
4. Verify: Clear button (X) appears when text is present

#### 2. Analyze CV
1. Click "Analyze with Aya" button
2. Wait for analysis (should take 3-5 seconds)
3. **Expected console logs:**
   ```
   🔍 Starting CV analysis for role: [Your Role]
   📝 CV text length: [number]
   ✅ AI analysis complete, suggestions: 6
   💾 Saving suggestions to database: 6
   ✅ Suggestions saved, data length: 6
   ```
4. Verify: 6-8 suggestions appear below the text box
5. Verify: Each suggestion has:
   - Category label (e.g., "SKILLS", "CONTENT")
   - Checkbox (unchecked initially)
   - Suggestion text
6. Verify: Progress bar shows 0% or low percentage

#### 3. Test Suggestion Checkboxes
1. Tap on any suggestion
2. Verify: Checkbox fills with blue background and checkmark
3. Verify: Text gets strikethrough
4. Verify: Progress bar updates
5. Tap again to uncheck
6. Verify: Checkbox reverts, strikethrough removed

#### 4. Generate Improved CV ✨
1. Click "Generate Improved CV ✨" button
2. Verify: Button shows "Generating..." loading state
3. Wait 5-10 seconds (AI generates full CV rewrite)
4. **Expected console logs:**
   ```
   🎨 Generating improved CV for role: [Your Role]
   ✅ Improved CV generated, length: [number]
   ✅ All suggestions marked as complete
   ```
5. Verify: Alert appears: "CV Improved! ✨"
6. Verify: ALL suggestions are now checked (auto-completed)
7. Verify: Progress bar shows 100%
8. Verify: Improved CV section appears below

#### 5. View Improved CV
1. Scroll down to "Your Improved CV" section
2. Verify: Section has sparkles icon (✨)
3. Verify: "Coming Soon: Download as DOCX file" banner visible
4. Verify: Improved CV text is displayed in scrollable container
5. Verify: CV text is formatted and readable
6. Verify: Content is enhanced version of your original CV

#### 6. Copy to Clipboard
1. Click "Copy to Clipboard" button
2. Verify: Button changes to:
   - Green border
   - Checkmark icon
   - "Copied!" text
3. Verify: Alert appears: "Copied! 📋"
4. Open Notes app or any text editor
5. Paste (Cmd+V / Ctrl+V)
6. Verify: Full improved CV pastes successfully
7. Wait 3 seconds
8. Verify: Copy button resets to original state

#### 7. Pull to Refresh
1. Pull down on the screen
2. Verify: Refresh spinner appears
3. Verify: Data reloads
4. Verify: Suggestions and improved CV persist

#### 8. Re-analyze CV
1. Click "Re-analyze CV" button (refresh icon)
2. Verify: New analysis starts
3. Verify: Old improved CV is replaced with new one
4. Verify: Suggestions reset and update

### Expected Behavior

#### Analysis Success ✅
- Takes 3-5 seconds
- Returns 6-8 specific suggestions
- Suggestions reference actual CV content
- Suggestions are personalized (not generic)
- Console shows success logs

#### Improvement Success ✅
- Takes 5-10 seconds
- Returns full rewritten CV
- Maintains factual information
- Improves writing quality
- Auto-checks all suggestions
- Shows in scrollable container

#### Copy Success ✅
- Works on first click
- Pastes full CV text
- Button shows success feedback
- Resets after 3 seconds

### Common Issues & Solutions

#### ❌ "Table not found" error
**Solution:** Run `add_cv_suggestions_table.sql` in Supabase SQL Editor

#### ❌ "No CV found" alert
**Solution:** Paste CV text in the text input field (minimum 50 characters)

#### ❌ "Job Role Required" alert
**Solution:** Set target job role in Settings → Job Preferences

#### ❌ Suggestions not appearing
**Check:**
- Console for error logs
- Database table exists
- User is authenticated
- Network connection

#### ❌ Improved CV not generating
**Check:**
- Console for API errors
- Groq API key in .env file
- Network connection
- CV text is present

#### ❌ Copy not working
**Check:**
- Device permissions (if needed)
- expo-clipboard is installed
- Try on physical device (may not work in simulator)

### Performance Benchmarks

| Action | Expected Time | Max Time |
|--------|--------------|----------|
| Analyze CV | 3-5 seconds | 10 seconds |
| Generate Improved CV | 5-10 seconds | 20 seconds |
| Copy to Clipboard | Instant | 1 second |
| Load saved data | Instant | 2 seconds |

### Data Validation

#### Suggestions Should Include:
- Category (Skills, Content, Experience, Keywords, etc.)
- Specific observation about YOUR CV
- Actionable improvement advice
- Reference to actual CV content

#### Improved CV Should Include:
- All original factual info (names, dates, companies)
- Enhanced action verbs
- Better formatting/structure
- Quantified achievements where possible
- Role-specific keywords
- Professional tone
- Improved readability

### Dark Mode Testing
1. Toggle dark mode in Settings
2. Verify: All new UI elements adapt correctly
3. Check:
   - Improved CV section background
   - Text colors readable
   - Button contrast
   - Banner colors
   - Coming Soon banner visible

### Edge Cases to Test

#### Empty CV
- Paste only 20 characters → Should show alert

#### Very Long CV
- Paste 5000+ word CV → Should handle gracefully
- Check scrolling works
- Check copy includes full text

#### Special Characters
- Paste CV with emojis, symbols → Should preserve them
- Copy and paste → Should maintain formatting

#### Interruptions
- Start generation → Background app → Return
- Should continue or show clear error

#### No Internet
- Try to analyze offline → Should show error
- Improved CV section should persist if already generated

### Success Criteria
✅ Analysis completes in under 10 seconds  
✅ Suggestions are specific and helpful  
✅ Improved CV is readable and professional  
✅ Copy function works reliably  
✅ Auto-check all suggestions works  
✅ Progress bar updates correctly  
✅ UI is responsive and smooth  
✅ Works in both light and dark mode  
✅ Error messages are clear and helpful  
✅ Data persists after app restart  

---

## 🐛 Bug Reporting Template

If you encounter issues, report with:

```
**Issue:** [Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]
**Actual:** [What actually happened]

**Console Logs:** [Copy error logs]

**Device:** iPhone 14 / Android Pixel 7
**OS Version:** iOS 17 / Android 13
**App Version:** [Current version]

**Screenshot:** [If applicable]
```

---

**Test Date:** _____________  
**Tested By:** _____________  
**Status:** ⬜ Pass  ⬜ Fail  ⬜ Partial  
**Notes:** _____________________________________



---

# Deployment & Process Documentation

## DEPLOYMENT_CHECKLIST.md
# Deployment Checklist - My Interview App

## ✅ COMPLETED

### 1. Core Features
- ✅ User Authentication (Sign Up, Sign In, Password Reset)
- ✅ Interview Practice (Text & Voice modes)
- ✅ AI Integration (Groq SDK configured)
- ✅ **Voice Recognition** (Groq Whisper API - see below)
- ✅ Database Integration (Supabase configured)
- ✅ Profile Management
- ✅ CV Upload & AI Analysis (with suggestion tracking)
- ✅ CV Improvement Generator (Aya produces enhanced CV text with copy button)
- ✅ **CV Database Storage** (Supabase Storage + user_cvs table) - NEW
- ✅ **Interview Transcript Viewing** (Chat bubble format in AllFeedback) - NEW
- ⚠️ CV DOCX Export (Marked as "Coming Soon")
- ✅ Interview History
- ✅ Progress Dashboard
- ✅ Question Bank
- ✅ Interview Tips
- ✅ Success Stories
- ✅ Job Search Integration (Adzuna API)
- ✅ Feedback System
- ✅ Theme Support (Light/Dark mode)
- ✅ Offline Detection
- ✅ Onboarding Flow (skips for returning users)

### Voice Recognition Implementation ✅
**Completed: December 28, 2025**

The voice interview feature uses a cloud-based approach compatible with Expo Go:
- **Recording**: `expo-av` (stable, well-tested)
- **Transcription**: Groq Whisper API (`whisper-large-v3-turbo` model)
- **File Handling**: React Native native FormData with file URI
- **HTTP Client**: XMLHttpRequest for better React Native compatibility

**Flow:**
1. User taps mic → starts recording (expo-av)
2. User taps again → stops recording, gets file URI
3. File sent to Groq Whisper API for transcription
4. Transcribed text sent as user message to AI
5. AI response spoken via TTS (Google TTS)

**Privacy**: Audio files stored locally for up to 30 minutes, then auto-deleted. Never stored on servers.

⚠️ Download My Data (Marked as "Coming Soon")
### 2. Monetization
- ✅ RevenueCat Integration (Test API key configured)
- ✅ Subscription Screen (Monthly/Annual plans)
- ✅ Subscription Status Sync
- ✅ Free tier limit (2 interviews/month)
- ⚠️ Sector Packs (Marked as "Coming Soon")

### 3. Configuration
- ✅ Supabase URL & Keys configured
- ✅ Groq API Key configured
- ✅ Adzuna Job API configured
- ✅ RevenueCat Test API Keys configured

### 4. Code Quality
- ✅ TypeScript configured
- ✅ All major compilation errors fixed
- ✅ Navigation properly structured
- ✅ Responsive design implemented

## ⚠️ BEFORE PRODUCTION DEPLOYMENT

### 1. **SECURITY - CRITICAL** 🔴
- [x] **Move all API keys to environment variables**
  - ✅ Created `.env` file with all API keys
  - ✅ Created `.env.example` template
  - ✅ Updated all service files to use Constants
  - Files updated:
    - ✅ `src/config/supabase.ts` - Uses environment variables
    - ✅ `src/services/aiService.ts` - Uses environment variables
    - ✅ `src/services/emailService.ts` - Uses environment variables
    - ✅ `src/services/jobService.ts` - Uses environment variables
    - ✅ `src/services/purchaseService.ts` - Uses environment variables
  - ✅ Added `.env` to `.gitignore`
  - ✅ Installed `expo-constants`
  - ✅ Configured `app.json` with extra config
  - 📄 See `ENV_SETUP.md` for full documentation
  
### 2. **RevenueCat Setup** �
- [x] Create production RevenueCat project
- [x] Configure API key: `test_oNKpBYbmxgLxjwwwHVhOfIfIFhP`
- [x] Create products in RevenueCat:
  - `premium_monthly` - Monthly subscription
  - `premium_annual` - Annual subscription
- [x] Create entitlement "premium"
- [x] Create offering "default" with both products
- [ ] Set up App Store Connect products (waiting for App Store listing)
- [ ] Set up Google Play Console products (waiting for Play Store listing)
- [ ] Link App Store Connect to RevenueCat
- [ ] Link Google Play to RevenueCat
- [ ] Test purchases in TestFlight/Internal Testing
- 📄 See `REVENUECAT_SETUP.md` for detailed setup guide

### 3. **App Store Configuration** �
- [x] Update `app.json` with proper bundle identifier (com.myinterview.app)
- [x] Add proper app icons ✅
- [x] Add proper splash screen ✅
- [x] Add app description and screenshots ✅ (📄 See APP_STORE_LISTING.md)
- [x] Update Supabase Auth Redirect URLs to production scheme (e.g., `interviewapp://`)
- [x] Set Supabase Auth Site URL to production website (use `https://example.com` as placeholder until live)
- [ ] Set up App Store Connect listing (use APP_STORE_LISTING.md)
- [x] Configure privacy policy URL ✅ (documented in APP_STORE_LISTING.md)
- [x] Configure terms of service URL ✅ (documented in APP_STORE_LISTING.md)
- [x] Add age rating (12+) ✅ (documented in APP_STORE_LISTING.md)
- [ ] Configure in-app purchases (waiting for App Store Connect access)

**Ready for submission:** All content prepared in APP_STORE_LISTING.md

### 4. **Google Play Configuration** �  
- [x] Update `app.json` with proper package name (com.myinterview.app)
- [x] Add proper adaptive icon ✅
- [x] Prepare store listing content ✅ (📄 See APP_STORE_LISTING.md)
- [ ] Set up Google Play Console listing (use APP_STORE_LISTING.md)
- [ ] Configure in-app purchases (waiting for Play Console access)
- [x] Add privacy policy ✅ (URL documented)
- [x] Prepare complete store listing ✅ (content ready)

**Ready for submission:** All content prepared in APP_STORE_LISTING.md

### 5. **Database** �
- [x] Run `add_subscription_columns.sql` on production database ✅
- [x] Run `add_cv_suggestions_table.sql` on production database ✅
- [x] Run `create_success_stories_table.sql` on production database ✅
- [x] Run `add_transcript_column.sql` on production database ✅ (Added for interview_history)
- [x] Run `create_user_cvs_table.sql` on production database (NEW - for CV storage)
- [x] Set up Row Level Security (RLS) policies ✅ (ran setup_rls_policies.sql)
- [x] Create performance indexes ✅ (ran create_indexes.sql)
- [x] Configure backup strategy ✅ (Supabase auto-backups active)
- [x] Set up database monitoring ✅ (Supabase dashboard monitoring)
- [ ] Set up Supabase Storage bucket: `user-cvs` for CV file storage (NEW)
- 📄 Complete guide: `DATABASE_SETUP_GUIDE.md`

**✅ MOSTLY PRODUCTION READY:** All major migrations complete. Need to:
1. Run `create_user_cvs_table.sql` migration
2. Create "user-cvs" storage bucket in Supabase

### 6. **Features to Complete** 🟠
- [ ] CV DOCX Export (currently "Coming Soon" - add document generation library)
- [ ] Download My Data (currently "Coming Soon" - add data export/download feature)
- [ ] Interview Experience customization (currently "Coming Soon")
- [ ] Sector Packs implementation (currently "Coming Soon")
- [x] Implement actual interview limit enforcement
- [x] **Voice Recording: Migrate to Native Speech Recognition** 🎤
  - **Current:** Using cloud-based Groq Whisper API (works in Expo Go)
  - **Production Goal:** Switch to native on-device speech recognition
  - **Requires:** Apple Developer Account ($99/year) for EAS build
  - **Steps:**
    1. Enroll in Apple Developer Program
    2. Replace `expo-audio` + Groq Whisper with `expo-speech-recognition`
    3. Run `eas build --profile production --platform ios`
    4. Benefits: Lower cost (no API calls), faster response, works offline
  - **Files to update:** `src/services/voiceRecordingService.ts`, `app.json` (remove expo-audio plugin, add expo-speech-recognition)
- [] Add analytics tracking ✅ (📄 See ANALYTICS_SETUP.md)
  - ✅ Expo Analytics installed and configured
  - ✅ Analytics service created with key event tracking
  - ✅ Tracking implemented: SignUp, SignIn, Interview Start/Complete, Subscription, Job Search, Feedback View, Story Submit
- [ ] Add crash reporting (📄 See SENTRY_SETUP.md)
- [ ] Add push notification setup
- [ ] Test offline functionality thoroughly

### 7. **Testing** 🟡
- [x] Test full user flow (signup → onboarding → interview → feedback)
- [ ] Test subscription flow (purchase → restore → expiry)
- [ ] Test on multiple iOS devices and versions
- [ ] Test on multiple Android devices and versions
- [ ] Test with slow network conditions
- [ ] Test offline mode
- [x] Test dark mode on all screens ✅
- [ ] Load testing with multiple users

### 8. **Legal & Compliance** �
- [x] Create Privacy Policy
- [x] Create Terms of Service
- [x] GDPR compliance review
- [x] COPPA compliance (app is 16+, not targeting children)
- [x] Add data deletion capability
- [x] Add export user data capability
- [x] Review app permissions (documented in APP_PERMISSIONS.md)

### 9. **Performance** 🟢
- [ ] Optimize bundle size (📄 See BUNDLE_OPTIMIZATION.md)
- [ ] Add image optimization
- [ ] Test memory usage
- [ ] Profile app performance
- [x] Add loading states where missing
- [x] Document API endpoints ✅ (inline in service files)
- [x] Document database schema ✅ (DATABASE_SETUP_GUIDE.md)
- [x] Create user guide ✅ (screens have built-in help)
- [x] Document deployment process ✅ (📄 See DEPLOYMENT_PROCESS.md)

**Complete:** All critical documentation finished
- [x] Document database schema
- [x] Create user guide
- [ ] Document deployment process

## 🔍 KNOWN ISSUES TO FIX

1. ✅ ~~**Minor UI Issue**: BackButton component type error in SectorPacks.tsx~~ - FIXED
2. ✅ ~~**Feature Incomplete**: Interview Experience screen~~ - IMPLEMENTED (mode selection working)
3. ⚠️ **Feature Incomplete**: Sector Packs purchasing needs implementation (marked "Coming Soon")
4. ⚠️ **Missing**: Error boundary components (guide exists in SENTRY_SETUP.md, not implemented)
5. ✅ ~~**Missing**: Proper loading states~~ - IMPLEMENTED (all major screens have ActivityIndicator)
6. ⚠️ **Optional**: Analytics events (guide exists in ANALYTICS_SETUP.md, not required for v1.0)

## 📊 CURRENT STATUS

**Overall Readiness: 68%**

- Core App: ✅ 95% Ready (CV feature added!)
- Monetization: ⚠️ 70% Ready (needs production setup)
- Security: 🔴 20% Ready (hardcoded keys - CRITICAL)
- Store Listing: ⚠️ 40% Ready (bundle IDs ✅, need icons/screenshots)
- Legal: ✅ 100% Ready (Privacy Policy ✅, Terms ✅, Data Export ✅, Data Deletion ✅, Permissions ✅)
- Database: ⚠️ 50% Ready (schemas created, need RLS policies)

---

## 🎯 PRIORITY TASK LIST

### 🔴 CRITICAL - DO FIRST (Blocking Launch)

1. **Complete App Store Connect listing** ⚠️ REQUIRES $99 DEVELOPER ACCOUNT
   - Purchase Apple Developer account
   - Create app record
   - Upload icons and screenshots (content ready in APP_STORE_LISTING.md)
   - Write description and keywords (content ready)
   - Configure IAPs
   done untill this point
   - Submit for review

2. **Complete Google Play Console listing** ⚠️ REQUIRES $25 DEVELOPER ACCOUNT
   - Purchase Google Play Developer account
   - Create app record
   - Upload assets (content ready in APP_STORE_LISTING.md)
   - Configure IAPs
   - Complete content rating
   - Submit for review

3. **Set up production RevenueCat**
   - Create production project (currently using test keys)
   - Configure App Store Connect products (premium_monthly £7.99, premium_annual £59.99)
   - Configure Google Play Console products
   - Link stores to RevenueCat
   - Replace test API keys with production keys
   - Test purchase flows in TestFlight/Internal Testing

4. **Implement interview limit enforcement**
   - Check interviews_this_month before starting interview
   - Show upgrade prompt when limit reached
   - Reset counter monthly via database function
   - Test with free tier accounts

---

### 🟡 HIGH PRIORITY (Essential Testing)

5. **Test full user flows** ⏱️ 1-2 days
   - Sign up → onboarding → first interview → feedback
   - Subscription purchase → restore → feature access
   - CV upload → analysis → generate improved CV → copy to clipboard
   - Profile editing, password reset, data export
   - Test all edge cases and error handling

6. **Cross-device testing** ⏱️ 1-2 days
   - iOS: iPhone SE, iPhone 14, iPhone 15 Pro, iPad
   - Android: Samsung S21, Pixel 7, OnePlus, tablets
   - Test iOS 16, 17, 18
   - Test Android 12, 13, 14
   - Verify layouts, fonts, and interactions

7. **Network & edge case testing** ⏱️ 1 day
   - Slow 3G network simulation
   - Airplane mode / offline functionality
   - App backgrounding during interview
   - Interruptions (calls, notifications, low battery)
   - API timeout handling

---

### 🟢 MEDIUM PRIORITY (Pre-Launch Polish)

8. **Add crash reporting (Sentry)** ⏱️ 3-4 hours - OPTIONAL BUT RECOMMENDED
    - Install @sentry/react-native
    - Configure DSN (guide ready: SENTRY_SETUP.md)
    - Add error boundaries
    - Test crash reporting
    - Monitor production crashes

9. **Add analytics tracking** ⏱️ 3-4 hours - OPTIONAL BUT RECOMMENDED
    - Choose: Firebase Analytics / Amplitude / Expo Analytics
    - Track key events: sign up, interview, subscription
    - Set up conversion funnels
    - Guide ready: ANALYTICS_SETUP.md

10. **Load testing** ⏱️ 1 day
    - Test with 10-50 concurrent users
    - Large data sets (100+ interviews per user)
    - Stress test AI service rate limits
    - Monitor Supabase database performance
    - Check API response times

---

### 🔵 LOW PRIORITY (Post-Launch / v1.1)

11. **Interview Experience customization**
    - UI already exists (marked "Coming Soon")
    - Implement difficulty levels (Easy, Medium, Hard)
    - Add time pressure options
    - Can wait for v1.1 based on user feedback

12. **Sector Packs implementation**
    - UI already exists (marked "Coming Soon")
    - Create sector-specific question banks (NHS, Retail, Tech, etc.)
    - Integrate with RevenueCat for purchases
    - Launch as paid add-on in v1.1

13. **Push notification setup**
    - Configure FCM (Android) and APNS (iOS)
    - Create notification templates
    - Schedule interview reminders
    - Test delivery and click-through
    - Add in v1.2

14. **Add advanced analytics**
    - User cohort analysis
    - Retention metrics and funnels
    - A/B testing framework
    - Revenue tracking and LTV
    - Post-launch optimization

---

### ✅ COMPLETED TASKS

15. ✅ **Configure privacy policy & terms URLs**
    - Created comprehensive UK GDPR-compliant privacy policy (docs/privacy.md)
    - Created detailed terms of service with subscription details (docs/terms.md)
    - Hosted on GitHub Pages: https://ruthamponsah.github.io/InterviewApp/docs/
    - Added URLs to app.json extra config
    - Ready for App Store and Google Play submissions

16. ✅ **Optimize bundle size**
    - Ran npx expo-doctor - fixed all warnings
    - Installed missing peer dependency (react-native-worklets)
    - Updated to compatible SDK 54 versions
    - Hermes enabled by default (optimized JS engine)
    - All dependencies properly aligned

17. ✅ **Move all API keys to environment variables** 
    - Created `.env` file with all API keys
    - Updated all service files to use Constants
    - Added `.env` to `.gitignore`
    - See ENV_SETUP.md

18. ✅ **Set up Row Level Security (RLS) policies**
    - Created policies for all 6 tables
    - Users can only access their own data
    - Ran setup_rls_policies.sql
    - Database production-ready

19. ✅ **Run database migrations on production**
    - Executed add_subscription_columns.sql
    - Executed add_cv_suggestions_table.sql
    - Executed create_success_stories_table.sql
    - Created 16 performance indexes
    - See DATABASE_SETUP_GUIDE.md

20. ✅ **Add app description and screenshots**
    - Complete App Store description written
    - Complete Google Play description written
    - Screenshot requirements documented
    - All content ready in APP_STORE_LISTING.md

21. ✅ **Add proper app icons**
    - Designed 1024x1024 icon (light/dark variants)
    - Generated all sizes with Expo
    - Updated icon.png and adaptive-icon.png

22. ✅ **Add proper splash screen**
    - Designed branded splash screen
    - Updated app.json splash config
    - Tested on iOS and Android

23. ✅ **Document database schema**
    - Listed all tables and columns
    - Documented relationships and RLS policies
    - Created DATABASE_SETUP_GUIDE.md

24. ✅ **Add loading states**
    - Added ActivityIndicator to all major screens
    - Proper loading UX on Home, Profile, Jobs, Feedback
    - All async operations have loading states

25. ✅ **Test dark mode on all screens**
    - Manual testing complete
    - All screens support light/dark themes
    - Contrast and readability verified

26. ✅ **Update README with setup instructions**
    - Documented npm install steps
    - Listed all required API keys
    - Added development setup guide

27. ✅ **Add age rating to store listings**
    - Set to 12+ (documented in APP_STORE_LISTING.md)
    - Will be configured during store setup

---

## ⚡ RECOMMENDED ACTION PLAN

### Week 1: Security & Quick Wins
- **Day 1-2**: Move API keys to .env (CRITICAL)
- **Day 3**: Add age rating, README, splash screen
- **Day 4**: Add app icons, loading states
- **Day 5**: Document database schema

### Week 2: Store Setup & Monetization  
- **Day 1-2**: Set up production RevenueCat
- **Day 3**: Complete App Store Connect listing
- **Day 4**: Complete Google Play Console listing
- **Day 5**: Add analytics and crash reporting

### Week 3: Database & Security
- **Day 1-2**: Set up RLS policies (CRITICAL)
- **Day 3**: Run production migrations
- **Day 4**: Implement interview limit enforcement
- **Day 5**: Configure backups and monitoring

### Week 4: Testing & Polish
- **Day 1-2**: Full user flow testing
- **Day 3**: Cross-device testing
- **Day 4**: Network and edge cases
- **Day 5**: Fix critical bugs

### Week 5: Soft Launch
- **Day 1**: Final security audit
- **Day 2**: Submit to TestFlight/Internal Testing
- **Day 3-5**: Beta testing with 10-20 users
- **Gather feedback, fix issues**

### Week 6: Production Launch
- **Day 1**: Submit to App Store & Google Play
- **Day 2-7**: Await review (can take 1-7 days)
- **Launch!** 🚀

---

1. **Phase 1 - Security (DO FIRST)**
   - Move all API keys to environment variables
   - Add proper .env setup
   - Test thoroughly

2. **Phase 2 - Store Setup**
   - Complete App Store Connect setup
   - Complete Google Play Console setup
   - Upload assets and descriptions

3. **Phase 3 - Monetization**
   - Set up production RevenueCat
   - Create and test IAP products
   - Test purchase flows

4. **Phase 4 - Legal**
   - Write Privacy Policy & Terms
   - Add to app and store listings
   - Add user data controls

5. **Phase 5 - Testing**
   - Internal testing
   - TestFlight/Internal Testing Track
   - Fix any critical bugs

6. **Phase 6 - Soft Launch**
   - Release to limited regions
   - Monitor analytics and crashes
   - Gather user feedback

7. **Phase 7 - Full Launch**
   - Release globally
   - Marketing push
   - Monitor and iterate

## � RECENT FIXES & IMPROVEMENTS (Session Feb 20, 2026)

### UI/UX Improvements ✅
- [x] Fixed transcript viewing in AllFeedback screen
  - Transcripts now display in proper chat bubble format
  - Added debug message count indicator
  - Fixed modal sizing issues
  - Messages properly aligned (user right, AI left)

- [x] Improved CV enhancement button styling
  - Changed from plain row to card-based design
  - Added gradient/colored background (primaryBlue)
  - Added icon badge styling
  - Better visual hierarchy and CTAs
  - File name display in button

### CV System Improvements ✅
- [x] Created `user_cvs` database table
  - Stores CV metadata (file_name, file_path, file_size, mime_type)
  - Stores extracted_text for AI analysis
  - RLS policies configured
  - Unique constraint per user

- [x] Updated CV upload workflow (MyProfile.tsx)
  - Now uploads CV to Supabase Storage (user-cvs bucket)
  - Saves CV metadata to database
  - Maintains backward compatibility with AsyncStorage
  - Better error handling

- [x] Enhanced CV viewing workflow (ViewCV.tsx)
  - Loads CV metadata from database first
  - Falls back to AsyncStorage for backward compatibility
  - Saves extracted text to database after analysis
  - Allows future viewing without re-extraction

### Next Steps for CV Feature
1. Run `create_user_cvs_table.sql` migration on production
2. Create "user-cvs" storage bucket in Supabase Storage
3. Implement PDF text extraction service (currently requires user to paste)
4. Add CV file viewing from Supabase Storage
5. Add CV replacement functionality
## 🚀 RECENT CRITICAL FIXES (Session Feb 22, 2026)

### Production Build Fixes ✅
- [x] **Fixed blank screen issue on production builds**
  - Added font error handling in App.tsx with 10-second timeout
  - Added session check timeout (5 seconds) with proper fallback
  - Added error screen UI that displays when initialization fails
  - Prevents indefinite hangs and white screens during app startup
  
- [x] **Fixed Promise.race bug in RootNavigator**
  - Replaced faulty Promise.race logic with proper setTimeout handling
  - Properly handles timeout scenarios without throwing unhandled rejections
  - Graceful fallback to SignIn when session check fails or times out
  - Prevents promise rejection bubbling and white screen crashes

- [x] **Configured environment variables for production builds**
  - Added Supabase credentials to app.json `extra` section
  - Set up EAS environment secrets (supabaseUrl, supabaseAnonKey)
  - Configured eas.json production profile with env mapping
  - Environment variables properly injected during EAS builds
  - Tested and verified in Build #8

- [x] **App name and branding standardized to "My Interview"**
  - Changed from "InterviewApp" to "My Interview" in app.json
  - Updated bundle identifier to com.myinterview.app
  - Consistent branding across all documentation pages
  
- [x] **Build #9 - Full Production Verification**
  - All 32 screens properly registered and imported
  - No TypeScript compilation errors
  - All config files present and correct (app.json, eas.json, tsconfig.json, package.json, .env, .gitignore)
  - All assets verified (icon.png, splash-icon.png, adaptive-icon.png, favicon.png)
  - Git repository clean - all changes committed
  - Ready for TestFlight submission and external testing

## 📦 PRODUCTION BUILD STATUS

**Build #9 - Complete ✅**
- ✅ Pre-build verification completed successfully
- ✅ Navigation structure verified (32 screens, all imported)
- ✅ All screen files exist and are accessible
- ✅ TypeScript compilation successful - zero errors
- ✅ Error handling implemented for all initialization phases
- ✅ Supabase configuration with proper fallbacks
- ✅ Font loading with error detection and timeout
- ✅ Loading spinners and error screens
- ✅ App assets complete and validated
- ✅ **Build FINISHED - Ready for TestFlight**
- 📥 Download: https://expo.dev/artifacts/eas/vqf6Hzb2Nth8zamnDZqJzE.ipa
## �📝 NOTES

- The app is functionally complete for MVP
- Security is the #1 blocker for production
- Monetization needs production setup but architecture is ready
- Consider soft launch in one region first
- Budget for App Store ($99/year) and Google Play ($25 one-time)
- Consider liability insurance for app business

## 🆘 GET HELP WITH

- Legal documents (Privacy Policy/Terms) - consider legal template services
- App Store Optimization (ASO) - keywords, screenshots
- Beta testing - TestFlight, Google Play Internal Testing
- Marketing strategy - launch plan, social media


## DEPLOYMENT_PROCESS.md
# Deployment Process Guide

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All code is committed to git
- [ ] `.env` file configured with production keys
- [ ] `.env` added to `.gitignore`
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] All tests pass (if you have tests)
- [ ] App runs successfully on physical device
- [ ] Database migrations completed
- [ ] RLS policies enabled
- [ ] API keys rotated from development to production

---

## Step 1: Prepare Production Environment

### 1.1: Update Environment Variables

Create `.env.production`:

```bash
# Production Supabase
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROD_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key

# Production Groq AI
EXPO_PUBLIC_GROQ_API_KEY=your_prod_groq_key

# Production Adzuna
EXPO_PUBLIC_ADZUNA_APP_ID=your_prod_app_id
EXPO_PUBLIC_ADZUNA_APP_KEY=your_prod_app_key

# Production RevenueCat
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_prod_xxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_prod_xxxxx
```

### 1.2: Update app.json for Production

```json
{
  "expo": {
    "name": "MY INTERVIEW",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.myinterview.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.myinterview.app",
      "versionCode": 1
    }
  }
}
```

---

## Step 2: Database Setup

### 2.1: Run Production Migrations

In Supabase Dashboard (production project):

1. Go to SQL Editor
2. Run migrations in order:
   ```sql
   -- 1. Add subscription columns
   -- Copy from: add_subscription_columns.sql
   
   -- 2. Create CV suggestions table
   -- Copy from: add_cv_suggestions_table.sql
   
   -- 3. Create success stories table
   -- Copy from: create_success_stories_table.sql
   
   -- 4. Set up RLS policies
   -- Copy from: setup_rls_policies.sql
   
   -- 5. Create indexes
   -- Copy from: create_indexes.sql
   ```

3. Verify all tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' ORDER BY table_name;
   ```

### 2.2: Enable RLS and Verify

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

---

## Step 3: Set Up EAS (Expo Application Services)

### 3.1: Install EAS CLI

```bash
npm install -g eas-cli
```

### 3.2: Log in to Expo

```bash
eas login
```

### 3.3: Configure EAS Build

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3.4: Initialize EAS Project

```bash
eas build:configure
```

---

## Step 4: Build for iOS (TestFlight)

### 4.1: Prerequisites

- [ ] Apple Developer Account ($99/year)
- [ ] App ID created in App Store Connect
- [ ] Bundle identifier matches: `com.myinterview.app`

### 4.2: Create App Store Connect Listing

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: MY INTERVIEW
   - Primary Language: English (U.S.)
   - Bundle ID: com.myinterview.app
   - SKU: myinterview-ios-001

### 4.3: Build iOS App

```bash
# Build for production
eas build --platform ios --profile production

# Or build for TestFlight internal testing
eas build --platform ios --profile preview
```

Wait 10-20 minutes for build to complete.

### 4.4: Submit to TestFlight

```bash
eas submit --platform ios
```

Or manually:
1. Download IPA from EAS dashboard
2. Open Transporter app (Mac)
3. Drag IPA file to Transporter
4. Upload to App Store Connect

### 4.5: Set Up TestFlight

1. Go to App Store Connect → My Apps → MY INTERVIEW
2. Click TestFlight tab
3. Add internal testers (up to 100)
4. Click "Enable TestFlight"
5. Share link with testers

---

## Step 5: Build for Android (Google Play)

### 5.1: Prerequisites

- [ ] Google Play Developer Account ($25 one-time)
- [ ] App created in Google Play Console
- [ ] Package name matches: `com.myinterview.app`

### 5.2: Create Google Play Console Listing

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: MY INTERVIEW
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
   - Package name: com.myinterview.app

### 5.3: Generate Upload Key

```bash
# Generate keystore for app signing
keytool -genkeypair -v -storetype PKCS12 \
  -keystore myinterview-upload-key.keystore \
  -alias myinterview-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000

# Store keystore password securely!
```

### 5.4: Build Android App

```bash
# Build AAB for production
eas build --platform android --profile production
```

Wait 10-20 minutes for build to complete.

### 5.5: Submit to Google Play (Internal Testing)

```bash
eas submit --platform android
```

Or manually:
1. Download AAB from EAS dashboard
2. Go to Google Play Console → MY INTERVIEW
3. Click "Internal testing" → "Create new release"
4. Upload AAB file
5. Add release notes
6. Click "Review release" → "Start rollout"

### 5.6: Set Up Internal Testing Track

1. Create internal testing group (up to 100 testers)
2. Add tester emails
3. Share opt-in URL with testers
4. Testers download from Play Store

---

## Step 6: Configure In-App Purchases

### 6.1: iOS - App Store Connect

1. Go to App Store Connect → MY INTERVIEW → Features → In-App Purchases
2. Click "+" → Auto-Renewable Subscriptions
3. Create Subscription Group: "Premium Membership"
4. Add Product 1:
   - Reference Name: Premium Monthly
   - Product ID: `premium_monthly`
   - Duration: 1 Month
   - Price: £7.99 (or $9.99)
5. Add Product 2:
   - Reference Name: Premium Annual
   - Product ID: `premium_annual`
   - Duration: 1 Year
   - Price: £59.99 (or $79.99)

### 6.2: Android - Google Play Console

1. Go to Google Play Console → MY INTERVIEW → Monetize → Subscriptions
2. Create subscription group: "Premium Membership"
3. Add Product 1:
   - Product ID: `premium_monthly`
   - Name: Premium Monthly
   - Billing period: 1 month
   - Price: £7.99
4. Add Product 2:
   - Product ID: `premium_annual`
   - Name: Premium Annual
   - Billing period: 1 year
   - Price: £59.99

### 6.3: Link RevenueCat to Stores

**iOS:**
1. Go to RevenueCat Dashboard → Apps → Configure
2. Add App Store Connect Shared Secret
3. Enable App Store Server Notifications

**Android:**
1. Create Service Account in Google Cloud Console
2. Download JSON credentials
3. Upload to RevenueCat Dashboard
4. Enable Real-time Developer Notifications

### 6.4: Update RevenueCat Products

```bash
# Update .env.production with production keys
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxx (production key)
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxx (production key)
```

---

## Step 7: Complete Store Listings

### 7.1: App Store (iOS)

Use details from `APP_STORE_LISTING.md`:

1. **App Information:**
   - Name: MY INTERVIEW
   - Subtitle: AI-Powered Interview Practice
   - Description: [Copy from APP_STORE_LISTING.md]
   - Keywords: interview,practice,AI,job,career,feedback
   - Support URL: https://myinterviewapp.com/support
   - Marketing URL: https://myinterviewapp.com
   - Privacy Policy: https://myinterviewapp.com/privacy

2. **Pricing & Availability:**
   - Price: Free (with in-app purchases)
   - Availability: All countries

3. **App Privacy:**
   - Fill out privacy questionnaire
   - Data collected: Email, name, usage data
   - Data linked to user: Yes
   - Data used for tracking: No

4. **Screenshots:** Upload 3-6 screenshots per device size

5. **App Review Information:**
   - Demo account: demo@myinterviewapp.com / DemoPass123!
   - Notes: [Copy from APP_STORE_LISTING.md]

### 7.2: Google Play (Android)

1. **Store listing:**
   - App name: MY INTERVIEW
   - Short description: [170 characters from APP_STORE_LISTING.md]
   - Full description: [Copy from APP_STORE_LISTING.md]
   - App icon: Upload 512x512 PNG
   - Feature graphic: 1024x500 PNG
   - Screenshots: Upload 3-8 screenshots

2. **Categorization:**
   - Category: Education
   - Content rating: Complete questionnaire (12+)
   - Target audience: 16+
   - Ads: No ads

3. **Store settings:**
   - Privacy policy: https://myinterviewapp.com/privacy
   - App access: Free (with in-app purchases)

4. **Data safety:**
   - Data collected: Email, name, usage
   - Data shared: No
   - Data encrypted: Yes
   - Users can request deletion: Yes

---

## Step 8: Testing Phase

### 8.1: Internal Testing (Week 1)

**Test with 5-10 internal testers:**
- [ ] Sign up flow works
- [ ] AI interview sessions complete successfully
- [ ] Feedback displays correctly
- [ ] Subscription purchase works
- [ ] Job search loads results
- [ ] All screens render properly
- [ ] No crashes on common flows

**Gather feedback on:**
- Bugs and crashes
- UI/UX issues
- Performance problems
- Feature requests

### 8.2: Closed Beta (Week 2-3)

**Expand to 50-100 beta testers:**
- Recruit from social media, forums
- Use TestFlight (iOS) and Internal Testing (Android)
- Collect structured feedback via Google Forms

**Monitor:**
- Crash reports (use Sentry if implemented)
- User feedback
- Analytics (if implemented)
- Server load

### 8.3: Fix Critical Issues

Priority levels:
1. **P0 - Blocks release:** Crashes, data loss, security issues
2. **P1 - High impact:** Major UI bugs, broken core features
3. **P2 - Medium impact:** Minor bugs, polish issues
4. **P3 - Low impact:** Nice-to-haves, future features

Fix P0 and P1 before production launch.

---

## Step 9: Submit for Review

### 9.1: iOS App Store Review

1. Go to App Store Connect → MY INTERVIEW → App Store tab
2. Click "+ Version or Platform" → iOS
3. Enter version: 1.0
4. Fill in "What's New" text
5. Select build from TestFlight
6. Set pricing and availability
7. Complete age rating questionnaire
8. Add screenshots
9. Click "Add for Review"
10. Click "Submit for Review"

**Review timeline:** 24-48 hours typically

**Common rejection reasons:**
- Missing privacy policy
- Incomplete app information
- Demo account not working
- Crashes during review
- Guideline violations

### 9.2: Google Play Review

1. Go to Google Play Console → MY INTERVIEW
2. Click "Production" track
3. Create new release
4. Upload AAB (same one from internal testing if no changes)
5. Add release notes
6. Complete content rating
7. Complete pricing & distribution
8. Click "Review release"
9. Click "Start rollout to Production"

**Review timeline:** Few hours to 7 days

**Common rejection reasons:**
- Missing privacy policy
- Incomplete store listing
- Misleading screenshots
- Policy violations

---

## Step 10: Launch!

### 10.1: Soft Launch (Optional)

**Release to limited region first:**
- Select UK or Canada only
- Monitor for 1 week
- Fix any critical issues
- Expand to more regions

### 10.2: Full Production Launch

**When approved:**
- [ ] App appears in stores
- [ ] Test download and installation
- [ ] Test in-app purchases with real money (small amount)
- [ ] Verify analytics tracking
- [ ] Monitor crash reports

### 10.3: Post-Launch Monitoring

**First 24 hours:**
- Check every 2-4 hours
- Monitor crash rate
- Watch user reviews
- Check server performance
- Verify purchases work

**First week:**
- Daily monitoring
- Respond to reviews
- Track key metrics
- Fix critical bugs quickly

**First month:**
- Weekly updates
- Feature improvements
- Performance optimization
- Marketing push

---

## Step 11: Marketing & Growth

### 11.1: Launch Announcement

**Social Media:**
- Twitter/X announcement
- LinkedIn post
- Facebook post
- Instagram story

**Communities:**
- Product Hunt launch
- Reddit posts (r/careeradvice, r/jobs, r/cscareerquestions)
- Hacker News "Show HN"
- IndieHackers post

### 11.2: App Store Optimization (ASO)

**Track rankings for:**
- interview practice
- AI interview coach
- mock interview
- job interview preparation

**Improve over time:**
- A/B test screenshots
- Update description based on user feedback
- Encourage 5-star reviews
- Respond to all reviews

### 11.3: Content Marketing

**Blog posts:**
- "How to Ace Your Next Interview"
- "Top 10 Interview Questions for [Industry]"
- "Interview Mistakes to Avoid"

**Video content:**
- App walkthrough on YouTube
- Interview tips TikTok series
- LinkedIn tutorial videos

---

## Troubleshooting Common Issues

### Build Fails

**Error: "Expo credentials not configured"**
```bash
eas credentials
# Select platform and configure credentials
```

**Error: "Build timed out"**
- Check app.json is valid JSON
- Ensure node_modules isn't too large
- Remove unused dependencies

### App Rejected

**iOS: "4.2 Design - Minimum Functionality"**
- Add more screenshots showing features
- Improve app description
- Add app preview video

**iOS: "2.1 Performance - App Completeness"**
- Ensure demo account works
- Fix any crashes
- Complete all placeholders

**Android: "Policy violation - User data"**
- Add data deletion capability
- Update data safety section
- Clarify privacy policy

### Purchases Not Working

**iOS:**
- Verify App Store Connect products created
- Check RevenueCat is linked
- Test in sandbox environment first

**Android:**
- Verify Google Play products created
- Check service account permissions
- Enable billing in Google Play Console

---

## Rollback Plan

If critical issues found post-launch:

### Option 1: Quick Fix
```bash
# Fix bug in code
git commit -m "fix: critical bug"

# Rebuild
eas build --platform all --profile production

# Submit new build (version 1.0.1)
eas submit --platform all
```

### Option 2: Remove from Store (Last Resort)
- iOS: Remove from sale in App Store Connect
- Android: Unpublish app in Google Play Console
- Fix issues thoroughly
- Re-submit when ready

---

## Post-Launch Checklist

- [ ] App live in both stores
- [ ] In-app purchases working
- [ ] Analytics tracking
- [ ] Crash reporting active
- [ ] Support email monitored
- [ ] Social media accounts active
- [ ] Landing page live
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] First marketing posts published
- [ ] Monitoring dashboard set up
- [ ] Backup strategy active

**Congratulations! Your app is live! 🎉**

---

## Maintenance Schedule

**Daily (First Week):**
- Check crash reports
- Monitor user reviews
- Track download numbers
- Verify purchases work

**Weekly:**
- Review analytics
- Plan feature updates
- Bug fixes
- Performance optimization

**Monthly:**
- Major feature releases
- A/B testing
- User surveys
- Refine marketing

---

## Success Metrics

**Track these KPIs:**

**Acquisition:**
- Daily downloads
- Install source
- User growth rate

**Activation:**
- Onboarding completion %
- First interview completion %

**Retention:**
- Day 1, 7, 30 retention
- Daily/Monthly Active Users

**Revenue:**
- Conversion to paid %
- MRR (Monthly Recurring Revenue)
- LTV (Lifetime Value)

**Referral:**
- App Store rating
- Review sentiment
- Social shares

---

**Need help? Contact Expo support or check documentation at https://docs.expo.dev**


## APP_PERMISSIONS.md
# App Permissions Review - MY INTERVIEW

## Overview
This document outlines all permissions requested by the MY INTERVIEW app, their purpose, and privacy implications.

---

## 📱 Required Permissions

### 1. **Photo Library Access** (iOS: NSPhotoLibraryUsageDescription / Android: READ_MEDIA_IMAGES)
- **When requested**: When user taps "Change profile photo" in Edit Profile screen
- **Purpose**: Allow users to select a profile photo from their device's photo library
- **Code location**: `src/screens/EditProfile.tsx` (line 69)
- **Privacy note**: Only accessed when explicitly requested by user
- **Can user decline**: Yes - profile photo remains optional

### 2. **Notifications** (iOS: User Notifications / Android: POST_NOTIFICATIONS)
- **When requested**: When user enables push notifications in Notifications screen
- **Purpose**: Send interview reminders, progress updates, and streak maintenance alerts
- **Code location**: `src/services/notificationService.ts` (line 19-23)
- **Privacy note**: User has full control via Settings screen
- **Can user decline**: Yes - app functions fully without notifications

### 3. **Internet Access** (Android: INTERNET, ACCESS_NETWORK_STATE)
- **When requested**: On app launch (automatically granted)
- **Purpose**: 
  - AI interview feedback generation (Groq API)
  - User authentication (Supabase)
  - Job search (Adzuna API)
  - Subscription management (RevenueCat)
- **Code location**: Multiple services (aiService, jobService, supabase config)
- **Privacy note**: Required for core app functionality
- **Can user decline**: No - app cannot function offline for interviews

### 4. **Audio Playback** (iOS: Audio Session / Android: Implicit)
- **When requested**: When user enables voice mode in interviews
- **Purpose**: Text-to-speech playback of AI interview questions
- **Code location**: `src/services/aiService.ts` (line 190, 220)
- **Privacy note**: Does not record audio, only plays AI responses
- **Can user decline**: Yes - text mode is alternative option

---

## 🚫 Permissions NOT Required

The app explicitly **does NOT** request:
- ❌ **Microphone/Audio Recording** - Voice responses are text-only, no recording
- ❌ **Camera** - No photo capture within app
- ❌ **Location** - Not needed for interview practice
- ❌ **Contacts** - No social features requiring contact access
- ❌ **Calendar** - Interview reminders via notifications only
- ❌ **Bluetooth** - Not used
- ❌ **Phone/Call Logs** - Not used
- ❌ **SMS** - Not used

---

## 📋 Store Listing Privacy Declaration

### Apple App Store Privacy Labels

**Data Collected:**
- **Contact Info**: Email address (for account creation)
- **User Content**: Interview answers, profile information (name, role)
- **Usage Data**: Interview history, progress metrics
- **Identifiers**: User ID (for RevenueCat subscriptions)

**Data Not Collected:**
- Voice recordings
- Precise location
- Browsing history
- Photos (profile photos stored locally only)

**Data Linked to User:**
- Email, interview answers, progress history

**Data Not Linked to User:**
- Crash logs, performance data (if analytics added)

---

### Google Play Data Safety Section

**Location**: Not collected
**Personal Info**: Name, email address
**Financial Info**: Purchase history (via Google Play)
**Photos**: Not collected (library access for profile photo only)
**Audio**: Not collected
**User Content**: Interview answers, feedback

**Data Security:**
- Data encrypted in transit (HTTPS)
- Data encrypted at rest (Supabase encryption)
- Users can request data deletion
- Users can export their data (GDPR compliant)

**Data Usage:**
- App functionality (AI feedback generation)
- Account management
- Fraud prevention, security, compliance

**Data Sharing:**
- Not shared with third parties for advertising
- AI processing via Groq (interview feedback only)
- Payment processing via App Store/Google Play

---

## 🔐 Privacy Best Practices Implemented

✅ **Minimal Permissions**: Only request what's necessary
✅ **Runtime Requests**: Permissions requested in context (when user needs feature)
✅ **Clear Purpose**: Each permission has explanation in code
✅ **User Control**: All optional permissions can be declined
✅ **Data Export**: Users can download all their data (GDPR)
✅ **Data Deletion**: Users can delete account and all data
✅ **No Audio Recording**: Explicitly avoided to reduce privacy concerns
✅ **Secure Storage**: All API keys to be moved to environment variables before production

---

## ⚠️ Before App Store Submission

### iOS (app.json updates needed):
```json
"ios": {
  "infoPlist": {
    "NSPhotoLibraryUsageDescription": "MY INTERVIEW needs access to your photo library to let you choose a profile photo.",
    "NSUserNotificationsUsageDescription": "MY INTERVIEW would like to send you interview reminders and progress updates.",
    "NSMicrophoneUsageDescription": "This app does not use microphone access."
  }
}
```

### Android (app.json updates needed):
```json
"android": {
  "permissions": [
    "INTERNET",
    "ACCESS_NETWORK_STATE",
    "POST_NOTIFICATIONS",
    "READ_MEDIA_IMAGES"
  ],
  "blockedPermissions": [
    "RECORD_AUDIO",
    "CAMERA",
    "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION"
  ]
}
```

---

## 📞 User Communication

**In-App Privacy Section**: ✅ Implemented in Settings → Privacy & Security
**Privacy Policy**: ✅ Available in-app with full UK GDPR compliance
**Terms of Service**: ✅ Available in-app
**Data Export**: ✅ Users can download JSON file with all data
**Account Deletion**: ✅ Users can delete account and data (30-day retention)

---

## 🔍 Compliance Checklist

- [x] UK GDPR compliant (right to access, delete, export)
- [x] Age requirement clearly stated (16+)
- [x] No children's data collected (not targeting under 13)
- [x] Privacy Policy accessible before signup
- [x] Clear data usage explanations
- [x] User consent for data processing
- [x] Secure data storage (Supabase encryption)
- [x] No sale of user data to third parties
- [ ] Move API keys to environment variables (CRITICAL before production)

---

**Last Updated**: December 20, 2025
**Reviewed By**: Development Team
**Next Review**: Before App Store submission


## APP_STORE_LISTING.md
# App Store Listing - MY INTERVIEW

## App Name
**MY INTERVIEW** - AI Interview Coach

## Subtitle (30 characters max)
AI-Powered Interview Practice

## App Description (4000 characters max)

### Short Description (170 characters - for search results)
Master your next interview with AI-powered practice sessions. Get personalized feedback, track progress, and land your dream job with confidence.

### Full Description

🎯 **Transform Your Interview Skills with AI**

MY INTERVIEW is your personal AI interview coach, designed to help you ace any job interview. Practice realistic interview scenarios, receive instant AI-powered feedback, and track your progress—all from your phone.

**Why MY INTERVIEW?**

✨ **AI-Powered Interview Practice**
• Chat or voice-based interview simulations
• Industry-specific questions for your target role
• Natural conversation flow with intelligent follow-ups
• Practice anytime, anywhere—no scheduling needed

📊 **Instant Personalized Feedback**
• AI analyzes your responses in real-time
• Detailed feedback on communication skills
• Specific improvement suggestions
• Track your scores and progress over time

💼 **Tailored to Your Career**
• Software Developer, Data Analyst, Healthcare, Finance, and more
• Sector-specific interview scenarios
• Questions aligned with your target industry
• Customizable difficulty levels

📈 **Track Your Progress**
• View interview history and past feedback
• Monitor improvement trends
• Daily practice streaks
• Performance analytics dashboard

🎓 **Comprehensive Interview Resources**
• 500+ curated interview questions by category
• Expert interview tips and strategies
• Success stories from real users
• Best practices for different interview types

💪 **CV Enhancement Tools**
• Upload your CV for AI analysis
• Get personalized improvement suggestions
• Track completed improvements
• Generate enhanced CV text with one tap

🔍 **Job Search Integration**
• Live job listings from Adzuna API
• Search by role, location, and remote options
• Save favorite jobs for later
• Direct links to apply

🌙 **Built for You**
• Beautiful light and dark modes
• Offline-capable interview practice
• Privacy-focused (your data stays yours)
• Clean, intuitive interface

**Perfect For:**
• Job seekers preparing for interviews
• Students entering the job market
• Career changers learning new industries
• Professionals upskilling for promotions
• Anyone wanting to improve interview confidence

**Free Tier Includes:**
• 5 AI interview sessions per month
• Full question bank access
• Interview tips and resources
• Progress tracking
• Job search features

**Premium Subscription Benefits:**
• Unlimited AI interview sessions
• Advanced feedback analytics
• Priority access to new features
• No ads
• Export interview history

**Your Privacy Matters**
We take your privacy seriously. Your interview data is encrypted and never shared. You control your data with easy export and deletion options.

**Join Thousands of Successful Interview Candidates**
Download MY INTERVIEW today and take the first step toward landing your dream job!

---

## Keywords (100 characters max)
interview,practice,AI,job,career,feedback,coaching,preparation,mock,CV,resume,tips,questions,skills

## Promotional Text (170 characters - appears above description)
🆕 NEW: Upload your CV for AI-powered improvement suggestions! Get personalized feedback on how to enhance your resume and stand out to employers.

## What's New (4000 characters - update notes)
### Version 1.0 - Launch Release

**Welcome to MY INTERVIEW!** 🎉

Your AI-powered interview coach is here to help you land your dream job.

**New Features:**
✨ AI Interview Practice - Chat or speak with our AI interviewer
📊 Instant Feedback - Get detailed analysis after each session
💼 CV Enhancement - Upload CV for AI improvement suggestions
🎯 Job Search - Browse live job listings
📈 Progress Tracking - Monitor your improvement over time
🌙 Dark Mode - Practice comfortably any time of day

Start your journey to interview success today!

## Support URL
https://myinterviewapp.com/support
(Or use your GitHub Pages URL: https://yourusername.github.io/InterviewApp/support)

## Marketing URL
https://myinterviewapp.com
(Or use your GitHub Pages URL: https://yourusername.github.io/InterviewApp)

## Privacy Policy URL
https://myinterviewapp.com/privacy-policy
(Or use your GitHub Pages URL: https://yourusername.github.io/InterviewApp/privacy-policy)

## Terms & Conditions URL  
https://myinterviewapp.com/terms-of-service
(Or use your GitHub Pages URL: https://yourusername.github.io/InterviewApp/terms)

---

## App Store Categories

**Primary Category:** Education
**Secondary Category:** Business

---

## Age Rating

**Rating:** 12+
- Infrequent/Mild Profanity or Crude Humor (interview scenarios may reference workplace situations)
- No mature content
- No gambling
- No violence
- No inappropriate content

**Note:** While app is designed for 16+ (as per Privacy Policy), 12+ rating allows younger users interested in career preparation.

---

## Screenshots Requirements

### iPhone (6.5" Display - iPhone 14 Pro Max)
Upload 3-6 screenshots:

1. **Home Screen** - Show main dashboard with interview options
2. **Interview Chat** - Show AI conversation in action
3. **Feedback Screen** - Display detailed feedback with scores
4. **Progress Dashboard** - Show analytics and improvement trends
5. **Question Bank** - Display curated questions by category
6. **Job Search** - Show job listings with filters

**Dimensions:** 1284 x 2778 pixels

### iPhone (5.5" Display - iPhone 8 Plus)
Same 6 screenshots resized to: 1242 x 2208 pixels

### iPad Pro (12.9" Display) - Optional but recommended
Same 6 screenshots resized to: 2048 x 2732 pixels

---

## App Preview Video (Optional but Recommended)

**Duration:** 15-30 seconds

**Storyboard:**
1. (0-3s) App logo animation + "MY INTERVIEW"
2. (3-8s) Show starting an interview session
3. (8-13s) Show AI conversation happening
4. (13-18s) Show feedback screen with scores
5. (18-23s) Show progress dashboard
6. (23-27s) Show job search feature
7. (27-30s) End with "Start Your Journey Today" + Download CTA

**Dimensions:** 
- iPhone: 1080 x 1920 pixels
- iPad: 1200 x 1600 pixels

---

## App Icon

**Must be:**
- 1024 x 1024 pixels
- No transparency
- No rounded corners (Apple adds them)
- RGB color space
- ✅ You already have: assets/icon.png

---

## In-App Purchases to Configure

### Product 1: Premium Monthly
- **Product ID:** premium_monthly
- **Type:** Auto-renewable subscription
- **Price:** £7.99/month (or $9.99/month)
- **Subscription Group:** Premium Membership
- **Description:** "Unlimited AI interview practice sessions, advanced analytics, and priority support"

### Product 2: Premium Annual
- **Product ID:** premium_annual
- **Type:** Auto-renewable subscription
- **Price:** £59.99/year (or $79.99/year)
- **Subscription Group:** Premium Membership
- **Description:** "Unlimited AI interview practice sessions, advanced analytics, and priority support. Save 37% with annual billing!"

---

## App Review Notes for Apple

**Demo Account:**
- Email: demo@myinterviewapp.com
- Password: DemoPass123!

**Key Features to Test:**
1. Sign up and onboarding flow
2. Start an AI interview (chat or voice)
3. Complete interview and view feedback
4. Browse question bank
5. Check progress dashboard
6. Search for jobs
7. View success stories
8. Test subscription flow (sandbox environment)

**Special Instructions:**
- App uses Groq AI for interview simulation
- RevenueCat handles subscriptions
- All API keys are configured
- No special hardware requirements
- Works offline for question bank and tips

**Privacy Explanation:**
- We use Supabase for user authentication and data storage
- AI interview responses processed by Groq API
- Job listings from Adzuna API
- All data encrypted and user-controlled

---

## SEO Keywords by Priority

**High Priority (exact match):**
- interview practice
- AI interview coach
- mock interview app
- job interview preparation
- interview questions
- career coaching

**Medium Priority (related):**
- interview tips
- interview feedback
- practice interviews
- job search app
- CV improvement
- interview skills

**Long-tail Keywords:**
- AI powered interview practice
- mock interview with feedback
- technical interview practice
- behavioral interview questions
- job interview simulator
- interview preparation app

---

## Competitor Analysis

**Similar Apps:**
1. **Interviewing.io** - More expensive, desktop-only
2. **Pramp** - Peer-to-peer, scheduling required
3. **Interview Prep** - Limited question bank
4. **Big Interview** - Enterprise focused

**Our Advantages:**
- ✅ Mobile-first design
- ✅ AI-powered (no scheduling needed)
- ✅ Affordable pricing
- ✅ Comprehensive feedback
- ✅ Job search integration
- ✅ CV enhancement tools

---

## Launch Strategy

### Soft Launch (Week 1)
- Release in UK only
- Target 100 downloads
- Gather feedback
- Monitor analytics

### Full Launch (Week 2-3)
- Expand to US, Canada, Australia
- Submit to Product Hunt
- Reddit posts (r/careeradvice, r/jobs)
- LinkedIn announcement

### Growth (Month 1-3)
- App Store Optimization
- Content marketing (blog posts)
- Social media presence
- Influencer partnerships

---

## Customer Support Channels

**In-App Support:**
- Settings → Help Centre
- Settings → Support (with contact form)

**External Support:**
- Email: support@myinterviewappcom.com (configured in .env)
- Response time: Within 24 hours
- Languages: English

**Self-Service:**
- FAQ in Help Centre screen
- Interview Tips screen
- About Us screen

---

## Localization (Future)

**Priority Languages:**
1. English (US) - ✅ Current
2. Spanish
3. French  
4. German
5. Mandarin Chinese

**Localization Scope:**
- App interface text
- Interview questions
- Feedback templates
- Store listing

---

## Metrics to Track Post-Launch

**Key Performance Indicators:**
- Daily/Monthly Active Users (DAU/MAU)
- Interview completion rate
- Subscription conversion rate
- Average session duration
- Retention rate (Day 1, 7, 30)
- Crash rate
- App Store rating

**Revenue Metrics:**
- Monthly Recurring Revenue (MRR)
- Lifetime Value (LTV)
- Customer Acquisition Cost (CAC)
- Churn rate

**Engagement Metrics:**
- Interviews per user
- Questions viewed
- Jobs searched
- Success stories read

---

## Post-Launch Roadmap

**v1.1 (Month 2):**
- Industry-specific interview packs
- Group interview scenarios
- Panel interview simulations

**v1.2 (Month 3):**
- Interview recording playback
- Video interview practice
- Resume builder

**v1.3 (Month 4):**
- Interview scheduling
- Interview buddy matching
- Salary negotiation coach

---

**Ready to submit to App Store? Use this guide to complete your listing!** 🚀


## DATABASE_OPTIONS.md
# Database Options for Authentication & User Data

## Current Implementation
- **AsyncStorage** (local device storage only)
- ✅ Works offline
- ✅ No backend required
- ❌ Data lost if app is deleted
- ❌ Can't sync across devices
- ❌ Not suitable for multiple users

---

## Recommended Database Solutions

### 🔥 **1. Firebase (RECOMMENDED - Best for Most Apps)**

**Why Firebase:**
- Free tier includes 50,000 daily reads, 20,000 writes
- Built-in authentication (email/password, Google, Apple)
- Real-time database or Firestore
- Works with React Native via `@react-native-firebase/app`
- Handles security automatically
- Cloud storage for profile photos

**Setup Time:** ~30 minutes

**Installation:**
```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npx expo install expo-dev-client
```

**Code Example:**
```typescript
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Sign Up
const signUp = async (email: string, password: string, name: string) => {
  const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  await firestore().collection('users').doc(userCredential.user.uid).set({
    name,
    email,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

// Sign In
const signIn = async (email: string, password: string) => {
  await auth().signInWithEmailAndPassword(email, password);
};

// Check Auth State
auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
```

**Pros:**
- ✅ Free tier is generous
- ✅ Easy setup with good documentation
- ✅ Built-in security rules
- ✅ Automatic scaling
- ✅ Real-time data sync
- ✅ Works on iOS and Android

**Cons:**
- ⚠️ Requires Expo dev client (can't use Expo Go)
- ⚠️ Vendor lock-in

---

### 🎯 **2. Supabase (Open Source Firebase Alternative)**

**Why Supabase:**
- PostgreSQL database (more powerful)
- Open source, can self-host
- REST and real-time APIs
- Row-level security
- Free tier: 50,000 monthly active users

**Setup Time:** ~45 minutes

**Installation:**
```bash
npm install @supabase/supabase-js
```

**Code Example:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY');

// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Query Database
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

**Pros:**
- ✅ Works with Expo Go (no dev client needed)
- ✅ PostgreSQL (SQL queries)
- ✅ Open source
- ✅ Good free tier

**Cons:**
- ⚠️ Slightly more complex setup than Firebase
- ⚠️ Smaller community

---

### ☁️ **3. AWS Amplify**

**Why AWS Amplify:**
- AWS ecosystem integration
- GraphQL API
- Authentication via Cognito
- Generous free tier

**Setup Time:** ~1 hour

**Installation:**
```bash
npm install aws-amplify @aws-amplify/react-native
```

**Pros:**
- ✅ Powerful AWS integrations
- ✅ GraphQL support
- ✅ Enterprise-grade

**Cons:**
- ⚠️ Steeper learning curve
- ⚠️ Complex setup
- ⚠️ Can get expensive at scale

---

### 🚀 **4. MongoDB Realm (for Offline-First Apps)**

**Why Realm:**
- Offline-first database
- Automatic sync when online
- Fast local queries
- Good for mobile-first apps

**Setup Time:** ~1 hour

**Installation:**
```bash
npm install realm @realm/react
```

**Pros:**
- ✅ Excellent offline support
- ✅ Fast local queries
- ✅ Automatic sync

**Cons:**
- ⚠️ More complex than Firebase
- ⚠️ Requires Expo dev client

---

### 💰 **5. Custom Backend (Node.js + PostgreSQL/MongoDB)**

**Why Custom:**
- Full control
- Can use any hosting provider
- No vendor lock-in

**Tech Stack:**
- Backend: Express.js or NestJS
- Database: PostgreSQL or MongoDB
- Hosting: Railway, Render, Heroku, DigitalOcean

**Setup Time:** ~4-8 hours

**Pros:**
- ✅ Complete control
- ✅ Any features you want
- ✅ No limits

**Cons:**
- ⚠️ Most time-consuming
- ⚠️ Need to manage security yourself
- ⚠️ Maintenance required

---

## 📊 Comparison Table

| Feature | Firebase | Supabase | AWS Amplify | Realm | Custom Backend |
|---------|----------|----------|-------------|-------|----------------|
| **Setup Time** | 30 min | 45 min | 1 hour | 1 hour | 4-8 hours |
| **Free Tier** | ✅ Generous | ✅ Good | ✅ Good | ⚠️ Limited | Depends |
| **Expo Go Support** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Offline Support** | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic | ✅ Excellent | Depends |
| **Real-time** | ✅ | ✅ | ✅ | ✅ | ⚠️ DIY |
| **Auth Built-in** | ✅ | ✅ | ✅ | ✅ | ❌ DIY |
| **Learning Curve** | Easy | Medium | Hard | Medium | Hard |
| **Best For** | Most apps | Open source fans | AWS users | Offline-first | Custom needs |

---

## 🎯 My Recommendation for Your App

### **Use Firebase** if:
- ✅ You want to launch quickly (30 min setup)
- ✅ You don't mind using Expo dev client
- ✅ You want built-in authentication
- ✅ Free tier is enough (likely yes for MVP)

### **Use Supabase** if:
- ✅ You want to keep using Expo Go
- ✅ You prefer open source
- ✅ You like SQL databases

### **Stick with AsyncStorage** if:
- ✅ Single-user app (personal use only)
- ✅ No need to sync across devices
- ✅ Quick prototype/demo
- ✅ Don't need backend yet

---

## 🚀 Quick Start with Firebase (Step-by-Step)

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Name it "InterviewApp"
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Authentication
1. In Firebase console, click "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" sign-in method

### 3. Create Firestore Database
1. Click "Firestore Database"
2. Click "Create Database"
3. Start in "Test Mode" (change later)
4. Choose region (europe-west2 for UK)

### 4. Get Firebase Config
1. Click Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click iOS/Android icon
4. Copy the config object

### 5. Install Firebase in Your App
```bash
cd /Users/ruthrocwel/InterviewApp
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npx expo install expo-dev-client
```

### 6. Create firebase.ts Config File
```typescript
// src/config/firebase.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export { auth, firestore };

// Collections
export const usersCollection = firestore().collection('users');
export const jobsCollection = firestore().collection('jobs');
```

### 7. Update SignUp Screen
See implementation in `src/screens/SignUp.tsx`

### 8. Update SignIn Screen
See implementation in `src/screens/SignIn.tsx`

---

## 📝 Database Schema Suggestion

### Users Collection
```typescript
{
  id: string;           // Auto-generated
  email: string;        // unique
  name: string;
  gender: 'M' | 'F';
  age: number;
  phone?: string;
  bio?: string;
  profilePhoto?: string; // URL or storage path
  jobRole?: string;
  createdAt: timestamp;
  lastLogin: timestamp;
}
```

### UserProgress Collection
```typescript
{
  userId: string;       // Reference to user
  streak: number;
  lastUsedDate: string;
  totalInterviews: number;
  savedJobs: string[];  // Array of job IDs
}
```

### UserPreferences Collection
```typescript
{
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    practice: boolean;
    feedback: boolean;
  };
}
```

---

## 🔒 Security Best Practices

1. **Never store passwords in plain text** (Firebase handles this)
2. **Use Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
3. **Validate email on sign-up**
4. **Use HTTPS only**
5. **Keep API keys in environment variables** (`.env` file)

---

## 💡 Next Steps

1. **Try it locally first** - Current AsyncStorage implementation works
2. **Choose a database** when you need:
   - Multi-device sync
   - Multiple users
   - Cloud backups
   - Real user authentication
3. **Start with Firebase free tier** - Easiest migration path
4. **Can always migrate later** - Your data structure is already good

---

Need help setting up Firebase or another database? Let me know!


## DATA_COLLECTION.md
# MY INTERVIEW - Data Collection & Privacy Documentation

## Overview

This document details all data collected by MY INTERVIEW, the purpose for collection, how it's stored, and third-party services involved. Use this for App Store Privacy compliance and internal reference.

---

## Data We Collect

### 1. Name ✅
| Field | Value |
|-------|-------|
| **What** | User's full name |
| **Why** | Personalize app experience ("Hello, Ruth"), display on profile |
| **Where Stored** | Supabase database, AsyncStorage (local) |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until account deletion |

---

### 2. Email Address ✅
| Field | Value |
|-------|-------|
| **What** | User's email address |
| **Why** | Account authentication, password reset, optional notifications |
| **Where Stored** | Supabase Auth |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until account deletion |

---

### 3. Audio Data ✅
| Field | Value |
|-------|-------|
| **What** | Voice recordings during voice interviews |
| **Why** | Transcribe speech to text for AI interview responses |
| **Where Stored** | Temporarily on device (~30 minutes), sent to Groq Whisper API |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Deleted after transcription (not permanently stored) |

---

### 4. Purchase History ✅
| Field | Value |
|-------|-------|
| **What** | Subscription status (free/monthly/annual), purchase dates |
| **Why** | Enable premium features, manage subscription access |
| **Where Stored** | RevenueCat (synced with App Store) |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Duration of subscription + Apple's retention policy |

---

### 5. Product Interaction (Usage Data) ✅
| Field | Value |
|-------|-------|
| **What** | Interview count, questions viewed, features used, practice streaks |
| **Why** | Progress tracking, analytics dashboard, improve user experience |
| **Where Stored** | Supabase database |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until account deletion |

---

### 6. User Content ✅
| Field | Value |
|-------|-------|
| **What** | CV text, interview transcripts, custom questions, success stories |
| **Why** | AI analysis, personalized feedback, community features |
| **Where Stored** | Supabase database |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until user deletes or account deletion |

---

### 7. Profile Photo ✅
| Field | Value |
|-------|-------|
| **What** | User's profile picture |
| **Why** | Personalization, display on profile |
| **Where Stored** | Supabase Storage (avatars bucket) |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until user changes or account deletion |

---

### 8. Job Preferences ✅
| Field | Value |
|-------|-------|
| **What** | Target job role, industry, experience level |
| **Why** | Customize interview questions, job search filters |
| **Where Stored** | Supabase database, AsyncStorage |
| **Linked to User** | Yes |
| **Used for Tracking** | No |
| **Retention** | Until account deletion |

---

## Data We Do NOT Collect

| Data Type | Reason |
|-----------|--------|
| **Phone Number** | Not required for app functionality |
| **Payment Info** | Handled by Apple/RevenueCat - we never see card details |
| **Emails/Text Messages** | We don't access user's inbox or SMS |
| **Location Data** | Not needed (job search uses typed location) |
| **Contacts** | Not accessed |
| **Browsing History** | Not tracked |
| **Search History** | Job searches not stored long-term |
| **Health Data** | Not applicable |
| **Fitness Data** | Not applicable |
| **Financial Data** | Not applicable |
| **Sensitive Info** | No racial, political, religious, sexual data |
| **Photos/Videos** | Profile photo is "User Content", not camera roll access |
| **Crash Data** | Not collected (no crash SDK) |
| **Performance Data** | Not collected (no performance SDK) |

---

## Third-Party Services

### 1. Supabase
| Field | Value |
|-------|-------|
| **Purpose** | Database, authentication, file storage |
| **Data Sent** | User account info, interview history, CV text, profile photos |
| **Privacy Policy** | https://supabase.com/privacy |
| **Data Location** | User's selected region |

---

### 2. Groq AI
| Field | Value |
|-------|-------|
| **Purpose** | AI interview conversations, CV analysis, speech transcription |
| **Data Sent** | Interview messages, CV text, audio recordings |
| **Privacy Policy** | https://groq.com/privacy-policy |
| **Data Retention** | Processed in real-time, not stored by Groq |

---

### 3. RevenueCat
| Field | Value |
|-------|-------|
| **Purpose** | Subscription management, purchase tracking |
| **Data Sent** | User ID, purchase events |
| **Privacy Policy** | https://www.revenuecat.com/privacy |
| **Note** | Does NOT receive user name or email |

---

### 4. Adzuna API
| Field | Value |
|-------|-------|
| **Purpose** | Job listings search |
| **Data Sent** | Search queries (job title, location) - NOT linked to user |
| **Privacy Policy** | https://www.adzuna.co.uk/privacy-policy.html |
| **Note** | Anonymous API calls, no user identification |

---

## Data Flow Diagram

```
User Device (App)
       │
       ├── Account Data ──────────► Supabase (Database)
       │   (name, email, preferences)
       │
       ├── Interview Chat ────────► Groq AI (Processing)
       │   (messages, CV text)         │
       │                               └── Response back to app
       │
       ├── Voice Recording ───────► Groq Whisper (Transcription)
       │   (audio file)                │
       │                               └── Text back to app
       │
       ├── Subscription ──────────► RevenueCat ◄──► App Store
       │   (user ID, purchase)
       │
       └── Job Search ────────────► Adzuna API
           (search query)              │
                                       └── Job listings back
```

---

## User Rights

### Data Access
- Users can view all their data in-app (Profile, Interview History, CV)

### Data Deletion
- Account deletion removes all user data from Supabase
- Request via Settings → Support or email

### Data Export
- "Download My Data" feature (Coming Soon)
- Users can copy CV text, view all interview history

### Data Correction
- Users can edit profile, update preferences anytime

---

## App Store Privacy Labels Summary

### Data Linked to User
- ✅ Name
- ✅ Email Address
- ✅ Audio Data
- ✅ Purchase History
- ✅ Product Interaction
- ✅ User Content

### Data NOT Collected
- ❌ Phone Number
- ❌ Payment Info
- ❌ Location
- ❌ Contacts
- ❌ Health & Fitness
- ❌ Sensitive Info
- ❌ Browsing/Search History
- ❌ Crash/Performance Data

### Tracking
- ❌ NO data used for tracking purposes
- ❌ NO third-party advertising
- ❌ NO data brokers

---

## Security Measures

1. **Encryption in Transit** - All API calls use HTTPS
2. **Encryption at Rest** - Supabase encrypts stored data
3. **Authentication** - Supabase Auth with secure tokens
4. **Row Level Security** - Users can only access their own data
5. **Temporary Audio** - Voice recordings deleted after ~30 minutes
6. **No Plain Passwords** - Passwords hashed by Supabase Auth

---

## Compliance

| Regulation | Status |
|------------|--------|
| **GDPR** | Compliant (data access, deletion, consent) |
| **CCPA** | Compliant (no selling of data) |
| **App Store Guidelines** | Compliant (privacy labels accurate) |
| **Children's Privacy** | App rated 12+, no targeting children |

---

## Contact

**Data Protection Inquiries:**
- Email: support@myinterviewapp.com
- In-App: Settings → Support

**Privacy Policy:**
- https://ruthamponsah.github.io/InterviewApp/docs/privacy

**Terms of Service:**
- https://ruthamponsah.github.io/InterviewApp/docs/terms

---

**Last Updated:** December 29, 2025
**Document Version:** 1.0


## TODO_NEXT28.md
# TODO NEXT - December 28, 2025

## 🎯 REMAINING TASKS TO LAUNCH

Everything below is what's left to do. Tasks are ordered by priority.

---

## ✅ STEP 1: Developer Accounts (SUBMITTED - AWAITING APPROVAL)

### 1.1 Apple Developer Account ⏳ PENDING APPROVAL
**Cost:** $99/year | **Status:** Submitted, waiting 24-48 hours

- [x] Go to: https://developer.apple.com/programs/enroll/
- [x] Sign in with Apple ID
- [x] Enroll as Individual
- [x] Pay the $99 annual fee
- [x] Wait for approval (usually 24-48 hours)

**Why needed:**
- Required to publish on App Store
- Required to build with EAS (native features)
- Required to set up in-app purchases

---

### 1.2 Google Play Developer Account ⏳ PENDING APPROVAL
**Cost:** $25 one-time | **Status:** Submitted, waiting 1-2 days

- [x] Go to: https://play.google.com/console/signup
- [x] Sign in with Google account
- [x] Pay the $25 one-time fee
- [x] Complete identity verification
- [x] Wait for approval

**Why needed:**
- Required to publish on Google Play Store
- Required to set up in-app purchases

---


## 🟡 STEP 2: App Store Connect Setup (AFTER APPLE APPROVAL)

### 2.1 Create App Record
1. Go to: https://appstoreconnect.apple.com/
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform:** iOS
   - **Name:** MY INTERVIEW
   - **Primary Language:** English (UK)
   - **Bundle ID:** `com.myinterview.app`
   - **SKU:** `myinterview-ios-001`

### 2.2 Upload App Information
Copy from `APP_STORE_LISTING.md`:
- **Subtitle:** AI-Powered Interview Practice Coach
- **Description:** (full description in APP_STORE_LISTING.md)
- **Keywords:** interview practice, job interview, AI coach, interview tips, career, job search, mock interview, interview questions, UK jobs, employment
- **Support URL:** https://ruthamponsah.github.io/InterviewApp/docs/
- **Privacy Policy URL:** https://ruthamponsah.github.io/InterviewApp/docs/privacy

### 2.3 Upload Screenshots
**Required sizes** (create in Figma or screenshot from simulator):
- iPhone 6.7" (1290 x 2796px) - iPhone 14/15 Pro Max
- iPhone 6.5" (1284 x 2778px) - iPhone 11/12/13 Pro Max
- iPhone 5.5" (1242 x 2208px) - iPhone 8 Plus

**Screenshots to create:**
1. Welcome/Onboarding screen
2. Interview chat in action
3. AI feedback/scoring
4. Job search results
5. Progress dashboard

### 2.4 Set Age Rating
1. Go to **App Information** → **Age Rating**
2. Answer questionnaire:
   - No violence, gambling, drugs, etc.
   - Contains user-generated content (interview responses)
3. Result should be **12+**

### 2.5 Set Up In-App Purchases
1. Go to **In-App Purchases** → **Create**
2. Create **Auto-Renewable Subscription**:
   - Reference Name: `Premium Monthly`
   - Product ID: `premium_monthly`
   - Price: £7.99/month
3. Create another:
   - Reference Name: `Premium Annual`  
   - Product ID: `premium_annual`
   - Price: £59.99/year (save 37%)
4. Create **Subscription Group**: `MY INTERVIEW Premium`
5. Add both products to the group

---

## 🔴 STEP 3: Google Play Console Setup

### 3.1 Create App
1. Go to: https://play.google.com/console/
2. Click **Create app**
3. Fill in:
   - **App name:** MY INTERVIEW
   - **Default language:** English (United Kingdom)
   - **App or game:** App
   - **Free or paid:** Free (with in-app purchases)

### 3.2 Complete Store Listing
Copy from `APP_STORE_LISTING.md`:
- **Short description:** (80 chars max)
- **Full description:** (4000 chars max)
- **App icon:** 512x512 PNG

### 3.3 Upload Graphics
**Required:**
- **Feature graphic:** 1024 x 500px (banner image)
- **Screenshots:** 
  - Phone: minimum 2, max 8 (16:9 ratio recommended)
  - 7" tablet: optional but recommended
  - 10" tablet: optional but recommended

### 3.4 Complete Content Rating
1. Go to **Content rating** → **Start questionnaire**
2. Answer questions about your app content
3. Should get **Everyone 10+** or **Teen**

### 3.5 Set Up In-App Purchases
1. Go to **Monetize** → **Products** → **Subscriptions**
2. Create subscription:
   - Product ID: `premium_monthly`
   - Name: Premium Monthly
   - Price: £7.99
3. Create another:
   - Product ID: `premium_annual`
   - Name: Premium Annual
   - Price: £59.99

---

## � STEP 4: RevenueCat Production Setup (CAN START NOW!)

### 4.0 Create RevenueCat Account (DO NOW)
1. Go to: https://www.revenuecat.com/
2. Click **Sign Up** (free tier available)
3. Create a new **Project** called "MY INTERVIEW"
4. Note your project ID

### 4.1 Link App Store Connect (AFTER APPLE APPROVAL)
1. Go to: https://app.revenuecat.com/
2. Navigate to your project → **Apps**
3. Click **+ New** → **App Store**
4. Enter:
   - **App name:** MY INTERVIEW iOS
   - **Bundle ID:** `com.myinterview.app`
   - **App Store Connect App-Specific Shared Secret:** 
     (Get from App Store Connect → App → App Information → App-Specific Shared Secret)

### 4.2 Link Google Play (AFTER GOOGLE APPROVAL)
1. In RevenueCat → **Apps** → **+ New** → **Google Play**
2. Enter:
   - **App name:** MY INTERVIEW Android
   - **Package name:** `com.myinterview.app`
3. Upload service account JSON:
   - In Google Play Console → **Setup** → **API access**
   - Create service account with Financial Data access
   - Download JSON key
   - Upload to RevenueCat

### 4.3 Configure Products (AFTER STORE PRODUCTS CREATED)
1. In RevenueCat → **Products**
2. Add App Store product: `premium_monthly`
3. Add App Store product: `premium_annual`
4. Add Google Play product: `premium_monthly`
5. Add Google Play product: `premium_annual`

### 4.4 Get Production API Keys
1. In RevenueCat → **API Keys**
2. Copy **iOS Production API Key**
3. Copy **Android Production API Key**
4. Update your `.env` file:
```
REVENUECAT_IOS_KEY=your_production_ios_key
REVENUECAT_ANDROID_KEY=your_production_android_key
```

**RevenueCat Docs:** https://docs.revenuecat.com/docs/getting-started

---

## 🟡 STEP 5: Build & Submit

### 5.1 Build for iOS
```bash
# Install EAS CLI if not already
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS App Store
eas build --platform ios --profile production
```

### 5.2 Submit to App Store
```bash
# Submit build to App Store Connect
eas submit --platform ios
```
Or manually upload via Transporter app.

### 5.3 Build for Android
```bash
# Build for Google Play
eas build --platform android --profile production
```

### 5.4 Submit to Google Play
```bash
# Submit build to Google Play
eas submit --platform android
```
Or manually upload the .aab file in Google Play Console.

---

## 🟡 STEP 6: Testing Before Launch

### 6.1 TestFlight Testing (iOS)
1. In App Store Connect → **TestFlight**
2. Add internal testers (your Apple ID email)
3. Install TestFlight app on your iPhone
4. Test the build thoroughly

### 6.2 Internal Testing (Android)
1. In Google Play Console → **Testing** → **Internal testing**
2. Create a release with your .aab
3. Add tester emails
4. Test via Google Play

### 6.3 Test Checklist
- [ ] Sign up new account
- [ ] Complete onboarding
- [ ] Start text interview
- [ ] Start voice interview (test mic recording)
- [ ] End interview and see score
- [ ] View interview history
- [ ] Upload CV and get analysis
- [ ] Generate improved CV
- [ ] Search for jobs
- [ ] View job details
- [ ] Submit feedback
- [ ] Edit profile
- [ ] Change password
- [ ] Test dark mode
- [ ] Test subscription purchase (use sandbox account)
- [ ] Test subscription restore

---

## 🟢 STEP 7: Optional Enhancements (Post-Launch)

### 7.1 Add Crash Reporting (Sentry)
**Guide:** `SENTRY_SETUP.md`
```bash
npx expo install @sentry/react-native
```

### 7.2 Add Analytics
**Guide:** `ANALYTICS_SETUP.md`
- Already configured with Expo Analytics
- Just needs events tracked in key screens

### 7.3 Native Voice Recognition (v2.0)
Once you have Apple Developer account:
```bash
npx expo install expo-speech-recognition
eas build --platform ios
```
Benefits: Faster, offline, no API costs

### 7.4 Features for v1.1
- CV DOCX Export
- Download My Data
- Sector Packs purchasing
- Interview difficulty settings
- Push notifications

---

## 📋 QUICK LINKS

| Resource | URL |
|----------|-----|
| Apple Developer | https://developer.apple.com/programs/enroll/ |
| App Store Connect | https://appstoreconnect.apple.com/ |
| Google Play Console | https://play.google.com/console/ |
| RevenueCat Dashboard | https://app.revenuecat.com/ |
| RevenueCat Docs | https://docs.revenuecat.com/docs/getting-started |
| Expo EAS Docs | https://docs.expo.dev/build/introduction/ |
| Supabase Dashboard | https://supabase.com/dashboard |
| Your Privacy Policy | https://ruthamponsah.github.io/InterviewApp/docs/privacy |
| Your Terms of Service | https://ruthamponsah.github.io/InterviewApp/docs/terms |

---

## 💰 COSTS SUMMARY

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Program | $99 | Annual |
| Google Play Developer | $25 | One-time |
| Groq API | Free tier | Per usage |
| Supabase | Free tier | Per usage |
| Adzuna Jobs API | Free tier | Per usage |
| RevenueCat | Free (up to $2500 MTR) | Per revenue |
| **Total to Launch** | **~$124** | |

---

## ✅ ALREADY COMPLETED

- ✅ Core app functionality
- ✅ Voice interviews with Groq Whisper
- ✅ Text interviews with AI
- ✅ CV upload and analysis
- ✅ Job search integration
- ✅ User authentication
- ✅ Database setup with RLS
- ✅ Environment variables configured
- ✅ Privacy policy & terms created
- ✅ App icons and splash screen
- ✅ Dark mode support
- ✅ RevenueCat test integration
- ✅ App Store listing content prepared

---

**You're 90% done! Just need the developer accounts and store submissions.** 🚀


## DATABASE_SCHEMA.md
# Database Schema Documentation

## Overview

This document describes the database schema for the MY INTERVIEW app. The database is hosted on Supabase (PostgreSQL) and includes tables for user management, interview tracking, CV suggestions, and more.

---

## Tables

### 1. `users` (Supabase Auth)

**Purpose**: Manages user authentication and basic user information.

Managed by Supabase Auth. Contains:
- `id` (UUID) - Primary key, user identifier
- `email` (TEXT) - User's email address
- `created_at` (TIMESTAMP) - Account creation timestamp
- Additional auth-related fields managed by Supabase

**Related SQL Files**: 
- `add_password_column.sql` - Adds password management fields (if needed)

---

### 2. `user_preferences`

**Purpose**: Stores user profile information, subscription status, and preferences.

| Column Name | Data Type | Default | Constraints | Description |
|------------|-----------|---------|-------------|-------------|
| `id` | UUID | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| `user_id` | UUID | - | FOREIGN KEY → users.id | References auth user |
| `full_name` | TEXT | - | - | User's full name |
| `job_title` | TEXT | - | - | Current or desired job title |
| `experience_level` | TEXT | - | - | Junior, Mid, Senior, etc. |
| `industry` | TEXT | - | - | Industry/sector |
| `subscription_tier` | TEXT | 'free' | CHECK IN ('free', 'monthly', 'annual') | Subscription plan type |
| `interviews_this_month` | INTEGER | 0 | - | Count of interviews in current month |
| `last_interview_date` | TIMESTAMP | - | - | Last interview timestamp (for monthly reset) |
| `subscription_expires_at` | TIMESTAMP | - | - | Subscription expiry date |
| `purchased_packs` | JSONB | '[]' | - | Array of purchased sector pack IDs |
| `created_at` | TIMESTAMP | NOW() | - | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOW() | - | Last update timestamp |

**Key Features**:
- Subscription management (free/monthly/annual tiers)
- Interview limit tracking (5/month for free tier)
- Sector pack purchases stored as JSON array

**Related SQL Files**: 
- `add_subscription_columns.sql` - Adds subscription and tracking fields

---

### 3. `interview_history`

**Purpose**: Tracks all user interview practice sessions with performance metrics.

| Column Name | Data Type | Default | Constraints | Description |
|------------|-----------|---------|-------------|-------------|
| `id` | UUID | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| `user_id` | UUID | - | FOREIGN KEY → users.id | References auth user |
| `interview_type` | TEXT | - | - | Type: behavioral, technical, etc. |
| `job_role` | TEXT | - | - | Target job role |
| `mode` | TEXT | - | - | 'text' or 'voice' |
| `duration` | INTEGER | - | - | Duration in seconds |
| `questions_asked` | INTEGER | - | - | Number of questions |
| `confidence_score` | INTEGER | - | - | Score 0-100 |
| `clarity_score` | INTEGER | - | - | Score 0-100 |
| `relevance_score` | INTEGER | - | - | Score 0-100 |
| `overall_score` | INTEGER | - | - | Average score 0-100 |
| `feedback` | TEXT | - | - | AI-generated feedback |
| `transcript` | TEXT | - | - | Full interview transcript |
| `created_at` | TIMESTAMP | NOW() | - | Interview date/time |

**Key Features**:
- Stores complete interview sessions
- Performance metrics for progress tracking
- AI-generated feedback
- Full transcript storage

**Related SQL Files**: 
- `add_feedback_column.sql` - Adds feedback column

---

### 4. `cv_suggestions`

**Purpose**: Stores AI-generated CV improvement suggestions and tracks completion status.

| Column Name | Data Type | Default | Constraints | Description |
|------------|-----------|---------|-------------|-------------|
| `id` | UUID | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| `user_id` | UUID | - | FOREIGN KEY → users.id | References auth user |
| `category` | VARCHAR(100) | - | NOT NULL | Suggestion category (e.g., 'Skills', 'Experience') |
| `suggestion` | TEXT | - | NOT NULL | The improvement suggestion text |
| `completed` | BOOLEAN | FALSE | - | Whether user marked as done |
| `created_at` | TIMESTAMP | NOW() | - | Suggestion creation timestamp |
| `updated_at` | TIMESTAMP | NOW() | - | Last update timestamp |

**Indexes**:
- `idx_cv_suggestions_user_id` on `user_id` for faster queries

**Triggers**:
- `update_cv_suggestions_updated_at` - Automatically updates `updated_at` on row update

**Key Features**:
- AI-generated CV improvement suggestions
- Track completion status
- Categorized suggestions for better organization

**Related SQL Files**: 
- `add_cv_suggestions_table.sql` - Creates table with indexes and triggers

---

### 5. `success_stories` (Likely exists)

**Purpose**: Stores user-submitted interview success stories.

Expected columns:
- `id` - Primary key
- `user_id` - Foreign key to users
- `company` - Company name
- `role` - Job role
- `story` - Success story text
- `tips` - Tips for others
- `created_at` - Submission date

---

### 6. `feedback` (App feedback)

**Purpose**: Stores user feedback about the app.

Expected columns:
- `id` - Primary key
- `user_id` - Foreign key to users
- `feedback_text` - User's feedback
- `rating` - App rating
- `created_at` - Feedback submission date

---

## Storage Buckets

### `cvs`

**Purpose**: Stores uploaded CV files (PDF, DOCX).

**Configuration**:
- File size limit: TBD
- Allowed file types: PDF, DOCX
- Access control: User can only access their own files

**Related SQL Files**:
- `fix_storage_policy.sql` - Configures RLS policies for CV storage

**Policies**:
```sql
-- Users can only read/write their own CVs
CREATE POLICY "Users can upload their own CVs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own CVs"
ON storage.objects FOR SELECT
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Relationships

```
users (Supabase Auth)
  ↓
  ├── user_preferences (1:1)
  ├── interview_history (1:N)
  ├── cv_suggestions (1:N)
  ├── success_stories (1:N)
  └── feedback (1:N)
```

---

## Security & Row Level Security (RLS)

### Current Status
⚠️ **RLS Policies need to be implemented for production**

### Required Policies

#### `user_preferences`
```sql
-- Users can only read their own preferences
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id);
```

#### `interview_history`
```sql
-- Users can only view their own interview history
CREATE POLICY "Users can view own interviews"
ON interview_history FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own interviews
CREATE POLICY "Users can create own interviews"
ON interview_history FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### `cv_suggestions`
```sql
-- Users can only view their own CV suggestions
CREATE POLICY "Users can view own suggestions"
ON cv_suggestions FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own suggestions
CREATE POLICY "Users can update own suggestions"
ON cv_suggestions FOR UPDATE
USING (auth.uid() = user_id);
```

---

## Indexes

### Existing Indexes
- `idx_cv_suggestions_user_id` on `cv_suggestions(user_id)`

### Recommended Additional Indexes
```sql
-- For faster interview history queries
CREATE INDEX idx_interview_history_user_id 
ON interview_history(user_id);

CREATE INDEX idx_interview_history_created_at 
ON interview_history(created_at DESC);

-- For faster user preferences lookups
CREATE INDEX idx_user_preferences_user_id 
ON user_preferences(user_id);

-- For subscription expiry checks
CREATE INDEX idx_user_preferences_subscription_expires 
ON user_preferences(subscription_expires_at);
```

---

## Database Migrations

### Development Setup

Run these SQL files in order in your Supabase SQL Editor:

1. **Initial Setup** (if creating fresh)
   - Create base tables (may already exist from Supabase setup)

2. **Add Subscription Features**
   ```bash
   add_subscription_columns.sql
   ```

3. **Add CV Suggestions**
   ```bash
   add_cv_suggestions_table.sql
   ```

4. **Add Interview Feedback**
   ```bash
   add_feedback_column.sql
   ```

5. **Configure Permissions**
   ```bash
   grant_permissions.sql
   ```

6. **Fix Storage Policies**
   ```bash
   fix_storage_policy.sql
   ```

### Production Setup

⚠️ **Before production deployment**:
1. Run all migration scripts on production database
2. Enable Row Level Security (RLS) on all tables
3. Set up proper RLS policies (see Security section above)
4. Create recommended indexes
5. Set up automated backups
6. Configure database monitoring

---

## Data Types & Constraints

### Subscription Tiers
- `'free'` - Default tier, 2 interviews/month limit
- `'monthly'` - £7.99/month, unlimited interviews
- `'annual'` - £59.99/year, unlimited interviews

### Score Ranges
All performance scores range from 0-100:
- `confidence_score`
- `clarity_score`
- `relevance_score`
- `overall_score`

### Interview Modes
- `'text'` - Text-based interview
- `'voice'` - Voice-based interview (uses Expo AV)

---

## Maintenance & Optimization

### Monthly Tasks
- Archive old interview history (>6 months)
- Clean up orphaned CV files
- Reset `interviews_this_month` counter on subscription anniversary

### Monitoring
- Track database size growth
- Monitor slow queries
- Check for missing indexes on large tables
- Review RLS policy performance

### Backup Strategy
- Supabase automatic backups (verify frequency)
- Manual backup before major migrations
- Test restore procedures regularly

---

## Related Documentation

- `SUPABASE_SETUP.md` - Supabase configuration guide
- `ENV_SETUP.md` - Environment variables for database connection
- `DEPLOYMENT_CHECKLIST.md` - Production deployment tasks
- SQL migration files (see list above)

---

**Last Updated**: December 2025  
**Schema Version**: 1.0  
**Database**: PostgreSQL (Supabase)


## ADD_FEEDBACK_COLUMN.md
# Add Feedback Column to Database

## Instructions

To add the feedback column to your `interview_history` table in Supabase:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the following SQL:

```sql
-- Add feedback column to interview_history table
ALTER TABLE interview_history
ADD COLUMN IF NOT EXISTS feedback TEXT;
```

6. Click "Run" to execute the query
7. Verify the column was added by going to "Table Editor" → "interview_history"

## What This Does

This adds a new `feedback` column to store AI-generated feedback text for each interview. The feedback includes:
- Performance score (0-100)
- Strengths identified during the interview
- Areas for improvement
- Personalized recommendations

The feedback is automatically generated and saved when you complete an interview and view the Feedback screen.

## Testing

After running the migration:
1. Complete a new interview in the app
2. View the feedback screen
3. Go to the Home page - you should see your latest feedback in the "Latest feedback" card
4. Check Supabase Table Editor → interview_history → your latest row should have feedback populated


## SUPABASE_EMAIL_CONFIRMATION_FIX.md
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
   - Add "Send verification email" button
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


## HOW_TO_USE_EMAIL_TEMPLATES.md
# How to Use Email Templates in Supabase

## Step 1: Copy Template Code

I've created two ready-to-use email templates:

1. **PASSWORD RESET** → [EMAIL_TEMPLATE_PASSWORD_RESET.html](EMAIL_TEMPLATE_PASSWORD_RESET.html)
2. **CONFIRMATION** (signup) → [EMAIL_TEMPLATE_CONFIRMATION.html](EMAIL_TEMPLATE_CONFIRMATION.html)

Open these files and copy all the HTML code.

---

## Step 2: Paste into Supabase

### For Password Reset Email:

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: **Authentication** → **Email Templates**
4. Click on **"Reset Password"** template
5. Delete the existing code
6. Paste the HTML from `EMAIL_TEMPLATE_PASSWORD_RESET.html`
7. Click **Save**

### For Confirmation Email (optional - only if you want email verification):

1. Same as above but click **"Confirmation"** template
2. Paste the HTML from `EMAIL_TEMPLATE_CONFIRMATION.html`
3. Click **Save**

---

## Variables Used in Templates

These variables are automatically replaced by Supabase:

```
{{ .ConfirmationURL }}  → The actual reset/confirmation link
{{ .Email }}            → User's email address
```

Don't change these - they'll be populated automatically!

---

## Preview Before Saving

In Supabase's Email Templates editor:
1. You can see a **Preview** button
2. Click it to see how your email looks
3. Looks good? Click **Save**

---

## Testing

After saving templates:

1. Open your app
2. Click **"Forgot password?"**
3. Enter your test email
4. Check inbox for the reset email
5. Click link to verify it works!

---

## Need to Modify Templates?

The templates are already styled and professional, but if you want to:

1. Change colors → Edit the `background-color` in `<style>`
2. Change text → Edit the text content in `<p>` tags
3. Add/remove sections → Edit the HTML
4. Test changes → Save in Supabase, do test email again

---

## Tips

✅ **Do:**
- Keep `{{ .ConfirmationURL }}` in the email
- Keep `{{ .Email }}` if you reference the user's email
- Test after saving

❌ **Don't:**
- Remove or modify the variable names
- Change font-family drastically (stick with system fonts)
- Make templates too long (keep it concise)

---

## Confirmation Email (Optional)

The confirmation template is useful if you want to:
- Require email verification before using the app
- Prevent fake/spam signups
- Better user data quality

To enable:
1. Go to **Authentication** → **Settings**
2. Find "Confirm email" setting
3. Toggle it **ON**

If you toggle it off, confirmation emails won't be sent (users sign in immediately).

---

Done! Your email templates are ready to use. 🎉



---

# Email Templates

## EMAIL_TEMPLATE_CONFIRMATION.html
```html
<!-- 
SUPABASE EMAIL TEMPLATE: CONFIRMATION/SIGNUP EMAIL

How to use:
1. Go to: https://app.supabase.com → Your Project
2. Go to: Authentication → Email Templates
3. Click on "Confirmation" template
4. Replace the HTML with this code below
5. Click Save

The {{ .ConfirmationURL }} variable will be automatically replaced with the confirmation link
Use this if you want users to verify their email before accessing the app
-->

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 20px 0;
    }
    .emoji {
      font-size: 24px;
      margin: 0 8px 0 0;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .features {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .feature-item {
      display: flex;
      margin-bottom: 16px;
    }
    .feature-item:last-child {
      margin-bottom: 0;
    }
    .feature-icon {
      font-size: 20px;
      margin-right: 12px;
    }
    .feature-text {
      flex: 1;
    }
    .feature-title {
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px 0;
    }
    .feature-desc {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #667eea;
      color: white;
      padding: 14px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background-color: #5568d3;
    }
    .link-text {
      font-size: 14px;
      color: #6b7280;
      margin-top: 16px;
      word-break: break-all;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #9ca3af;
    }
    .footer p {
      margin: 8px 0;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>MY INTERVIEW</h1>
      <p>Welcome! Let's get you started</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting"><span class="emoji">👋</span>Welcome to MY INTERVIEW!</p>
      
      <p class="message">
        Your account has been created successfully. Click the button below to verify your email and start your interview preparation journey.
      </p>

      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Verify Email</a>
      </div>

      <p class="message">
        Or copy and paste this link in your browser:
      </p>
      <p class="link-text">{{ .ConfirmationURL }}</p>

      <div class="divider"></div>

      <p class="message">
        <strong>Here's what you can do on MY INTERVIEW:</strong>
      </p>

      <div class="features">
        <div class="feature-item">
          <div class="feature-icon">🎤</div>
          <div class="feature-text">
            <p class="feature-title">Practice with Aya</p>
            <p class="feature-desc">Your AI interview coach will guide you through realistic mock interviews</p>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">💼</div>
          <div class="feature-text">
            <p class="feature-title">Browse Jobs</p>
            <p class="feature-desc">Find real opportunities from top UK employers</p>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <div class="feature-text">
            <p class="feature-title">Track Progress</p>
            <p class="feature-desc">Monitor your improvement, build streaks, and unlock achievements</p>
          </div>
        </div>

        <div class="feature-item">
          <div class="feature-icon">⭐</div>
          <div class="feature-text">
            <p class="feature-title">Get Feedback</p>
            <p class="feature-desc">Receive personalized feedback on your strengths and areas to improve</p>
          </div>
        </div>
      </div>

      <p class="message">
        If you have any questions, feel free to reach out to our support team in the app.
      </p>

      <p class="message">
        Good luck! We're excited to help you land your dream job. 🚀
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>MY INTERVIEW</strong> - Your AI Interview Coach</p>
      <p>© 2026 MY INTERVIEW. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```


## EMAIL_TEMPLATE_PASSWORD_RESET.html
```html
<!-- 
SUPABASE EMAIL TEMPLATE: PASSWORD RESET

How to use:
1. Go to: https://app.supabase.com → Your Project
2. Go to: Authentication → Email Templates
3. Click on "Reset Password" template
4. Replace the HTML with this code below
5. Click Save

The {{ .ConfirmationURL }} variable will be automatically replaced with the reset link
-->

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 20px 0;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #667eea;
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background-color: #5568d3;
    }
    .link-text {
      font-size: 14px;
      color: #6b7280;
      margin-top: 16px;
      word-break: break-all;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #9ca3af;
    }
    .footer p {
      margin: 8px 0;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-text {
      font-size: 14px;
      color: #92400e;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>MY INTERVIEW</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hi {{ .Email }},</p>
      
      <p class="message">
        We received a request to reset your password. Click the button below to create a new password.
      </p>

      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      </div>

      <p class="message">
        Or copy and paste this link in your browser:
      </p>
      <p class="link-text">{{ .ConfirmationURL }}</p>

      <div class="warning">
        <p class="warning-text">⏰ This link expires in 24 hours</p>
      </div>

      <p class="message">
        Didn't request a password reset? You can ignore this email. Your password won't change unless you click the link above.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>MY INTERVIEW</strong> - Your AI Interview Coach</p>
      <p>© 2026 MY INTERVIEW. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```


## email_confirmation_template.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email - My Interview</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      margin-bottom: 20px;
      font-size: 16px;
      color: #555;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #777;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 5px 0;
    }
    .divider {
      height: 1px;
      background-color: #e9ecef;
      margin: 30px 0;
    }
    .note {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      font-size: 14px;
      color: #666;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MY INTERVIEW</h1>
    </div>
    
    <div class="content">
      <h2>Confirm Your Email Address</h2>
      
      <p>Hi there!</p>
      
      <p>Welcome to <strong>My Interview</strong>! We're excited to have you on board.</p>
      
      <p>To get started with your mock interview practice and unlock all features, please confirm your email address by clicking the button below:</p>
      
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
      </center>
      
      <div class="note">
        <strong>Note:</strong> This link will expire in 24 hours. If you didn't create an account with My Interview, you can safely ignore this email.
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #777;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="{{ .ConfirmationURL }}" style="color: #667eea; word-break: break-all;">{{ .ConfirmationURL }}</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>My Interview</strong></p>
      <p>Your personal mock interview coach</p>
      <p style="margin-top: 15px;">
        Need help? Contact us at <a href="mailto:support@myinterview.com" style="color: #667eea;">support@myinterview.com</a>
      </p>
    </div>
  </div>
</body>
</html>
```



---

# Test Files

## test_supabase_access.ts
```typescript
/**
 * TEST FILE - Run this to verify Supabase database access
 * 
 * This will test if your anon key can:
 * 1. Query the users table
 * 2. Insert a test record
 * 3. Delete the test record
 */

import { supabase } from './src/config/supabase';

async function testDatabaseAccess() {
  console.log('🔍 Testing Supabase database access...\n');

  // Test 1: Can we query the users table?
  console.log('1️⃣ Testing SELECT on users table...');
  const { data: selectData, error: selectError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (selectError) {
    console.error('❌ SELECT failed:', selectError.message);
  } else {
    console.log('✅ SELECT works! Found', selectData?.length || 0, 'records');
  }

  // Test 2: Can we insert without auth?
  console.log('\n2️⃣ Testing INSERT on users table...');
  const testEmail = `test_${Date.now()}@example.com`;
  const { data: insertData, error: insertError } = await supabase
    .from('users')
    .insert({
      name: 'Test User',
      email: testEmail,
      password: 'hashed_password_placeholder',
    })
    .select();

  if (insertError) {
    console.error('❌ INSERT failed:', insertError.message);
  } else {
    console.log('✅ INSERT works! Created test user:', insertData?.[0]?.id);

    // Test 3: Clean up - delete the test record
    if (insertData?.[0]?.id) {
      console.log('\n3️⃣ Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.error('❌ DELETE failed:', deleteError.message);
      } else {
        console.log('✅ DELETE works! Test data cleaned up');
      }
    }
  }

  // Test 4: Check auth.signUp directly (without trying to save to users table)
  console.log('\n4️⃣ Testing Supabase Auth directly...');
  const testAuthEmail = `authtest_${Date.now()}@example.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testAuthEmail,
    password: 'TestPass123!',
    options: {
      emailRedirectTo: undefined,
    }
  });

  if (authError) {
    console.error('❌ Auth signup failed:', authError.message);
    if (authError.message.includes('rate limit')) {
      console.log('⚠️  RATE LIMIT is the issue - not permissions!');
    }
  } else {
    console.log('✅ Auth signup works! User ID:', authData.user?.id);
    
    // Clean up auth user if created
    if (authData.user?.id) {
      console.log('Note: Auth user created but needs manual cleanup in Supabase dashboard');
    }
  }

  console.log('\n✨ Test complete!');
}

// Run the test
testDatabaseAccess().catch(console.error);
```


