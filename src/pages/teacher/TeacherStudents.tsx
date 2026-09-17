import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  Calendar,
  Mail,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/State';
import { Modal } from '../../components/ui/Modal';
import { teacherService } from '../../lib/teacherService';
import { attendanceService } from '../../lib/attendanceService';
import type { StudentRosterItem, ClassAttendanceRecord } from '../../lib/types';

export default function TeacherStudents() {
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Modal for individual student history
  const [selectedStudent, setSelectedStudent] = useState<StudentRosterItem | null>(null);
  const [studentHistory, setStudentHistory] = useState<ClassAttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await teacherService.getStudentRoster();
        setRoster(data);
      } catch (err) {
        console.error('Failed to load student roster', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openStudentHistory = async (student: StudentRosterItem) => {
    setSelectedStudent(student);
    setHistoryLoading(true);
    try {
      const records = await attendanceService.getStudentAttendanceHistory(student.id, student.name);
      setStudentHistory(records);
    } catch (err) {
      console.error('Failed to load student history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const departments = ['all', ...Array.from(new Set(roster.map((s) => s.department)))];

  const filtered = roster.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === 'all' || s.department === selectedDept;
    return matchSearch && matchDept;
  });

  if (loading) return <Loading label="Loading student directory..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2.5">
            <Users className="text-emerald-500" /> Student Directory & Academic Roster
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/60">
            Monitor student attendance percentages, coursework completion, and academic standings.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl glass border border-white/10 self-start sm:self-auto">
          {filtered.length} Students Enrolled
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass border border-white/10 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl glass border border-white/10 bg-transparent outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d} className="dark:bg-slate-900">
                {d === 'all' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Students Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((student) => {
          const isAtRisk = student.attendance_rate < 75;

          return (
            <GlassCard
              key={student.id}
              className={`p-5 flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-all ${
                isAtRisk ? 'border-rose-500/30' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.name}
                        className="w-11 h-11 rounded-xl object-cover border border-white/20 shadow-md"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl gradient-brand text-white flex items-center justify-center font-bold text-sm shadow-md">
                        {student.name[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm">{student.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{student.roll_number}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isAtRisk
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}
                  >
                    {student.attendance_rate}%
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-white/60 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-slate-400" />
                    {student.department} &bull; Semester {student.semester}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    {student.email}
                  </p>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ClipboardList size={12} /> Tasks completed:
                  </span>
                  <span className="font-semibold text-slate-300">
                    {student.tasks_completed}/{student.total_tasks}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openStudentHistory(student)}
                  className="w-full text-xs"
                >
                  <Calendar size={13} /> View Attendance Record
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Modal: Student Detailed Attendance Record */}
      <Modal
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={`Academic Record: ${selectedStudent?.name}`}
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl glass border border-white/10 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold">{selectedStudent?.department}</p>
              <p className="text-slate-400">Roll: {selectedStudent?.roll_number}</p>
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-bold ${
                  (selectedStudent?.attendance_rate ?? 0) >= 75 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {selectedStudent?.attendance_rate}%
              </span>
              <p className="text-[10px] text-slate-400">Overall Attendance</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs mb-2">Subject Session History</h4>
            {historyLoading ? (
              <Loading label="Fetching records..." />
            ) : studentHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No individual session records logged yet for this student.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {studentHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-xl glass border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold">{rec.subject}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(rec.date).toLocaleDateString()} {rec.remarks ? `— "${rec.remarks}"` : ''}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rec.status === 'present'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : rec.status === 'absent'
                          ? 'bg-rose-500/10 text-rose-500'
                          : rec.status === 'late'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-sky-500/10 text-sky-500'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
