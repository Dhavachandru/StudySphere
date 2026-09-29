import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, ClipboardList, Calendar, Flame, Sparkles, Bell, Award, Target, TrendingUp,
  Code2, Users, FileText, ChevronRight,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Loading } from '../components/ui/State';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { teacherService } from '../lib/teacherService';
import type { Assignment, AnalyticsRow, PlannerEntry, CodingProgressRow, ExamScheduleEntry, StudyGoal, Notification, TeacherTask } from '../lib/types';

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function greeting(h: number) {
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const now = useClock();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teacherTasks, setTeacherTasks] = useState<TeacherTask[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [planner, setPlanner] = useState<PlannerEntry[]>([]);
  const [coding, setCoding] = useState<CodingProgressRow[]>([]);
  const [exams, setExams] = useState<ExamScheduleEntry[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [a, an, p, cod, exm, gls, notif, tTasks] = await Promise.all([
        supabase.from('assignments').select('*').eq('user_id', user.id).order('due_date', { ascending: true }).limit(5),
        supabase.from('analytics').select('*').eq('user_id', user.id).order('day', { ascending: false }).limit(30),
        supabase.from('planner').select('*').eq('user_id', user.id).eq('entry_type', 'timetable'),
        supabase.from('coding_progress').select('*').eq('user_id', user.id).order('day', { ascending: false }).limit(30),
        supabase.from('exam_schedule').select('*').eq('user_id', user.id).order('exam_date', { ascending: true }),
        supabase.from('study_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        teacherService.getAllTasks(),
      ]);
      setAssignments((a.data as Assignment[]) ?? []);
      setAnalytics((an.data as AnalyticsRow[]) ?? []);
      setPlanner((p.data as PlannerEntry[]) ?? []);
      setCoding((cod.data as CodingProgressRow[]) ?? []);
      setExams((exm.data as ExamScheduleEntry[]) ?? []);
      setGoals((gls.data as StudyGoal[]) ?? []);
      setNotifications((notif.data as Notification[]) ?? []);
      setTeacherTasks(tTasks.slice(0, 3));
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <Loading label="Loading your workspace…" />;

  const todayStr = now.toISOString().slice(0, 10);
  const todayAnalytics = analytics.find((d) => d.day === todayStr);
  const studyHours = todayAnalytics?.study_hours ?? 0;
  const productivity = todayAnalytics?.productivity_score ?? 0;

  const codingStreak = (() => {
    if (coding.length === 0) return 0;
    const sorted = [...coding].sort((a, b) => b.day.localeCompare(a.day));
    let streak = 0;
    let check = new Date(todayStr);
    for (const row of sorted) {
      const rowDate = new Date(row.day);
      const diff = Math.round((check.getTime() - rowDate.getTime()) / 86400000);
      if (diff === 0 && Number(row.hours) > 0) { streak++; check = new Date(check.getTime() - 86400000); }
      else if (diff === 1 && Number(row.hours) > 0) { streak++; check = new Date(check.getTime() - 86400000); }
      else break;
    }
    return streak;
  })();

  const dayName = now.toLocaleDateString(undefined, { weekday: 'long' });
  const todaysTimetable = planner.filter((p) => p.day_of_week === dayName);

  const upcoming = assignments.filter((a) => a.due_date && new Date(a.due_date) >= new Date(now.toDateString())).slice(0, 4);
  const upcomingExams = exams.filter((e) => e.status === 'upcoming' && new Date(e.exam_date) >= new Date(now.toDateString())).slice(0, 3);
  const unreadNotifs = notifications.filter((n) => !n.read);
  const dailyGoals = goals.filter((g) => g.period === 'daily' && !g.completed);

  // Build last-14-days activity series for the graph
  const activityDays = (() => {
    const days: { date: string; label: string; study: number; coding: number }[] = [];
    const today = new Date(todayStr);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const ds = d.toISOString().slice(0, 10);
      const aRow = analytics.find((a) => a.day === ds);
      const cRow = coding.find((c) => c.day === ds);
      days.push({
        date: ds,
        label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1),
        study: aRow?.study_hours ?? 0,
        coding: cRow?.hours ?? 0,
      });
    }
    return days;
  })();
  const maxActivity = Math.max(1, ...activityDays.map((d) => Math.max(d.study, d.coding)));
  const totalStudyThisWeek = activityDays.slice(-7).reduce((s, d) => s + d.study, 0);
  const totalCodingThisWeek = activityDays.slice(-7).reduce((s, d) => s + d.coding, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">
            {greeting(now.getHours())}, <span className="gradient-text">{profile?.full_name || 'Student'}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} ·{' '}
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        {unreadNotifs.length > 0 && (
          <Link to="/notifications" className="relative p-2.5 rounded-xl glass hover:bg-white/70 dark:hover:bg-white/10 active:scale-95 transition min-w-[42px] min-h-[42px] flex items-center justify-center">
            <Bell size={20} className="text-indigo-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadNotifs.length}</span>
          </Link>
        )}
      </div>

      {/* Android Native Thumb Quick Actions */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
        {[
          { label: 'Ask Copilot', path: '/ai', icon: Sparkles, color: 'from-violet-600 to-indigo-600' },
          { label: 'New Note', path: '/notes', icon: FileText, color: 'from-sky-500 to-blue-600' },
          { label: 'Timetable', path: '/planner', icon: Calendar, color: 'from-emerald-500 to-teal-600' },
          { label: 'Study Quests', path: '/group-study', icon: Users, color: 'from-fuchsia-500 to-pink-600' },
          { label: 'Coding Hub', path: '/coding', icon: Code2, color: 'from-amber-500 to-orange-600' },
          { label: 'Deadlines', path: '/assignments', icon: ClipboardList, color: 'from-rose-500 to-red-600' },
        ].map((act) => (
          <Link
            key={act.path}
            to={act.path}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass hover:border-indigo-500/40 active:scale-95 transition-all shrink-0 min-h-[44px] shadow-sm border border-white/10"
          >
            <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${act.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
              <act.icon size={14} />
            </div>
            <span className="text-xs font-semibold whitespace-nowrap text-slate-800 dark:text-slate-100">{act.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Study progress', value: `${studyHours}h`, sub: 'today', icon: BookOpen, color: 'from-blue-500 to-indigo-500' },
          { label: 'Coding streak', value: `${codingStreak}d`, sub: codingStreak > 0 ? 'active' : 'start today', icon: Flame, color: 'from-orange-500 to-rose-500' },
          { label: 'Productivity', value: `${productivity}`, sub: 'score', icon: Sparkles, color: 'from-violet-500 to-fuchsia-500' },
          { label: 'Assignments', value: `${assignments.filter((a) => a.status !== 'completed').length}`, sub: 'pending', icon: ClipboardList, color: 'from-emerald-500 to-teal-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-4 active:scale-[0.98] transition">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3 shadow-lg`}>
                <s.icon size={18} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-white/50">{s.label} · {s.sub}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-semibold flex items-center gap-2"><TrendingUp size={18} className="text-indigo-500" /> Study & coding activity</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-gradient-to-br from-blue-500 to-indigo-500" /> Study {totalStudyThisWeek.toFixed(1)}h</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500" /> Coding {totalCodingThisWeek.toFixed(1)}h</span>
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-none pb-1">
          <div className="flex items-end justify-between gap-1.5 h-44 min-w-[340px]">
            {activityDays.map((d, i) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex items-end justify-center gap-0.5 h-32 relative">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.study / maxActivity) * 100}%` }}
                    transition={{ delay: i * 0.03, type: 'spring', damping: 20 }}
                    className="w-2.5 sm:w-3 rounded-t bg-gradient-to-br from-blue-500 to-indigo-500 min-h-[2px]"
                    title={`Study: ${d.study}h`}
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.coding / maxActivity) * 100}%` }}
                    transition={{ delay: i * 0.03 + 0.05, type: 'spring', damping: 20 }}
                    className="w-2.5 sm:w-3 rounded-t bg-gradient-to-br from-violet-500 to-fuchsia-500 min-h-[2px]"
                    title={`Coding: ${d.coding}h`}
                  />
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                    {d.study}h · {d.coding}h
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        {analytics.length === 0 && coding.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-white/50 text-center mt-4">No activity yet — start studying or coding to see your graph grow.</p>
        )}
      </GlassCard>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Calendar size={18} className="text-indigo-500" /> Today's timetable</h2>
            <Link to="/planner" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 transition flex items-center gap-1 min-h-[32px]">
              Open planner <ChevronRight size={13} />
            </Link>
          </div>
          {todaysTimetable.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-white/50 py-6 text-center">No classes scheduled for {dayName}. Enjoy the day!</p>
          ) : (
            <div className="space-y-2">
              {todaysTimetable.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl glass active:scale-[0.99] transition">
                  <div className="w-1.5 h-10 rounded-full gradient-brand" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.title || t.subject || 'Class'}</p>
                    <p className="text-xs text-slate-500 dark:text-white/50">{t.subject}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    {t.start_time ? new Date(t.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}{' '}
                    {t.end_time ? `– ${new Date(t.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><ClipboardList size={18} className="text-rose-500" /> Deadlines & Tasks</h2>
            <Link to="/assignments" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 transition flex items-center gap-1 min-h-[32px]">
              View all <ChevronRight size={13} />
            </Link>
          </div>

          <div className="space-y-2">
            {/* Faculty Assigned Tasks Highlight */}
            {teacherTasks.slice(0, 2).map((t) => (
              <div key={t.id} className="p-3 rounded-xl glass border border-indigo-500/20 active:scale-[0.99] transition">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                    Faculty: {t.teacher_name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {t.total_points} pts
                  </span>
                </div>
                <p className="font-medium text-sm truncate">{t.title}</p>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                  <span>{t.subject}</span>
                  <span className="text-indigo-400 font-medium">Due {new Date(t.due_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {/* Personal Deadlines */}
            {upcoming.slice(0, 2).map((a) => {
              const days = a.due_date ? Math.ceil((new Date(a.due_date).getTime() - now.getTime()) / 86400000) : 0;
              return (
                <div key={a.id} className="p-3 rounded-xl glass active:scale-[0.99] transition">
                  <p className="font-medium text-sm truncate">{a.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500 dark:text-white/50">{a.subject}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${days <= 2 ? 'bg-rose-500/15 text-rose-500' : 'bg-indigo-500/15 text-indigo-500'}`}>
                      {days <= 0 ? 'Due today' : `${days}d left`}
                    </span>
                  </div>
                </div>
              );
            })}

            {teacherTasks.length === 0 && upcoming.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-white/50 py-6 text-center">No upcoming deadlines.</p>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <GlassCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Target size={18} className="text-emerald-500" /> Daily goals</h2>
            <Link to="/planner" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 transition flex items-center gap-1 min-h-[32px]">
              All goals <ChevronRight size={13} />
            </Link>
          </div>
          {dailyGoals.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-white/50 py-6 text-center">No active daily goals.</p>
          ) : (
            <div className="space-y-2">
              {dailyGoals.slice(0, 4).map((g) => (
                <div key={g.id} className="flex items-center gap-2 p-2.5 rounded-xl glass">
                  <Target size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-sm flex-1 truncate">{g.title}</span>
                  <span className="text-xs text-slate-400 font-semibold">{g.target_hours}h</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Award size={18} className="text-amber-500" /> Upcoming exams</h2>
            <Link to="/exams" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 transition flex items-center gap-1 min-h-[32px]">
              All exams <ChevronRight size={13} />
            </Link>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-white/50 py-6 text-center">No upcoming exams.</p>
          ) : (
            <div className="space-y-2">
              {upcomingExams.map((e) => {
                const days = Math.ceil((new Date(e.exam_date).getTime() - now.getTime()) / 86400000);
                return (
                  <div key={e.id} className="p-3 rounded-xl glass">
                    <p className="font-medium text-sm truncate">{e.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500 dark:text-white/50">{e.subject}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${days <= 3 ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'}`}>
                        {days <= 0 ? 'Today' : `${days}d left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Bell size={18} className="text-indigo-500" /> Notifications</h2>
            <Link to="/notifications" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 transition flex items-center gap-1 min-h-[32px]">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-white/50 py-6 text-center">No notifications.</p>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 4).map((n) => (
                <div key={n.id} className={`p-2.5 rounded-xl ${n.read ? 'glass' : 'glass ring-1 ring-indigo-400/30'}`}>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.message && <p className="text-xs text-slate-500 dark:text-white/50 truncate mt-0.5">{n.message}</p>}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
