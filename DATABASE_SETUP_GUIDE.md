# Database Setup Guide - Supabase

## Current Database Schema

Your app uses the following tables in Supabase:

### 1. **users** (Core user data)
- `id` (UUID, Primary Key)
- `email` (TEXT)
- `name` (TEXT)
- `gender` (TEXT) - 'M' or 'F'
- `age` (INTEGER)
- `password` (TEXT)
- `job_role` (TEXT)
- `profile_photo` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 2. **user_preferences** (Settings & subscription)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `theme` (TEXT) - 'light', 'dark', 'system'
- `notif_push` (BOOLEAN)
- `notif_email` (BOOLEAN)
- `notif_practice` (BOOLEAN)
- `notif_feedback` (BOOLEAN)
- `subscription_tier` (TEXT) - 'free', 'monthly', 'annual'
- `interviews_this_month` (INTEGER)
- `last_interview_date` (TIMESTAMP)
- `subscription_expires_at` (TIMESTAMP)
- `purchased_packs` (JSONB)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 3. **user_progress** (Gamification & saved jobs)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `streak` (INTEGER)
- `total_interviews` (INTEGER)
- `saved_jobs` (TEXT[]) - Array of job IDs
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 4. **interview_history** (Interview sessions)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `job_role` (TEXT)
- `date` (DATE)
- `duration_minutes` (INTEGER)
- `feedback` (TEXT) - AI-generated feedback
- `created_at` (TIMESTAMPTZ)

### 5. **cv_suggestions** (CV improvement tracking)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `category` (VARCHAR(100))
- `suggestion` (TEXT)
- `completed` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 6. **success_stories** (User testimonials)
- `id` (UUID, Primary Key)
- `user_email` (TEXT)
- `name` (TEXT)
- `role` (TEXT)
- `company` (TEXT)
- `story` (TEXT)
- `interview_count` (INTEGER)
- `timeframe` (TEXT)
- `gender` (TEXT) - 'male', 'female', 'other'
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## Step-by-Step Setup Instructions

### Step 1: Run Existing Migrations

Execute these SQL files in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql):

#### 1.1: Add Subscription Columns
```bash
# File: add_subscription_columns.sql
```
This adds:
- `subscription_tier` (free/monthly/annual)
- `interviews_this_month` (for limits)
- `last_interview_date` (for monthly reset)
- `subscription_expires_at`
- `purchased_packs` (JSON array)

**Run this in Supabase SQL Editor:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `add_subscription_columns.sql`
3. Paste and click "Run"
4. Verify: You should see "Success. No rows returned"

#### 1.2: Create CV Suggestions Table
```bash
# File: add_cv_suggestions_table.sql
```
This creates:
- `cv_suggestions` table
- Index on `user_id`
- `updated_at` trigger

**Run this in Supabase SQL Editor:**
1. Copy contents of `add_cv_suggestions_table.sql`
2. Paste and click "Run"
3. Verify table exists: Go to Table Editor → cv_suggestions

#### 1.3: Create Success Stories Table
```bash
# File: create_success_stories_table.sql
```
This creates:
- `success_stories` table with RLS policies
- Public read access
- Authenticated write access
- Example Sarah Thompson story

**Run this in Supabase SQL Editor:**
1. Copy contents of `create_success_stories_table.sql`
2. Paste and click "Run"
3. Verify: Go to Table Editor → success_stories → should see Sarah's story

---

### Step 2: Set Up Row Level Security (RLS)

RLS ensures users can only access their own data. Here's the comprehensive RLS setup:

#### 2.1: Users Table RLS

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own data (signup)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);
```

#### 2.2: User Preferences RLS

```sql
-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### 2.3: User Progress RLS

```sql
-- Enable RLS on user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY "Users can view own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### 2.4: Interview History RLS

```sql
-- Enable RLS on interview_history
ALTER TABLE interview_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own interview history
CREATE POLICY "Users can view own interviews"
ON interview_history FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own interviews
CREATE POLICY "Users can insert own interviews"
ON interview_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own interviews
CREATE POLICY "Users can update own interviews"
ON interview_history FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own interviews
CREATE POLICY "Users can delete own interviews"
ON interview_history FOR DELETE
USING (auth.uid() = user_id);
```

#### 2.5: CV Suggestions RLS

```sql
-- Enable RLS on cv_suggestions
ALTER TABLE cv_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can read their own CV suggestions
CREATE POLICY "Users can view own cv_suggestions"
ON cv_suggestions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own CV suggestions
CREATE POLICY "Users can insert own cv_suggestions"
ON cv_suggestions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own CV suggestions
CREATE POLICY "Users can update own cv_suggestions"
ON cv_suggestions FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own CV suggestions
CREATE POLICY "Users can delete own cv_suggestions"
ON cv_suggestions FOR DELETE
USING (auth.uid() = user_id);
```

#### 2.6: Success Stories RLS (Already Set Up ✅)
Success stories table already has RLS policies:
- ✅ Public read access
- ✅ Authenticated insert
- ✅ User can update/delete own stories

---

### Step 3: Create Indexes for Performance

```sql
-- Index on user_preferences.user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
ON user_preferences(user_id);

-- Index on user_progress.user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id 
ON user_progress(user_id);

-- Index on interview_history.user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_interview_history_user_id 
ON interview_history(user_id);

-- Index on interview_history.created_at for sorting
CREATE INDEX IF NOT EXISTS idx_interview_history_created_at 
ON interview_history(created_at DESC);

-- Index on cv_suggestions.user_id (already created in migration)
-- Index on success_stories.created_at (already created in migration)

-- Composite index for subscription queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription 
ON user_preferences(user_id, subscription_tier, subscription_expires_at);
```

---

### Step 4: Set Up Database Backups

#### Automatic Backups (Supabase Pro Plan)
Supabase Pro includes:
- Daily backups (retained for 7 days)
- Point-in-time recovery

**To enable:**
1. Go to Supabase Dashboard → Settings → Billing
2. Upgrade to Pro plan ($25/month)
3. Backups are automatic

#### Manual Backup Script (Free Tier)

Create `backup_database.sh`:
```bash
#!/bin/bash
# Manual database backup script

# Set your Supabase project details
PROJECT_REF="urewxbnmubmkceuplctd"
DB_PASSWORD="your_postgres_password"

# Create backup directory
mkdir -p backups
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"

# Download backup using pg_dump
pg_dump "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" > $BACKUP_FILE

echo "Backup saved to $BACKUP_FILE"

# Keep only last 7 backups
ls -t backups/backup_*.sql | tail -n +8 | xargs rm -f
```

**Usage:**
```bash
chmod +x backup_database.sh
./backup_database.sh
```

---

### Step 5: Database Monitoring

#### Enable Supabase Monitoring

1. Go to Dashboard → Reports
2. Monitor:
   - Database size
   - Query performance
   - Connection count
   - Table sizes

#### Set Up Alerts

1. Go to Dashboard → Settings → API
2. Enable "Database Webhooks"
3. Set up alerts for:
   - Database size > 80% of limit
   - High connection count
   - Slow queries

#### Query Performance Monitoring

```sql
-- Find slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Find table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Find missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1;
```

---

## Verification Checklist

After completing setup, verify everything works:

### ✅ Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- users
- user_preferences
- user_progress
- interview_history
- cv_suggestions
- success_stories

### ✅ RLS Policies Active
```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Should see policies for all tables.

### ✅ Indexes Created
```sql
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Should see indexes on foreign keys and frequently queried columns.

### ✅ Test Data Access

Test as a logged-in user:
1. Sign up in your app
2. Create an interview
3. Check if it appears in interview_history
4. Try accessing another user's data (should fail)

---

## Production Readiness Checklist

- [ ] All migrations run successfully
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance
- [ ] Backup strategy configured
- [ ] Monitoring enabled
- [ ] Test user data isolation (RLS working)
- [ ] Verify success_stories public access
- [ ] Check subscription columns exist
- [ ] Verify CV suggestions table exists
- [ ] Document database password securely

---

## Common Issues & Solutions

### Issue: "permission denied for table X"
**Solution:** Check RLS policies are created and user is authenticated

### Issue: Queries are slow
**Solution:** Run index creation SQL, check pg_stat_statements for slow queries

### Issue: Can't access data after RLS enabled
**Solution:** Verify `auth.uid()` matches the user_id in the policy

### Issue: Success stories not visible
**Solution:** Check public read policy exists: `USING (true)`

---

## Next Steps After Database Setup

1. ✅ Test all CRUD operations in your app
2. ✅ Verify subscription tier changes work
3. ✅ Test interview limits for free users
4. ✅ Verify CV suggestions save and load
5. ✅ Check success stories display for all users
6. ✅ Run backup script to test backups
7. ✅ Monitor database size and performance

---

## Support Resources

- Supabase Docs: https://supabase.com/docs
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Performance Tuning: https://supabase.com/docs/guides/database/performance
- Backups: https://supabase.com/docs/guides/platform/backups
