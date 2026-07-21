import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Code2, Flame, Trophy, Clock, TrendingUp } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { CodingProgressRow } from '../lib/types';

const LANG_OPTIONS = ['JavaScript', 'Python', 'Java', 'C', 'C++', 'SQL', 'TypeScript', 'Go', 'Rust', 'HTML', 'CSS'];

export default function CodingProgress() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CodingProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ day: new Date().toISOString().slice(0, 10), problems_solved: '', hours: '', languages: [] as string[], notes: '' });

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('coding_progress').select('*').eq('user_id', user.id).order('day', { ascending: false }).limit(60);
      if (error) setError(error.message);
      setRows((data as CodingProgressRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load coding progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [user]);

  const add = async () => {
    if (!user) return;
    if (!form.day) { setError('Date is required.'); return; }
    const { error } = await supabase.from('coding_progress').upsert({
      user_id: user.id, day: form.day,
      problems_solved: Number(form.problems_solved) || 0,
      hours: Number(form.hours) || 0,
      languages: form.languages,
      notes: form.notes || null,
    }, { onConflict: 'user_id,day' });
    if (error) { setError(error.message); return; }
    setOpen(false);
    setForm({ day: new Date().toISOString().slice(0, 10), problems_solved: '', hours: '', languages: [], notes: '' });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('coding_progress').delete().eq('id', id);
    setRows((p) => p.filter((r) => r.id !== id));
  };

  const toggleLang = (lang: string) => {
    setForm((f) => ({ ...f, languages: f.languages.includes(lang) ? f.languages.filter((l) => l !== lang) : [...f.languages, lang] }));
  };

  // Stats
  const totalProblems = rows.reduce((s, r) => s + r.problems_solved, 0);
  const totalHours = rows.reduce((s, r) => s + Number(r.hours), 0);
  const allLangs = Array.from(new Set(rows.flatMap((r) => r.languages)));
  const maxStreak = rows.length > 0 ? Math.max(...rows.map((r) => r.streak)) : 0;
  const currentStreak = rows[0]?.streak ?? 0;

  const maxVal = Math.max(...rows.map((r) => r.problems_solved), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Code2 className="text-violet-500" /> Coding Progress</h1>
          <p className="text-sm text-slate-500 dark:text-white/50">Track problems solved, hours, languages and streaks.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} /> Log today</Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? <Loading /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Problems solved', value: totalProblems, icon: Trophy, color: 'from-violet-500 to-fuchsia-500' },
              { label: 'Coding hours', value: `${totalHours.toFixed(1)}h`, icon: Clock, color: 'from-blue-500 to-indigo-500' },
              { label: 'Languages', value: allLangs.length, icon: Code2, color: 'from-emerald-500 to-teal-500' },
              { label: 'Current streak', value: `${currentStreak}d`, icon: Flame, color: 'from-orange-500 to-rose-500' },
            ].map((s) => (
              <GlassCard key={s.label} className="p-4">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2`}><s.icon size={16} /></div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-white/50">{s.label}</p>
              </GlassCard>
            ))}
          </div>

          {rows.length === 0 ? (
            <EmptyState icon={<Code2 size={24} />} title="No coding logged yet" hint="Log your first coding session to track progress." action={<Button onClick={() => setOpen(true)} size="sm"><Plus size={14} /> Log today</Button>} />
          ) : (
            <>
              <GlassCard className="p-5">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-500" /> Problems solved (last 30 days)</h2>
                <div className="flex items-end gap-1 h-40">
                  {rows.slice(0, 30).reverse().map((r, i) => (
                    <motion.div key={r.id} className="flex-1 rounded-t gradient-brand" initial={{ height: 0 }} animate={{ height: `${(r.problems_solved / maxVal) * 100}%` }} transition={{ delay: i * 0.02 }} title={`${r.day}: ${r.problems_solved} problems`} />
                  ))}
                </div>
              </GlassCard>

              <div>
                <h2 className="font-semibold mb-3">Recent sessions</h2>
                <div className="space-y-1">
                  {rows.slice(0, 15).map((r) => (
                    <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <GlassCard className="p-3 group flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center text-white"><Code2 size={16} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{new Date(r.day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {r.languages.map((l) => <span key={l} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500">{l}</span>)}
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-500 dark:text-white/50">
                          <p>{r.problems_solved} problems</p>
                          <p>{Number(r.hours)}h</p>
                        </div>
                        {r.streak > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500 flex items-center gap-1"><Flame size={11} /> {r.streak}d</span>}
                        <button onClick={() => remove(r.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1"><Trash2 size={14} /></button>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Log coding session">
        <div className="space-y-3">
          <Input type="date" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="Problems solved" value={form.problems_solved} onChange={(e) => setForm({ ...form, problems_solved: e.target.value })} />
            <Input type="number" step="0.5" placeholder="Hours" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-white/50 mb-2">Languages</p>
            <div className="flex flex-wrap gap-1.5">
              {LANG_OPTIONS.map((l) => (
                <button key={l} onClick={() => toggleLang(l)} className={`px-2.5 py-1 rounded-lg text-xs transition ${form.languages.includes(l) ? 'gradient-brand text-white' : 'glass hover:bg-white/70 dark:hover:bg-white/10'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Textarea placeholder="Notes (optional)" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button onClick={add} className="w-full">Save session</Button>
        </div>
      </Modal>
    </div>
  );
}
