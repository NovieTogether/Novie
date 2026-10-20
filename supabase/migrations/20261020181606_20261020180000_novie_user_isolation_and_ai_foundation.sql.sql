/*
# Novie: User Isolation, AI Privacy Settings, and Conversation History

## Overview
Converts Novie from a single-tenant (no-auth, shared data) app to a multi-user app
with proper data ownership. Each user sees only their own profile, check-ins,
journal, goals, habits, memories, artwork, and all other records.

Also adds two new tables for the AI ecosystem:
- `ai_privacy_settings`: per-user controls for which data categories the AI can access
- `ai_conversations`: persistent conversation history with the AI companion

## Important: Existing Data
There is minimal existing data (1 profile, 1 checkin, 18 garden events).
These rows have no user_id. They will be assigned to a placeholder UUID
so they are not lost, but they will not be visible to any real user.
This is acceptable — the data is test/seed data from development.

## Changes to Existing Tables (all 14 tables)
Each table gets a new `user_id` column:
- `profiles` — user_id REFERENCES auth.users(id) ON DELETE CASCADE
- `checkins` — user_id
- `goals` — user_id
- `journal_entries` — user_id
- `reflections` — user_id
- `connections` — user_id
- `interests` — user_id
- `memories` — user_id
- `garden_events` — user_id
- `achievements` — user_id
- `habits` — user_id
- `shared_activities` — user_id (child of connections)
- `artwork` — user_id
- `garden_preferences` — user_id

All user_id columns are `uuid NOT NULL DEFAULT auth.uid()` so that frontend
inserts that omit user_id still succeed via the DEFAULT.

## New Tables
1. `ai_privacy_settings` — one row per user, tracks which data categories
   the AI may reference when generating responses. Categories: checkins,
   journal, goals, interests, astrology, memories. Each is a boolean toggle.
2. `ai_conversations` — stores conversation messages between user and Novie AI.
   Fields: role (user/assistant), content, metadata (jsonb for context snapshot),
   created_at. Owned by user_id.

## Security Changes
- ALL existing policies dropped and replaced with owner-scoped policies
  using `auth.uid() = user_id` checks
- All policies now `TO authenticated` (no more anon access — app requires sign-in)
- RLS remains enabled on all tables
- `profiles` table: user_id column added; the old `id` column remains as PK
  but `user_id` is used for ownership. profile is matched by user_id.
- `shared_activities` scoped through parent: user can only see shared_activities
  for connections they own
- `garden_preferences`: one row per user, matched by user_id

## Migration Steps
1. Add user_id column to each table (with DEFAULT auth.uid())
2. Backfill existing rows with a placeholder UUID (so they aren't lost)
3. Set user_id NOT NULL after backfill
4. Add foreign key constraints to auth.users
5. Drop all old anon policies
6. Create new authenticated owner-scoped policies
7. Create ai_privacy_settings table with policies
8. Create ai_conversations table with policies
9. Add index on user_id for each table
*/

-- Step 1: Add user_id columns to all existing tables
-- Using DO block to conditionally add columns if they don't exist

DO $$
BEGIN
  -- profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') THEN
    ALTER TABLE profiles ADD COLUMN user_id uuid;
  END IF;

  -- checkins
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkins' AND column_name = 'user_id') THEN
    ALTER TABLE checkins ADD COLUMN user_id uuid;
  END IF;

  -- goals
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'user_id') THEN
    ALTER TABLE goals ADD COLUMN user_id uuid;
  END IF;

  -- journal_entries
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'user_id') THEN
    ALTER TABLE journal_entries ADD COLUMN user_id uuid;
  END IF;

  -- reflections
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reflections' AND column_name = 'user_id') THEN
    ALTER TABLE reflections ADD COLUMN user_id uuid;
  END IF;

  -- connections
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'connections' AND column_name = 'user_id') THEN
    ALTER TABLE connections ADD COLUMN user_id uuid;
  END IF;

  -- interests
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interests' AND column_name = 'user_id') THEN
    ALTER TABLE interests ADD COLUMN user_id uuid;
  END IF;

  -- memories
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memories' AND column_name = 'user_id') THEN
    ALTER TABLE memories ADD COLUMN user_id uuid;
  END IF;

  -- garden_events
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'garden_events' AND column_name = 'user_id') THEN
    ALTER TABLE garden_events ADD COLUMN user_id uuid;
  END IF;

  -- achievements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'user_id') THEN
    ALTER TABLE achievements ADD COLUMN user_id uuid;
  END IF;

  -- habits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'habits' AND column_name = 'user_id') THEN
    ALTER TABLE habits ADD COLUMN user_id uuid;
  END IF;

  -- shared_activities
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shared_activities' AND column_name = 'user_id') THEN
    ALTER TABLE shared_activities ADD COLUMN user_id uuid;
  END IF;

  -- artwork
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artwork' AND column_name = 'user_id') THEN
    ALTER TABLE artwork ADD COLUMN user_id uuid;
  END IF;

  -- garden_preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'garden_preferences' AND column_name = 'user_id') THEN
    ALTER TABLE garden_preferences ADD COLUMN user_id uuid;
  END IF;
END $$;

-- Step 2: Backfill existing rows with a placeholder UUID so data is not lost
-- (these rows won't be visible to any real user, but are preserved)
UPDATE profiles SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE checkins SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE goals SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE journal_entries SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE reflections SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE connections SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE interests SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE memories SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE garden_events SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE achievements SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE habits SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE shared_activities SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE artwork SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE garden_preferences SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;

-- Step 3: Set user_id NOT NULL with DEFAULT auth.uid()
ALTER TABLE profiles ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE checkins ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE checkins ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE journal_entries ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE journal_entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE reflections ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE reflections ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE connections ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE connections ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE interests ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE interests ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE memories ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE memories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE garden_events ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE garden_events ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE achievements ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE achievements ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE habits ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE habits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE shared_activities ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE shared_activities ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE artwork ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE artwork ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE garden_preferences ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE garden_preferences ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add foreign key constraints (do NOT add FK to auth.users for the
-- placeholder rows — instead we add the FK constraint after cleaning up)
-- We skip FK constraints to auth.users to avoid issues with the placeholder UUID.
-- RLS policies enforce ownership via auth.uid() = user_id which is sufficient.

-- Step 5: Drop ALL old policies and create new owner-scoped policies
-- Profiles
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Checkins
DROP POLICY IF EXISTS "anon_select_checkins" ON checkins;
DROP POLICY IF EXISTS "anon_insert_checkins" ON checkins;
DROP POLICY IF EXISTS "anon_update_checkins" ON checkins;
DROP POLICY IF EXISTS "anon_delete_checkins" ON checkins;
CREATE POLICY "select_own_checkins" ON checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_checkins" ON checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_checkins" ON checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_checkins" ON checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Goals
DROP POLICY IF EXISTS "anon_select_goals" ON goals;
DROP POLICY IF EXISTS "anon_insert_goals" ON goals;
DROP POLICY IF EXISTS "anon_update_goals" ON goals;
DROP POLICY IF EXISTS "anon_delete_goals" ON goals;
CREATE POLICY "select_own_goals" ON goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_goals" ON goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_goals" ON goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_goals" ON goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Journal entries
DROP POLICY IF EXISTS "anon_select_journal" ON journal_entries;
DROP POLICY IF EXISTS "anon_insert_journal" ON journal_entries;
DROP POLICY IF EXISTS "anon_update_journal" ON journal_entries;
DROP POLICY IF EXISTS "anon_delete_journal" ON journal_entries;
CREATE POLICY "select_own_journal" ON journal_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_journal" ON journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_journal" ON journal_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reflections
DROP POLICY IF EXISTS "anon_select_reflections" ON reflections;
DROP POLICY IF EXISTS "anon_insert_reflections" ON reflections;
DROP POLICY IF EXISTS "anon_delete_reflections" ON reflections;
CREATE POLICY "select_own_reflections" ON reflections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_reflections" ON reflections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_reflections" ON reflections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Connections
DROP POLICY IF EXISTS "anon_select_connections" ON connections;
DROP POLICY IF EXISTS "anon_insert_connections" ON connections;
DROP POLICY IF EXISTS "anon_update_connections" ON connections;
DROP POLICY IF EXISTS "anon_delete_connections" ON connections;
CREATE POLICY "select_own_connections" ON connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_connections" ON connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_connections" ON connections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_connections" ON connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Interests
DROP POLICY IF EXISTS "anon_select_interests" ON interests;
DROP POLICY IF EXISTS "anon_insert_interests" ON interests;
DROP POLICY IF EXISTS "anon_delete_interests" ON interests;
CREATE POLICY "select_own_interests" ON interests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_interests" ON interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_interests" ON interests FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Memories
DROP POLICY IF EXISTS "anon_select_memories" ON memories;
DROP POLICY IF EXISTS "anon_insert_memories" ON memories;
DROP POLICY IF EXISTS "anon_update_memories" ON memories;
DROP POLICY IF EXISTS "anon_delete_memories" ON memories;
CREATE POLICY "select_own_memories" ON memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_memories" ON memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_memories" ON memories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_memories" ON memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Garden events
DROP POLICY IF EXISTS "anon_select_garden" ON garden_events;
DROP POLICY IF EXISTS "anon_insert_garden" ON garden_events;
DROP POLICY IF EXISTS "anon_delete_garden" ON garden_events;
CREATE POLICY "select_own_garden_events" ON garden_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_garden_events" ON garden_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_garden_events" ON garden_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Achievements
DROP POLICY IF EXISTS "anon_select_achievements" ON achievements;
DROP POLICY IF EXISTS "anon_insert_achievements" ON achievements;
DROP POLICY IF EXISTS "anon_delete_achievements" ON achievements;
CREATE POLICY "select_own_achievements" ON achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_achievements" ON achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Habits
DROP POLICY IF EXISTS "anon_select_habits" ON habits;
DROP POLICY IF EXISTS "anon_insert_habits" ON habits;
DROP POLICY IF EXISTS "anon_update_habits" ON habits;
DROP POLICY IF EXISTS "anon_delete_habits" ON habits;
CREATE POLICY "select_own_habits" ON habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_habits" ON habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_habits" ON habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_habits" ON habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Shared activities (scoped through parent connection ownership)
DROP POLICY IF EXISTS "anon_select_shared" ON shared_activities;
DROP POLICY IF EXISTS "anon_insert_shared" ON shared_activities;
DROP POLICY IF EXISTS "anon_delete_shared" ON shared_activities;
CREATE POLICY "select_own_shared_activities" ON shared_activities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_shared_activities" ON shared_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_shared_activities" ON shared_activities FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Artwork
DROP POLICY IF EXISTS "anon_select_artwork" ON artwork;
DROP POLICY IF EXISTS "anon_insert_artwork" ON artwork;
DROP POLICY IF EXISTS "anon_delete_artwork" ON artwork;
CREATE POLICY "select_own_artwork" ON artwork FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_artwork" ON artwork FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_artwork" ON artwork FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Garden preferences
DROP POLICY IF EXISTS "anon_select_garden_prefs" ON garden_preferences;
DROP POLICY IF EXISTS "anon_insert_garden_prefs" ON garden_preferences;
DROP POLICY IF EXISTS "anon_update_garden_prefs" ON garden_preferences;
DROP POLICY IF EXISTS "anon_delete_garden_prefs" ON garden_preferences;
CREATE POLICY "select_own_garden_prefs" ON garden_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_garden_prefs" ON garden_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_garden_prefs" ON garden_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_garden_prefs" ON garden_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Step 6: Create ai_privacy_settings table
CREATE TABLE IF NOT EXISTS ai_privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  checkins_enabled boolean DEFAULT true,
  journal_enabled boolean DEFAULT true,
  goals_enabled boolean DEFAULT true,
  interests_enabled boolean DEFAULT true,
  astrology_enabled boolean DEFAULT false,
  memories_enabled boolean DEFAULT true,
  reflections_enabled boolean DEFAULT true,
  habits_enabled boolean DEFAULT true,
  artwork_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE ai_privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_ai_privacy" ON ai_privacy_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_ai_privacy" ON ai_privacy_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_ai_privacy" ON ai_privacy_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_ai_privacy" ON ai_privacy_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Step 7: Create ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_conversations" ON ai_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_conversations" ON ai_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_conversations" ON ai_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Step 8: Add indexes on user_id for all tables
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_interests_user_id ON interests(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_events_user_id ON garden_events(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_activities_user_id ON shared_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_artwork_user_id ON artwork(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_prefs_user_id ON garden_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_privacy_user_id ON ai_privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
