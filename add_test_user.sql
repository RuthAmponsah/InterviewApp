-- Add test user to users table
-- Run this in your Supabase SQL Editor

-- First, create a test auth user (replace with your actual auth user ID if you have one)
-- Or insert directly into users table with a UUID

-- Option 1: Insert with a new UUID (generates automatically)
INSERT INTO users (id, email, name, gender, age, password, created_at)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  'Test User',
  'F',
  25,
  'Test@123',  -- Password with 8+ chars and special char
  NOW()
);

-- Option 2: Insert multiple test users at once
INSERT INTO users (id, email, name, gender, age, password, created_at)
VALUES 
  (gen_random_uuid(), 'ava@test.com', 'Ava Johnson', 'F', 28, 'Password@1', NOW()),
  (gen_random_uuid(), 'john@test.com', 'John Smith', 'M', 32, 'Secure@99', NOW()),
  (gen_random_uuid(), 'sarah@test.com', 'Sarah Lee', 'F', 24, 'Strong#2024', NOW());

-- View all users to confirm
SELECT id, email, name, gender, age, created_at 
FROM users 
ORDER BY created_at DESC;

-- Optional: Add user preferences for the test user
-- (Replace 'test@example.com' with your actual email)
INSERT INTO user_preferences (user_id, theme, notif_push, notif_email, notif_practice, notif_feedback)
SELECT id, 'system', true, true, true, true
FROM users
WHERE email = 'test@example.com'
AND NOT EXISTS (
  SELECT 1 FROM user_preferences WHERE user_id = users.id
);

-- Optional: Add user progress for the test user
INSERT INTO user_progress (user_id, streak, total_interviews)
SELECT id, 0, 0
FROM users
WHERE email = 'test@example.com'
AND NOT EXISTS (
  SELECT 1 FROM user_progress WHERE user_id = users.id
);

-- Now you can sign in with:
-- Email: test@example.com
-- Password: Test@123
