import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Bookmark as BookmarkIcon, Search, Folder, Download, Upload, Globe } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Bookmark } from '../lib/types';

export default function Bookmarks() {
  const { user } = useAuth();
  const [items, setItems] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('All');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', folder: 'Default' });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('bookmarks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) setError(error.message);
    setItems((data as Bookmark[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const folders = useMemo(() => ['All', ...Array.from(new Set(items.map((b) => b.folder)))], [items]);
  const filtered = items.filter((b) => {
    const mq = !query || b.title.toLowerCase().includes(query.toLowerCase()) || b.url.toLowerCase().includes(query.toLowerCase());
    const mf = folder === 'All' || b.folder === folder;
    return mq && mf;
  });

  const add = async () => {
    if (!user || !form.title || !form.url) { setError('Title and URL are required.'); return; }
    let url = form.url;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const { error } = await supabase.from('bookmarks').insert({ user_id: user.id, title: form.title, url, folder: form.folder });
    if (error) { setError(error.message); return; }
    setOpen(false);
    setForm({ title: '', url: '', folder: 'Default' });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id);
    setItems((p) => p.filter((b) => b.id !== id));
  };

  const exportBookmarks = () => {
    const data = JSON.stringify(items, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'studysphere-bookmarks.json';
    a.click();
  };

  const importBookmarks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const arr = JSON.parse(await file.text()) as Partial<Bookmark>[];
      const rows = arr.map((b) => ({ user_id: user.id, title: b.title || 'Imported', url: b.url || '', folder: b.folder || 'Imported' })).filter((r) => r.url);
      const { error } = await supabase.from('bookmarks').insert(rows);
      if (error) setError(error.message);
      load();
    } catch { setError('Invalid bookmarks file.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Bookmarks</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Organize your favorite sites into folders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportBookmarks}><Download size={15} /> Export</Button>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import</Button>
          <Button size="sm" onClick={() => setOpen(true)}><Plus size={15} /> Add</Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importBookmarks} />
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search bookmarks…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <select value={folder} onChange={(e) => setFolder(e.target.value)} className="px-4 py-2.5 rounded-xl glass-strong text-sm">
          {folders.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState icon={<BookmarkIcon size={24} />} title="No bookmarks" hint="Add bookmarks or import from a file." action={<Button onClick={() => setOpen(true)} size="sm"><Plus size={14} /> Add</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((b) => (
            <motion.div key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GlassCard className="p-4 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white shrink-0"><Globe size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <a href={b.url} target="_blank" rel="noreferrer" className="font-medium text-sm hover:text-indigo-500 truncate block">{b.title}</a>
                    <p className="text-xs text-slate-500 dark:text-white/50 truncate">{b.url}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 mt-1.5"><Folder size={10} /> {b.folder}</span>
                  </div>
                  <button onClick={() => remove(b.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1"><Trash2 size={14} /></button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add bookmark">
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <Input placeholder="Folder" value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })} />
          <Button onClick={add} className="w-full">Add bookmark</Button>
        </div>
      </Modal>
    </div>
  );
}
