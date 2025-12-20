-- Add password column to users table
-- Run this in your Supabase SQL Editor

-- Add the password column (nullable at first to not break existing users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add check constraints for password requirements:
-- 1. At least 8 characters long
-- 2. Contains at least one special character
ALTER TABLE users 
ADD CONSTRAINT password_min_length 
CHECK (password IS NULL OR LENGTH(password) >= 8);

ALTER TABLE users 
ADD CONSTRAINT password_has_special_char 
CHECK (password IS NULL OR password ~ '[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;`~]');

-- Optional: If you want to make password required for all new users going forward
-- (Don't run this if you have existing users without passwords)
-- ALTER TABLE users 
-- ALTER COLUMN password SET NOT NULL;

-- View the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';
