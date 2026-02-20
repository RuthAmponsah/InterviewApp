-- Add transcript column to interview_history table
-- Run this in Supabase SQL Editor

ALTER TABLE interview_history
ADD COLUMN IF NOT EXISTS transcript TEXT;

-- The transcript will store the full conversation in JSON format
-- Example: [{"from": "ai", "text": "..."}, {"from": "user", "text": "..."}]

COMMENT ON COLUMN interview_history.transcript IS 'JSON array of interview messages';
