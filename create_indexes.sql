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
