export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  college: string | null;
  department: string | null;
  semester: number | null;
  bio: string | null;
  achievements: string[] | null;
  statistics: Record<string, number> | null;
  created_at?: string;
  updated_at?: string;
};

export type Subject = {
  id: string;
  user_id: string;
  name: string;
  code: string | null;
  color: string;
  instructor: string | null;
  credits: number | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceRecord = {
  id: string;
  user_id: string;
  subject_id: string | null;
  subject_name: string | null;
  date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ExamScheduleEntry = {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  exam_date: string;
  exam_time: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CodingProgressRow = {
  id: string;
  user_id: string;
  day: string;
  problems_solved: number;
  hours: number;
  languages: string[];
  streak: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type StudyGoal = {
  id: string;
  user_id: string;
  title: string;
  period: string;
  target_hours: number;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  related_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type Assignment = {
  id: string;
  user_id: string;
  title: string;
  subject: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type PlannerEntry = {
  id: string;
  user_id: string;
  entry_type: string;
  title: string | null;
  subject: string | null;
  start_time: string | null;
  end_time: string | null;
  day_of_week: string | null;
  exam_date: string | null;
  attendance_total: number;
  attendance_present: number;
  semester_number: number | null;
  gpa: number | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  folder: string;
  favicon: string | null;
  created_at: string;
};

export type HistoryEntry = {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  visited_at: string;
};

export type Download = {
  id: string;
  user_id: string;
  filename: string;
  url: string;
  progress: number;
  status: string;
  size_bytes: number | null;
  created_at: string;
};

export type AnalyticsRow = {
  id: string;
  user_id: string;
  day: string;
  study_hours: number;
  coding_hours: number;
  productivity_score: number;
  assignments_done: number;
  attendance_present: number;
  attendance_total: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type Settings = {
  user_id: string;
  theme: string;
  notifications: boolean;
  privacy_public: boolean;
  language: string;
  account_email: string | null;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  conversation_id: string;
  role: string;
  content: string;
  kind: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
