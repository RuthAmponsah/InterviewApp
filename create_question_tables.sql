-- Create question_answers table to store user answers to practice questions
CREATE TABLE IF NOT EXISTS question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL, -- Can be 'standard_question_id' or 'custom_question_id'
  question_text TEXT NOT NULL, -- Store the full question text for record-keeping
  answer TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'standard', -- 'standard' or 'custom'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Add index for faster queries
  UNIQUE(user_id, question_id, created_at)
);

-- Create custom_questions table to store user-created questions
CREATE TABLE IF NOT EXISTS custom_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for question_answers
CREATE INDEX idx_question_answers_user_id ON question_answers(user_id);
CREATE INDEX idx_question_answers_created_at ON question_answers(created_at DESC);

-- Create index for custom_questions
CREATE INDEX idx_custom_questions_user_id ON custom_questions(user_id);

-- Enable Row Level Security
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own answers
CREATE POLICY question_answers_user_policy ON question_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY question_answers_insert_policy ON question_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY question_answers_update_policy ON question_answers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY question_answers_delete_policy ON question_answers
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: Users can only see/manage their own custom questions
CREATE POLICY custom_questions_user_policy ON custom_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY custom_questions_insert_policy ON custom_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY custom_questions_update_policy ON custom_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY custom_questions_delete_policy ON custom_questions
  FOR DELETE USING (auth.uid() = user_id);
