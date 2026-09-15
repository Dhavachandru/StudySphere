import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, LogOut, Search, Trash2, GraduationCap, UserCheck, Loader2, Sparkles, X,
  Trophy, Target, Flame, Award
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
import { GroupStudyRoomModal } from '../components/social/GroupStudyRoomModal';
import { loadGroupTasks, loadMemberPoints, getLevelInfo } from '../lib/groupGamification';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { StudyGroup, StudyGroupMember, Profile, Friendship } from '../lib/types';

type GroupWithExtras = StudyGroup & {
  memberCount: number;
  joined: boolean;
  isOwner: boolean;
};

export default function GroupStudy() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithExtras[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, (StudyGroupMember & { profile: Profile })[]>>({});
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [inviteGroup, setInviteGroup] = useState<StudyGroup | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', description: '', max_members: 10 });
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'joined'>('all');
  const [activeStudyGroup, setActiveStudyGroup] = useState<StudyGroup | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data: gRows, error: ge } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
    if (ge) {
      if (ge.message.includes('study_groups') || ge.code === 'PGRST205') {
        setError("Database table 'public.study_groups' is missing. Please run the migration (supabase/migrations/20260904151249_social_friends_groups.sql) in your Supabase SQL Editor.");
      } else {
        setError(ge.message);
      }
      setLoading(false);
      return;
    }
    const allGroups = (gRows as StudyGroup[]) ?? [];

    const { data: mRows } = await supabase.from('study_group_members').select('*');
    const allMembers = (mRows as StudyGroupMember[]) ?? [];

    const memberProfileIds = Array.from(new Set(allMembers.map((m) => m.user_id)));
    let profMap: Record<string, Profile> = {};
    if (memberProfileIds.length) {
      const { data: profs } = await supabase.from('profiles').select('*').in('id', memberProfileIds);
      profMap = Object.fromEntries(((profs as Profile[]) ?? []).map((p) => [p.id, p]));
    }

    const byGroup: Record<string, (StudyGroupMember & { profile: Profile })[]> = {};
    for (const m of allMembers) {
      const g = m.group_id;
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push({ ...m, profile: profMap[m.user_id] ?? { id: m.user_id, username: null, full_name: 'Unknown', avatar_url: null, college: null, department: null, semester: null, bio: null, achievements: null, statistics: null } });
    }
    setMembersMap(byGroup);

    const enriched: GroupWithExtras[] = allGroups.map((g) => {
      const gms = byGroup[g.id] ?? [];
      return {
        ...g,
        memberCount: gms.length,
        joined: gms.some((m) => m.user_id === user.id),
        isOwner: g.owner_id === user.id,
      };
    });
    setGroups(enriched);

    // Load friends for invite modal
    const { data: fRows } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    const allF = (fRows as Friendship[]) ?? [];
    const friendIds = allF.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id));
    if (friendIds.length) {
      const { data: fProfs } = await supabase.from('profiles').select('*').in('id', friendIds);
      setFriends((fProfs as Profile[]) ?? []);
    } else {
      setFriends([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createGroup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) {
      setCreateError('Group name is required.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    const { data: gRow, error: gErr } = await supabase
      .from('study_groups')
      .insert({
        name: form.name.trim(),
        subject: form.subject.trim() || null,
        description: form.description.trim() || null,
        max_members: form.max_members,
        owner_id: user.id,
      })
      .select('*')
      .single();
    if (gErr) {
      setCreateError(gErr.message);
      setCreating(false);
      return;
    }
    const group = gRow as StudyGroup;
    const { error: mErr } = await supabase
      .from('study_group_members')
      .insert({ group_id: group.id, user_id: user.id, role: 'owner' });
    if (mErr) {
      setCreateError(mErr.message);
      setCreating(false);
      return;
    }
    setForm({ name: '', subject: '', description: '', max_members: 10 });
    setCreateError(null);
    setCreating(false);
    setCreateOpen(false);
    await load();
  };

  const joinGroup = async (g: StudyGroup) => {
    if (!user) return;
    setBusyId(g.id);
    const { error: je } = await supabase.from('study_group_members').insert({ group_id: g.id, user_id: user.id, role: 'member' });
    if (je) { setError(je.message); setBusyId(null); return; }
    await load();
    setBusyId(null);
  };

  const leaveGroup = async (g: StudyGroup) => {
    if (!user) return;
    setBusyId(g.id);
    const { error: le } = await supabase.from('study_group_members').delete().eq('group_id', g.id).eq('user_id', user.id);
    if (le) { setError(le.message); setBusyId(null); return; }
    if (g.owner_id === user.id) {
      // owner leaving deletes the group
      await supabase.from('study_groups').delete().eq('id', g.id);
    }
    await load();
    setBusyId(null);
  };

  const deleteGroup = async (g: StudyGroup) => {
    setBusyId(g.id);
    const { error: de } = await supabase.from('study_groups').delete().eq('id', g.id);
    if (de) { setError(de.message); setBusyId(null); return; }
    await load();
    setBusyId(null);
  };

  const inviteFriend = async (friendId: string, groupId: string) => {
    setBusyId(friendId);
    setInviteError(null);
    // Insert a membership row for the friend (they're auto-added as member)
    const { error: ie } = await supabase.from('study_group_members').insert({ group_id: groupId, user_id: friendId, role: 'member' });
    if (ie) {
      // Already a member is fine — ignore
      if (ie.code !== '23505') {
        setInviteError(ie.message.includes('row-level security')
          ? 'Permission denied: Please update the database RLS policy to allow inviting members.'
          : ie.message
        );
        setBusyId(null);
        return;
      }
    }
    setBusyId(null);
    await load();
  };

  const filtered = groups.filter((g) => {
    if (filter === 'mine') return g.isOwner;
    if (filter === 'joined') return g.joined && !g.isOwner;
    return true;
  });

  const Avatar = ({ p, size = 36 }: { p: Profile; size?: number }) => {
    const initials = (p.full_name || p.username || 'S').slice(0, 1).toUpperCase();
    return (
      <div className="rounded-full gradient-brand flex items-center justify-center text-white font-bold shrink-0 overflow-hidden" style={{ width: size, height: size, fontSize: size * 0.4 }}>
        {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
    );
  };

  const invitedIds = inviteGroup ? (membersMap[inviteGroup.id] ?? []).map((m) => m.user_id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Users className="text-indigo-500" /> Group Study</h1>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">Create study groups, invite friends, and learn together.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New group</Button>
      </div>

      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-200 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Gamification Highlights Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Group Study Quests & Levels
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                Gamified
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Complete study tasks with your friends, earn XP, level up your scholar rank, and dominate the leaderboard!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-300">
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 font-medium">
            <Target size={14} className="text-indigo-400" /> Complete Quests
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 font-medium">
            <Flame size={14} className="text-orange-400" /> Earn Points
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 font-medium">
            <Award size={14} className="text-amber-400" /> Level Up Friends
          </div>
        </div>
      </div>

      <div className="flex gap-1">
        {(['all', 'mine', 'joined'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${filter === f ? 'gradient-brand text-white' : 'glass'}`}>
            {f === 'mine' ? 'My groups' : f}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title={filter === 'mine' ? 'You haven\'t created any groups' : filter === 'joined' ? 'You haven\'t joined any groups' : 'No study groups yet'}
          hint="Create a group and invite your friends to start studying together."
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Create a group</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((g, i) => {
            const gms = membersMap[g.id] ?? [];
            const groupTasks = loadGroupTasks(g.id, g.subject);
            const groupPointsMap = loadMemberPoints(g.id);
            const groupTotalXp = Object.values(groupPointsMap).reduce((s, p) => s + p, 0);
            const groupLevel = getLevelInfo(groupTotalXp);
            const completedCount = groupTasks.filter((t) => t.completed).length;

            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard className="p-5 h-full flex flex-col hover:border-indigo-500/30 transition">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate text-base">{g.name}</h3>
                      {g.subject && <p className="text-xs text-indigo-500 flex items-center gap-1 mt-0.5"><GraduationCap size={12} /> {g.subject}</p>}
                    </div>
                    {g.isOwner && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 shrink-0 font-medium">Owner</span>}
                  </div>
                  {g.description && <p className="text-sm text-slate-500 dark:text-white/60 mb-3 line-clamp-2">{g.description}</p>}

                  {/* Gamification Bar */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs mb-3">
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Flame size={13} className="text-orange-400" /> {groupTotalXp} XP · Lvl {groupLevel.level}
                    </span>
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Target size={12} className="text-indigo-400" /> {completedCount}/{groupTasks.length} Quests Done
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                      {gms.slice(0, 4).map((m) => (
                        <div key={m.id} className="ring-2 ring-white dark:ring-slate-800 rounded-full"><Avatar p={m.profile} size={28} /></div>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-white/50">{g.memberCount}/{g.max_members} members</span>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <Button
                      size="sm"
                      onClick={() => setActiveStudyGroup(g)}
                      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-indigo-500/20"
                    >
                      <Trophy size={13} /> Quests & Leaderboard
                    </Button>
                    {g.isOwner ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setInviteGroup(g)}><UserCheck size={14} /> Invite</Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteGroup(g)} loading={busyId === g.id}><Trash2 size={14} /></Button>
                      </>
                    ) : g.joined ? (
                      <Button size="sm" variant="outline" onClick={() => leaveGroup(g)} loading={busyId === g.id}><LogOut size={14} /> Leave</Button>
                    ) : g.memberCount >= g.max_members ? (
                      <span className="text-xs text-slate-400 self-center">Full</span>
                    ) : (
                      <Button size="sm" onClick={() => joinGroup(g)} loading={busyId === g.id}><Plus size={14} /> Join</Button>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create group modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateError(null);
        }}
        title="Create study group"
      >
        <form onSubmit={createGroup} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Group Name <span className="text-rose-400">*</span>
            </label>
            <Input
              placeholder="e.g. Algorithms & Data Structures"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (createError) setCreateError(null);
              }}
              autoFocus
            />
            {createError && (
              <p className="text-xs text-rose-400 mt-1.5">{createError}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Subject (optional)</label>
            <Input
              placeholder="e.g. Computer Science"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Description (optional)</label>
            <Textarea
              placeholder="What is this study group about?"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-500 dark:text-white/50">Max members</label>
            <Input
              type="number"
              min={2}
              max={50}
              value={form.max_members}
              onChange={(e) => setForm({ ...form, max_members: Math.max(2, Math.min(50, Number(e.target.value) || 10)) })}
              className="w-24 text-center"
            />
          </div>
          <Button
            type="submit"
            loading={creating}
            disabled={!form.name.trim() || creating}
            className="w-full"
          >
            <Sparkles size={15} /> Create group
          </Button>
        </form>
      </Modal>

      {/* Invite friends modal */}
      <Modal
        open={!!inviteGroup}
        onClose={() => {
          setInviteGroup(null);
          setInviteError(null);
        }}
        title={`Invite friends to "${inviteGroup?.name ?? ''}"`}
      >
        {inviteError && (
          <div className="p-3 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {inviteError}
          </div>
        )}
        {friends.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-white/50 text-center py-6">You need friends to invite. Go to the Connect page to add some!</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-auto">
            {friends.map((f) => {
              const alreadyIn = invitedIds.includes(f.id);
              return (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl glass">
                  <Avatar p={f} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{f.full_name || 'Student'}</p>
                    <p className="text-xs text-indigo-500 truncate">@{f.username}</p>
                  </div>
                  {alreadyIn ? (
                    <span className="text-xs text-emerald-500 flex items-center gap-1"><UserCheck size={14} /> In group</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => inviteFriend(f.id, inviteGroup!.id)} loading={busyId === f.id}>
                      <Plus size={14} /> Invite
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Study Room Gamification & Leaderboard Modal */}
      {activeStudyGroup && (
        <GroupStudyRoomModal
          group={activeStudyGroup}
          members={membersMap[activeStudyGroup.id] ?? []}
          open={Boolean(activeStudyGroup)}
          onClose={() => {
            setActiveStudyGroup(null);
            load();
          }}
        />
      )}
    </div>
  );
}
