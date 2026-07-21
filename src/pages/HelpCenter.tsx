import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Search, ChevronDown, BookOpen, Bot, Globe, Code2, Calendar, Cloud } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';

const FAQS = [
  { q: 'How do I create an account?', a: 'Click "Get started" on the landing page, enter your email and password, or sign up with Google. Your profile is created automatically.' },
  { q: 'Is my data secure?', a: 'Yes. Every table uses Row Level Security — you can only ever read or write your own data. Sessions persist securely across devices via Supabase Auth.' },
  { q: 'How does the browser work?', a: 'Open the Browser page, type a URL or search query in the address bar. You can open multiple tabs, bookmark pages, and review your history.' },
  { q: 'Can I use the AI Assistant offline?', a: 'The assistant runs locally for explanations, summaries, notes, flashcards, quizzes and translations. No external API key is required.' },
  { q: 'How do notes autosave work?', a: 'Every keystroke triggers a debounced save to your database. Your note is preserved even if you switch tabs or reload.' },
  { q: 'Which languages does Coding Hub support?', a: 'HTML, CSS, JavaScript, Java, Python, C and SQL. HTML/CSS/JS get a live preview; others show the code in a syntax-styled view.' },
  { q: 'How do I track my GPA and attendance?', a: 'Open the Planner page and switch to the GPA or Attendance tab. Add an entry and your stats update instantly.' },
  { q: 'Can I export my bookmarks?', a: 'Yes — on the Bookmarks page, click Export to download a JSON file, and Import to restore it later.' },
];

const GUIDES = [
  { icon: BookOpen, title: 'Getting started', desc: 'Set up your profile and navigate the workspace.' },
  { icon: Globe, title: 'Using the browser', desc: 'Tabs, bookmarks, history and downloads.' },
  { icon: Bot, title: 'AI Assistant', desc: 'Chat, summarize, generate notes and quizzes.' },
  { icon: Code2, title: 'Coding Hub', desc: 'Write and preview code across 7 languages.' },
  { icon: Calendar, title: 'Planner', desc: 'Timetable, exams, attendance and GPA.' },
  { icon: Cloud, title: 'Sync & security', desc: 'How your data is stored and protected.' },
];

export default function HelpCenter() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(0);

  const filtered = FAQS.filter((f) => !query || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-500/30"><HelpCircle size={26} /></div>
        <h1 className="text-2xl lg:text-3xl font-bold">Help Center</h1>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">How can we help you today?</p>
      </div>

      <div className="relative max-w-xl mx-auto">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search for help…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GUIDES.map(({ icon: Icon, title, desc }, i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-4 hover:-translate-y-0.5 transition cursor-pointer">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white mb-3"><Icon size={18} /></div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-white/50 mt-1">{desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <GlassCard className="p-5 max-w-3xl mx-auto">
        <h2 className="font-semibold mb-4">Frequently asked questions</h2>
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-slate-500 dark:text-white/50 text-center py-4">No results for "{query}".</p>}
          {filtered.map((f, i) => (
            <div key={i} className="rounded-xl glass overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-3 text-left">
                <span className="font-medium text-sm">{f.q}</span>
                <ChevronDown size={16} className={`transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <p className="px-3 pb-3 text-sm text-slate-500 dark:text-white/60">{f.a}</p>}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
