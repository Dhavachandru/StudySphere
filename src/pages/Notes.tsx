import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pin, Star, Trash2, FileText, X } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Note } from '../lib/types';

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [active, setActive] = useState<Note | null>(null);
  const [draft, setDraft] = useState({ title: '', content: '', category: 'General' });
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (error) setError(error.message);
    setNotes((data as Note[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(notes.map((n) => n.category)))], [notes]);

  const filtered = notes.filter((n) => {
    const matchQ = !query || n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase());
    const matchC = category === 'All' || n.category === category;
    return matchQ && matchC;
  });

  const pinned = filtered.filter((n) => n.pinned);
  const others = filtered.filter((n) => !n.pinned);

  const createNote = async () => {
    if (!user) return;
    const { data } = await supabase.from('notes').insert({ user_id: user.id, title: 'Untitled', content: '', category: 'General' }).select('*').maybeSingle();
    if (data) {
      const n = data as Note;
      setNotes((p) => [n, ...p]);
      openNote(n);
    }
  };

  const openNote = (n: Note) => {
    setActive(n);
    setDraft({ title: n.title, content: n.content, category: n.category });
  };

  const save = async () => {
    if (!active || !user) return;
    setSaving(true);
    const { data } = await supabase.from('notes').update({ title: draft.title, content: draft.content, category: draft.category, updated_at: new Date().toISOString() }).eq('id', active.id).select('*').maybeSingle();
    if (data) {
      const updated = data as Note;
      setActive(updated);
      setNotes((p) => p.map((n) => (n.id === updated.id ? updated : n)));
    }
    setSaving(false);
  };

  // autosave (debounced)
  useEffect(() => {
    if (!active) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(), 1000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line
  }, [draft]);

  const togglePin = async (n: Note) => {
    await supabase.from('notes').update({ pinned: !n.pinned }).eq('id', n.id);
    setNotes((p) => p.map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x)));
  };
  const toggleFav = async (n: Note) => {
    await supabase.from('notes').update({ favorite: !n.favorite }).eq('id', n.id);
    setNotes((p) => p.map((x) => (x.id === n.id ? { ...x, favorite: !x.favorite } : x)));
  };
  const remove = async (n: Note) => {
    await supabase.from('notes').delete().eq('id', n.id);
    setNotes((p) => p.filter((x) => x.id !== n.id));
    if (active?.id === n.id) setActive(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Notes</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Markdown notes with autosave, pin & favorites.</p>
        </div>
        <Button onClick={createNote}><Plus size={16} /> New note</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search notes…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2.5 rounded-xl glass-strong text-sm">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <EmptyState icon={<FileText size={24} />} title="No notes yet" hint="Create your first note to get started." action={<Button onClick={createNote} size="sm"><Plus size={14} /> New note</Button>} />
            ) : (
              <>
                {pinned.length > 0 && <p className="text-xs text-slate-400 px-1 pt-1">Pinned</p>}
                {pinned.map((n) => <NoteCard key={n.id} n={n} active={active?.id === n.id} onOpen={() => openNote(n)} onPin={() => togglePin(n)} onFav={() => toggleFav(n)} onDelete={() => remove(n)} />)}
                {others.length > 0 && pinned.length > 0 && <p className="text-xs text-slate-400 px-1 pt-2">All notes</p>}
                {others.map((n) => <NoteCard key={n.id} n={n} active={active?.id === n.id} onOpen={() => openNote(n)} onPin={() => togglePin(n)} onFav={() => toggleFav(n)} onDelete={() => remove(n)} />)}
              </>
            )}
          </div>

          <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
            {active ? (
              <div className="flex flex-col h-[70vh]">
                <div className="flex items-center gap-2 p-3 border-b border-white/10">
                  <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Note title" className="border-0 bg-transparent text-lg font-semibold focus:ring-0 px-2" />
                  <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="px-3 py-2 rounded-lg glass text-sm">
                    {['General', 'Study', 'Ideas', 'Tasks', 'Personal'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => setActive(null)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><X size={16} /></button>
                </div>
                <Textarea
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  placeholder="Start writing in markdown…"
                  className="border-0 bg-transparent rounded-none focus:ring-0 flex-1 resize-none p-4 code-area"
                />
                <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-slate-500 dark:text-white/50">
                  <span>{draft.content.length} chars</span>
                  <span>{saving ? 'Saving…' : 'Saved'}</span>
                </div>
              </div>
            ) : (
              <EmptyState icon={<FileText size={24} />} title="Select a note" hint="Pick a note from the list, or create a new one." />
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function NoteCard({ n, active, onOpen, onPin, onFav, onDelete }: { n: Note; active: boolean; onOpen: () => void; onPin: () => void; onFav: () => void; onDelete: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div onClick={onOpen} className={`cursor-pointer p-3 rounded-xl transition ${active ? 'glass-strong ring-2 ring-indigo-400/40' : 'glass hover:bg-white/70 dark:hover:bg-white/10'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{n.title || 'Untitled'}</p>
            <p className="text-xs text-slate-500 dark:text-white/50 truncate mt-0.5">{n.content.slice(0, 60) || 'Empty note'}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onPin(); }} className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${n.pinned ? 'text-indigo-500' : 'text-slate-400'}`}><Pin size={13} fill={n.pinned ? 'currentColor' : 'none'} /></button>
            <button onClick={(e) => { e.stopPropagation(); onFav(); }} className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${n.favorite ? 'text-amber-500' : 'text-slate-400'}`}><Star size={13} fill={n.favorite ? 'currentColor' : 'none'} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-rose-500/15 hover:text-rose-500 text-slate-400"><Trash2 size={13} /></button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">{n.category}</span>
          <span className="text-[10px] text-slate-400">{new Date(n.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
