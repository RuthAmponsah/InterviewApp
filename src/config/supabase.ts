import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://urewxbnmubmkceuplctd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyZXd4Ym5tdWJta2NldXBsY3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTEwMjUsImV4cCI6MjA4MTEyNzAyNX0.KP9_Ho5ZW9erv7Ub-VBALS_wtKQwXCZx-oO6EMvALG8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
