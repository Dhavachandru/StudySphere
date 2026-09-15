export interface GroupTask {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  category: 'Study' | 'Coding' | 'Review' | 'Discussion';
  completed: boolean;
  completedBy?: string;
  completedByName?: string;
  completedAt?: string;
  created_at: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  nextThreshold: number;
  currentThreshold: number;
}

export function getLevelInfo(points: number): LevelInfo {
  if (points >= 2000) {
    return {
      level: 6,
      title: 'Legendary Sage',
      icon: '🌟',
      color: 'from-amber-400 via-rose-500 to-purple-600',
      badgeBg: 'bg-amber-500/15 text-amber-300',
      badgeBorder: 'border-amber-500/30',
      nextThreshold: 3500,
      currentThreshold: 2000,
    };
  }
  if (points >= 1000) {
    return {
      level: 5,
      title: 'Study Elite',
      icon: '👑',
      color: 'from-fuchsia-500 to-pink-500',
      badgeBg: 'bg-fuchsia-500/15 text-fuchsia-300',
      badgeBorder: 'border-fuchsia-500/30',
      nextThreshold: 2000,
      currentThreshold: 1000,
    };
  }
  if (points >= 500) {
    return {
      level: 4,
      title: 'Master Scholar',
      icon: '🔥',
      color: 'from-orange-500 to-rose-500',
      badgeBg: 'bg-orange-500/15 text-orange-300',
      badgeBorder: 'border-orange-500/30',
      nextThreshold: 1000,
      currentThreshold: 500,
    };
  }
  if (points >= 250) {
    return {
      level: 3,
      title: 'Study Ace',
      icon: '⚡',
      color: 'from-indigo-500 to-purple-500',
      badgeBg: 'bg-indigo-500/15 text-indigo-300',
      badgeBorder: 'border-indigo-500/30',
      nextThreshold: 500,
      currentThreshold: 250,
    };
  }
  if (points >= 100) {
    return {
      level: 2,
      title: 'Dedicated Learner',
      icon: '📘',
      color: 'from-blue-500 to-indigo-500',
      badgeBg: 'bg-blue-500/15 text-blue-300',
      badgeBorder: 'border-blue-500/30',
      nextThreshold: 250,
      currentThreshold: 100,
    };
  }
  return {
    level: 1,
    title: 'Novice Scholar',
    icon: '🌱',
    color: 'from-emerald-500 to-teal-500',
    badgeBg: 'bg-emerald-500/15 text-emerald-300',
    badgeBorder: 'border-emerald-500/30',
    nextThreshold: 100,
    currentThreshold: 0,
  };
}

export function calculateProgress(points: number): {
  percent: number;
  xpNeeded: number;
  currentXpInLevel: number;
  levelSpan: number;
} {
  const info = getLevelInfo(points);
  const currentXpInLevel = points - info.currentThreshold;
  const levelSpan = info.nextThreshold - info.currentThreshold;
  const percent = Math.min(100, Math.max(0, Math.round((currentXpInLevel / levelSpan) * 100)));
  const xpNeeded = Math.max(0, info.nextThreshold - points);
  return { percent, xpNeeded, currentXpInLevel, levelSpan };
}

const STORAGE_TASKS_PREFIX = 'studysphere_group_tasks_';
const STORAGE_POINTS_PREFIX = 'studysphere_group_points_';

export function getStarterTasks(groupId: string, subject?: string | null): GroupTask[] {
  const isCoding = subject?.toLowerCase().includes('code') ||
    subject?.toLowerCase().includes('computer') ||
    subject?.toLowerCase().includes('algorithm') ||
    subject?.toLowerCase().includes('data structure');

  if (isCoding) {
    return [
      {
        id: `${groupId}-t1`,
        groupId,
        title: 'Solve 3 Algorithm Problems on Coding Hub',
        description: 'Practice Java, C++, or Python problem-solving together.',
        points: 100,
        difficulty: 'Medium',
        category: 'Coding',
        completed: false,
        created_at: new Date().toISOString(),
      },
      {
        id: `${groupId}-t2`,
        groupId,
        title: 'Review Data Structures Cheatsheet',
        description: 'Read through Trees, Graphs, and Hashmaps notes.',
        points: 50,
        difficulty: 'Easy',
        category: 'Study',
        completed: false,
        created_at: new Date().toISOString(),
      },
      {
        id: `${groupId}-t3`,
        groupId,
        title: 'Implement a Complex Dynamic Programming Problem',
        description: 'Tackle a 2D DP challenge and explain your approach in chat.',
        points: 200,
        difficulty: 'Hard',
        category: 'Coding',
        completed: false,
        created_at: new Date().toISOString(),
      },
    ];
  }

  return [
    {
      id: `${groupId}-t1`,
      groupId,
      title: 'Complete 1h Focused Study Session',
      description: 'Review key chapter formulas and lecture notes with the group.',
      points: 50,
      difficulty: 'Easy',
      category: 'Study',
      completed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: `${groupId}-t2`,
      groupId,
      title: 'Create 10 High-Yield Exam Flashcards',
      description: 'Generate or write key definitions and review with friends.',
      points: 100,
      difficulty: 'Medium',
      category: 'Review',
      completed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: `${groupId}-t3`,
      groupId,
      title: 'Mock Exam / Group Discussion Challenge',
      description: 'Test each other on 5 difficult past questions.',
      points: 150,
      difficulty: 'Hard',
      category: 'Discussion',
      completed: false,
      created_at: new Date().toISOString(),
    },
  ];
}

export function loadGroupTasks(groupId: string, subject?: string | null): GroupTask[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_TASKS_PREFIX}${groupId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback to starter tasks
  }
  const starters = getStarterTasks(groupId, subject);
  saveGroupTasks(groupId, starters);
  return starters;
}

export function saveGroupTasks(groupId: string, tasks: GroupTask[]): void {
  try {
    localStorage.setItem(`${STORAGE_TASKS_PREFIX}${groupId}`, JSON.stringify(tasks));
  } catch {
    // storage limit error handling
  }
}

export function loadMemberPoints(groupId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(`${STORAGE_POINTS_PREFIX}${groupId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function saveMemberPoints(groupId: string, points: Record<string, number>): void {
  try {
    localStorage.setItem(`${STORAGE_POINTS_PREFIX}${groupId}`, JSON.stringify(points));
  } catch {
    // ignore
  }
}
