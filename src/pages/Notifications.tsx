import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Trash2, Check, BellOff, Plus } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Notification } from '../lib/types';

const TYPES = [
  { id: 'assignment', label: 'Assignment reminder' },
  { id: 'exam', label: 'Exam reminder' },
  { id: 'study', label: 'Study reminder' },
  { id: 'general', label: 'General' },
];

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'assignment', title: '', message: '' });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (error) setError(error.message);
    setItems((data as Notification[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const add = async () => {
    if (!user || !form.title.trim()) { setError('Title is required.'); return; }
    const { error } = await supabase.from('notifications').insert({
      user_id: user.id, type: form.type, title: form.title, message: form.message || null,
    });
    if (error) { setError(error.message); return; }
    setOpen(false);
    setForm({ type: 'assignment', title: '', message: '' });
    load();
  };

  const markRead = async (n: Notification) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    if (error) { setError(error.message); return; }
    setItems((p) => p.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
  };

  const markAllRead = async () => {
    if (!user) return;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    if (error) { setError(error.message); return; }
    setItems((p) => p.map((x) => ({ ...x, read: true })));
  };

  const remove = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setItems((p) => p.filter((x) => x.id !== id));
  };

  const clearAll = async () => {
    if (!user) return;
    if (!confirm('Delete all notifications? This cannot be undone.')) return;
    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
    if (error) { setError(error.message); return; }
    setItems([]);
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Bell className="text-indigo-500" /> Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">{unread} unread of {items.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={markAllRead} disabled={unread === 0}><Check size={15} /> Mark all read</Button>
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}><Plus size={15} /> Add</Button>
          <Button variant="danger" size="sm" onClick={clearAll} disabled={items.length === 0}><Trash2 size={15} /> Clear all</Button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? <Loading /> : items.length === 0 ? (
        <EmptyState icon={<BellOff size={24} />} title="No notifications" hint="Assignment, exam and study reminders will appear here." action={<Button onClick={() => setOpen(true)} size="sm"><Plus size={14} /> Add</Button>} />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <motion.div key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GlassCard className={`p-4 group flex items-start gap-3 ${n.read ? '' : 'ring-1 ring-indigo-400/30'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${n.read ? 'glass' : 'gradient-brand text-white'}`}>
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 capitalize">{n.type}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                  </div>
                  {n.message && <p className="text-sm text-slate-500 dark:text-white/50 mt-0.5">{n.message}</p>}
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && <button onClick={() => markRead(n)} className="p-2 rounded-lg hover:bg-emerald-500/15 hover:text-emerald-500" title="Mark read"><Check size={16} /></button>}
                  <button onClick={() => remove(n.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-2"><Trash2 size={16} /></button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add notification">
        <div className="space-y-3">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-4 py-2.5 rounded-xl glass-strong text-sm w-full">
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Message (optional)" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <Button onClick={add} className="w-full">Add notification</Button>
        </div>
      </Modal>
    </div>
  );
}
