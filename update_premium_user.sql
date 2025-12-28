-- Clean up unused columns from user_progress (we use user_preferences instead)
ALTER TABLE user_progress 
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_end_date;

DROP INDEX IF EXISTS idx_user_progress_subscription;

-- Add subscription tracking columns to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster subscription queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription ON user_preferences(subscription_tier);

-- Make ruth@gmail.com a premium user
UPDATE user_preferences 
SET subscription_tier = 'annual',
    subscription_expires_at = '2026-12-31 23:59:59'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'ruth@gmail.com'
);

-- Verify the update
SELECT 
  u.email,
  up.subscription_tier,
  up.subscription_expires_at,
  up.interviews_this_month
FROM auth.users u
JOIN user_preferences up ON u.id = up.user_id
WHERE u.email = 'ruth@gmail.com';
