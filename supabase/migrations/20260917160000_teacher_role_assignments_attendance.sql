/*
# Teacher Role, Assignments & Class Attendance System

1. Profiles Extension:
   - Adds `role` (text, default 'student')
   - Adds `teacher_id` (text, nullable)
   - Adds `designation` (text, nullable)
   - Adds `specialization` (text, nullable)

2. New Tables:
   - `teacher_tasks`: Tasks & assignments created by teachers for classes/students
   - `task_submissions`: Submissions made by students with teacher grades & feedback
   - `class_attendance`: Attendance recorded by teachers per subject and date

3. Security:
   - RLS enabled on all new tables
   - Teachers can manage their tasks and attendance
   - Authenticated students can view tasks and their own attendance/submissions
*/

-- 1. Profiles columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'student';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN teacher_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'designation'
  ) THEN
    ALTER TABLE profiles ADD COLUMN designation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'specialization'
  ) THEN
    ALTER TABLE profiles ADD COLUMN specialization text;
  END IF;
END $$;

-- 2. teacher_tasks table
CREATE TABLE IF NOT EXISTS teacher_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_name text NOT NULL,
  teacher_avatar text,
  title text NOT NULL,
  subject text NOT NULL,
  department text,
  description text DEFAULT '',
  due_date date,
  total_points integer DEFAULT 100,
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teacher_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_teacher_tasks" ON teacher_tasks;
CREATE POLICY "select_teacher_tasks"
  ON teacher_tasks FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_teacher_tasks" ON teacher_tasks;
CREATE POLICY "insert_teacher_tasks"
  ON teacher_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "update_teacher_tasks" ON teacher_tasks;
CREATE POLICY "update_teacher_tasks"
  ON teacher_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "delete_teacher_tasks" ON teacher_tasks;
CREATE POLICY "delete_teacher_tasks"
  ON teacher_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);

CREATE INDEX IF NOT EXISTS teacher_tasks_teacher_idx ON teacher_tasks(teacher_id);
CREATE INDEX IF NOT EXISTS teacher_tasks_subject_idx ON teacher_tasks(subject);

-- 3. task_submissions table
CREATE TABLE IF NOT EXISTS task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES teacher_tasks(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_email text,
  student_avatar text,
  submission_text text DEFAULT '',
  submission_link text,
  status text DEFAULT 'submitted',
  grade numeric,
  feedback text,
  submitted_at timestamptz DEFAULT now(),
  graded_at timestamptz
);

ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_teacher_submissions" ON task_submissions;
CREATE POLICY "select_own_or_teacher_submissions"
  ON task_submissions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM teacher_tasks
      WHERE teacher_tasks.id = task_submissions.task_id AND teacher_tasks.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_student_submissions" ON task_submissions;
CREATE POLICY "insert_student_submissions"
  ON task_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "update_submissions" ON task_submissions;
CREATE POLICY "update_submissions"
  ON task_submissions FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM teacher_tasks
      WHERE teacher_tasks.id = task_submissions.task_id AND teacher_tasks.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_student_submissions" ON task_submissions;
CREATE POLICY "delete_student_submissions"
  ON task_submissions FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

CREATE INDEX IF NOT EXISTS task_submissions_task_idx ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS task_submissions_student_idx ON task_submissions(student_id);

-- 4. class_attendance table
CREATE TABLE IF NOT EXISTS class_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_name text NOT NULL,
  student_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  student_email text,
  student_avatar text,
  subject text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  remarks text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE class_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_class_attendance" ON class_attendance;
CREATE POLICY "select_class_attendance"
  ON class_attendance FOR SELECT
  TO authenticated
  USING (
    auth.uid() = teacher_id OR
    auth.uid() = student_id OR
    student_id IS NULL
  );

DROP POLICY IF EXISTS "insert_class_attendance" ON class_attendance;
CREATE POLICY "insert_class_attendance"
  ON class_attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "update_class_attendance" ON class_attendance;
CREATE POLICY "update_class_attendance"
  ON class_attendance FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "delete_class_attendance" ON class_attendance;
CREATE POLICY "delete_class_attendance"
  ON class_attendance FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);

CREATE INDEX IF NOT EXISTS class_attendance_teacher_idx ON class_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS class_attendance_student_idx ON class_attendance(student_id);
CREATE INDEX IF NOT EXISTS class_attendance_date_idx ON class_attendance(date);
CREATE INDEX IF NOT EXISTS class_attendance_subject_idx ON class_attendance(subject);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
