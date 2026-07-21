import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ClipboardList, Check, Clock } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Assignment } from '../lib/types';

const STATUSES = ['pending', 'in-progress', 'completed', 'overdue'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function Assignments() {
  const { user } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', subject: '', due_date: '', priority: 'medium', status: 'pending', description: '' });

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('assignments').select('*').eq('user_id', user.id).order('due_date', { ascending: true });
      if (error) setError(error.message);
      setItems((data as Assignment[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const add = async () => {
    if (!user || !form.title) { setError('Title is required.'); return; }
    const { error } = await supabase.from('assignments').insert({ user_id: user.id, title: form.title, subject: form.subject, due_date: form.due_date || null, priority: form.priority, status: form.status, description: form.description });
    if (error) { setError(error.message); return; }
    setOpen(false);
    setForm({ title: '', subject: '', due_date: '', priority: 'medium', status: 'pending', description: '' });
    load();
  };

  const update = async (a: Assignment, patch: Partial<Assignment>) => {
    const { error } = await supabase.from('assignments').update(patch).eq('id', a.id);
    if (error) { setError(error.message); return; }
    setItems((p) => p.map((x) => (x.id === a.id ? { ...x, ...patch } : x)));
  };

  const remove = async (id: string) => {
    await supabase.from('assignments').delete().eq('id', id);
    setItems((p) => p.filter((x) => x.id !== id));
  };

  const filtered = filter === 'all' ? items : items.filter((a) => a.status === filter);

  const stats = {
    total: items.length,
    pending: items.filter((a) => a.status === 'pending').length,
    inProgress: items.filter((a) => a.status === 'in-progress').length,
    completed: items.filter((a) => a.status === 'completed').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Assignments</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Track deadlines, priorities and progress.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} /> Add assignment</Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'from-blue-500 to-indigo-500' },
          { label: 'Pending', value: stats.pending, color: 'from-amber-500 to-orange-500' },
          { label: 'In progress', value: stats.inProgress, color: 'from-sky-500 to-cyan-500' },
          { label: 'Completed', value: stats.completed, color: 'from-emerald-500 to-teal-500' },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2`}><ClipboardList size={15} /></div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-white/50">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm capitalize whitespace-nowrap transition ${filter === s ? 'gradient-brand text-white' : 'glass hover:bg-white/70 dark:hover:bg-white/10'}`}>
            {s.replace('-', ' ')}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState icon={<ClipboardList size={24} />} title="No assignments" hint="Add your first assignment to start tracking deadlines." action={<Button onClick={() => setOpen(true)} size="sm"><Plus size={14} /> Add</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const days = a.due_date ? Math.ceil((new Date(a.due_date).getTime() - Date.now()) / 86400000) : null;
            const done = a.status === 'completed';
            return (
              <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassCard className="p-4 group">
                  <div className="flex items-start gap-3">
                    <button onClick={() => update(a, { status: done ? 'pending' : 'completed' })} className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${done ? 'gradient-brand border-transparent' : 'border-slate-300 dark:border-white/20'}`}>
                      {done && <Check size={14} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium ${done ? 'line-through text-slate-400' : ''}`}>{a.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.priority === 'high' ? 'bg-rose-500/15 text-rose-500' : a.priority === 'medium' ? 'bg-amber-500/15 text-amber-500' : 'bg-slate-500/15 text-slate-500'}`}>{a.priority}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-white/50">
                        {a.subject && <span>{a.subject}</span>}
                        {a.due_date && (
                          <span className={`flex items-center gap-1 ${days !== null && days <= 2 && !done ? 'text-rose-500' : ''}`}>
                            <Clock size={12} /> {new Date(a.due_date).toLocaleDateString()} {days !== null && days >= 0 ? `(${days}d)` : ''}
                          </span>
                        )}
                      </div>
                      {a.description && <p className="text-xs text-slate-500 dark:text-white/50 mt-1">{a.description}</p>}
                    </div>
                    <select value={a.status} onChange={(e) => update(a, { status: e.target.value })} className="px-2 py-1 rounded-lg glass text-xs capitalize">
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                    </select>
                    <button onClick={() => remove(a.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1"><Trash2 size={14} /></button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add assignment">
        <div className="space-y-3">
          <Input placeholder="Assignment title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="px-3 py-2.5 rounded-xl glass-strong text-sm">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p} priority</option>)}
            </select>
          </div>
          <Textarea placeholder="Description (optional)" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button onClick={add} className="w-full">Add assignment</Button>
        </div>
      </Modal>
    </div>
  );
}
