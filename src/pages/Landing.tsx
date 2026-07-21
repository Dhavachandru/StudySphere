import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Globe, StickyNote, Calendar, Bot, Code2, BarChart3, ArrowRight,
  Shield, Zap, Cloud, Layers,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const features = [
  { icon: Globe, title: 'AI Browser', desc: 'Browse the web with smart tabs, bookmarks, history and downloads — all in one place.' },
  { icon: StickyNote, title: 'Smart Notes', desc: 'Rich-text markdown notes with categories, pinning, favorites and autosave.' },
  { icon: Calendar, title: 'Planner', desc: 'Timetable, attendance, exam countdown, semester tracker and GPA calculator.' },
  { icon: Bot, title: 'AI Assistant', desc: 'ChatGPT-style chat, summarize webpages & PDFs, generate notes, flashcards & quizzes.' },
  { icon: Code2, title: 'Coding Hub', desc: 'Write & preview HTML, CSS, JS, Java, Python, C and SQL with syntax highlighting.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Study hours, coding streaks, productivity score, weekly & monthly charts.' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg">
      <header className="sticky top-0 z-30 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-semibold text-lg">StudySphere</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-indigo-500/25">
                Open app
              </button>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition">
                  Log in
                </Link>
                <Link to="/signup" className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-indigo-500/25">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-indigo-600 dark:text-indigo-300 mb-6">
            <Sparkles size={14} /> AI-powered student workspace
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            One Browser. <span className="gradient-text">Every Student Need.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-white/60 max-w-2xl mx-auto">
            StudySphere is the all-in-one browser and productivity platform for students — browse, study, take notes,
            plan, code, and let AI do the heavy lifting. Synced securely across all your devices.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-medium shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition">
              Start free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-strong font-medium hover:bg-white/80 dark:hover:bg-white/10 transition">
              I have an account
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-14 mx-auto max-w-4xl glass-strong rounded-2xl p-2 shadow-2xl shadow-indigo-500/10"
        >
          <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-white dark:from-slate-900 dark:to-slate-800 aspect-[16/9] flex">
            <div className="w-48 p-4 border-r border-white/10 hidden sm:block">
              {[Globe, StickyNote, Calendar, Bot, Code2].map((Icon, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-slate-500 dark:text-white/50 text-sm">
                  <Icon size={16} /> {['Browser', 'Notes', 'Planner', 'AI', 'Coding'][i]}
                </div>
              ))}
            </div>
            <div className="flex-1 p-5 text-left">
              <div className="flex gap-1.5 mb-4">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="space-y-3">
                <div className="h-8 rounded-lg bg-indigo-500/10 w-2/3" />
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl glass" />)}
                </div>
                <div className="h-32 rounded-xl glass" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Everything a student needs</h2>
          <p className="mt-2 text-slate-500 dark:text-white/50">A complete workspace, beautifully integrated.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform"
            >
              <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-white/55 mt-1.5">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: Shield, title: 'Secure & Private', desc: 'Row-level security on every table. Your data is yours alone.' },
            { icon: Cloud, title: 'Synced Everywhere', desc: 'Sessions persist across devices. Sign in and your workspace returns.' },
            { icon: Zap, title: 'Fast & Modern', desc: 'Built on React, Vite & Supabase. Instant, smooth, responsive.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-indigo-500 shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-white/55 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="glass-strong rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-60" />
          <div className="relative">
            <Layers className="mx-auto text-indigo-500 mb-4" size={32} />
            <h2 className="text-3xl font-bold">Ready to upgrade your study game?</h2>
            <p className="mt-2 text-slate-500 dark:text-white/55">Join StudySphere and bring every tool under one browser.</p>
            <Link
              to="/signup"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-medium shadow-xl shadow-indigo-500/30"
            >
              Create your account <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500 dark:text-white/40">
        StudySphere — One Browser. Every Student Need.
      </footer>
    </div>
  );
}
