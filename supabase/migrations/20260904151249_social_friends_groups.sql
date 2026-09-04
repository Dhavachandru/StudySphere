/*
# Add social features: friends, group study

1. Overview
This migration adds Instagram/Facebook-style social features to StudySphere:
- Users get a public, searchable username (like an Instagram handle).
- Users can search for other users by username and send friend requests.
- Friend requests can be accepted or declined.
- Users can create study groups, invite friends, and collaborate.

2. Modified tables
- `profiles`
  - NEW column `username` (text, unique, nullable). A short, public handle for
    friend search (e.g. "alex_studies"). Lowercased and trimmed by the app
    before insert/update. Existing rows get NULL and are prompted to pick one.

3. New tables
- `friendships`
  - `id` uuid PK
  - `user_id` uuid NOT NULL — the person who SENT the request (defaults to auth.uid())
  - `friend_id` uuid NOT NULL — the person who RECEIVES the request
  - `status` text NOT NULL DEFAULT 'pending' — 'pending' | 'accepted' | 'declined'
  - `created_at` timestamptz DEFAULT now()
  - `updated_at` timestamptz DEFAULT now()
  - CHECK constraint: user_id <> friend_id (no self-friending)
  - A unique index on (least(user_id, friend_id), greatest(user_id, friend_id))
    ensures only one relationship row exists between any pair of users.

- `study_groups`
  - `id` uuid PK
  - `name` text NOT NULL
  - `description` text
  - `owner_id` uuid NOT NULL — the creator (defaults to auth.uid())
  - `subject` text
  - `max_members` int DEFAULT 10
  - `created_at` timestamptz DEFAULT now()
  - `updated_at` timestamptz DEFAULT now()

- `study_group_members`
  - `id` uuid PK
  - `group_id` uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE
  - `user_id` uuid NOT NULL — the member (defaults to auth.uid())
  - `role` text NOT NULL DEFAULT 'member' — 'owner' | 'member'
  - `joined_at` timestamptz DEFAULT now()
  - UNIQUE (group_id, user_id) — one membership per user per group

4. Security (RLS)
- `profiles` SELECT policy is widened: an authenticated user can read ANY
  profile row (so they can search and view other users), but can still only
  UPDATE/DELETE their own row. INSERT stays owner-only.
- `friendships`: a user can read rows where they are either the sender or the
  receiver. They can INSERT only rows where they are the sender. They can
  UPDATE only rows where they are the receiver or sender. They can DELETE only
  rows where they are the sender or receiver.
- `study_groups`: any authenticated user can read all groups (so they can
  browse/join). Only the owner can UPDATE or DELETE their group.
- `study_group_members`: a user can read memberships for any group. A user can
  INSERT only their own membership. A user can DELETE only their own membership.

5. Indexes
- `profiles_username_idx` on `profiles(username)` for fast username search.
- `friendships_pair_idx` unique index on the ordered pair for one-row-per-pair.
- `friendships_user_idx` on `friendships(user_id)`.
- `friendships_friend_idx` on `friendships(friend_id)`.
- `study_groups_owner_idx` on `study_groups(owner_id)`.
- `study_group_members_group_idx` on `study_group_members(group_id)`.
- `study_group_members_user_idx` on `study_group_members(user_id)`.

6. Notes
- No existing data is modified or deleted. The username column is nullable so
  existing profiles are not forced to have one until the user picks it.
- Friend request rows are unique per pair regardless of direction, preventing
  duplicate requests between the same two users.
*/

-- 1. Add username to profiles (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
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

-- One relationship row per pair of users (regardless of who sent it)
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_idx
ON friendships (least(user_id, friend_id), greatest(user_id, friend_id));

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

-- 5. Widen profiles SELECT so users can search each other
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
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

-- 6. Indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS friendships_user_idx ON friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_idx ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS study_groups_owner_idx ON study_groups(owner_id);
CREATE INDEX IF NOT EXISTS study_group_members_group_idx ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS study_group_members_user_idx ON study_group_members(user_id);
