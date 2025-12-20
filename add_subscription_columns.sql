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
