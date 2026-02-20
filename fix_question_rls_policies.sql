-- Fix RLS policies for question_answers and custom_questions
-- These policies allow any authenticated user to insert/update/delete their own data

-- Drop existing policies
DROP POLICY IF EXISTS question_answers_user_policy ON question_answers;
DROP POLICY IF EXISTS question_answers_insert_policy ON question_answers;
DROP POLICY IF EXISTS question_answers_update_policy ON question_answers;
DROP POLICY IF EXISTS question_answers_delete_policy ON question_answers;
DROP POLICY IF EXISTS question_answers_select_policy ON question_answers;
DROP POLICY IF EXISTS custom_questions_user_policy ON custom_questions;
DROP POLICY IF EXISTS custom_questions_insert_policy ON custom_questions;
DROP POLICY IF EXISTS custom_questions_update_policy ON custom_questions;
DROP POLICY IF EXISTS custom_questions_delete_policy ON custom_questions;
DROP POLICY IF EXISTS custom_questions_select_policy ON custom_questions;

-- Create new policies for question_answers
-- SELECT: Users can only see their own answers
CREATE POLICY question_answers_select_policy ON question_answers
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- INSERT: Allow any authenticated user to insert (they provide their own user_id)
CREATE POLICY question_answers_insert_policy ON question_answers
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can only update their own answers
CREATE POLICY question_answers_update_policy ON question_answers
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- DELETE: Users can only delete their own answers
CREATE POLICY question_answers_delete_policy ON question_answers
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Create new policies for custom_questions
-- SELECT: Users can only see their own questions
CREATE POLICY custom_questions_select_policy ON custom_questions
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- INSERT: Allow any authenticated user to insert their own questions
CREATE POLICY custom_questions_insert_policy ON custom_questions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can only update their own questions
CREATE POLICY custom_questions_update_policy ON custom_questions
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- DELETE: Users can only delete their own questions
CREATE POLICY custom_questions_delete_policy ON custom_questions
  FOR DELETE
  USING (auth.uid()::text = user_id::text);
