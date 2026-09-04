import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, LogOut, Search, Trash2, GraduationCap, UserCheck, Loader2, Sparkles,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { Modal } from '../components/ui/Modal';
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
  const [inviteGroup, setInviteGroup] = useState<StudyGroup | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', description: '', max_members: 10 });
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'joined'>('all');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data: gRows, error: ge } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
    if (ge) { setError(ge.message); setLoading(false); return; }
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

  const createGroup = async () => {
    if (!user) return;
    if (!form.name.trim()) { setError('Group name is required.'); return; }
    setCreating(true);
    setError(null);
    const { data: gRow, error: gErr } = await supabase
      .from('study_groups')
      .insert({ name: form.name.trim(), subject: form.subject.trim() || null, description: form.description.trim() || null, max_members: form.max_members, owner_id: user.id })
      .select('*')
      .single();
    if (gErr) { setError(gErr.message); setCreating(false); return; }
    const group = gRow as StudyGroup;
    const { error: mErr } = await supabase.from('study_group_members').insert({ group_id: group.id, user_id: user.id, role: 'owner' });
    if (mErr) { setError(mErr.message); setCreating(false); return; }
    setForm({ name: '', subject: '', description: '', max_members: 10 });
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
    // Insert a membership row for the friend (they're auto-added as member)
    const { error: ie } = await supabase.from('study_group_members').insert({ group_id: groupId, user_id: friendId, role: 'member' });
    if (ie) {
      // Already a member is fine — ignore
      if (ie.code !== '23505') { setError(ie.message); setBusyId(null); return; }
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

      {error && <ErrorState message={error} onRetry={load} />}

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
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard className="p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{g.name}</h3>
                      {g.subject && <p className="text-xs text-indigo-500 flex items-center gap-1 mt-0.5"><GraduationCap size={12} /> {g.subject}</p>}
                    </div>
                    {g.isOwner && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 shrink-0">Owner</span>}
                  </div>
                  {g.description && <p className="text-sm text-slate-500 dark:text-white/60 mb-3 line-clamp-2">{g.description}</p>}

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                      {gms.slice(0, 4).map((m) => (
                        <div key={m.id} className="ring-2 ring-white dark:ring-slate-800 rounded-full"><Avatar p={m.profile} size={28} /></div>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-white/50">{g.memberCount}/{g.max_members} members</span>
                  </div>

                  <div className="mt-auto flex gap-2">
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
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create study group">
        <div className="space-y-3">
          <Input placeholder="Group name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Subject (optional)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Textarea placeholder="Description (optional)" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 dark:text-white/50">Max members</label>
            <Input type="number" min={2} max={50} value={form.max_members} onChange={(e) => setForm({ ...form, max_members: Number(e.target.value) })} className="w-24" />
          </div>
          <Button onClick={createGroup} loading={creating} className="w-full"><Sparkles size={15} /> Create group</Button>
        </div>
      </Modal>

      {/* Invite friends modal */}
      <Modal open={!!inviteGroup} onClose={() => setInviteGroup(null)} title={`Invite friends to "${inviteGroup?.name ?? ''}"`}>
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
    </div>
  );
}
