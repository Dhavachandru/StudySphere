import { supabase } from './supabase';
import type { ClassAttendanceRecord, AttendanceStatus } from './types';
import { INITIAL_STUDENT_ROSTER } from './teacherService';

const STORAGE_KEY_ATTENDANCE = 'studysphere_class_attendance';

export const TEACHER_SUBJECTS = [
  'Data Structures & Algorithms',
  'Database Management Systems',
  'Web Technologies',
  'Operating Systems',
  'Computer Networks',
  'Artificial Intelligence',
];

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

const INITIAL_ATTENDANCE: ClassAttendanceRecord[] = [
  // Yesterday's attendance for Data Structures
  {
    id: 'att-1',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    student_id: 'std-1',
    student_name: 'Aarav Sharma',
    student_email: 'aarav.sharma@studysphere.edu',
    student_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    subject: 'Data Structures & Algorithms',
    date: yesterday,
    status: 'present',
    remarks: 'Active in class discussion',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'att-2',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    student_id: 'std-2',
    student_name: 'Ananya Verma',
    student_email: 'ananya.v@studysphere.edu',
    student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    subject: 'Data Structures & Algorithms',
    date: yesterday,
    status: 'present',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'att-3',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    student_id: 'std-3',
    student_name: 'Rohan Mehta',
    student_email: 'rohan.m@studysphere.edu',
    student_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    subject: 'Data Structures & Algorithms',
    date: yesterday,
    status: 'absent',
    remarks: 'Informed sick leave',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'att-4',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    student_id: 'std-4',
    student_name: 'Sneha Patel',
    student_email: 'sneha.patel@studysphere.edu',
    student_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    subject: 'Data Structures & Algorithms',
    date: yesterday,
    status: 'late',
    remarks: 'Arrived 15 minutes late',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'att-5',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    student_id: 'std-5',
    student_name: 'Vikram Sengupta',
    student_email: 'vikram.s@studysphere.edu',
    student_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    subject: 'Data Structures & Algorithms',
    date: yesterday,
    status: 'present',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'att-6',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    student_id: 'std-6',
    student_name: 'Diya Krishnan',
    student_email: 'diya.k@studysphere.edu',
    student_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    subject: 'Data Structures & Algorithms',
    date: yesterday,
    status: 'present',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },

  // Two days ago for Database Management Systems
  {
    id: 'att-7',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    student_id: 'std-1',
    student_name: 'Aarav Sharma',
    subject: 'Database Management Systems',
    date: twoDaysAgo,
    status: 'present',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'att-8',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    student_id: 'std-2',
    student_name: 'Ananya Verma',
    subject: 'Database Management Systems',
    date: twoDaysAgo,
    status: 'present',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'att-9',
    teacher_id: 'prof-1',
    teacher_name: 'Dr. Radhakrishnan',
    student_id: 'std-3',
    student_name: 'Rohan Mehta',
    subject: 'Database Management Systems',
    date: twoDaysAgo,
    status: 'absent',
    remarks: 'Unexcused absent',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function getLocalAttendance(): ClassAttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
      return INITIAL_ATTENDANCE;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ATTENDANCE;
  }
}

function setLocalAttendance(records: ClassAttendanceRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
  } catch {
    // ignore
  }
}

export const attendanceService = {
  async getAttendanceForDate(subject: string, date: string): Promise<ClassAttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('class_attendance')
        .select('*')
        .eq('subject', subject)
        .eq('date', date);

      if (!error && data && data.length > 0) {
        return data as ClassAttendanceRecord[];
      }
    } catch {
      // ignore
    }

    const local = getLocalAttendance();
    return local.filter((r) => r.subject === subject && r.date === date);
  },

  async saveClassAttendance(records: ClassAttendanceRecord[]): Promise<void> {
    try {
      await supabase.from('class_attendance').upsert(records, { onConflict: 'id' });
    } catch {
      // ignore
    }

    const local = getLocalAttendance();
    const map = new Map<string, ClassAttendanceRecord>();
    local.forEach((r) => map.set(`${r.subject}-${r.date}-${r.student_id || r.student_name}`, r));
    records.forEach((r) => map.set(`${r.subject}-${r.date}-${r.student_id || r.student_name}`, r));
    setLocalAttendance(Array.from(map.values()));
  },

  async getAttendanceHistory(subject?: string): Promise<ClassAttendanceRecord[]> {
    try {
      let query = supabase.from('class_attendance').select('*').order('date', { ascending: false });
      if (subject) {
        query = query.eq('subject', subject);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as ClassAttendanceRecord[];
      }
    } catch {
      // ignore
    }

    const local = getLocalAttendance();
    if (subject) {
      return local.filter((r) => r.subject === subject).sort((a, b) => b.date.localeCompare(a.date));
    }
    return [...local].sort((a, b) => b.date.localeCompare(a.date));
  },

  async getStudentAttendanceHistory(studentId: string, studentName?: string): Promise<ClassAttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('class_attendance')
        .select('*')
        .or(`student_id.eq.${studentId},student_name.ilike.%${studentName || ''}%`)
        .order('date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as ClassAttendanceRecord[];
      }
    } catch {
      // ignore
    }

    const local = getLocalAttendance();
    const normalizedName = (studentName || '').toLowerCase().trim();
    return local
      .filter((r) => r.student_id === studentId || (normalizedName && r.student_name.toLowerCase().includes(normalizedName)))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async getAttendanceStats(): Promise<{
    totalMarkedSessions: number;
    overallPercentage: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
  }> {
    const history = await this.getAttendanceHistory();
    if (history.length === 0) {
      return { totalMarkedSessions: 0, overallPercentage: 100, presentCount: 0, absentCount: 0, lateCount: 0 };
    }

    const present = history.filter((h) => h.status === 'present').length;
    const absent = history.filter((h) => h.status === 'absent').length;
    const late = history.filter((h) => h.status === 'late').length;
    const excused = history.filter((h) => h.status === 'excused').length;

    const total = history.length;
    const pct = total > 0 ? Math.round(((present + late * 0.75 + excused) / total) * 100) : 100;

    return {
      totalMarkedSessions: new Set(history.map((h) => `${h.subject}-${h.date}`)).size,
      overallPercentage: pct,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
    };
  },
};
