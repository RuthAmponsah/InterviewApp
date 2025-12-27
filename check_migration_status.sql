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
