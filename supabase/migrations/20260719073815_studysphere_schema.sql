/*
# StudySphere — full schema with Row Level Security

## Overview
StudySphere is a multi-user student productivity platform. Every table is owner-scoped
to the authenticated user via a `user_id` column that defaults to `auth.uid()`, so client
inserts that omit the owner still satisfy RLS. Each table has four CRUD policies
(select/insert/update/delete) restricted to `authenticated` users who own the row.

## New Tables
1. `profiles` — user profile (college, department, semester, avatar, achievements, stats).
2. `notes` — rich-text / markdown notes with category, pin, favorite, autosave.
3. `assignments` — assignment tracker with title, subject, due date, status, priority.
4. `planner` — planner entries: timetable, study plan, exams, attendance, semester, GPA.
5. `bookmarks` — bookmark folders + bookmark items with url, title, folder.
6. `history` — browsing history entries (url, title, visited_at).
7. `downloads` — download manager entries (url, filename, progress, status).
8. `analytics` — daily analytics buckets (study hours, coding hours, productivity score).
9. `settings` — per-user settings (theme, notifications, privacy, language, account).
10. `chat_history` — AI assistant conversations and messages.

## Security
- RLS enabled on every table.
- Four owner-scoped CRUD policies per table using `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` so inserts without an explicit owner succeed.
- `profiles` uses `id = auth.uid()` (one row per user) instead of a separate user_id.
*/

-- profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  college text,
  department text,
  semester integer DEFAULT 1,
  achievements jsonb DEFAULT '[]'::jsonb,
  statistics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- notes
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  content text DEFAULT '',
  category text DEFAULT 'General',
  pinned boolean DEFAULT false,
  favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notes_user_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_updated_idx ON notes(updated_at DESC);

DROP POLICY IF EXISTS "select_own_notes" ON notes;
CREATE POLICY "select_own_notes" ON notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notes" ON notes;
CREATE POLICY "insert_own_notes" ON notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notes" ON notes;
CREATE POLICY "update_own_notes" ON notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notes" ON notes;
CREATE POLICY "delete_own_notes" ON notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text,
  due_date date,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS assignments_user_idx ON assignments(user_id);
CREATE INDEX IF NOT EXISTS assignments_due_idx ON assignments(due_date);

DROP POLICY IF EXISTS "select_own_assignments" ON assignments;
CREATE POLICY "select_own_assignments" ON assignments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_assignments" ON assignments;
CREATE POLICY "insert_own_assignments" ON assignments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_assignments" ON assignments;
CREATE POLICY "update_own_assignments" ON assignments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_assignments" ON assignments;
CREATE POLICY "delete_own_assignments" ON assignments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- planner
CREATE TABLE IF NOT EXISTS planner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type text NOT NULL DEFAULT 'timetable',
  title text,
  subject text,
  start_time timestamptz,
  end_time timestamptz,
  day_of_week text,
  exam_date date,
  attendance_total integer DEFAULT 0,
  attendance_present integer DEFAULT 0,
  semester_number integer,
  gpa numeric(3,2),
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE planner ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS planner_user_idx ON planner(user_id);
CREATE INDEX IF NOT EXISTS planner_type_idx ON planner(entry_type);

DROP POLICY IF EXISTS "select_own_planner" ON planner;
CREATE POLICY "select_own_planner" ON planner FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_planner" ON planner;
CREATE POLICY "insert_own_planner" ON planner FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_planner" ON planner;
CREATE POLICY "update_own_planner" ON planner FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_planner" ON planner;
CREATE POLICY "delete_own_planner" ON planner FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  folder text DEFAULT 'Default',
  favicon text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS bookmarks_user_idx ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS bookmarks_folder_idx ON bookmarks(folder);

DROP POLICY IF EXISTS "select_own_bookmarks" ON bookmarks;
CREATE POLICY "select_own_bookmarks" ON bookmarks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_bookmarks" ON bookmarks;
CREATE POLICY "insert_own_bookmarks" ON bookmarks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_bookmarks" ON bookmarks;
CREATE POLICY "update_own_bookmarks" ON bookmarks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_bookmarks" ON bookmarks;
CREATE POLICY "delete_own_bookmarks" ON bookmarks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- history
CREATE TABLE IF NOT EXISTS history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  visited_at timestamptz DEFAULT now()
);
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS history_user_idx ON history(user_id);
CREATE INDEX IF NOT EXISTS history_visited_idx ON history(visited_at DESC);

DROP POLICY IF EXISTS "select_own_history" ON history;
CREATE POLICY "select_own_history" ON history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_history" ON history;
CREATE POLICY "insert_own_history" ON history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_history" ON history;
CREATE POLICY "update_own_history" ON history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_history" ON history;
CREATE POLICY "delete_own_history" ON history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- downloads
CREATE TABLE IF NOT EXISTS downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  url text NOT NULL,
  progress integer DEFAULT 0,
  status text DEFAULT 'pending',
  size_bytes bigint,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS downloads_user_idx ON downloads(user_id);

DROP POLICY IF EXISTS "select_own_downloads" ON downloads;
CREATE POLICY "select_own_downloads" ON downloads FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_downloads" ON downloads;
CREATE POLICY "insert_own_downloads" ON downloads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_downloads" ON downloads;
CREATE POLICY "update_own_downloads" ON downloads FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_downloads" ON downloads;
CREATE POLICY "delete_own_downloads" ON downloads FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- analytics
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  study_hours numeric(5,2) DEFAULT 0,
  coding_hours numeric(5,2) DEFAULT 0,
  productivity_score integer DEFAULT 0,
  assignments_done integer DEFAULT 0,
  attendance_present integer DEFAULT 0,
  attendance_total integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, day)
);
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS analytics_user_idx ON analytics(user_id);
CREATE INDEX IF NOT EXISTS analytics_day_idx ON analytics(day);

DROP POLICY IF EXISTS "select_own_analytics" ON analytics;
CREATE POLICY "select_own_analytics" ON analytics FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_analytics" ON analytics;
CREATE POLICY "insert_own_analytics" ON analytics FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_analytics" ON analytics;
CREATE POLICY "update_own_analytics" ON analytics FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_analytics" ON analytics;
CREATE POLICY "delete_own_analytics" ON analytics FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- settings
CREATE TABLE IF NOT EXISTS settings (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'dark',
  notifications boolean DEFAULT true,
  privacy_public boolean DEFAULT false,
  language text DEFAULT 'en',
  account_email text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON settings;
CREATE POLICY "select_own_settings" ON settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_settings" ON settings;
CREATE POLICY "insert_own_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_settings" ON settings;
CREATE POLICY "update_own_settings" ON settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_settings" ON settings;
CREATE POLICY "delete_own_settings" ON settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- chat_history
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid DEFAULT gen_random_uuid(),
  role text NOT NULL,
  content text NOT NULL,
  kind text DEFAULT 'chat',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS chat_user_idx ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS chat_conv_idx ON chat_history(conversation_id);
CREATE INDEX IF NOT EXISTS chat_created_idx ON chat_history(created_at DESC);

DROP POLICY IF EXISTS "select_own_chats" ON chat_history;
CREATE POLICY "select_own_chats" ON chat_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_chats" ON chat_history;
CREATE POLICY "insert_own_chats" ON chat_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_chats" ON chat_history;
CREATE POLICY "update_own_chats" ON chat_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_chats" ON chat_history;
CREATE POLICY "delete_own_chats" ON chat_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
