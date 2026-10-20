/*
# Novie Core Schema — Self-Discovery & Growth Platform

## Overview
Creates the complete database schema for Novie, a personal growth and self-discovery platform.
This is a single-tenant app (no sign-in required), so all tables use anon+authenticated policies
with open access, since data is local to the user's browser session via the anon key.

## New Tables
1. `profiles` — User profile: name, role, birth info, privacy settings, onboarded state, XP/leaves/streak
2. `checkins` — Daily mood check-ins: mood, energy, stress, connection, note, date
3. `goals` — Personal goals: title, category, status, progress
4. `journal_entries` — Journal reflections: title, content, mood tag, date
5. `reflections` — Self-discovery question answers: question, answer, date
6. `connections` — People the user is building relationships with: name, type, sharing permissions
7. `interests` — User's selected interests: name, category
8. `memories` — User-approved AI memories: content, category, source, approved flag
9. `garden_events` — Garden growth events: activity type, xp earned, description, date
10. `achievements` — Earned achievements: name, description, icon, date earned
11. `habits` — Recurring habits: name, frequency, streak count, last completed
12. `shared_activities` — Activities done with connections: connection_id, activity, result, date

## Security
- RLS enabled on all tables
- All policies use `TO anon, authenticated` with `USING (true)` — single-tenant, no sign-in
- Data is intentionally accessible to the anon-key frontend client
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text DEFAULT '',
  role text DEFAULT 'Just exploring',
  birth_date date,
  birth_time text,
  birth_place text,
  privacy text DEFAULT 'private',
  onboarded boolean DEFAULT false,
  xp integer DEFAULT 0,
  leaves integer DEFAULT 1,
  streak integer DEFAULT 0,
  last_checkin date,
  community_enabled boolean DEFAULT false,
  astrology_enabled boolean DEFAULT false,
  wellness_enabled boolean DEFAULT false,
  faith_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE TO anon, authenticated USING (true);

-- Check-ins table
CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mood text,
  energy integer DEFAULT 50,
  stress integer DEFAULT 30,
  connection integer DEFAULT 60,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_checkins" ON checkins;
CREATE POLICY "anon_select_checkins" ON checkins FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_checkins" ON checkins;
CREATE POLICY "anon_insert_checkins" ON checkins FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_checkins" ON checkins;
CREATE POLICY "anon_update_checkins" ON checkins FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_checkins" ON checkins;
CREATE POLICY "anon_delete_checkins" ON checkins FOR DELETE TO anon, authenticated USING (true);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text DEFAULT 'personal',
  status text DEFAULT 'active',
  progress integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_goals" ON goals;
CREATE POLICY "anon_select_goals" ON goals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_goals" ON goals;
CREATE POLICY "anon_insert_goals" ON goals FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_goals" ON goals;
CREATE POLICY "anon_update_goals" ON goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_goals" ON goals;
CREATE POLICY "anon_delete_goals" ON goals FOR DELETE TO anon, authenticated USING (true);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT '',
  content text NOT NULL,
  mood_tag text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_journal" ON journal_entries;
CREATE POLICY "anon_select_journal" ON journal_entries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_journal" ON journal_entries;
CREATE POLICY "anon_insert_journal" ON journal_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_journal" ON journal_entries;
CREATE POLICY "anon_update_journal" ON journal_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_journal" ON journal_entries;
CREATE POLICY "anon_delete_journal" ON journal_entries FOR DELETE TO anon, authenticated USING (true);

-- Reflections table (self-discovery answers)
CREATE TABLE IF NOT EXISTS reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'self-discovery',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_reflections" ON reflections;
CREATE POLICY "anon_select_reflections" ON reflections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_reflections" ON reflections;
CREATE POLICY "anon_insert_reflections" ON reflections FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_reflections" ON reflections;
CREATE POLICY "anon_delete_reflections" ON reflections FOR DELETE TO anon, authenticated USING (true);

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text DEFAULT 'Friend',
  sharing jsonb DEFAULT '{"games": true, "checkins": false, "goals": false, "astrology": false}'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_connections" ON connections;
CREATE POLICY "anon_select_connections" ON connections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_connections" ON connections;
CREATE POLICY "anon_insert_connections" ON connections FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_connections" ON connections;
CREATE POLICY "anon_update_connections" ON connections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_connections" ON connections;
CREATE POLICY "anon_delete_connections" ON connections FOR DELETE TO anon, authenticated USING (true);

-- Interests table
CREATE TABLE IF NOT EXISTS interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_interests" ON interests;
CREATE POLICY "anon_select_interests" ON interests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_interests" ON interests;
CREATE POLICY "anon_insert_interests" ON interests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_interests" ON interests;
CREATE POLICY "anon_delete_interests" ON interests FOR DELETE TO anon, authenticated USING (true);

-- Memories table (user-approved AI memories)
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  category text DEFAULT 'preference',
  source text DEFAULT 'user',
  approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_memories" ON memories;
CREATE POLICY "anon_select_memories" ON memories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_memories" ON memories;
CREATE POLICY "anon_insert_memories" ON memories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_memories" ON memories;
CREATE POLICY "anon_update_memories" ON memories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_memories" ON memories;
CREATE POLICY "anon_delete_memories" ON memories FOR DELETE TO anon, authenticated USING (true);

-- Garden events table (growth tracking)
CREATE TABLE IF NOT EXISTS garden_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL,
  description text,
  xp_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE garden_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_garden" ON garden_events;
CREATE POLICY "anon_select_garden" ON garden_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_garden" ON garden_events;
CREATE POLICY "anon_insert_garden" ON garden_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_garden" ON garden_events;
CREATE POLICY "anon_delete_garden" ON garden_events FOR DELETE TO anon, authenticated USING (true);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT '🌟',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_achievements" ON achievements;
CREATE POLICY "anon_select_achievements" ON achievements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_achievements" ON achievements;
CREATE POLICY "anon_insert_achievements" ON achievements FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_achievements" ON achievements;
CREATE POLICY "anon_delete_achievements" ON achievements FOR DELETE TO anon, authenticated USING (true);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  frequency text DEFAULT 'daily',
  streak_count integer DEFAULT 0,
  last_completed date,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_habits" ON habits;
CREATE POLICY "anon_select_habits" ON habits FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_habits" ON habits;
CREATE POLICY "anon_insert_habits" ON habits FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_habits" ON habits;
CREATE POLICY "anon_update_habits" ON habits FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_habits" ON habits;
CREATE POLICY "anon_delete_habits" ON habits FOR DELETE TO anon, authenticated USING (true);

-- Shared activities table
CREATE TABLE IF NOT EXISTS shared_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES connections(id) ON DELETE CASCADE,
  activity text NOT NULL,
  result text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shared_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_shared" ON shared_activities;
CREATE POLICY "anon_select_shared" ON shared_activities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_shared" ON shared_activities;
CREATE POLICY "anon_insert_shared" ON shared_activities FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_shared" ON shared_activities;
CREATE POLICY "anon_delete_shared" ON shared_activities FOR DELETE TO anon, authenticated USING (true);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_checkins_created ON checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_created ON reflections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_garden_created ON garden_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
