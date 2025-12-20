-- Create cv_suggestions table for storing AI-generated CV improvement suggestions
-- This table tracks suggestions and whether users have completed them

CREATE TABLE IF NOT EXISTS cv_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL,
    suggestion TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_cv_suggestions_user_id ON cv_suggestions(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_cv_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cv_suggestions_updated_at
BEFORE UPDATE ON cv_suggestions
FOR EACH ROW
EXECUTE FUNCTION update_cv_suggestions_updated_at();

-- Grant permissions (adjust based on your Supabase setup)
-- GRANT ALL ON cv_suggestions TO authenticated;
-- GRANT ALL ON cv_suggestions TO service_role;

-- Example query to view suggestions for a user:
-- SELECT * FROM cv_suggestions WHERE user_id = '<user_id>' ORDER BY created_at DESC;

-- Example query to mark suggestion as complete:
-- UPDATE cv_suggestions SET completed = TRUE WHERE id = '<suggestion_id>';
