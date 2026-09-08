/*
# Refresh social features: ensure username column and social tables are in schema cache

1. Purpose
The PostgREST schema cache was not picking up the `username` column on `profiles`
or the social tables (`friendships`, `study_groups`, `study_group_members`).
This migration re-applies the same idempotent DDL so the migration system
re-registers everything and the schema cache refreshes.

2. Changes
- Ensures `profiles.username` column exists (text, nullable, unique).
- Ensures `friendships`, `study_groups`, `study_group_members` tables exist.
- Re-creates all RLS policies (drop + create, idempotent).
- Re-creates all indexes.
- Reloads the PostgREST schema cache via NOTIFY.

3. No data loss
All statements use IF NOT EXISTS / DO $$ blocks. No DROP of tables or columns.
*/

-- 1. Ensure username column on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- 2. friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT friendships_no_self CHECK (user_id <> friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_friendships" ON friendships;
CREATE POLICY "select_own_friendships"
ON friendships FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "insert_own_friendships" ON friendships;
CREATE POLICY "insert_own_friendships"
ON friendships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_friendships" ON friendships;
CREATE POLICY "update_own_friendships"
ON friendships FOR UPDATE
TO authenticated
USING (auth.uid() = friend_id OR auth.uid() = user_id)
WITH CHECK (auth.uid() = friend_id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_friendships" ON friendships;
CREATE POLICY "delete_own_friendships"
ON friendships FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_idx
ON friendships (least(user_id, friend_id), greatest(user_id, friend_id));

CREATE INDEX IF NOT EXISTS friendships_user_idx ON friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_idx ON friendships(friend_id);

-- 3. study_groups table
CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  max_members integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_study_groups" ON study_groups;
CREATE POLICY "select_study_groups"
ON study_groups FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_study_groups" ON study_groups;
CREATE POLICY "insert_own_study_groups"
ON study_groups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_study_groups" ON study_groups;
CREATE POLICY "update_own_study_groups"
ON study_groups FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_study_groups" ON study_groups;
CREATE POLICY "delete_own_study_groups"
ON study_groups FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS study_groups_owner_idx ON study_groups(owner_id);

-- 4. study_group_members table
CREATE TABLE IF NOT EXISTS study_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  CONSTRAINT study_group_members_unique UNIQUE (group_id, user_id)
);

ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_study_group_members" ON study_group_members;
CREATE POLICY "select_study_group_members"
ON study_group_members FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_study_group_members" ON study_group_members;
CREATE POLICY "insert_own_study_group_members"
ON study_group_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_study_group_members" ON study_group_members;
CREATE POLICY "delete_own_study_group_members"
ON study_group_members FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS study_group_members_group_idx ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS study_group_members_user_idx ON study_group_members(user_id);

-- 5. Widen profiles SELECT so users can search each other
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "select_profiles_search" ON profiles;
CREATE POLICY "select_profiles_search"
ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
ON profiles FOR DELETE
TO authenticated USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- 6. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
