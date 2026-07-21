/*
# StudySphere — extend schema with new feature tables + profile bio

## Overview
Adds 6 new owner-scoped tables to support attendance, subjects, exam schedule,
coding progress, study goals, and notifications. Also adds a `bio` column to the
existing `profiles` table. Every new table has RLS enabled with four owner-scoped
CRUD policies (select/insert/update/delete) using `auth.uid() = user_id`, and
`user_id` defaults to `auth.uid()` so client inserts that omit the owner succeed.

## Modified Tables
- `profiles` — added `bio` (text, nullable) for user biography.

## New Tables
1. `subjects` — academic subjects a user is enrolled in (name, code, color, instructor).
2. `attendance` — per-subject attendance records (date, present/absent, subject_id optional).
3. `exam_schedule` — scheduled exams with subject, date, time, location, status.
4. `coding_progress` — daily coding log (problems solved, hours, languages, streak).
5. `study_goals` — daily/weekly study goals (title, target hours, completed, period).
6. `notifications` — in-app notifications (type, message, read, related entity).

## Security
- RLS enabled on every new table.
- Four owner-scoped CRUD policies per table using `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` on all new tables.
*/

-- Add bio column to profiles (non-destructive)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- subjects
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  color text DEFAULT '#6366f1',
  instructor text,
  credits integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS subjects_user_idx ON subjects(user_id);

DROP POLICY IF EXISTS "select_own_subjects" ON subjects;
CREATE POLICY "select_own_subjects" ON subjects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_subjects" ON subjects;
CREATE POLICY "insert_own_subjects" ON subjects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_subjects" ON subjects;
CREATE POLICY "update_own_subjects" ON subjects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_subjects" ON subjects;
CREATE POLICY "delete_own_subjects" ON subjects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  subject_name text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS attendance_user_idx ON attendance(user_id);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance(date);

DROP POLICY IF EXISTS "select_own_attendance" ON attendance;
CREATE POLICY "select_own_attendance" ON attendance FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_attendance" ON attendance;
CREATE POLICY "insert_own_attendance" ON attendance FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_attendance" ON attendance;
CREATE POLICY "update_own_attendance" ON attendance FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_attendance" ON attendance;
CREATE POLICY "delete_own_attendance" ON attendance FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- exam_schedule
CREATE TABLE IF NOT EXISTS exam_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text,
  exam_date date NOT NULL,
  exam_time text,
  location text,
  status text DEFAULT 'upcoming',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE exam_schedule ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS exam_schedule_user_idx ON exam_schedule(user_id);
CREATE INDEX IF NOT EXISTS exam_schedule_date_idx ON exam_schedule(exam_date);

DROP POLICY IF EXISTS "select_own_exams" ON exam_schedule;
CREATE POLICY "select_own_exams" ON exam_schedule FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_exams" ON exam_schedule;
CREATE POLICY "insert_own_exams" ON exam_schedule FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_exams" ON exam_schedule;
CREATE POLICY "update_own_exams" ON exam_schedule FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_exams" ON exam_schedule;
CREATE POLICY "delete_own_exams" ON exam_schedule FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- coding_progress
CREATE TABLE IF NOT EXISTS coding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  problems_solved integer DEFAULT 0,
  hours numeric(5,2) DEFAULT 0,
  languages text[] DEFAULT '{}',
  streak integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, day)
);
ALTER TABLE coding_progress ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS coding_progress_user_idx ON coding_progress(user_id);
CREATE INDEX IF NOT EXISTS coding_progress_day_idx ON coding_progress(day);

DROP POLICY IF EXISTS "select_own_coding_progress" ON coding_progress;
CREATE POLICY "select_own_coding_progress" ON coding_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_coding_progress" ON coding_progress;
CREATE POLICY "insert_own_coding_progress" ON coding_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_coding_progress" ON coding_progress;
CREATE POLICY "update_own_coding_progress" ON coding_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_coding_progress" ON coding_progress;
CREATE POLICY "delete_own_coding_progress" ON coding_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- study_goals
CREATE TABLE IF NOT EXISTS study_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  period text NOT NULL DEFAULT 'daily',
  target_hours numeric(5,2) DEFAULT 0,
  completed boolean DEFAULT false,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE study_goals ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS study_goals_user_idx ON study_goals(user_id);

DROP POLICY IF EXISTS "select_own_study_goals" ON study_goals;
CREATE POLICY "select_own_study_goals" ON study_goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_study_goals" ON study_goals;
CREATE POLICY "insert_own_study_goals" ON study_goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_study_goals" ON study_goals;
CREATE POLICY "update_own_study_goals" ON study_goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_study_goals" ON study_goals;
CREATE POLICY "delete_own_study_goals" ON study_goals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
