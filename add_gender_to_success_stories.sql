-- Add gender column to success_stories table
ALTER TABLE success_stories 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'other';

-- Update Sarah Thompson's story with gender
UPDATE success_stories 
SET gender = 'female' 
WHERE user_email = 'sarah.thompson@example.com';
