-- Add feedback column to interview_history table
ALTER TABLE interview_history
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Add a comment explaining the column
COMMENT ON COLUMN interview_history.feedback IS 'AI-generated feedback based on interview performance metrics';
