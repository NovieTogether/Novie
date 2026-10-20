/*
# Novie: Artwork and Garden Preferences Tables

## New Tables
1. `artwork` — User's saved drawings and creative work: title, image_data (base64 PNG), mood_tag, activity_type, created_at
2. `garden_preferences` — User's plant and theme choices: plant_type, seasonal_theme, auto_seasonal

## Security
- RLS enabled, anon+authenticated CRUD (single-tenant, no auth)
*/

CREATE TABLE IF NOT EXISTS artwork (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT '',
  image_data text,
  mood_tag text,
  activity_type text DEFAULT 'free_draw',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE artwork ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_artwork" ON artwork;
CREATE POLICY "anon_select_artwork" ON artwork FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_artwork" ON artwork;
CREATE POLICY "anon_insert_artwork" ON artwork FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_artwork" ON artwork;
CREATE POLICY "anon_delete_artwork" ON artwork FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS garden_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_type text DEFAULT 'seedling',
  seasonal_theme text DEFAULT 'none',
  auto_seasonal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE garden_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_garden_prefs" ON garden_preferences;
CREATE POLICY "anon_select_garden_prefs" ON garden_preferences FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_garden_prefs" ON garden_preferences;
CREATE POLICY "anon_insert_garden_prefs" ON garden_preferences FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_garden_prefs" ON garden_preferences;
CREATE POLICY "anon_update_garden_prefs" ON garden_preferences FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_garden_prefs" ON garden_preferences;
CREATE POLICY "anon_delete_garden_prefs" ON garden_preferences FOR DELETE TO anon, authenticated USING (true);
