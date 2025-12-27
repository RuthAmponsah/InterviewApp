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
