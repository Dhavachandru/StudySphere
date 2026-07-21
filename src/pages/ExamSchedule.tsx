import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Clock, Award, CheckCircle, CalendarClock } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { ExamScheduleEntry } from '../lib/types';

export default function ExamSchedule() {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', exam_date: '', exam_time: '', location: '', notes: '' });

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('exam_schedule').select('*').eq('user_id', user.id).order('exam_date', { ascending: true });
      if (error) setError(error.message);
      setExams((data as ExamScheduleEntry[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load exam schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const add = async () => {
    if (!user || !form.title.trim()) { setError('Exam title is required.'); return; }
    if (!form.exam_date) { setError('Exam date is required.'); return; }
    const { error } = await supabase.from('exam_schedule').insert({
      user_id: user.id, title: form.title, subject: form.subject || null,
      exam_date: form.exam_date, exam_time: form.exam_time || null,
      location: form.location || null, notes: form.notes || null, status: 'upcoming',
    });
    if (error) { setError(error.message); return; }
    setOpen(false);
    setForm({ title: '', subject: '', exam_date: '', exam_time: '', location: '', notes: '' });
    load();
  };

  const markCompleted = async (e: ExamScheduleEntry) => {
    const { error } = await supabase.from('exam_schedule').update({ status: 'completed' }).eq('id', e.id);
    if (error) { setError(error.message); return; }
    setExams((p) => p.map((x) => (x.id === e.id ? { ...x, status: 'completed' } : x)));
  };

  const remove = async (id: string) => {
    await supabase.from('exam_schedule').delete().eq('id', id);
    setExams((p) => p.filter((x) => x.id !== id));
  };

  const now = new Date();
  const upcoming = exams.filter((e) => e.status === 'upcoming' && new Date(e.exam_date) >= new Date(now.toDateString()));
  const completed = exams.filter((e) => e.status === 'completed');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><CalendarClock className="text-amber-500" /> Exam Schedule</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Create exams, track countdowns, and mark completion.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} /> Add exam</Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? <Loading /> : (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <GlassCard className="p-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white mb-2"><Clock size={16} /></div>
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-xs text-slate-500 dark:text-white/50">Upcoming</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white mb-2"><CheckCircle size={16} /></div>
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-xs text-slate-500 dark:text-white/50">Completed</p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white mb-2"><Award size={16} /></div>
              <p className="text-2xl font-bold">{exams.length}</p>
              <p className="text-xs text-slate-500 dark:text-white/50">Total exams</p>
            </GlassCard>
          </div>

          <h2 className="font-semibold">Upcoming exams</h2>
          {upcoming.length === 0 ? (
            <EmptyState icon={<Clock size={24} />} title="No upcoming exams" hint="Add an exam to start the countdown." action={<Button onClick={() => setOpen(true)} size="sm"><Plus size={14} /> Add exam</Button>} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcoming.map((e) => {
                const days = Math.ceil((new Date(e.exam_date).getTime() - now.getTime()) / 86400000);
                return (
                  <motion.div key={e.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <GlassCard className="p-4 group">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{e.title}</p>
                          <p className="text-xs text-slate-500 dark:text-white/50">{e.subject}</p>
                        </div>
                        <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={14} /></button>
                      </div>
                      <div className="mt-3 text-center py-2 rounded-xl gradient-brand text-white">
                        <p className="text-2xl font-bold">{days <= 0 ? 'Today' : days}</p>
                        <p className="text-[10px]">{days <= 0 ? 'Good luck!' : 'days to go'}</p>
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-white/50 space-y-0.5">
                        <p>{new Date(e.exam_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        {e.exam_time && <p>{e.exam_time}</p>}
                        {e.location && <p>{e.location}</p>}
                      </div>
                      <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => markCompleted(e)}>
                        <CheckCircle size={14} /> Mark completed
                      </Button>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}

          {completed.length > 0 && (
            <>
              <h2 className="font-semibold mt-6">Completed exams</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {completed.map((e) => (
                  <motion.div key={e.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <GlassCard className="p-4 group opacity-70">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold line-through">{e.title}</p>
                          <p className="text-xs text-slate-500 dark:text-white/50">{e.subject}</p>
                        </div>
                        <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={14} /></button>
                      </div>
                      <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1"><CheckCircle size={12} /> Completed</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add exam">
        <div className="space-y-3">
          <Input placeholder="Exam title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} />
            <Input type="time" value={form.exam_time} onChange={(e) => setForm({ ...form, exam_time: e.target.value })} />
          </div>
          <Input placeholder="Location (optional)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Textarea placeholder="Notes (optional)" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button onClick={add} className="w-full">Add exam</Button>
        </div>
      </Modal>
    </div>
  );
}
