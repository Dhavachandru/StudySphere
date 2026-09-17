import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/State';
import { useAuth } from '../../lib/auth';
import { teacherService } from '../../lib/teacherService';
import { attendanceService, TEACHER_SUBJECTS } from '../../lib/attendanceService';
import type { TeacherTask, TaskSubmission, StudentRosterItem } from '../../lib/types';

export default function TeacherDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalMarkedSessions: 0,
    overallPercentage: 92,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, s, r, att] = await Promise.all([
          teacherService.getTasks(user?.id),
          teacherService.getAllSubmissions(),
          teacherService.getStudentRoster(),
          attendanceService.getAttendanceStats(),
        ]);
        setTasks(t);
        setSubmissions(s);
        setRoster(r);
        setAttendanceStats(att);
      } catch (err) {
        console.error('Failed to load teacher dashboard', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <Loading label="Loading faculty portal..." />;

  const teacherName = profile?.full_name || 'Faculty Member';
  const department = profile?.department || 'Computer Science & Engineering';
  const designation = profile?.designation || 'Faculty Professor';

  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted');
  const lowAttendanceStudents = roster.filter((s) => s.attendance_rate < 75);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Faculty Hero Banner */}
      <GlassCard className="p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
              <GraduationCap size={15} /> Faculty Academic Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Welcome back, <span className="gradient-text">{teacherName}</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
              {designation} &bull; {department}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => navigate('/teacher/attendance')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
            >
              <Calendar size={16} /> Mark Attendance
            </Button>
            <Button onClick={() => navigate('/teacher/assignments?new=1')} variant="secondary">
              <Plus size={16} /> Assign Task
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Students',
            value: roster.length,
            sub: 'Across enrolled sections',
            icon: Users,
            color: 'from-blue-500 to-indigo-500',
            link: '/teacher/students',
          },
          {
            label: 'Active Tasks Assigned',
            value: tasks.length,
            sub: 'Assignments in progress',
            icon: ClipboardList,
            color: 'from-purple-500 to-pink-500',
            link: '/teacher/assignments',
          },
          {
            label: 'Overall Class Attendance',
            value: `${attendanceStats.overallPercentage}%`,
            sub: `${attendanceStats.totalMarkedSessions} sessions logged`,
            icon: CheckCircle,
            color: 'from-emerald-500 to-teal-500',
            link: '/teacher/attendance',
          },
          {
            label: 'Submissions to Grade',
            value: pendingSubmissions.length,
            sub: 'Awaiting review & marks',
            icon: Clock,
            color: 'from-amber-500 to-orange-500',
            link: '/teacher/assignments',
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <GlassCard
              key={m.label}
              className="p-5 cursor-pointer hover:-translate-y-0.5 transition-all group"
              onClick={() => navigate(m.link)}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white shadow-md`}
                >
                  <Icon size={18} />
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-400 group-hover:translate-x-0.5 transition-transform"
                />
              </div>
              <p className="text-2xl lg:text-3xl font-bold">{m.value}</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-white/80 mt-1">{m.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{m.sub}</p>
            </GlassCard>
          );
        })}
      </div>

      {/* Main Two-Column Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Classes & Active Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Teaching Sessions */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-500" /> Today's Teaching Schedule
                </h2>
                <p className="text-xs text-slate-400">Classes ready for attendance marking today ({todayStr})</p>
              </div>
              <Link to="/teacher/attendance" className="text-xs text-emerald-500 font-medium hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {TEACHER_SUBJECTS.slice(0, 3).map((subj, idx) => (
                <div
                  key={subj}
                  className="p-3.5 rounded-xl glass border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <p className="font-semibold text-sm">{subj}</p>
                    </div>
                    <p className="text-xs text-slate-400 ml-4.5 mt-0.5">
                      Period {idx + 1} &bull; Section {idx === 0 ? 'A (Room 304)' : idx === 1 ? 'B (Lab 2)' : 'C (Room 210)'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/teacher/attendance?subject=${encodeURIComponent(subj)}`)}
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs border border-emerald-500/20"
                  >
                    <CheckCircle size={14} /> Take Attendance
                  </Button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Active Tasks & Submissions Progress */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-base flex items-center gap-2">
                  <ClipboardList size={18} className="text-indigo-500" /> Active Coursework Tasks
                </h2>
                <p className="text-xs text-slate-400">Track student progress & submission quotas</p>
              </div>
              <Button size="sm" onClick={() => navigate('/teacher/assignments')}>
                Manage All
              </Button>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No active tasks created yet.</p>
              ) : (
                tasks.slice(0, 3).map((task) => {
                  const subs = submissions.filter((s) => s.task_id === task.id);
                  const graded = subs.filter((s) => s.status === 'graded');
                  const progressPct = roster.length > 0 ? Math.round((subs.length / roster.length) * 100) : 0;

                  return (
                    <div key={task.id} className="p-4 rounded-xl glass border border-white/10 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                            {task.subject}
                          </span>
                          <h3 className="font-bold text-sm mt-1">{task.title}</h3>
                          <p className="text-xs text-slate-400">
                            Due: {new Date(task.due_date).toLocaleDateString()} &bull; {task.total_points} Points
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/teacher/assignments?task=${task.id}`)}
                          className="text-xs"
                        >
                          Review ({subs.length})
                        </Button>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>
                            {subs.length} of {roster.length} students submitted
                          </span>
                          <span>{progressPct}% submitted</span>
                        </div>
                        <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right 1 Col: Submissions to Review & Low Attendance Alerts */}
        <div className="space-y-6">
          {/* Submissions Needing Grading */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Clock size={16} className="text-amber-500" /> Pending Submissions
              </h2>
              <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-semibold">
                {pendingSubmissions.length}
              </span>
            </div>

            {pendingSubmissions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">All caught up! No ungraded submissions.</p>
            ) : (
              <div className="space-y-2.5">
                {pendingSubmissions.slice(0, 4).map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl glass border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full gradient-brand text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {sub.student_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{sub.student_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => navigate(`/teacher/assignments?review=${sub.id}`)}
                      className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 shrink-0"
                    >
                      Grade
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Low Attendance Alert (<75%) */}
          <GlassCard className="p-5 border-amber-500/20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={16} /> Attendance Alert (&lt;75%)
              </h2>
              <span className="text-xs bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full font-semibold">
                {lowAttendanceStudents.length} Students
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              These students risk debarment from university examinations.
            </p>

            {lowAttendanceStudents.length === 0 ? (
              <p className="text-xs text-emerald-500 text-center py-2">
                All students currently satisfy the 75% attendance threshold!
              </p>
            ) : (
              <div className="space-y-2">
                {lowAttendanceStudents.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl glass border border-rose-500/20 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold">{s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.roll_number}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                      {s.attendance_rate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
