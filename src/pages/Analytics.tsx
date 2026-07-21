import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, BookOpen, Code2, TrendingUp, CheckCircle, Target } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { AnalyticsRow, CodingProgressRow, Assignment, StudyGoal } from '../lib/types';

export default function Analytics() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [coding, setCoding] = useState<CodingProgressRow[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'week' | 'month'>('week');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const [a, cod, asg, gls] = await Promise.all([
      supabase.from('analytics').select('*').eq('user_id', user.id).order('day', { ascending: true }).limit(90),
      supabase.from('coding_progress').select('*').eq('user_id', user.id).order('day', { ascending: true }).limit(90),
      supabase.from('assignments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('study_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (a.error) setError(a.error.message);
    if (cod.error) setError(cod.error.message);
    if (asg.error) setError(asg.error.message);
    if (gls.error) setError(gls.error.message);
    setRows((a.data as AnalyticsRow[]) ?? []);
    setCoding((cod.data as CodingProgressRow[]) ?? []);
    setAssignments((asg.data as Assignment[]) ?? []);
    setGoals((gls.data as StudyGoal[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const days = view === 'week' ? 7 : 30;
  const recent = rows.slice(-days);
  const recentCoding = coding.slice(-days);

  // Auto-calculated totals
  const totalStudy = recent.reduce((s, r) => s + Number(r.study_hours), 0);
  const totalCoding = recentCoding.reduce((s, r) => s + Number(r.hours), 0);
  const totalProblems = recentCoding.reduce((s, r) => s + r.problems_solved, 0);
  const avgProductivity = recent.length ? Math.round(recent.reduce((s, r) => s + r.productivity_score, 0) / recent.length) : 0;
  const completedAssignments = assignments.filter((a) => a.status === 'completed').length;
  const goalsCompleted = goals.filter((g) => g.completed).length;

  const maxVal = Math.max(...recent.map((r) => Math.max(Number(r.study_hours), Number(r.coding_hours)), 1), ...recentCoding.map((r) => Number(r.hours)), 1);

  const hasData = rows.length > 0 || coding.length > 0 || assignments.length > 0 || goals.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><BarChart3 className="text-indigo-500" /> Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Auto-calculated from your activity across StudySphere.</p>
        </div>
        <div className="flex gap-1">
          {(['week', 'month'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${view === v ? 'gradient-brand text-white' : 'glass'}`}>{v}</button>
          ))}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? <Loading /> : !hasData ? (
        <EmptyState icon={<BarChart3 size={24} />} title="No analytics yet" hint="Use Notes, Assignments or Coding Progress and your stats will appear here automatically." />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Study hours', value: `${totalStudy.toFixed(1)}h`, icon: BookOpen, color: 'from-blue-500 to-indigo-500' },
              { label: 'Coding hours', value: `${totalCoding.toFixed(1)}h`, icon: Code2, color: 'from-violet-500 to-fuchsia-500' },
              { label: 'Assignments done', value: completedAssignments, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
              { label: 'Goals completed', value: `${goalsCompleted}/${goals.length}`, icon: Target, color: 'from-amber-500 to-orange-500' },
            ].map((s) => (
              <GlassCard key={s.label} className="p-4">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2`}><s.icon size={16} /></div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-white/50">{s.label}</p>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Problems solved', value: totalProblems, icon: TrendingUp, color: 'from-rose-500 to-pink-500' },
              { label: 'Avg productivity', value: `${avgProductivity}/100`, icon: BarChart3, color: 'from-cyan-500 to-blue-500' },
              { label: 'Total assignments', value: assignments.length, icon: CheckCircle, color: 'from-teal-500 to-emerald-500' },
              { label: 'Total study', value: `${totalStudy.toFixed(1)}h`, icon: BookOpen, color: 'from-indigo-500 to-violet-500' },
            ].map((s) => (
              <GlassCard key={s.label} className="p-4">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2`}><s.icon size={16} /></div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-white/50">{s.label}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="p-5">
            <h2 className="font-semibold mb-4">Study vs Coding hours</h2>
            <div className="flex items-end gap-1 h-48">
              {Array.from({ length: days }).map((_, i) => {
                const date = new Date(); date.setDate(date.getDate() - (days - 1 - i));
                const dStr = date.toISOString().slice(0, 10);
                const aRow = recent.find((r) => r.day === dStr);
                const cRow = recentCoding.find((r) => r.day === dStr);
                const study = aRow ? Number(aRow.study_hours) : 0;
                const code = cRow ? Number(cRow.hours) : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="flex items-end gap-0.5 h-full w-full justify-center">
                      <motion.div className="w-1/2 rounded-t bg-gradient-to-t from-blue-500 to-indigo-400" initial={{ height: 0 }} animate={{ height: `${(study / maxVal) * 100}%` }} transition={{ delay: i * 0.02 }} title={`Study: ${study}h`} />
                      <motion.div className="w-1/2 rounded-t bg-gradient-to-t from-violet-500 to-fuchsia-400" initial={{ height: 0 }} animate={{ height: `${(code / maxVal) * 100}%` }} transition={{ delay: i * 0.02 }} title={`Coding: ${code}h`} />
                    </div>
                    <span className="text-[9px] text-slate-400">{date.getDate()}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-white/50">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> Study</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-violet-500" /> Coding</span>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="font-semibold mb-4">Productivity score</h2>
            <div className="flex items-end gap-1 h-32">
              {recent.map((r, i) => (
                <motion.div key={r.id || i} className="flex-1 rounded-t gradient-brand" initial={{ height: 0 }} animate={{ height: `${(r.productivity_score / 100) * 100}%` }} transition={{ delay: i * 0.02 }} title={`${r.productivity_score}`} />
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-white/50 mt-2">Avg productivity: {avgProductivity}/100</p>
          </GlassCard>
        </>
      )}
    </div>
  );
}
