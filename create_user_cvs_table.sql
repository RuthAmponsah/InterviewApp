-- Create user_cvs table to store CV file metadata and extracted text
CREATE TABLE IF NOT EXISTS user_cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase Storage
    extracted_text TEXT, -- Extracted CV text for analysis
    original_content BYTEA, -- Original file content (for PDF/DOCX)
    file_size INT,
    mime_type TEXT DEFAULT 'application/pdf',
    analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id) -- Only one active CV per user
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_cvs_user_id ON user_cvs(user_id);

-- Set up RLS policies
ALTER TABLE user_cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CV"
ON user_cvs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CV"
ON user_cvs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CV"
ON user_cvs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CV"
ON user_cvs FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_cvs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_cvs_updated_at
BEFORE UPDATE ON user_cvs
FOR EACH ROW
EXECUTE FUNCTION update_user_cvs_updated_at();

-- Create Supabase Storage bucket for CVs (run separately via dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-cvs', 'user-cvs', false);
