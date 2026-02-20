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
