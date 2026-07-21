import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Trash2, Search, Globe, Clock } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { HistoryEntry } from '../lib/types';

export default function History() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('history').select('*').eq('user_id', user.id).order('visited_at', { ascending: false }).limit(200);
    if (error) setError(error.message);
    setItems((data as HistoryEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const clearAll = async () => {
    if (!user) return;
    if (!confirm('Clear all browsing history? This cannot be undone.')) return;
    const { error } = await supabase.from('history').delete().eq('user_id', user.id);
    if (error) { setError(error.message); return; }
    setItems([]);
  };

  const remove = async (id: string) => {
    await supabase.from('history').delete().eq('id', id);
    setItems((p) => p.filter((x) => x.id !== id));
  };

  const filtered = items.filter((h) => !query || (h.title || h.url).toLowerCase().includes(query.toLowerCase()));

  const groups = filtered.reduce<Record<string, HistoryEntry[]>>((acc, h) => {
    const day = new Date(h.visited_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    (acc[day] ||= []).push(h);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">History</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Recently visited pages.</p>
        </div>
        <Button variant="danger" size="sm" onClick={clearAll} disabled={items.length === 0}><Trash2 size={15} /> Clear all</Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search history…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState icon={<HistoryIcon size={24} />} title="No history" hint="Pages you visit will appear here." />
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([day, entries]) => (
            <div key={day}>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-white/50 mb-2 px-1">{day}</h2>
              <div className="space-y-1">
                {entries.map((h) => (
                  <motion.div key={h.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <GlassCard className="p-3 group flex items-center gap-3">
                      <Globe size={16} className="text-indigo-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a href={h.url} target="_blank" rel="noreferrer" className="text-sm font-medium hover:text-indigo-500 truncate block">{h.title || h.url}</a>
                        <p className="text-xs text-slate-500 dark:text-white/50 truncate">{h.url}</p>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={11} /> {new Date(h.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button onClick={() => remove(h.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1"><Trash2 size={14} /></button>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
