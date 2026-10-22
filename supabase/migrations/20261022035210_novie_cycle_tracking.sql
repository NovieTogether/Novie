/*
# Cycle Tracking Table

1. New Tables
- `cycle_entries` — Private menstrual cycle log entries
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users, cascade delete)
  - `entry_date` (date, not null) — the day this entry records
  - `period_start` (boolean, default false) — marks first day of period
  - `period_end` (boolean, default false) — marks last day of period
  - `symptoms` (jsonb, default '{}') — object of symptom flags
  - `mood` (integer, null) — 1-5 scale, optional
  - `energy` (integer, null) — 1-5 scale, optional
  - `sleep_quality` (integer, null) — 1-5 scale, optional
  - `notes` (text, null) — free-form private notes
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS. Owner-scoped CRUD only. No anon access. Never shared.

3. Index
- Index on (user_id, entry_date) for efficient calendar queries.
*/

CREATE TABLE IF NOT EXISTS cycle_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  period_start boolean NOT NULL DEFAULT false,
  period_end boolean NOT NULL DEFAULT false,
  symptoms jsonb NOT NULL DEFAULT '{}'::jsonb,
  mood integer,
  energy integer,
  sleep_quality integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cycle_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cycle" ON cycle_entries;
CREATE POLICY "select_own_cycle" ON cycle_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cycle" ON cycle_entries;
CREATE POLICY "insert_own_cycle" ON cycle_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cycle" ON cycle_entries;
CREATE POLICY "update_own_cycle" ON cycle_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cycle" ON cycle_entries;
CREATE POLICY "delete_own_cycle" ON cycle_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cycle_user_date ON cycle_entries(user_id, entry_date DESC);
