# Database Schema Documentation

## Overview

This document describes the database schema for the MY INTERVIEW app. The database is hosted on Supabase (PostgreSQL) and includes tables for user management, interview tracking, CV suggestions, and more.

---

## Tables

### 1. `users` (Supabase Auth)

**Purpose**: Manages user authentication and basic user information.

Managed by Supabase Auth. Contains:
- `id` (UUID) - Primary key, user identifier
- `email` (TEXT) - User's email address
- `created_at` (TIMESTAMP) - Account creation timestamp
- Additional auth-related fields managed by Supabase

**Related SQL Files**: 
- `add_password_column.sql` - Adds password management fields (if needed)

---

### 2. `user_preferences`

**Purpose**: Stores user profile information, subscription status, and preferences.

| Column Name | Data Type | Default | Constraints | Description |
|------------|-----------|---------|-------------|-------------|
| `id` | UUID | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| `user_id` | UUID | - | FOREIGN KEY → users.id | References auth user |
| `full_name` | TEXT | - | - | User's full name |
| `job_title` | TEXT | - | - | Current or desired job title |
| `experience_level` | TEXT | - | - | Junior, Mid, Senior, etc. |
| `industry` | TEXT | - | - | Industry/sector |
| `subscription_tier` | TEXT | 'free' | CHECK IN ('free', 'monthly', 'annual') | Subscription plan type |
| `interviews_this_month` | INTEGER | 0 | - | Count of interviews in current month |
| `last_interview_date` | TIMESTAMP | - | - | Last interview timestamp (for monthly reset) |
| `subscription_expires_at` | TIMESTAMP | - | - | Subscription expiry date |
| `purchased_packs` | JSONB | '[]' | - | Array of purchased sector pack IDs |
| `created_at` | TIMESTAMP | NOW() | - | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOW() | - | Last update timestamp |

**Key Features**:
- Subscription management (free/monthly/annual tiers)
- Interview limit tracking (5/month for free tier)
- Sector pack purchases stored as JSON array

**Related SQL Files**: 
- `add_subscription_columns.sql` - Adds subscription and tracking fields

---

### 3. `interview_history`

**Purpose**: Tracks all user interview practice sessions with performance metrics.

| Column Name | Data Type | Default | Constraints | Description |
|------------|-----------|---------|-------------|-------------|
| `id` | UUID | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| `user_id` | UUID | - | FOREIGN KEY → users.id | References auth user |
| `interview_type` | TEXT | - | - | Type: behavioral, technical, etc. |
| `job_role` | TEXT | - | - | Target job role |
| `mode` | TEXT | - | - | 'text' or 'voice' |
| `duration` | INTEGER | - | - | Duration in seconds |
| `questions_asked` | INTEGER | - | - | Number of questions |
| `confidence_score` | INTEGER | - | - | Score 0-100 |
| `clarity_score` | INTEGER | - | - | Score 0-100 |
| `relevance_score` | INTEGER | - | - | Score 0-100 |
| `overall_score` | INTEGER | - | - | Average score 0-100 |
| `feedback` | TEXT | - | - | AI-generated feedback |
| `transcript` | TEXT | - | - | Full interview transcript |
| `created_at` | TIMESTAMP | NOW() | - | Interview date/time |

**Key Features**:
- Stores complete interview sessions
- Performance metrics for progress tracking
- AI-generated feedback
- Full transcript storage

**Related SQL Files**: 
- `add_feedback_column.sql` - Adds feedback column

---

### 4. `cv_suggestions`

**Purpose**: Stores AI-generated CV improvement suggestions and tracks completion status.

| Column Name | Data Type | Default | Constraints | Description |
|------------|-----------|---------|-------------|-------------|
| `id` | UUID | gen_random_uuid() | PRIMARY KEY | Unique identifier |
| `user_id` | UUID | - | FOREIGN KEY → users.id | References auth user |
| `category` | VARCHAR(100) | - | NOT NULL | Suggestion category (e.g., 'Skills', 'Experience') |
| `suggestion` | TEXT | - | NOT NULL | The improvement suggestion text |
| `completed` | BOOLEAN | FALSE | - | Whether user marked as done |
| `created_at` | TIMESTAMP | NOW() | - | Suggestion creation timestamp |
| `updated_at` | TIMESTAMP | NOW() | - | Last update timestamp |

**Indexes**:
- `idx_cv_suggestions_user_id` on `user_id` for faster queries

**Triggers**:
- `update_cv_suggestions_updated_at` - Automatically updates `updated_at` on row update

**Key Features**:
- AI-generated CV improvement suggestions
- Track completion status
- Categorized suggestions for better organization

**Related SQL Files**: 
- `add_cv_suggestions_table.sql` - Creates table with indexes and triggers

---

### 5. `success_stories` (Likely exists)

**Purpose**: Stores user-submitted interview success stories.

Expected columns:
- `id` - Primary key
- `user_id` - Foreign key to users
- `company` - Company name
- `role` - Job role
- `story` - Success story text
- `tips` - Tips for others
- `created_at` - Submission date

---

### 6. `feedback` (App feedback)

**Purpose**: Stores user feedback about the app.

Expected columns:
- `id` - Primary key
- `user_id` - Foreign key to users
- `feedback_text` - User's feedback
- `rating` - App rating
- `created_at` - Feedback submission date

---

## Storage Buckets

### `cvs`

**Purpose**: Stores uploaded CV files (PDF, DOCX).

**Configuration**:
- File size limit: TBD
- Allowed file types: PDF, DOCX
- Access control: User can only access their own files

**Related SQL Files**:
- `fix_storage_policy.sql` - Configures RLS policies for CV storage

**Policies**:
```sql
-- Users can only read/write their own CVs
CREATE POLICY "Users can upload their own CVs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own CVs"
ON storage.objects FOR SELECT
USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Relationships

```
users (Supabase Auth)
  ↓
  ├── user_preferences (1:1)
  ├── interview_history (1:N)
  ├── cv_suggestions (1:N)
  ├── success_stories (1:N)
  └── feedback (1:N)
```

---

## Security & Row Level Security (RLS)

### Current Status
⚠️ **RLS Policies need to be implemented for production**

### Required Policies

#### `user_preferences`
```sql
-- Users can only read their own preferences
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id);
```

#### `interview_history`
```sql
-- Users can only view their own interview history
CREATE POLICY "Users can view own interviews"
ON interview_history FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own interviews
CREATE POLICY "Users can create own interviews"
ON interview_history FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### `cv_suggestions`
```sql
-- Users can only view their own CV suggestions
CREATE POLICY "Users can view own suggestions"
ON cv_suggestions FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own suggestions
CREATE POLICY "Users can update own suggestions"
ON cv_suggestions FOR UPDATE
USING (auth.uid() = user_id);
```

---

## Indexes

### Existing Indexes
- `idx_cv_suggestions_user_id` on `cv_suggestions(user_id)`

### Recommended Additional Indexes
```sql
-- For faster interview history queries
CREATE INDEX idx_interview_history_user_id 
ON interview_history(user_id);

CREATE INDEX idx_interview_history_created_at 
ON interview_history(created_at DESC);

-- For faster user preferences lookups
CREATE INDEX idx_user_preferences_user_id 
ON user_preferences(user_id);

-- For subscription expiry checks
CREATE INDEX idx_user_preferences_subscription_expires 
ON user_preferences(subscription_expires_at);
```

---

## Database Migrations

### Development Setup

Run these SQL files in order in your Supabase SQL Editor:

1. **Initial Setup** (if creating fresh)
   - Create base tables (may already exist from Supabase setup)

2. **Add Subscription Features**
   ```bash
   add_subscription_columns.sql
   ```

3. **Add CV Suggestions**
   ```bash
   add_cv_suggestions_table.sql
   ```

4. **Add Interview Feedback**
   ```bash
   add_feedback_column.sql
   ```

5. **Configure Permissions**
   ```bash
   grant_permissions.sql
   ```

6. **Fix Storage Policies**
   ```bash
   fix_storage_policy.sql
   ```

### Production Setup

⚠️ **Before production deployment**:
1. Run all migration scripts on production database
2. Enable Row Level Security (RLS) on all tables
3. Set up proper RLS policies (see Security section above)
4. Create recommended indexes
5. Set up automated backups
6. Configure database monitoring

---

## Data Types & Constraints

### Subscription Tiers
- `'free'` - Default tier, 2 interviews/month limit
- `'monthly'` - £7.99/month, unlimited interviews
- `'annual'` - £59.99/year, unlimited interviews

### Score Ranges
All performance scores range from 0-100:
- `confidence_score`
- `clarity_score`
- `relevance_score`
- `overall_score`

### Interview Modes
- `'text'` - Text-based interview
- `'voice'` - Voice-based interview (uses Expo AV)

---

## Maintenance & Optimization

### Monthly Tasks
- Archive old interview history (>6 months)
- Clean up orphaned CV files
- Reset `interviews_this_month` counter on subscription anniversary

### Monitoring
- Track database size growth
- Monitor slow queries
- Check for missing indexes on large tables
- Review RLS policy performance

### Backup Strategy
- Supabase automatic backups (verify frequency)
- Manual backup before major migrations
- Test restore procedures regularly

---

## Related Documentation

- `SUPABASE_SETUP.md` - Supabase configuration guide
- `ENV_SETUP.md` - Environment variables for database connection
- `DEPLOYMENT_CHECKLIST.md` - Production deployment tasks
- SQL migration files (see list above)

---

**Last Updated**: December 2025  
**Schema Version**: 1.0  
**Database**: PostgreSQL (Supabase)
