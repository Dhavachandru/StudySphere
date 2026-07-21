import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, RotateCw, Home, Plus, X, Search, Bookmark, Lock, Globe,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

type Tab = { id: string; url: string; title: string; loading: boolean; history: string[]; idx: number };

const HOME = 'study://home';

function normalizeUrl(input: string): string {
  const v = input.trim();
  if (!v) return HOME;
  if (v === HOME) return HOME;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+/.test(v)) return `https://${v}`;
  return `https://www.google.com/search?q=${encodeURIComponent(v)}`;
}

function hostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

export default function Browser() {
  const { user } = useAuth();
  const [tabs, setTabs] = useState<Tab[]>([{ id: '1', url: HOME, title: 'New Tab', loading: false, history: [HOME], idx: 0 }]);
  const [active, setActive] = useState('1');
  const [addr, setAddr] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const tab = tabs.find((t) => t.id === active)!;

  useEffect(() => {
    setAddr(tab.url === HOME ? '' : tab.url);
    (async () => {
      if (!user || tab.url === HOME) return setBookmarked(false);
      const { data } = await supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('url', tab.url).maybeSingle();
      setBookmarked(!!data);
    })();
  }, [tab.url, user]);

  const updateTab = (id: string, patch: Partial<Tab>) => {
    setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const navigate = (raw: string, tabId = active) => {
    const url = normalizeUrl(raw);
    const t = tabs.find((x) => x.id === tabId);
    if (!t) return;
    const newHistory = [...t.history.slice(0, t.idx + 1), url];
    updateTab(tabId, { url, loading: true, history: newHistory, idx: newHistory.length - 1, title: hostname(url) });
    if (user && url !== HOME) {
      supabase.from('history').insert({ user_id: user.id, url, title: hostname(url) }).then(() => setHistoryRefresh((n) => n + 1));
    }
    setTimeout(() => updateTab(tabId, { loading: false }), 1200);
  };

  const goBack = () => {
    if (tab.idx <= 0) return;
    const ni = tab.idx - 1;
    updateTab(tab.id, { url: tab.history[ni], idx: ni, title: hostname(tab.history[ni]) });
  };
  const goForward = () => {
    if (tab.idx >= tab.history.length - 1) return;
    const ni = tab.idx + 1;
    updateTab(tab.id, { url: tab.history[ni], idx: ni, title: hostname(tab.history[ni]) });
  };
  const refresh = () => {
    updateTab(tab.id, { loading: true });
    setTimeout(() => updateTab(tab.id, { loading: false }), 800);
    if (iframeRef.current && tab.url !== HOME) {
      const src = iframeRef.current.src;
      iframeRef.current.src = src;
    }
  };
  const goHome = () => navigate(HOME);

  const newTab = () => {
    const id = String(Date.now());
    setTabs((ts) => [...ts, { id, url: HOME, title: 'New Tab', loading: false, history: [HOME], idx: 0 }]);
    setActive(id);
  };

  const closeTab = (id: string) => {
    setTabs((ts) => {
      const filtered = ts.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        const nt: Tab = { id: '1', url: HOME, title: 'New Tab', loading: false, history: [HOME], idx: 0 };
        setActive('1');
        return [nt];
      }
      if (id === active) setActive(filtered[filtered.length - 1].id);
      return filtered;
    });
  };

  const toggleBookmark = async () => {
    if (!user || tab.url === HOME) return;
    if (bookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('url', tab.url);
      setBookmarked(false);
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, url: tab.url, title: hostname(tab.url), folder: 'Default' });
      setBookmarked(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-t-xl text-sm whitespace-nowrap transition ${
              t.id === active ? 'glass-strong' : 'glass hover:bg-white/60 dark:hover:bg-white/10'
            }`}
          >
            <Globe size={13} className="text-indigo-400" />
            <span className="max-w-[120px] truncate">{t.title}</span>
            <span
              onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}
              className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 group-hover:opacity-100"
            >
              <X size={12} />
            </span>
          </button>
        ))}
        <button onClick={newTab} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><Plus size={16} /></button>
      </div>

      <GlassCard className="p-3">
        <div className="flex items-center gap-2">
          <button onClick={goBack} disabled={tab.idx <= 0} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"><ArrowLeft size={18} /></button>
          <button onClick={goForward} disabled={tab.idx >= tab.history.length - 1} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"><ArrowRight size={18} /></button>
          <button onClick={refresh} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><RotateCw size={16} className={tab.loading ? 'animate-spin' : ''} /></button>
          <button onClick={goHome} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><Home size={18} /></button>

          <form className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl glass" onSubmit={(e) => { e.preventDefault(); navigate(addr); }}>
            <Lock size={14} className="text-emerald-500" />
            <Input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Search Google or type a URL" className="border-0 bg-transparent focus:ring-0 px-0" />
            <button type="submit" className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"><Search size={16} /></button>
          </form>

          <button onClick={toggleBookmark} className={`p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ${bookmarked ? 'text-amber-500' : ''}`}>
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0 h-[70vh]">
        <AnimatePresence mode="wait">
          <motion.div key={tab.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            {tab.url === HOME ? (
              <HomePage onNavigate={(u) => navigate(u)} refresh={historyRefresh} />
            ) : (
              <iframe
                ref={iframeRef}
                src={tab.url}
                title={tab.title}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={() => updateTab(tab.id, { loading: false })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

function HomePage({ onNavigate, refresh }: { onNavigate: (u: string) => void; refresh: number }) {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<{ url: string; title: string | null }[]>([]);
  const [bookmarks, setBookmarks] = useState<{ url: string; title: string }[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [h, b] = await Promise.all([
        supabase.from('history').select('url,title').eq('user_id', user.id).order('visited_at', { ascending: false }).limit(8),
        supabase.from('bookmarks').select('url,title').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
      ]);
      setRecent((h.data as { url: string; title: string | null }[]) ?? []);
      setBookmarks((b.data as { url: string; title: string }[]) ?? []);
    })();
  }, [user, refresh]);

  const shortcuts = [
    { name: 'YouTube', url: 'https://youtube.com', color: 'from-rose-500 to-red-500' },
    { name: 'Google', url: 'https://google.com', color: 'from-blue-500 to-sky-500' },
    { name: 'GitHub', url: 'https://github.com', color: 'from-slate-700 to-slate-900' },
    { name: 'Wikipedia', url: 'https://wikipedia.org', color: 'from-slate-500 to-slate-700' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com', color: 'from-orange-500 to-amber-500' },
    { name: 'MDN', url: 'https://developer.mozilla.org', color: 'from-emerald-500 to-teal-500' },
    { name: 'Coursera', url: 'https://coursera.org', color: 'from-indigo-500 to-blue-500' },
    { name: 'Khan Academy', url: 'https://khanacademy.org', color: 'from-teal-500 to-cyan-500' },
  ];

  return (
    <div className="h-full overflow-y-auto p-8 gradient-bg">
      <div className="max-w-2xl mx-auto pt-8">
        <h1 className="text-3xl font-bold text-center mb-6">
          <span className="gradient-text">StudySphere</span> Search
        </h1>
        <form onSubmit={(e) => { e.preventDefault(); if (q) onNavigate(q); }} className="flex items-center gap-2 px-4 py-3 rounded-2xl glass-strong mb-8">
          <Search size={20} className="text-slate-400" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the web…" className="bg-transparent outline-none flex-1 text-lg" />
        </form>

        <h2 className="text-sm font-semibold text-slate-500 dark:text-white/50 mb-3">Shortcuts</h2>
        <div className="grid grid-cols-4 gap-3 mb-8">
          {shortcuts.map((s) => (
            <button key={s.url} onClick={() => onNavigate(s.url)} className="group flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition`}>
                {s.name[0]}
              </div>
              <span className="text-xs">{s.name}</span>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-white/50 mb-2">Recently visited</h2>
            <div className="space-y-1">
              {recent.length === 0 && <p className="text-xs text-slate-400">No history yet.</p>}
              {recent.map((r, i) => (
                <button key={i} onClick={() => onNavigate(r.url)} className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-left">
                  <Globe size={14} className="text-indigo-400 shrink-0" />
                  <span className="text-sm truncate">{r.title || r.url}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-white/50 mb-2">Bookmarks</h2>
            <div className="space-y-1">
              {bookmarks.length === 0 && <p className="text-xs text-slate-400">No bookmarks yet.</p>}
              {bookmarks.map((b, i) => (
                <button key={i} onClick={() => onNavigate(b.url)} className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-left">
                  <Bookmark size={14} className="text-amber-400 shrink-0" />
                  <span className="text-sm truncate">{b.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
