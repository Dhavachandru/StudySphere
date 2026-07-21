import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Globe, StickyNote, Calendar, ClipboardList, Download, Bookmark,
  History, Bot, Code2, BarChart3, User, Settings, HelpCircle, LogOut, Menu, X,
  Search, Sun, Moon, Sparkles, CalendarCheck, CalendarClock, TrendingUp, Bell,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/browser', label: 'Browser', icon: Globe },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/planner', label: 'Planner', icon: Calendar },
  { to: '/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/exams', label: 'Exam Schedule', icon: CalendarClock },
  { to: '/coding-progress', label: 'Coding Progress', icon: TrendingUp },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/downloads', label: 'Downloads', icon: Download },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/history', label: 'History', icon: History },
  { to: '/ai', label: 'AI Assistant', icon: Bot },
  { to: '/coding', label: 'Coding Hub', icon: Code2 },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/help', label: 'Help Center', icon: HelpCircle },
];

export function Layout() {
  const { profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const initials = (profile?.full_name || 'S').slice(0, 1).toUpperCase();

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <p className="font-semibold leading-tight">StudySphere</p>
          <p className="text-[11px] text-slate-500 dark:text-white/40">Student Browser</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'gradient-brand text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={async () => {
            await signOut();
            navigate('/login');
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-slate-600 dark:text-white/60 hover:bg-rose-500/10 hover:text-rose-500 transition"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-bg">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 glass-strong z-30">
        {SidebarContent}
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 w-64 glass-strong z-50 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 glass border-b border-white/10">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button className="lg:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" onClick={() => setOpen((v) => !v)}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl glass">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder="Search StudySphere…"
                className="bg-transparent text-sm outline-none w-full placeholder-slate-400"
                onKeyDown={(e) => { if (e.key === 'Enter') navigate('/browser'); }}
              />
            </div>

            <div className="flex-1 sm:hidden" />

            <button onClick={toggle} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition" title="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full gradient-brand text-white flex items-center justify-center font-medium text-sm shadow-lg shadow-indigo-500/25"
            >
              {initials}
            </button>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              exit={{ y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
