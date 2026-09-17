import { supabase } from './supabase';
import type { TeacherTask, TaskSubmission, StudentRosterItem } from './types';

const STORAGE_KEY_TASKS = 'studysphere_teacher_tasks';
const STORAGE_KEY_SUBMISSIONS = 'studysphere_task_submissions';
const STORAGE_KEY_ROSTER = 'studysphere_student_roster';

export const INITIAL_STUDENT_ROSTER: StudentRosterItem[] = [
  {
    id: 'std-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@studysphere.edu',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    department: 'Computer Science',
    semester: 6,
    roll_number: 'CS2024-001',
    attendance_rate: 92,
    tasks_completed: 8,
    total_tasks: 10,
  },
  {
    id: 'std-2',
    name: 'Ananya Verma',
    email: 'ananya.v@studysphere.edu',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    department: 'Computer Science',
    semester: 6,
    roll_number: 'CS2024-002',
    attendance_rate: 96,
    tasks_completed: 10,
    total_tasks: 10,
  },
  {
    id: 'std-3',
    name: 'Rohan Mehta',
    email: 'rohan.m@studysphere.edu',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    department: 'Information Technology',
    semester: 6,
    roll_number: 'IT2024-015',
    attendance_rate: 71,
    tasks_completed: 5,
    total_tasks: 10,
  },
  {
    id: 'std-4',
    name: 'Sneha Patel',
    email: 'sneha.patel@studysphere.edu',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    department: 'Computer Science',
    semester: 6,
    roll_number: 'CS2024-004',
    attendance_rate: 88,
    tasks_completed: 9,
    total_tasks: 10,
  },
  {
    id: 'std-5',
    name: 'Vikram Sengupta',
    email: 'vikram.s@studysphere.edu',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    department: 'Artificial Intelligence',
    semester: 4,
    roll_number: 'AI2024-009',
    attendance_rate: 84,
    tasks_completed: 7,
    total_tasks: 10,
  },
  {
    id: 'std-6',
    name: 'Diya Krishnan',
    email: 'diya.k@studysphere.edu',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    department: 'Computer Science',
    semester: 6,
    roll_number: 'CS2024-012',
    attendance_rate: 98,
    tasks_completed: 10,
    total_tasks: 10,
  },
];

const INITIAL_TASKS: TeacherTask[] = [
  {
    id: 'task-1',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    title: 'Implement Red-Black Tree Balanced Deletion',
    subject: 'Data Structures & Algorithms',
    department: 'Computer Science',
    description: 'Implement deletion and rotational balance fixup for Red-Black trees in Java or C++. Include unit tests covering double-black cases.',
    due_date: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    total_points: 100,
    priority: 'high',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'task-2',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    title: 'Relational Schema Normalization & BCNF Decomposition',
    subject: 'Database Management Systems',
    department: 'Computer Science',
    description: 'Given the hospital management enterprise scenario, compute minimal cover, candidate keys, and decompose to 3NF and Boyce-Codd Normal Form with lossless join guarantee.',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    total_points: 50,
    priority: 'medium',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'task-3',
    teacher_id: 'prof-2',
    teacher_name: 'Prof. Anita Sharma',
    title: 'RESTful API with JWT Authentication & Role-Based Middleware',
    subject: 'Web Technologies',
    department: 'Information Technology',
    description: 'Build a secure Node.js/Express or FastAPI service with token refresh rotation, bcrypt password hashing, and role verification for Student and Faculty portals.',
    due_date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    total_points: 100,
    priority: 'high',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_SUBMISSIONS: TaskSubmission[] = [
  {
    id: 'sub-1',
    task_id: 'task-1',
    student_id: 'std-1',
    student_name: 'Aarav Sharma',
    student_email: 'aarav.sharma@studysphere.edu',
    student_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    submission_text: 'Completed Red-Black deletion algorithm with 10 unit tests covering all 4 recoloring/rotation cases. Code is hosted on GitHub.',
    submission_link: 'https://github.com/aarav-sharma/rb-tree-algorithms',
    status: 'graded',
    grade: 96,
    feedback: 'Excellent implementation of double-black fixup logic. Great test coverage.',
    submitted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    graded_at: new Date().toISOString(),
  },
  {
    id: 'sub-2',
    task_id: 'task-1',
    student_id: 'std-2',
    student_name: 'Ananya Verma',
    student_email: 'ananya.v@studysphere.edu',
    student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    submission_text: 'Here is my submission in C++ with memory profiling and valgrind clean runs.',
    submission_link: 'https://github.com/ananya-v/dsa-redblack-cpp',
    status: 'submitted',
    grade: null,
    feedback: null,
    submitted_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'sub-3',
    task_id: 'task-2',
    student_id: 'std-4',
    student_name: 'Sneha Patel',
    student_email: 'sneha.patel@studysphere.edu',
    student_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    submission_text: 'Solved all parts: minimal cover derivation and step-by-step BCNF algorithm.',
    submission_link: 'https://drive.google.com/file/d/demo-dbms-assignment/view',
    status: 'submitted',
    grade: null,
    feedback: null,
    submitted_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

// Helper functions for Local Storage
function getLocalTasks(): TeacherTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TASKS;
  }
}

function setLocalTasks(tasks: TeacherTask[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch {
    // ignore
  }
}

function getLocalSubmissions(): TaskSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
      return INITIAL_SUBMISSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SUBMISSIONS;
  }
}

function setLocalSubmissions(subs: TaskSubmission[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(subs));
  } catch {
    // ignore
  }
}

// Teacher Service API
export const teacherService = {
  async getTasks(teacherId?: string): Promise<TeacherTask[]> {
    try {
      let query = supabase.from('teacher_tasks').select('*').order('created_at', { ascending: false });
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as TeacherTask[];
      }
    } catch {
      // ignore
    }

    const local = getLocalTasks();
    if (teacherId) {
      return local.filter((t) => t.teacher_id === teacherId || t.teacher_id === 'prof-1');
    }
    return local;
  },

  async getAllTasks(): Promise<TeacherTask[]> {
    try {
      const { data, error } = await supabase.from('teacher_tasks').select('*').order('due_date', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as TeacherTask[];
      }
    } catch {
      // ignore
    }
    return getLocalTasks();
  },

  async createTask(taskData: Omit<TeacherTask, 'id' | 'created_at'>): Promise<TeacherTask> {
    const newTask: TeacherTask = {
      ...taskData,
      id: 'task-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('teacher_tasks').insert(newTask).select('*').maybeSingle();
      if (!error && data) {
        const local = getLocalTasks();
        setLocalTasks([data as TeacherTask, ...local]);
        return data as TeacherTask;
      }
    } catch {
      // ignore
    }

    const local = getLocalTasks();
    setLocalTasks([newTask, ...local]);
    return newTask;
  },

  async updateTask(id: string, patch: Partial<TeacherTask>): Promise<TeacherTask | null> {
    try {
      await supabase.from('teacher_tasks').update(patch).eq('id', id);
    } catch {
      // ignore
    }

    const local = getLocalTasks();
    const updated = local.map((t) => (t.id === id ? { ...t, ...patch } : t));
    setLocalTasks(updated);
    return updated.find((t) => t.id === id) ?? null;
  },

  async deleteTask(id: string): Promise<void> {
    try {
      await supabase.from('teacher_tasks').delete().eq('id', id);
    } catch {
      // ignore
    }

    const local = getLocalTasks();
    setLocalTasks(local.filter((t) => t.id !== id));
  },

  async getSubmissions(taskId: string): Promise<TaskSubmission[]> {
    try {
      const { data, error } = await supabase.from('task_submissions').select('*').eq('task_id', taskId);
      if (!error && data && data.length > 0) {
        return data as TaskSubmission[];
      }
    } catch {
      // ignore
    }

    const local = getLocalSubmissions();
    return local.filter((s) => s.task_id === taskId);
  },

  async getAllSubmissions(): Promise<TaskSubmission[]> {
    try {
      const { data, error } = await supabase.from('task_submissions').select('*').order('submitted_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as TaskSubmission[];
      }
    } catch {
      // ignore
    }
    return getLocalSubmissions();
  },

  async submitTask(
    submissionData: Omit<TaskSubmission, 'id' | 'submitted_at' | 'status'>
  ): Promise<TaskSubmission> {
    const newSub: TaskSubmission = {
      ...submissionData,
      id: 'sub-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('task_submissions').upsert(newSub, { onConflict: 'id' }).select('*').maybeSingle();
      if (!error && data) {
        const local = getLocalSubmissions();
        setLocalSubmissions([data as TaskSubmission, ...local.filter((s) => s.id !== data.id)]);
        return data as TaskSubmission;
      }
    } catch {
      // ignore
    }

    const local = getLocalSubmissions();
    // Replace if exists for student & task or add new
    const filtered = local.filter((s) => !(s.task_id === submissionData.task_id && s.student_id === submissionData.student_id));
    setLocalSubmissions([newSub, ...filtered]);
    return newSub;
  },

  async gradeSubmission(
    submissionId: string,
    grade: number | string,
    feedback: string
  ): Promise<TaskSubmission | null> {
    const patch = {
      grade,
      feedback,
      status: 'graded' as const,
      graded_at: new Date().toISOString(),
    };

    try {
      await supabase.from('task_submissions').update(patch).eq('id', submissionId);
    } catch {
      // ignore
    }

    const local = getLocalSubmissions();
    const updated = local.map((s) => (s.id === submissionId ? { ...s, ...patch } : s));
    setLocalSubmissions(updated);
    return updated.find((s) => s.id === submissionId) ?? null;
  },

  async getStudentSubmissions(studentId: string): Promise<TaskSubmission[]> {
    try {
      const { data, error } = await supabase.from('task_submissions').select('*').eq('student_id', studentId);
      if (!error && data && data.length > 0) {
        return data as TaskSubmission[];
      }
    } catch {
      // ignore
    }

    const local = getLocalSubmissions();
    return local.filter((s) => s.student_id === studentId);
  },

  async getStudentRoster(): Promise<StudentRosterItem[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .limit(20);

      if (!error && data && data.length > 0) {
        const realStudents: StudentRosterItem[] = data.map((p, idx) => ({
          id: p.id,
          name: p.full_name || 'Student ' + (idx + 1),
          email: (p.statistics?.account_email as string) || (p.username ? `${p.username}@studysphere.edu` : `student${idx + 1}@studysphere.edu`),
          avatar_url: p.avatar_url,
          department: p.department || 'Computer Science',
          semester: p.semester || 6,
          roll_number: `CS2024-${String(idx + 10).padStart(3, '0')}`,
          attendance_rate: 88,
          tasks_completed: 6,
          total_tasks: 10,
        }));

        // Merge with initial roster to ensure rich list
        const existingIds = new Set(realStudents.map((s) => s.id));
        const combined = [...realStudents, ...INITIAL_STUDENT_ROSTER.filter((s) => !existingIds.has(s.id))];
        return combined;
      }
    } catch {
      // ignore
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_ROSTER);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }

    return INITIAL_STUDENT_ROSTER;
  },
};
