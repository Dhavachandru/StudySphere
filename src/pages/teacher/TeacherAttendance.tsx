import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Save,
  Users,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/State';
import { useAuth } from '../../lib/auth';
import { teacherService } from '../../lib/teacherService';
import { attendanceService, TEACHER_SUBJECTS } from '../../lib/attendanceService';
import type { StudentRosterItem, ClassAttendanceRecord, AttendanceStatus } from '../../lib/types';

export default function TeacherAttendance() {
  const { profile, user } = useAuth();
  const [searchParams] = useSearchParams();

  const [subject, setSubject] = useState(searchParams.get('subject') || TEACHER_SUBJECTS[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [history, setHistory] = useState<ClassAttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'mark' | 'history'>('mark');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load roster and attendance for selected subject and date
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rosterData, existingRecords, histData] = await Promise.all([
          teacherService.getStudentRoster(),
          attendanceService.getAttendanceForDate(subject, date),
          attendanceService.getAttendanceHistory(subject),
        ]);
        setStudents(rosterData);
        setHistory(histData);

        // Pre-populate map from existing records, or default all to 'present'
        const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};
        rosterData.forEach((s) => {
          const rec = existingRecords.find((r) => r.student_id === s.id || r.student_name === s.name);
          if (rec) {
            initialMap[s.id] = { status: rec.status, remarks: rec.remarks || '' };
          } else {
            initialMap[s.id] = { status: 'present', remarks: '' };
          }
        });
        setAttendanceMap(initialMap);
      } catch (err) {
        console.error('Failed to load attendance', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [subject, date]);

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || '',
      },
    }));
    setSavedSuccess(false);
  };

  const setStudentRemarks = (studentId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'present',
        remarks,
      },
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    students.forEach((s) => {
      updated[s.id] = {
        status,
        remarks: attendanceMap[s.id]?.remarks || '',
      };
    });
    setAttendanceMap(updated);
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const recordsToSave: ClassAttendanceRecord[] = students.map((s) => {
        const cur = attendanceMap[s.id] || { status: 'present', remarks: '' };
        return {
          id: `att-${subject.replace(/\s+/g, '')}-${date}-${s.id}`,
          teacher_id: user?.id || 'prof-1',
          teacher_name: profile?.full_name || 'Faculty Member',
          student_id: s.id,
          student_name: s.name,
          student_email: s.email,
          student_avatar: s.avatar_url,
          subject,
          date,
          status: cur.status,
          remarks: cur.remarks || null,
          created_at: new Date().toISOString(),
        };
      });

      await attendanceService.saveClassAttendance(recordsToSave);
      const updatedHistory = await attendanceService.getAttendanceHistory(subject);
      setHistory(updatedHistory);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save attendance', err);
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = Object.values(attendanceMap).filter((v) => v.status === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((v) => v.status === 'absent').length;
  const lateCount = Object.values(attendanceMap).filter((v) => v.status === 'late').length;
  const excusedCount = Object.values(attendanceMap).filter((v) => v.status === 'excused').length;
  const totalCount = students.length || 1;
  const attendanceRate = Math.round(((presentCount + lateCount * 0.75 + excusedCount) / totalCount) * 100);

  if (loading) return <Loading label="Loading attendance roster..." />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2.5">
            <CalendarIcon className="text-emerald-500" /> Attendance Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/60">
            Record daily student attendance, track percentages, and maintain academic records.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl glass border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('mark')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'mark'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} /> Take Attendance
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History size={14} /> Past Records ({history.length})
          </button>
        </div>
      </div>

      {activeTab === 'mark' ? (
        <>
          {/* Controls Bar: Subject, Date, Search, Bulk Actions */}
          <GlassCard className="p-4 lg:p-5 space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1.5">
                  Select Subject / Course
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl glass border border-white/10 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {TEACHER_SUBJECTS.map((s) => (
                    <option key={s} value={s} className="dark:bg-slate-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1.5">
                  Session Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl glass border border-white/10 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-white/60 block mb-1.5">
                  Search Students
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or roll..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 text-xs px-3 py-2 rounded-xl glass border border-white/10 bg-transparent outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={handleSave}
                  loading={saving}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 text-xs py-2.5"
                >
                  <Save size={15} /> Save Attendance
                </Button>
              </div>
            </div>

            {/* Quick Bulk Marking & Status Tally */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Quick bulk mark:</span>
                <button
                  type="button"
                  onClick={() => markAll('present')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition border border-emerald-500/20"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAll('absent')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition border border-rose-500/20"
                >
                  Mark All Absent
                </button>
              </div>

              {/* Tally Badges */}
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="text-emerald-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present: {presentCount}
                </span>
                <span className="text-rose-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent: {absentCount}
                </span>
                <span className="text-amber-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Late: {lateCount}
                </span>
                <span className="text-sky-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500" /> Excused: {excusedCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {attendanceRate}% Present
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Success Banner */}
          {savedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold"
            >
              <Check size={16} /> Attendance records for {subject} on {date} saved successfully!
            </motion.div>
          )}

          {/* Student Roster Table */}
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/60 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-4">Student</th>
                    <th className="p-4">Roll / ID</th>
                    <th className="p-4">Overall %</th>
                    <th className="p-4 text-center">Status for {date}</th>
                    <th className="p-4">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No students matched your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const cur = attendanceMap[student.id] || { status: 'present', remarks: '' };
                      const isPresent = cur.status === 'present';
                      const isAbsent = cur.status === 'absent';
                      const isLate = cur.status === 'late';
                      const isExcused = cur.status === 'excused';

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          {/* Student Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {student.avatar_url ? (
                                <img
                                  src={student.avatar_url}
                                  alt={student.name}
                                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-xs">
                                  {student.name[0]}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-800 dark:text-white">{student.name}</p>
                                <p className="text-[11px] text-slate-400">{student.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Roll Number */}
                          <td className="p-4 font-mono text-slate-500 dark:text-white/60">
                            {student.roll_number || 'N/A'}
                          </td>

                          {/* Overall Rate */}
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                student.attendance_rate >= 85
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : student.attendance_rate >= 75
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-rose-500/10 text-rose-500'
                              }`}
                            >
                              {student.attendance_rate}%
                            </span>
                          </td>

                          {/* Status Pills */}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setStudentStatus(student.id, 'present')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                                    : 'glass hover:bg-emerald-500/10 text-slate-500 dark:text-white/60'
                                }`}
                              >
                                <CheckCircle2 size={13} /> Present
                              </button>

                              <button
                                type="button"
                                onClick={() => setStudentStatus(student.id, 'absent')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                                  isAbsent
                                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/30'
                                    : 'glass hover:bg-rose-500/10 text-slate-500 dark:text-white/60'
                                }`}
                              >
                                <XCircle size={13} /> Absent
                              </button>

                              <button
                                type="button"
                                onClick={() => setStudentStatus(student.id, 'late')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                                  isLate
                                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                                    : 'glass hover:bg-amber-500/10 text-slate-500 dark:text-white/60'
                                }`}
                              >
                                <Clock size={13} /> Late
                              </button>

                              <button
                                type="button"
                                onClick={() => setStudentStatus(student.id, 'excused')}
                                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                                  isExcused
                                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/30'
                                    : 'glass hover:bg-sky-500/10 text-slate-500 dark:text-white/60'
                                }`}
                              >
                                Excused
                              </button>
                            </div>
                          </td>

                          {/* Remarks */}
                          <td className="p-4">
                            <input
                              type="text"
                              placeholder="Add optional remark..."
                              value={cur.remarks}
                              onChange={(e) => setStudentRemarks(student.id, e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg glass border border-white/10 bg-transparent outline-none focus:border-emerald-500/40"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      ) : (
        /* History View */
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base">Recorded Attendance History</h2>
              <p className="text-xs text-slate-400">All past entries logged for {subject}</p>
            </div>
            <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
              {history.length} Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Student</th>
                  <th className="py-2.5">Subject</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No past attendance records found for this subject.
                    </td>
                  </tr>
                ) : (
                  history.map((rec) => (
                    <tr key={rec.id} className="hover:bg-white/5">
                      <td className="py-3 font-medium">{new Date(rec.date).toLocaleDateString()}</td>
                      <td className="py-3 font-semibold">{rec.student_name}</td>
                      <td className="py-3 text-slate-400">{rec.subject}</td>
                      <td className="py-3">
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
                      </td>
                      <td className="py-3 text-slate-400">{rec.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
