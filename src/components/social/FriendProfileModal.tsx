import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserPlus,
  UserCheck,
  Clock,
  Share2,
  Trophy,
  GraduationCap,
  BookOpen,
  Users,
  Check,
  Award,
  Sparkles,
  Grid3X3,
  Flame,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import type { Profile, Friendship } from '../../lib/types';

interface Props {
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
  friendship?: Friendship | null;
  friendshipStatus?: 'friend' | 'incoming' | 'outgoing' | 'none' | 'self';
  onSendRequest?: (targetId: string) => Promise<void>;
  onAcceptRequest?: (f: Friendship) => Promise<void>;
  onDeclineRequest?: (f: Friendship) => Promise<void>;
  onCancelRequest?: (f: Friendship) => Promise<void>;
  onRemoveFriend?: (f: Friendship) => Promise<void>;
}

export function FriendProfileModal({
  profile,
  open,
  onClose,
  friendship,
  friendshipStatus = 'none',
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveFriend,
}: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'groups'>('overview');
  const [stats, setStats] = useState({ friends: 0, groups: 0, notes: 0 });
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSelf = profile?.id === user?.id;
  const effectiveStatus = isSelf ? 'self' : friendshipStatus;

  useEffect(() => {
    if (!open || !profile) return;
    setActiveTab('overview');
    setCopied(false);

    let isMounted = true;
    (async () => {
      setLoadingStats(true);
      try {
        const [friendsRes, groupsRes] = await Promise.all([
          supabase
            .from('friendships')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`),
          supabase
            .from('study_group_members')
            .select('group_id, study_groups(name)')
            .eq('user_id', profile.id),
        ]);

        if (!isMounted) return;

        const friendsCount = friendsRes.count ?? 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memberRows = (groupsRes.data as any[]) ?? [];
        const names: string[] = memberRows
          .map((r) => r.study_groups?.name)
          .filter(Boolean);

        setStats({
          friends: friendsCount,
          groups: names.length,
          notes: profile.statistics?.notes_count ?? 0,
        });
        setGroupNames(names);
      } catch {
        // graceful fallback if social tables are not configured
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [open, profile]);

  if (!profile) return null;

  const initials = (profile.full_name || profile.username || 'S').slice(0, 1).toUpperCase();
  const achievements = (profile.achievements ?? []) as string[];

  const handleCopyProfile = () => {
    const handle = profile.username ? `@${profile.username}` : profile.full_name || 'StudySphere student';
    const url = `${window.location.origin}/connect?q=${encodeURIComponent(profile.username || profile.full_name || '')}`;
    navigator.clipboard.writeText(`${handle} on StudySphere: ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with dark blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={onClose}
          />

          {/* Instagram-style Profile Container */}
          <motion.div
            className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900/95 text-white max-h-[90vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Top Bar (Instagram Style) */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-sm sm:text-base tracking-tight truncate">
                  {profile.username ? `@${profile.username}` : profile.full_name}
                </span>
                {achievements.length > 0 && (
                  <span title="Verified Achiever">
                    <ShieldCheck size={16} className="text-indigo-400 shrink-0" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyProfile}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
                  title="Share profile"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Profile Header Row: Avatar + Instagram Stats */}
              <div className="flex items-center justify-between gap-4">
                {/* Avatar with glowing Instagram Story Gradient Ring */}
                <div className="relative group shrink-0">
                  <div className="p-[3px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 shadow-lg shadow-rose-500/20">
                    <div className="p-0.5 rounded-full bg-slate-900">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full gradient-brand flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-inner">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Active Student Badge */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow" title="StudySphere Member" />
                </div>

                {/* 3 Instagram Stats (Friends, Groups, Achievements) */}
                <div className="flex-1 grid grid-cols-3 text-center gap-1">
                  <div className="p-2 rounded-xl hover:bg-white/5 transition">
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {loadingStats ? '—' : stats.friends}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">Friends</p>
                  </div>
                  <div className="p-2 rounded-xl hover:bg-white/5 transition">
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {loadingStats ? '—' : stats.groups}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">Groups</p>
                  </div>
                  <div className="p-2 rounded-xl hover:bg-white/5 transition">
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {achievements.length}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">Badges</p>
                  </div>
                </div>
              </div>

              {/* Bio & Academic Details (Instagram Style) */}
              <div className="space-y-2">
                <div>
                  <h2 className="font-bold text-base text-white">
                    {profile.full_name || 'Student'}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      🎓 Student
                    </span>
                    {profile.username && (
                      <span className="text-xs text-slate-400">@{profile.username}</span>
                    )}
                  </div>
                </div>

                {/* Academic credentials */}
                <div className="flex flex-wrap gap-2 text-xs text-slate-300 pt-1">
                  {profile.college && (
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                      <GraduationCap size={13} className="text-indigo-400" />
                      {profile.college}
                    </span>
                  )}
                  {profile.department && (
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                      <BookOpen size={13} className="text-indigo-400" />
                      {profile.department}
                    </span>
                  )}
                  {profile.semester && (
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                      <Calendar size={13} className="text-indigo-400" />
                      Semester {profile.semester}
                    </span>
                  )}
                </div>

                {/* Bio text */}
                {profile.bio && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pt-1">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons (Instagram Style) */}
              <div className="pt-1">
                {effectiveStatus === 'self' ? (
                  <Button
                    variant="secondary"
                    className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/10"
                    onClick={onClose}
                  >
                    Your Profile
                  </Button>
                ) : effectiveStatus === 'friend' ? (
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold">
                      <UserCheck size={16} /> Friends
                    </div>
                    {friendship && onRemoveFriend && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAction(() => onRemoveFriend(friendship))}
                        loading={busy}
                        className="bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10"
                      >
                        Unfriend
                      </Button>
                    )}
                  </div>
                ) : effectiveStatus === 'outgoing' ? (
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 border border-white/10 text-slate-300 text-xs sm:text-sm font-medium">
                      <Clock size={15} className="text-amber-400" /> Friend Request Sent
                    </div>
                    {friendship && onCancelRequest && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAction(() => onCancelRequest(friendship))}
                        loading={busy}
                        className="bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                ) : effectiveStatus === 'incoming' ? (
                  <div className="flex gap-2">
                    {friendship && onAcceptRequest && (
                      <Button
                        className="flex-1 gradient-brand text-white shadow-lg shadow-indigo-500/30 font-semibold"
                        onClick={() => handleAction(() => onAcceptRequest(friendship))}
                        loading={busy}
                      >
                        <Check size={15} /> Confirm
                      </Button>
                    )}
                    {friendship && onDeclineRequest && (
                      <Button
                        variant="secondary"
                        onClick={() => handleAction(() => onDeclineRequest(friendship))}
                        disabled={busy}
                        className="bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10"
                      >
                        Decline
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-semibold shadow-lg shadow-indigo-500/30 text-sm py-2.5"
                    onClick={() => onSendRequest && handleAction(() => onSendRequest(profile.id))}
                    loading={busy}
                  >
                    <UserPlus size={16} /> Add Friend
                  </Button>
                )}
              </div>

              {/* Instagram-Style Story Highlights */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Highlights
                </p>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="flex flex-col items-center gap-1.5 shrink-0 group"
                  >
                    <div className="w-13 h-13 p-0.5 rounded-full border-2 border-indigo-500/50 group-hover:border-indigo-400 transition">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
                        <GraduationCap size={20} />
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-300 font-medium">Academics</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('achievements')}
                    className="flex flex-col items-center gap-1.5 shrink-0 group"
                  >
                    <div className="w-13 h-13 p-0.5 rounded-full border-2 border-amber-500/50 group-hover:border-amber-400 transition">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                        <Trophy size={20} />
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-300 font-medium">Badges</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('groups')}
                    className="flex flex-col items-center gap-1.5 shrink-0 group"
                  >
                    <div className="w-13 h-13 p-0.5 rounded-full border-2 border-purple-500/50 group-hover:border-purple-400 transition">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition">
                        <Users size={20} />
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-300 font-medium">Circles</span>
                  </button>
                </div>
              </div>

              {/* Instagram-Style Tab Bar */}
              <div className="border-t border-white/10 pt-1">
                <div className="flex border-b border-white/10 text-xs">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-medium transition border-b-2 ${
                      activeTab === 'overview'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Grid3X3 size={14} />
                    <span>Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('achievements')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-medium transition border-b-2 ${
                      activeTab === 'achievements'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Award size={14} />
                    <span>Achievements ({achievements.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('groups')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-medium transition border-b-2 ${
                      activeTab === 'groups'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users size={14} />
                    <span>Groups ({groupNames.length})</span>
                  </button>
                </div>

                {/* Tab Content Panels */}
                <div className="pt-4">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                          <Sparkles size={14} /> Student Profile
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-black/20">
                            <span className="text-slate-400 block text-[10px]">College</span>
                            <span className="font-medium text-white truncate block">
                              {profile.college || 'Not specified'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black/20">
                            <span className="text-slate-400 block text-[10px]">Department</span>
                            <span className="font-medium text-white truncate block">
                              {profile.department || 'Not specified'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black/20">
                            <span className="text-slate-400 block text-[10px]">Current Semester</span>
                            <span className="font-medium text-white block">
                              {profile.semester ? `Semester ${profile.semester}` : 'Not specified'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black/20">
                            <span className="text-slate-400 block text-[10px]">Member Status</span>
                            <span className="font-medium text-emerald-400 block">Verified Student</span>
                          </div>
                        </div>
                      </div>

                      {/* Study Circle Summary */}
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                            <Flame size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">Study Circle Member</p>
                            <p className="text-[11px] text-slate-400">Collaborates & studies on StudySphere</p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                          Active
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Achievements Tab */}
                  {activeTab === 'achievements' && (
                    <div>
                      {achievements.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 space-y-2">
                          <Trophy size={32} className="mx-auto text-slate-600" />
                          <p className="text-xs">No badges unlocked yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                          {achievements.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center gap-2.5 hover:border-indigo-500/40 transition"
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0 shadow">
                                <Trophy size={14} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white truncate">{item}</p>
                                <span className="text-[10px] text-amber-300/80">Unlocked badge</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Groups Tab */}
                  {activeTab === 'groups' && (
                    <div>
                      {groupNames.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 space-y-2">
                          <Users size={32} className="mx-auto text-slate-600" />
                          <p className="text-xs">Not in any study groups yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {groupNames.map((name, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0">
                                <Users size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{name}</p>
                                <p className="text-[10px] text-slate-400">Study Group</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
