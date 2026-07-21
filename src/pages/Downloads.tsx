import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Download as DownloadIcon, Play, Pause, CheckCircle, FileArchive } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Download } from '../lib/types';

export default function Downloads() {
  const { user } = useAuth();
  const [items, setItems] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ filename: '', url: '' });
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('downloads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) setError(error.message);
    setItems((data as Download[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  // resume in-progress downloads that were active when the page reloaded
  useEffect(() => {
    items.forEach((d) => {
      if (d.status === 'downloading' && !timers.current[d.id]) simulateProgress(d.id, d.progress);
    });
    return () => { Object.values(timers.current).forEach(clearInterval); timers.current = {}; };
    // eslint-disable-next-line
  }, []);

  const simulateProgress = (id: string, start = 0) => {
    let p = start;
    timers.current[id] = setInterval(async () => {
      p += Math.random() * 18;
      if (p >= 100) {
        p = 100;
        clearInterval(timers.current[id]!);
        delete timers.current[id];
        await supabase.from('downloads').update({ progress: 100, status: 'completed' }).eq('id', id);
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, progress: 100, status: 'completed' } : x)));
      } else {
        await supabase.from('downloads').update({ progress: Math.round(p), status: 'downloading' }).eq('id', id);
        setItems((prev) => prev.map((x) => (x.id === id ? { ...x, progress: Math.round(p), status: 'downloading' } : x)));
      }
    }, 500);
  };

  const add = async () => {
    if (!user || !form.filename || !form.url) { setError('Filename and URL are required.'); return; }
    const { data } = await supabase.from('downloads').insert({ user_id: user.id, filename: form.filename, url: form.url, status: 'downloading', progress: 0 }).select('*').maybeSingle();
    setOpen(false);
    setForm({ filename: '', url: '' });
    if (data) {
      const d = data as Download;
      setItems((p) => [d, ...p]);
      simulateProgress(d.id);
    }
  };

  const toggle = async (d: Download) => {
    if (d.status === 'downloading') {
      if (timers.current[d.id]) { clearInterval(timers.current[d.id]); delete timers.current[d.id]; }
      await supabase.from('downloads').update({ status: 'paused' }).eq('id', d.id);
      setItems((p) => p.map((x) => (x.id === d.id ? { ...x, status: 'paused' } : x)));
    } else if (d.status === 'paused' || d.status === 'pending') {
      await supabase.from('downloads').update({ status: 'downloading' }).eq('id', d.id);
      setItems((p) => p.map((x) => (x.id === d.id ? { ...x, status: 'downloading' } : x)));
      simulateProgress(d.id, d.progress);
    }
  };

  const remove = async (id: string) => {
    if (timers.current[id]) { clearInterval(timers.current[id]); delete timers.current[id]; }
    await supabase.from('downloads').delete().eq('id', id);
    setItems((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Downloads</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Manage your downloads with progress tracking.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} /> New download</Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? <Loading /> : items.length === 0 ? (
        <EmptyState icon={<DownloadIcon size={24} />} title="No downloads" hint="Add a download to start tracking progress." action={<Button onClick={() => setOpen(true)} size="sm"><Plus size={14} /> Add</Button>} />
      ) : (
        <div className="space-y-2">
          {items.map((d) => (
            <motion.div key={d.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GlassCard className="p-4 group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' : 'gradient-brand text-white'}`}>
                    {d.status === 'completed' ? <CheckCircle size={18} /> : <FileArchive size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{d.filename}</p>
                    <p className="text-xs text-slate-500 dark:text-white/50 truncate">{d.url}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <motion.div className="h-full gradient-brand" animate={{ width: `${d.progress}%` }} transition={{ duration: 0.3 }} />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-white/50 w-10 text-right">{d.progress}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(d.status === 'downloading' || d.status === 'paused' || d.status === 'pending') && (
                      <button onClick={() => toggle(d)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                        {d.status === 'downloading' ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                    )}
                    <a href={d.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><DownloadIcon size={16} /></a>
                    <button onClick={() => remove(d.id)} className="p-2 rounded-lg hover:bg-rose-500/15 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-400 capitalize">{d.status} · {new Date(d.created_at).toLocaleString()}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New download">
        <div className="space-y-3">
          <Input placeholder="Filename" value={form.filename} onChange={(e) => setForm({ ...form, filename: e.target.value })} />
          <Input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <Button onClick={add} className="w-full">Start download</Button>
        </div>
      </Modal>
    </div>
  );
}
