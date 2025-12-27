-- Remove password column from users table (OPTIONAL - only run after migrating all users)
-- Passwords are handled by Supabase Auth, no need to store them separately
-- This also fixes the security issue of storing passwords in the database

-- ⚠️ IMPORTANT: Before running this, make sure:
-- 1. All existing users have been migrated to Supabase Auth (auth.users table)
-- 2. The SignIn.tsx has fallback login for legacy accounts (already implemented)
-- 3. You're ready to force all users to use proper Supabase Auth

-- For now, KEEP the password column to support legacy accounts
-- Uncomment the line below when ready to remove it:
-- ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Add comment to table
COMMENT ON TABLE users IS 'User profiles. Authentication is handled by Supabase Auth (auth.users table), this table stores additional profile data. Legacy accounts may have password column for backward compatibility.';
