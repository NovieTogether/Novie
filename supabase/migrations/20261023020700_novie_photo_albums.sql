/*
# Shared Moments Photo Albums (retry)

1. New Tables
- `photo_albums` — User-owned photo albums
  - id, user_id, title, shared_with (jsonb array of connection IDs), created_at
- `album_photos` — Photos within albums
  - id, album_id, user_id, image_data (text data URL), caption, photo_date, created_at

2. Security
- RLS on both tables. Owner-scoped CRUD via auth.uid() = user_id.
- No public or anon access. Private by default.

3. Indexes
- photo_albums(user_id, created_at), album_photos(album_id, created_at)
*/

CREATE TABLE IF NOT EXISTS photo_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  shared_with jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_albums" ON photo_albums;
CREATE POLICY "select_own_albums" ON photo_albums FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_albums" ON photo_albums;
CREATE POLICY "insert_own_albums" ON photo_albums FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_albums" ON photo_albums;
CREATE POLICY "update_own_albums" ON photo_albums FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_albums" ON photo_albums;
CREATE POLICY "delete_own_albums" ON photo_albums FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_albums_user ON photo_albums(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS album_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  image_data text NOT NULL,
  caption text NOT NULL DEFAULT '',
  photo_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_photos" ON album_photos;
CREATE POLICY "select_own_photos" ON album_photos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_photos" ON album_photos;
CREATE POLICY "insert_own_photos" ON album_photos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_photos" ON album_photos;
CREATE POLICY "update_own_photos" ON album_photos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_photos" ON album_photos;
CREATE POLICY "delete_own_photos" ON album_photos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_photos_album ON album_photos(album_id, created_at DESC);
