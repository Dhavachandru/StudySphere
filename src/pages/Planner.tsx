import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Trash2, BookOpen, GraduationCap, Award, Clock, Target, CheckCircle, Circle } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { PlannerEntry, StudyGoal } from '../lib/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type TabId = 'timetable' | 'exams' | 'attendance' | 'gpa' | 'semester' | 'goals-daily' | 'goals-weekly';

export default function Planner() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('timetable');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', day_of_week: 'Monday', start_time: '', end_time: '', exam_date: '', notes: '', semester_number: 1, gpa: '', attendance_total: 0, attendance_present: 0, target_hours: '', due_date: '' });

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [p, g] = await Promise.all([
        supabase.from('planner').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('study_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (p.error) setError(p.error.message);
      if (g.error) setError(g.error.message);
      setEntries((p.data as PlannerEntry[]) ?? []);
      setGoals((g.data as StudyGoal[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load planner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const addGoal = async () => {
    if (!user || !form.title.trim()) { setError('Goal title is required.'); return; }
    const { error } = await supabase.from('study_goals').insert({
      user_id: user.id, title: form.title, period: tab === 'goals-daily' ? 'daily' : 'weekly',
      target_hours: Number(form.target_hours) || 0, completed: false,
      due_date: form.due_date || null,
    });
    if (error) { setError(error.message); return; }
    setOpen(false);
    setForm({ title: '', subject: '', day_of_week: 'Monday', start_time: '', end_time: '', exam_date: '', notes: '', semester_number: 1, gpa: '', attendance_total: 0, attendance_present: 0, target_hours: '', due_date: '' });
    load();
  };

  const toggleGoal = async (goal: StudyGoal) => {
    const { error } = await supabase.from('study_goals').update({ completed: !goal.completed }).eq('id', goal.id);
    if (error) { setError(error.message); return; }
    setGoals((p) => p.map((x) => (x.id === goal.id ? { ...x, completed: !x.completed } : x)));
  };

  const removeGoal = async (id: string) => {
    await supabase.from('study_goals').delete().eq('id', id);
    setGoals((p) => p.filter((x) => x.id !== id));
  };

  const add = async () => {
    if (!user) return;
    if (tab === 'goals-daily' || tab === 'goals-weekly') { await addGoal(); return; }
    const payload: Record<string, unknown> = { user_id: user.id, entry_type: tab, notes: form.notes };
    if (tab === 'timetable') { payload.title = form.title; payload.subject = form.subject; payload.day_of_week = form.day_of_week; payload.start_time = form.start_time || null; payload.end_time = form.end_time || null; }
    if (tab === 'exams') { payload.title = form.title; payload.subject = form.subject; payload.exam_date = form.exam_date || null; }
    if (tab === 'attendance') { payload.title = form.title; payload.subject = form.subject; payload.attendance_total = Number(form.attendance_total); payload.attendance_present = Number(form.attendance_present); }
    if (tab === 'gpa') { payload.gpa = form.gpa ? Number(form.gpa) : null; payload.semester_number = Number(form.semester_number); payload.title = `Semester ${form.semester_number}`; }
    if (tab === 'semester') { payload.semester_number = Number(form.semester_number); payload.title = form.title || `Semester ${form.semester_number}`; }
    const { error } = await supabase.from('planner').insert(payload);
    if (error) { setError(error.message); return; }
    setOpen(false);
    setForm({ title: '', subject: '', day_of_week: 'Monday', start_time: '', end_time: '', exam_date: '', notes: '', semester_number: 1, gpa: '', attendance_total: 0, attendance_present: 0, target_hours: '', due_date: '' });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('planner').delete().eq('id', id);
    setEntries((p) => p.filter((e) => e.id !== id));
  };

  const filtered = entries.filter((e) => e.entry_type === tab);

  const tabs = [
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'exams', label: 'Exam Countdown', icon: Clock },
    { id: 'attendance', label: 'Attendance', icon: BookOpen },
    { id: 'gpa', label: 'GPA', icon: Award },
    { id: 'semester', label: 'Semester', icon: GraduationCap },
    { id: 'goals-daily', label: 'Daily Goals', icon: Target },
    { id: 'goals-weekly', label: 'Weekly Goals', icon: Target },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Planner</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Timetable, exams, attendance, GPA & semester tracking.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} /> Add entry</Button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition ${tab === id ? 'gradient-brand text-white shadow-lg shadow-indigo-500/25' : 'glass hover:bg-white/70 dark:hover:bg-white/10'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          {tab === 'timetable' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DAYS.map((day) => {
                const items = filtered.filter((e) => e.day_of_week === day).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
                return (
                  <GlassCard key={day} className="p-3 min-h-[200px]">
                    <h3 className="font-semibold text-sm mb-2">{day}</h3>
                    <div className="space-y-1.5">
                      {items.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No classes</p>}
                      {items.map((e) => (
                        <div key={e.id} className="group p-2 rounded-lg glass">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium">{e.title || e.subject}</p>
                            <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={12} /></button>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-white/50">{e.start_time?.slice(11, 16)} {e.end_time ? `– ${e.end_time.slice(11, 16)}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {tab === 'exams' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.length === 0 ? <EmptyState icon={<Clock size={24} />} title="No exams scheduled" /> : filtered.map((e) => {
                const days = e.exam_date ? Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86400000) : 0;
                return (
                  <GlassCard key={e.id} className="p-4 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{e.title || e.subject}</p>
                        <p className="text-xs text-slate-500 dark:text-white/50">{e.exam_date ? new Date(e.exam_date).toLocaleDateString() : ''}</p>
                      </div>
                      <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={14} /></button>
                    </div>
                    <div className="mt-3 text-center py-2 rounded-xl gradient-brand text-white">
                      <p className="text-2xl font-bold">{days <= 0 ? 'Today' : days}</p>
                      <p className="text-[10px]">{days <= 0 ? 'Good luck!' : 'days to go'}</p>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {tab === 'attendance' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.length === 0 ? <EmptyState icon={<BookOpen size={24} />} title="No attendance tracked" /> : filtered.map((e) => {
                const pct = e.attendance_total > 0 ? Math.round((e.attendance_present / e.attendance_total) * 100) : 0;
                return (
                  <GlassCard key={e.id} className="p-4 group">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{e.title || e.subject}</p>
                      <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={14} /></button>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1"><span>{e.attendance_present}/{e.attendance_total}</span><span className={pct >= 75 ? 'text-emerald-500' : 'text-rose-500'}>{pct}%</span></div>
                      <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <motion.div className="h-full gradient-brand" initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {tab === 'gpa' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filtered.length === 0 ? <EmptyState icon={<Award size={24} />} title="No GPA entries" /> : filtered.map((e) => (
                <GlassCard key={e.id} className="p-4 text-center group">
                  <button onClick={() => remove(e.id)} className="float-right opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={14} /></button>
                  <p className="text-xs text-slate-500 dark:text-white/50">{e.title}</p>
                  <p className="text-4xl font-bold gradient-text mt-1">{e.gpa ?? '—'}</p>
                  <p className="text-xs text-slate-400">GPA</p>
                </GlassCard>
              ))}
            </div>
          )}

          {tab === 'semester' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.length === 0 ? <EmptyState icon={<GraduationCap size={24} />} title="No semester entries" /> : filtered.map((e) => (
                <GlassCard key={e.id} className="p-4 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{e.title}</p>
                      <p className="text-xs text-slate-500 dark:text-white/50">Semester {e.semester_number}</p>
                    </div>
                    <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={14} /></button>
                  </div>
                  {e.notes && <p className="text-xs text-slate-500 dark:text-white/50 mt-2">{e.notes}</p>}
                </GlassCard>
              ))}
            </div>
          )}

          {(tab === 'goals-daily' || tab === 'goals-weekly') && (() => {
            const periodGoals = goals.filter((g) => g.period === (tab === 'goals-daily' ? 'daily' : 'weekly'));
            const completed = periodGoals.filter((g) => g.completed).length;
            return (
              <div className="space-y-3">
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-white/50">{tab === 'goals-daily' ? 'Today' : 'This week'} progress</p>
                      <p className="text-2xl font-bold">{completed}/{periodGoals.length} goals</p>
                    </div>
                    <Target className="text-indigo-400/40" size={32} />
                  </div>
                </GlassCard>
                {periodGoals.length === 0 ? (
                  <EmptyState icon={<Target size={24} />} title={`No ${tab === 'goals-daily' ? 'daily' : 'weekly'} goals yet`} hint="Set a goal to stay on track." action={<Button onClick={() => setOpen(true)} size="sm"><Plus size={14} /> Add goal</Button>} />
                ) : (
                  <div className="space-y-2">
                    {periodGoals.map((g) => (
                      <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <GlassCard className="p-4 group flex items-center gap-3">
                          <button onClick={() => toggleGoal(g)} className={`w-7 h-7 rounded-full flex items-center justify-center transition shrink-0 ${g.completed ? 'gradient-brand text-white' : 'glass hover:bg-white/70 dark:hover:bg-white/10'}`}>
                            {g.completed ? <CheckCircle size={16} /> : <Circle size={16} className="text-slate-400" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${g.completed ? 'line-through text-slate-400' : ''}`}>{g.title}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/50">
                              {g.target_hours > 0 && <span>{g.target_hours}h target</span>}
                              {g.due_date && <span>· due {new Date(g.due_date).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <button onClick={() => removeGoal(g.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1"><Trash2 size={14} /></button>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Add ${tab === 'goals-daily' ? 'daily goal' : tab === 'goals-weekly' ? 'weekly goal' : `${tab} entry`}`}>
        <div className="space-y-3">
          {(tab === 'timetable' || tab === 'exams' || tab === 'attendance' || tab === 'semester' || tab === 'goals-daily' || tab === 'goals-weekly') && (
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          )}
          {(tab === 'timetable' || tab === 'exams' || tab === 'attendance') && (
            <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          )}
          {tab === 'timetable' && (
            <div className="grid grid-cols-2 gap-2">
              <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} className="px-3 py-2.5 rounded-xl glass-strong text-sm">
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          )}
          {tab === 'exams' && <Input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} />}
          {tab === 'attendance' && (
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Total classes" value={form.attendance_total} onChange={(e) => setForm({ ...form, attendance_total: Number(e.target.value) })} />
              <Input type="number" placeholder="Attended" value={form.attendance_present} onChange={(e) => setForm({ ...form, attendance_present: Number(e.target.value) })} />
            </div>
          )}
          {(tab === 'gpa' || tab === 'semester') && (
            <Input type="number" placeholder="Semester number" value={form.semester_number} onChange={(e) => setForm({ ...form, semester_number: Number(e.target.value) })} />
          )}
          {tab === 'gpa' && <Input type="number" step="0.01" placeholder="GPA (e.g. 8.5)" value={form.gpa} onChange={(e) => setForm({ ...form, gpa: e.target.value })} />}
          {(tab === 'goals-daily' || tab === 'goals-weekly') && (
            <>
              <Input type="number" step="0.5" placeholder="Target hours (optional)" value={form.target_hours} onChange={(e) => setForm({ ...form, target_hours: e.target.value })} />
              <Input type="date" placeholder="Due date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </>
          )}
          {tab !== 'goals-daily' && tab !== 'goals-weekly' && <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />}
          <Button onClick={add} className="w-full">Save</Button>
        </div>
      </Modal>
    </div>
  );
}
