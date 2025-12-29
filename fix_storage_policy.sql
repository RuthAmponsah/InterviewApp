-- Fix Storage RLS Policy for Profile Photos
-- Run this in Supabase SQL Editor to allow users to upload profile photos

-- IMPORTANT: You must also make the bucket PUBLIC in Supabase Dashboard:
-- 1. Go to Storage → Buckets
-- 2. Click on 'avatars' bucket
-- 3. Click the three dots (...) menu → Edit bucket
-- 4. Toggle "Public bucket" to ON
-- 5. Save

-- Create the avatars bucket if it doesn't exist (run in Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;

-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow everyone to view profile photos (public read)
CREATE POLICY "Users can view all profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own photos
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
