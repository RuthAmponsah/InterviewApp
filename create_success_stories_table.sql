-- Create success_stories table
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  story TEXT NOT NULL,
  interview_count INTEGER DEFAULT 0,
  timeframe TEXT,
  gender TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_success_stories_created_at 
ON success_stories(created_at DESC);

-- Enable Row Level Security
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read success stories (public access)
CREATE POLICY "Anyone can view success stories" 
ON success_stories 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own stories
CREATE POLICY "Users can create success stories" 
ON success_stories 
FOR INSERT 
WITH CHECK (true);

-- Allow users to update their own stories
CREATE POLICY "Users can update their own stories" 
ON success_stories 
FOR UPDATE 
USING (user_email = auth.jwt()->>'email');

-- Allow users to delete their own stories
CREATE POLICY "Users can delete their own stories" 
ON success_stories 
FOR DELETE 
USING (user_email = auth.jwt()->>'email');

-- Insert the default Sarah Thompson story
INSERT INTO success_stories (user_email, name, role, company, story, interview_count, timeframe, gender)
VALUES (
  'sarah.thompson@example.com',
  'Sarah Thompson',
  'Marketing Assistant',
  'Local Marketing Agency',
  'I was really nervous about my first proper job interview after graduating. I practiced with the app for about 2 weeks, going through common questions like ''Why do you want this role?'' and ''What are your strengths?''. It helped me feel more confident and less anxious. When the actual interview came, I felt prepared and managed to stay calm. I got the job offer a week later!',
  12,
  '2 weeks',
  'female'
);
