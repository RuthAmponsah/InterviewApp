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
