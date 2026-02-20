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
