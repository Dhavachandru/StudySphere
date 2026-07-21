import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Award, GraduationCap, Mail, Edit2, Trophy, Flame, BookOpen, Clock } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Loading, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [stats, setStats] = useState({ notes: 0, assignments: 0, bookmarks: 0, history: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', college: '', department: '', semester: 1, bio: '', avatar_url: '' });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [n, a, b, h] = await Promise.all([
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('history').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setStats({ notes: n.count ?? 0, assignments: a.count ?? 0, bookmarks: b.count ?? 0, history: h.count ?? 0 });
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', college: profile.college || '', department: profile.department || '', semester: profile.semester ?? 1, bio: profile.bio || '', avatar_url: profile.avatar_url || '' });
  }, [profile]);

  const save = async () => {
    if (!user) return;
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, college: form.college, department: form.department, semester: form.semester, bio: form.bio, avatar_url: form.avatar_url || null, updated_at: new Date().toISOString() }).eq('id', user.id);
    if (error) { setError(error.message); return; }
    await refreshProfile();
    setOpen(false);
  };

  if (loading || !profile) return <Loading />;

  const initials = (profile.full_name || 'S').slice(0, 1).toUpperCase();
  const achievements = (profile.achievements ?? []) as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold">Profile</h1>
        <Button onClick={() => setOpen(true)}><Edit2 size={15} /> Edit profile</Button>
      </div>

      {error && <ErrorState message={error} />}

      <GlassCard className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-50" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-500/30 overflow-hidden">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold">{profile.full_name || 'Student'}</h2>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500 dark:text-white/60">
              {profile.college && <span className="flex items-center gap-1"><GraduationCap size={14} /> {profile.college}</span>}
              {profile.department && <span className="flex items-center gap-1"><BookOpen size={14} /> {profile.department}</span>}
              {profile.semester && <span className="flex items-center gap-1"><Clock size={14} /> Semester {profile.semester}</span>}
            </div>
            {user?.email && <p className="flex items-center gap-1 text-xs text-slate-400 mt-1"><Mail size={12} /> {user.email}</p>}
            {profile.bio && <p className="text-sm text-slate-600 dark:text-white/70 mt-2 max-w-md">{profile.bio}</p>}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Notes', value: stats.notes, icon: BookOpen, color: 'from-blue-500 to-indigo-500' },
          { label: 'Assignments', value: stats.assignments, icon: Award, color: 'from-emerald-500 to-teal-500' },
          { label: 'Bookmarks', value: stats.bookmarks, icon: User, color: 'from-amber-500 to-orange-500' },
          { label: 'Pages visited', value: stats.history, icon: Flame, color: 'from-violet-500 to-fuchsia-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="p-4">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2`}><s.icon size={16} /></div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-white/50">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <GlassCard className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Trophy size={18} className="text-amber-500" /> Achievements</h2>
        {achievements.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-white/50 text-center py-6">No achievements yet. Keep using StudySphere to unlock them!</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white"><Trophy size={16} /></div>
                <span className="text-sm font-medium">{a}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit profile">
        <div className="space-y-3">
          <Input placeholder="Avatar URL (optional)" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
          <Input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input placeholder="College" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
          <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Input type="number" min={1} max={12} placeholder="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          <Textarea placeholder="Bio (optional)" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <Button onClick={save} className="w-full">Save changes</Button>
        </div>
      </Modal>
    </div>
  );
}
