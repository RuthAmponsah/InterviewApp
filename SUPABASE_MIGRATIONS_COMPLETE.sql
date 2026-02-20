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
