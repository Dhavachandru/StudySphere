import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, StickyNote, Calendar, ClipboardList,
  Bot, Code2, BarChart3, User, Settings, HelpCircle, LogOut, Menu, X,
  Search, Sun, Moon, Sparkles, CalendarClock, TrendingUp, Bell, Users, GraduationCap,
  BookOpen, CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import type { UserRole } from '../lib/types';

const studentNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assignments', label: 'Coursework & Tasks', icon: ClipboardList },
  { to: '/planner', label: 'Planner & Attendance', icon: Calendar },
  { to: '/notes', label: 'Smart Notes', icon: StickyNote },
  { to: '/exams', label: 'Exam Schedule', icon: CalendarClock },
  { to: '/coding-progress', label: 'Coding Progress', icon: TrendingUp },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/ai', label: 'AI Assistant', icon: Bot },
  { to: '/coding', label: 'Coding Hub', icon: Code2 },
  { to: '/connect', label: 'Connect', icon: Users },
  { to: '/group-study', label: 'Group Study', icon: GraduationCap },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/help', label: 'Help Center', icon: HelpCircle },
];

const teacherNav = [
  { to: '/teacher/dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
  { to: '/teacher/attendance', label: 'Class Attendance', icon: CheckCircle2 },
  { to: '/teacher/assignments', label: 'Assign Coursework', icon: ClipboardList },
  { to: '/teacher/students', label: 'Student Directory', icon: Users },
  { to: '/notes', label: 'Faculty Notes', icon: StickyNote },
  { to: '/ai', label: 'AI Teaching Assistant', icon: Bot },
  { to: '/coding', label: 'Coding Sandbox', icon: Code2 },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/help', label: 'Help Center', icon: HelpCircle },
];

export function Layout() {
  const { profile, role, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const initials = (profile?.full_name || (role === 'teacher' ? 'F' : 'S')).slice(0, 1).toUpperCase();
  const navItems = role === 'teacher' ? teacherNav : studentNav;

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${
            role === 'teacher'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/30'
              : 'gradient-brand shadow-indigo-500/30'
          }`}
        >
          {role === 'teacher' ? <GraduationCap size={18} className="text-white" /> : <Sparkles size={18} className="text-white" />}
        </div>
        <div>
          <p className="font-semibold leading-tight">StudySphere</p>
          <p className="text-[11px] text-slate-500 dark:text-white/40">
            {role === 'teacher' ? 'Faculty Portal' : 'Student Browser'}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? role === 'teacher'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 font-semibold'
                    : 'gradient-brand text-white shadow-lg shadow-indigo-500/25 font-semibold'
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
                placeholder={role === 'teacher' ? 'Search students, classes or submissions...' : 'Search students, friends or notes…'}
                className="bg-transparent text-sm outline-none w-full placeholder-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = e.currentTarget.value.trim();
                    if (q) navigate(`/connect?q=${encodeURIComponent(q)}`);
                  }
                }}
              />
            </div>

            <div className="flex-1 sm:hidden" />

            {/* Role Indicator Badge */}
            {role === 'teacher' ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <GraduationCap size={13} /> Faculty Mode
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BookOpen size={13} /> Student Mode
              </span>
            )}

            <button onClick={toggle} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition" title="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => navigate('/profile')}
              className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-medium text-sm shadow-lg ${
                role === 'teacher'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/25'
                  : 'gradient-brand shadow-indigo-500/25'
              }`}
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
