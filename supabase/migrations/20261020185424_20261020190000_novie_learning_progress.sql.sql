/*
# Novie: Learning Progress Table

## Overview
Creates a table to track which learning lessons a user has completed.
This prevents repeated clicks from generating unlimited XP and lets users
resume learning paths and see their progress.

## New Table
1. `learning_progress` — one row per completed lesson per user
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to auth.uid())
- `path_id` (text, not null) — the learning path identifier
- `lesson_index` (integer, not null) — zero-based index of the lesson within the path
- `lesson_title` (text) — the lesson title for display
- `reflection` (text) — optional reflection the user wrote during the lesson
- `created_at` (timestamptz)

## Security
- RLS enabled
- Owner-scoped CRUD: authenticated users can only access their own progress
- Unique constraint on (user_id, path_id, lesson_index) prevents duplicate completions
*/

CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  path_id text NOT NULL,
  lesson_index integer NOT NULL,
  lesson_title text,
  reflection text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_learning_progress" ON learning_progress;
CREATE POLICY "select_own_learning_progress" ON learning_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_learning_progress" ON learning_progress;
CREATE POLICY "insert_own_learning_progress" ON learning_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_learning_progress" ON learning_progress;
CREATE POLICY "delete_own_learning_progress" ON learning_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Prevent duplicate lesson completions
CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_progress_unique
  ON learning_progress (user_id, path_id, lesson_index);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_path
  ON learning_progress (user_id, path_id);
