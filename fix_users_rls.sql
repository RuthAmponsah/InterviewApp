-- Fix RLS policy for users table - add proper UUID type casting

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Recreate with proper type casting
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid()::uuid = id);

CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid()::uuid = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::uuid = id);

-- Verify policies are in place
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
