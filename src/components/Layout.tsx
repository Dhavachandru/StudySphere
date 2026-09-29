import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, StickyNote, Calendar, ClipboardList,
  Bot, Code2, BarChart3, User, Settings, HelpCircle, LogOut, X,
  Search, Sun, Moon, Sparkles, CalendarClock, TrendingUp, Bell, Users, GraduationCap,
  BookOpen, CheckCircle2, Download, MoreHorizontal, ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { InstallAppModal } from './InstallAppModal';
import { InstallAppBanner } from './InstallAppBanner';

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
  const { profile, role, user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const initials = (profile?.full_name || (role === 'teacher' ? 'F' : 'S')).slice(0, 1).toUpperCase();
  const navItems = role === 'teacher' ? teacherNav : studentNav;

  // Primary Android Bottom Navigation Tabs
  const mobileTabs = role === 'teacher' ? [
    { to: '/teacher/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/teacher/attendance', label: 'Attendance', icon: CheckCircle2 },
    { to: '/teacher/assignments', label: 'Tasks', icon: ClipboardList },
    { to: '/ai', label: 'AI Copilot', icon: Bot },
  ] : [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/planner', label: 'Planner', icon: Calendar },
    { to: '/notes', label: 'Notes', icon: StickyNote },
    { to: '/ai', label: 'AI Copilot', icon: Bot },
  ];

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('read', false)
      .then(({ count }) => {
        if (typeof count === 'number') setUnreadCount(count);
      });
  }, [user, location.pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={() => setShowInstallModal(true)}
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm w-full text-indigo-400 hover:bg-indigo-500/10 transition font-medium"
        >
          <div className="flex items-center gap-3">
            <Download size={18} /> Download App
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
            App Stores
          </span>
        </button>

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
      {/* Desktop Sidebar (Laptop / Tablet Wide) */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 glass-strong z-30">
        {SidebarContent}
      </aside>

      {/* Main Container */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 glass border-b border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 lg:px-8 h-14 lg:h-16">
            {/* Mobile Branding */}
            <div className="flex items-center gap-2 lg:hidden">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
                  role === 'teacher'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/30'
                    : 'gradient-brand shadow-indigo-500/30'
                }`}
              >
                {role === 'teacher' ? <GraduationCap size={16} className="text-white" /> : <Sparkles size={16} className="text-white" />}
              </div>
              <span className="font-bold text-base tracking-tight">StudySphere</span>
            </div>

            {/* Desktop Global Search */}
            <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl glass border border-white/10">
              <Search size={16} className="text-slate-400 shrink-0" />
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

            <div className="flex-1 lg:hidden" />

            {/* Right Action Icons (Responsive & Touch-Friendly) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Role Indicator Badge (Desktop) */}
              {role === 'teacher' ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <GraduationCap size={13} /> Faculty
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <BookOpen size={13} /> Student
                </span>
              )}

              {/* Download App Action */}
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold glass text-indigo-400 hover:bg-indigo-500/10 transition border border-indigo-500/20 active:scale-95"
                title="Download App for Android & Windows"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Download App</span>
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition"
                aria-label="Notifications"
              >
                <Bell size={18} className="text-slate-600 dark:text-white/70" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-slate-900" />
                )}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggle}
                className="p-2 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition"
                title="Toggle theme"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Profile Avatar Button */}
              <button
                onClick={() => navigate('/profile')}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md active:scale-95 transition ${
                  role === 'teacher'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/25'
                    : 'gradient-brand shadow-indigo-500/25'
                }`}
                aria-label="View Profile"
              >
                {initials}
              </button>
            </div>
          </div>
        </header>

        {/* Content Area with extra bottom padding on mobile for the bottom nav bar */}
        <main className="flex-1 px-4 lg:px-8 py-5 max-w-7xl w-full mx-auto pb-28 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Android Floating Glass Bottom Navigation Bar (Mobile Viewports Only) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/10 shadow-2xl backdrop-blur-2xl"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around px-2 pt-1.5 h-14">
          {mobileTabs.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || (to !== '/dashboard' && to !== '/teacher/dashboard' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-150 active:scale-90 ${
                  isActive
                    ? 'text-indigo-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg transition ${isActive ? 'bg-indigo-500/20 text-indigo-400 shadow-sm shadow-indigo-500/20' : ''}`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{label}</span>
              </NavLink>
            );
          })}

          {/* 5th Button: Android "More Tools" Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-150 active:scale-90 ${
              mobileMenuOpen ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="More Features"
          >
            <div className={`p-1 rounded-lg transition ${mobileMenuOpen ? 'bg-indigo-500/20 text-indigo-400' : ''}`}>
              <MoreHorizontal size={20} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Android Modern Bottom Sheet "More Features" Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl glass-strong border-t border-white/15 p-5 shadow-2xl"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              {/* Top Drag Handle Pill */}
              <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${
                      role === 'teacher'
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                        : 'gradient-brand'
                    }`}
                  >
                    {role === 'teacher' ? <GraduationCap size={18} className="text-white" /> : <Sparkles size={18} className="text-white" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight">All Features</h3>
                    <p className="text-xs text-slate-400">
                      {role === 'teacher' ? 'Faculty Academic Portal' : 'Student Hub'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Grid of secondary items */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 p-3 rounded-2xl text-xs font-medium transition active:scale-95 ${
                        isActive
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                      }`
                    }
                  >
                    <Icon size={16} className="text-indigo-400 shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>

              {/* App Download Card in Drawer */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Download size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs">Get Android &amp; Windows App</h5>
                    <p className="text-[11px] text-slate-400">Offline access &amp; instant launch</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowInstallModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 shadow-md shadow-indigo-500/25 active:scale-95 transition"
                >
                  Install
                </button>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await signOut();
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 active:scale-95 transition"
              >
                <LogOut size={15} /> Sign out from StudySphere
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Install Modal & Banner */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
      <InstallAppBanner />
    </div>
  );
}
