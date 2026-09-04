import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, UserPlus, Check, X, Users, UserCheck, Clock, AtSign, Loader2,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading, EmptyState, ErrorState } from '../components/ui/State';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Profile, Friendship } from '../lib/types';

type FriendWithProfile = Friendship & { profile: Profile };

export default function Connect() {
  const { user, profile, refreshProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Profile[]>([]);
  const [searched, setSearched] = useState(false);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendWithProfile[]>([]);
  const [outgoing, setOutgoing] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data: rows, error: e } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    if (e) { setError(e.message); setLoading(false); return; }

    const all = (rows as Friendship[]) ?? [];
    const otherIds = Array.from(new Set(all.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id))));
    let profileMap: Record<string, Profile> = {};
    if (otherIds.length) {
      const { data: profs } = await supabase.from('profiles').select('*').in('id', otherIds);
      profileMap = Object.fromEntries(((profs as Profile[]) ?? []).map((p) => [p.id, p]));
    }

    const enrich = (f: Friendship): FriendWithProfile => ({
      ...f,
      profile: profileMap[f.user_id === user.id ? f.friend_id : f.user_id] ?? { id: '', username: null, full_name: 'Unknown user', avatar_url: null, college: null, department: null, semester: null, bio: null, achievements: null, statistics: null },
    });

    setFriends(all.filter((f) => f.status === 'accepted').map(enrich));
    setIncoming(all.filter((f) => f.status === 'pending' && f.friend_id === user.id).map(enrich));
    setOutgoing(all.filter((f) => f.status === 'pending' && f.user_id === user.id).map(enrich));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (profile) setUsernameDraft(profile.username ?? '');
  }, [profile]);

  const doSearch = async () => {
    const q = query.trim().toLowerCase().replace(/^@/, '');
    if (!q) { setResults([]); setSearched(false); return; }
    setSearching(true);
    setSearched(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${q}%`)
      .neq('id', user?.id ?? '')
      .limit(12);
    setResults((data as Profile[]) ?? []);
    setSearching(false);
  };

  const sendRequest = async (targetId: string) => {
    if (!user) return;
    setBusyId(targetId);
    const { error: ie } = await supabase.from('friendships').insert({ user_id: user.id, friend_id: targetId, status: 'pending' });
    if (ie) { setError(ie.message); setBusyId(null); return; }
    await load();
    setBusyId(null);
  };

  const acceptRequest = async (f: Friendship) => {
    setBusyId(f.id);
    const { error: ue } = await supabase.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', f.id);
    if (ue) { setError(ue.message); setBusyId(null); return; }
    await load();
    setBusyId(null);
  };

  const declineRequest = async (f: Friendship) => {
    setBusyId(f.id);
    const { error: de } = await supabase.from('friendships').delete().eq('id', f.id);
    if (de) { setError(de.message); setBusyId(null); return; }
    await load();
    setBusyId(null);
  };

  const cancelRequest = async (f: Friendship) => {
    setBusyId(f.id);
    const { error: ce } = await supabase.from('friendships').delete().eq('id', f.id);
    if (ce) { setError(ce.message); setBusyId(null); return; }
    await load();
    setBusyId(null);
  };

  const removeFriend = async (f: Friendship) => {
    setBusyId(f.id);
    const { error: re } = await supabase.from('friendships').delete().eq('id', f.id);
    if (re) { setError(re.message); setBusyId(null); return; }
    await load();
    setBusyId(null);
  };

  const saveUsername = async () => {
    if (!user) return;
    const cleaned = usernameDraft.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    if (cleaned.length < 3) { setUsernameError('Username must be at least 3 characters (letters, numbers, underscore).'); return; }
    setSavingUsername(true);
    setUsernameError(null);
    const { error: ue } = await supabase.from('profiles').update({ username: cleaned, updated_at: new Date().toISOString() }).eq('id', user.id);
    if (ue) { setUsernameError(ue.code === '23505' ? 'That username is taken. Try another.' : ue.message); setSavingUsername(false); return; }
    await refreshProfile();
    setSavingUsername(false);
  };

  const isFriend = (pid: string) => friends.some((f) => f.profile.id === pid);
  const isPending = (pid: string) => outgoing.some((f) => f.profile.id === pid);

  const Avatar = ({ p, size = 40 }: { p: Profile; size?: number }) => {
    const initials = (p.full_name || p.username || 'S').slice(0, 1).toUpperCase();
    return (
      <div className="rounded-full gradient-brand flex items-center justify-center text-white font-bold shrink-0 overflow-hidden" style={{ width: size, height: size, fontSize: size * 0.4 }}>
        {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2"><Users className="text-indigo-500" /> Connect</h1>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">Find friends by username and grow your study circle.</p>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Username setup */}
      {profile && !profile.username && (
        <GlassCard className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-2"><AtSign size={18} className="text-indigo-500" /> Pick your username</h2>
          <p className="text-sm text-slate-500 dark:text-white/50 mb-3">This is how friends will find you. Choose a handle like <span className="font-medium text-indigo-500">@alex_studies</span>.</p>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="username"
              value={usernameDraft}
              onChange={(e) => setUsernameDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
              className="max-w-xs"
            />
            <Button onClick={saveUsername} loading={savingUsername} disabled={!usernameDraft.trim()}>Save username</Button>
          </div>
          {usernameError && <p className="text-xs text-rose-500 mt-2">{usernameError}</p>}
        </GlassCard>
      )}

      {/* Search */}
      <GlassCard className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3"><Search size={18} className="text-indigo-500" /> Find friends</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by username…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={doSearch} loading={searching}>Search</Button>
        </div>

        {searched && (
          <div className="mt-4 space-y-2">
            {searching ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-indigo-500" size={22} /></div>
            ) : results.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-white/50 text-center py-6">No users found. Try a different username.</p>
            ) : (
              results.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 p-3 rounded-xl glass">
                  <Avatar p={p} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.full_name || 'Student'}</p>
                    <p className="text-xs text-indigo-500 truncate">@{p.username}</p>
                  </div>
                  {isFriend(p.id) ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium"><UserCheck size={15} /> Friends</span>
                  ) : isPending(p.id) ? (
                    <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={14} /> Requested</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => sendRequest(p.id)} loading={busyId === p.id}>
                      <UserPlus size={14} /> Add
                    </Button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </GlassCard>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <GlassCard className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><UserPlus size={18} className="text-amber-500" /> Friend requests <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">{incoming.length}</span></h2>
          <div className="space-y-2">
            {incoming.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl glass">
                <Avatar p={f.profile} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{f.profile.full_name || 'Student'}</p>
                  <p className="text-xs text-indigo-500 truncate">@{f.profile.username}</p>
                </div>
                <Button size="sm" onClick={() => acceptRequest(f)} loading={busyId === f.id}><Check size={14} /> Accept</Button>
                <Button size="sm" variant="ghost" onClick={() => declineRequest(f)} disabled={busyId === f.id}><X size={14} /></Button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Friends list */}
      <GlassCard className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3"><UserCheck size={18} className="text-emerald-500" /> Your friends <span className="text-xs text-slate-400">({friends.length})</span></h2>
        {loading ? <Loading /> : friends.length === 0 ? (
          <EmptyState icon={<Users size={24} />} title="No friends yet" hint="Search for a username above and send a friend request." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl glass">
                <Avatar p={f.profile} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{f.profile.full_name || 'Student'}</p>
                  <p className="text-xs text-slate-500 dark:text-white/50 truncate">
                    {f.profile.username ? `@${f.profile.username}` : ''}
                    {f.profile.college ? ` · ${f.profile.college}` : ''}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeFriend(f)} disabled={busyId === f.id}><X size={14} /></Button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Outgoing requests */}
      {outgoing.length > 0 && (
        <GlassCard className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><Clock size={18} className="text-slate-400" /> Sent requests</h2>
          <div className="space-y-2">
            {outgoing.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl glass">
                <Avatar p={f.profile} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{f.profile.full_name || 'Student'}</p>
                  <p className="text-xs text-indigo-500 truncate">@{f.profile.username}</p>
                </div>
                <span className="text-xs text-slate-400">Pending</span>
                <Button size="sm" variant="ghost" onClick={() => cancelRequest(f)} disabled={busyId === f.id}>Cancel</Button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
