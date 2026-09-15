import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trophy,
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Award,
  Users,
  Target,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Shield,
  Clock,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import {
  GroupTask,
  getLevelInfo,
  calculateProgress,
  loadGroupTasks,
  saveGroupTasks,
  loadMemberPoints,
  saveMemberPoints,
} from '../../lib/groupGamification';
import { FriendProfileModal } from './FriendProfileModal';
import { useAuth } from '../../lib/auth';
import type { StudyGroup, StudyGroupMember, Profile } from '../../lib/types';

interface Props {
  group: StudyGroup;
  members: (StudyGroupMember & { profile: Profile })[];
  open: boolean;
  onClose: () => void;
}

export function GroupStudyRoomModal({ group, members, open, onClose }: Props) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'leaderboard'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Load group tasks and points
  const [tasks, setTasks] = useState<GroupTask[]>(() =>
    loadGroupTasks(group.id, group.subject)
  );
  const [memberPoints, setMemberPoints] = useState<Record<string, number>>(() =>
    loadMemberPoints(group.id)
  );

  // New task modal state
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPoints, setNewPoints] = useState<number>(100);
  const [newDifficulty, setNewDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Epic'>('Medium');
  const [newCategory, setNewCategory] = useState<'Study' | 'Coding' | 'Review' | 'Discussion'>('Study');

  // Selected profile for Instagram modal
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);

  // Celebration banner
  const [celebration, setCelebration] = useState<{ name: string; points: number } | null>(null);

  if (!open) return null;

  // Complete or uncomplete a task
  const toggleTask = (task: GroupTask) => {
    if (!user) return;
    const isNowCompleted = !task.completed;
    const currentMemberName = profile?.full_name || profile?.username || 'You';

    const updatedTasks = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          completed: isNowCompleted,
          completedBy: isNowCompleted ? user.id : undefined,
          completedByName: isNowCompleted ? currentMemberName : undefined,
          completedAt: isNowCompleted ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    // Update points
    const currentScore = memberPoints[user.id] || 0;
    const delta = isNowCompleted ? task.points : -task.points;
    const updatedPoints = {
      ...memberPoints,
      [user.id]: Math.max(0, currentScore + delta),
    };

    setTasks(updatedTasks);
    setMemberPoints(updatedPoints);
    saveGroupTasks(group.id, updatedTasks);
    saveMemberPoints(group.id, updatedPoints);

    if (isNowCompleted) {
      setCelebration({ name: currentMemberName, points: task.points });
      setTimeout(() => setCelebration(null), 3500);
    }
  };

  // Create custom group task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: GroupTask = {
      id: `${group.id}-${Date.now()}`,
      groupId: group.id,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      points: newPoints,
      difficulty: newDifficulty,
      category: newCategory,
      completed: false,
      created_at: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveGroupTasks(group.id, updated);
    setNewTitle('');
    setNewDesc('');
    setNewPoints(100);
    setAddTaskOpen(false);
  };

  // Delete a task
  const deleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveGroupTasks(group.id, updated);
  };

  // Leaderboard data calculation
  const leaderboardList = members.map((m) => {
    const pts = memberPoints[m.user_id] || 0;
    const levelInfo = getLevelInfo(pts);
    const progress = calculateProgress(pts);
    const tasksDone = tasks.filter((t) => t.completed && t.completedBy === m.user_id).length;

    return {
      member: m,
      points: pts,
      levelInfo,
      progress,
      tasksDone,
    };
  }).sort((a, b) => b.points - a.points);

  // Group total XP
  const totalGroupXp = Object.values(memberPoints).reduce((acc, p) => acc + p, 0);
  const groupLevel = getLevelInfo(totalGroupXp);
  const completedTasksCount = tasks.filter((t) => t.completed).length;

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'active') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  const Avatar = ({ p, size = 38 }: { p: Profile; size?: number }) => {
    const initials = (p.full_name || p.username || 'S').slice(0, 1).toUpperCase();
    return (
      <div
        className="rounded-full gradient-brand flex items-center justify-center text-white font-bold shrink-0 overflow-hidden shadow-sm"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

        {/* Study Room Container */}
        <motion.div
          className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900/95 text-white max-h-[92vh] flex flex-col"
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl gradient-brand flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Users size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight">{group.name}</h2>
                  {group.subject && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                      {group.subject}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 text-amber-300 font-semibold">
                    <Flame size={13} className="text-orange-400" /> {totalGroupXp} Group XP
                  </span>
                  <span>•</span>
                  <span>Team Level {groupLevel.level} ({groupLevel.title})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Celebration Toast */}
          <AnimatePresence>
            {celebration && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                className="mx-6 mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-200 flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                  <Sparkles size={16} className="text-amber-400 animate-spin" />
                  <span>
                    🎉 Mission Accomplished! <strong>+{celebration.points} XP</strong> awarded to{' '}
                    <span className="underline">{celebration.name}</span>!
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                  LEVEL UP
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between px-6 pt-3 border-b border-white/10 text-sm">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 pb-3 px-3 font-semibold transition border-b-2 ${
                  activeTab === 'tasks'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Target size={16} />
                <span>Group Tasks & Quests</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {completedTasksCount}/{tasks.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex items-center gap-2 pb-3 px-3 font-semibold transition border-b-2 ${
                  activeTab === 'leaderboard'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy size={16} className="text-amber-400" />
                <span>Friends Leaderboard & Levels</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  {members.length} Friends
                </span>
              </button>
            </div>

            {activeTab === 'tasks' && (
              <Button size="sm" onClick={() => setAddTaskOpen(true)} className="mb-2">
                <Plus size={14} /> Add Quest
              </Button>
            )}
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* TASKS TAB */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                {/* Filter Pills */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1.5 text-xs">
                    {(['all', 'active', 'completed'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setTaskFilter(f)}
                        className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                          taskFilter === f
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/5 hover:bg-white/10 text-slate-400'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-slate-400">
                    Complete tasks to level up and earn XP for the leaderboard!
                  </span>
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-3">
                    <Target size={36} className="mx-auto text-slate-600" />
                    <p className="text-sm font-medium">No quests in this category.</p>
                    <Button size="sm" variant="secondary" onClick={() => setAddTaskOpen(true)}>
                      <Plus size={14} /> Create a new quest
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredTasks.map((t) => {
                      const difficultyColor =
                        t.difficulty === 'Easy'
                          ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                          : t.difficulty === 'Medium'
                          ? 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30'
                          : t.difficulty === 'Hard'
                          ? 'text-orange-400 bg-orange-500/15 border-orange-500/30'
                          : 'text-rose-400 bg-rose-500/15 border-rose-500/30';

                      return (
                        <motion.div
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                            t.completed
                              ? 'bg-emerald-950/20 border-emerald-500/30 opacity-90'
                              : 'bg-white/5 border-white/10 hover:border-indigo-500/30'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => toggleTask(t)}
                              className="mt-0.5 text-slate-400 hover:text-emerald-400 transition"
                              title={t.completed ? 'Mark incomplete' : 'Complete task'}
                            >
                              {t.completed ? (
                                <CheckCircle2 size={22} className="text-emerald-400" />
                              ) : (
                                <Circle size={22} className="hover:text-indigo-400" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4
                                  className={`text-sm font-semibold tracking-tight ${
                                    t.completed ? 'line-through text-slate-400' : 'text-white'
                                  }`}
                                >
                                  {t.title}
                                </h4>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${difficultyColor}`}
                                >
                                  +{t.points} XP
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                                  {t.category}
                                </span>
                              </div>

                              {t.description && (
                                <p className="text-xs text-slate-400 leading-relaxed mb-1.5">
                                  {t.description}
                                </p>
                              )}

                              {t.completed && (
                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                                  <Sparkles size={12} />
                                  <span>Completed by {t.completedByName || 'a friend'}</span>
                                  {t.completedAt && (
                                    <span className="text-slate-500">
                                      · {new Date(t.completedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!t.completed ? (
                              <Button
                                size="sm"
                                onClick={() => toggleTask(t)}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs"
                              >
                                <CheckCircle2 size={14} /> Complete (+{t.points} XP)
                              </Button>
                            ) : (
                              <button
                                onClick={() => deleteTask(t.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/5 transition"
                                title="Delete task"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* LEADERBOARD TAB */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                {/* Podium Top 3 */}
                {leaderboardList.length >= 2 && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
                    {/* 2nd Place */}
                    {leaderboardList[1] && (
                      <div
                        onClick={() => setSelectedFriend(leaderboardList[1].member.profile)}
                        className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-slate-400/50 transition cursor-pointer group"
                      >
                        <span className="text-lg">🥈</span>
                        <div className="p-0.5 rounded-full bg-slate-400 my-1">
                          <Avatar p={leaderboardList[1].member.profile} size={42} />
                        </div>
                        <p className="text-xs font-bold text-white truncate max-w-full text-center">
                          {leaderboardList[1].member.profile.full_name || 'Friend'}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {leaderboardList[1].points} XP
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 mt-1 font-semibold">
                          Lvl {leaderboardList[1].levelInfo.level}
                        </span>
                      </div>
                    )}

                    {/* 1st Place */}
                    {leaderboardList[0] && (
                      <div
                        onClick={() => setSelectedFriend(leaderboardList[0].member.profile)}
                        className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 to-indigo-500/10 border-2 border-amber-400/60 transition cursor-pointer group shadow-xl shadow-amber-500/10 -translate-y-2"
                      >
                        <span className="text-2xl animate-bounce">👑 🥇</span>
                        <div className="p-1 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 my-1 shadow-lg">
                          <Avatar p={leaderboardList[0].member.profile} size={50} />
                        </div>
                        <p className="text-sm font-extrabold text-amber-200 truncate max-w-full text-center">
                          {leaderboardList[0].member.profile.full_name || 'Friend'}
                        </p>
                        <span className="text-xs font-bold text-amber-300">
                          {leaderboardList[0].points} XP
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 mt-1 font-bold border border-amber-400/30">
                          Lvl {leaderboardList[0].levelInfo.level} · {leaderboardList[0].levelInfo.title}
                        </span>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {leaderboardList[2] && (
                      <div
                        onClick={() => setSelectedFriend(leaderboardList[2].member.profile)}
                        className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-700/50 transition cursor-pointer group"
                      >
                        <span className="text-lg">🥉</span>
                        <div className="p-0.5 rounded-full bg-amber-700 my-1">
                          <Avatar p={leaderboardList[2].member.profile} size={42} />
                        </div>
                        <p className="text-xs font-bold text-white truncate max-w-full text-center">
                          {leaderboardList[2].member.profile.full_name || 'Friend'}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {leaderboardList[2].points} XP
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 mt-1 font-semibold">
                          Lvl {leaderboardList[2].levelInfo.level}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Ranked Member List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Member Levels & Points Ranking
                  </h3>

                  {leaderboardList.map(({ member, points, levelInfo, progress, tasksDone }, rank) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedFriend(member.profile)}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 transition cursor-pointer flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            rank === 0
                              ? 'bg-amber-400 text-slate-900 font-extrabold shadow'
                              : rank === 1
                              ? 'bg-slate-300 text-slate-900'
                              : rank === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {rank + 1}
                        </div>

                        {/* Avatar */}
                        <div className="p-[2px] rounded-full group-hover:bg-gradient-to-tr group-hover:from-amber-400 group-hover:via-rose-500 group-hover:to-indigo-500 transition">
                          <Avatar p={member.profile} size={40} />
                        </div>

                        {/* Friend Name & Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition truncate">
                              {member.profile.full_name || 'Friend'}
                            </p>
                            {member.user_id === user?.id && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span>{levelInfo.icon} Level {levelInfo.level}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-300">{levelInfo.title}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Points & Progress */}
                      <div className="flex flex-col sm:items-end w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-amber-300 flex items-center gap-1">
                            <Sparkles size={13} /> {points} XP
                          </span>
                          <span className="text-xs text-slate-400">
                            ({tasksDone} quests completed)
                          </span>
                        </div>

                        {/* XP Progress Bar towards next level */}
                        <div className="w-full sm:w-44 mt-1.5">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>Progress</span>
                            <span>{progress.percent}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${levelInfo.color} transition-all duration-500`}
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-500 block text-right mt-0.5">
                            {progress.xpNeeded > 0 ? `${progress.xpNeeded} XP to Lvl ${levelInfo.level + 1}` : 'Max Level'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Add Task Modal */}
        <AnimatePresence>
          {addTaskOpen && (
            <motion.div
              className="fixed inset-0 z-60 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddTaskOpen(false)} />
              <motion.div
                className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-white/20 text-white shadow-2xl space-y-4"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Target size={18} className="text-indigo-400" /> Create Group Quest
                  </h3>
                  <button onClick={() => setAddTaskOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Quest Title <span className="text-rose-400">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Solve 3 Binary Search problems"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Description (optional)</label>
                    <Textarea
                      placeholder="Details, links, or instructions for the group..."
                      rows={2}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Points Reward</label>
                      <select
                        value={newPoints}
                        onChange={(e) => setNewPoints(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        <option value={50}>+50 XP (Quick)</option>
                        <option value={100}>+100 XP (Standard)</option>
                        <option value={150}>+150 XP (Challenging)</option>
                        <option value={250}>+250 XP (Epic)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white outline-none focus:border-indigo-500"
                      >
                        <option value="Study">Study Session</option>
                        <option value="Coding">Coding</option>
                        <option value="Review">Review & Flashcards</option>
                        <option value="Discussion">Discussion</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" disabled={!newTitle.trim()} className="w-full mt-2 font-semibold">
                    <Sparkles size={15} /> Add Quest to Group
                  </Button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Friend Instagram-style Profile Modal on click */}
        {selectedFriend && (
          <FriendProfileModal
            profile={selectedFriend}
            open={Boolean(selectedFriend)}
            onClose={() => setSelectedFriend(null)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
