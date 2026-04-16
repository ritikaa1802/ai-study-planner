export type AchievementCategory = "productivity" | "consistency" | "focus" | "goals" | "time";

export type UnlockedAchievement = {
  id: number;
  key: string;
  name: string;
  description: string;
  category: string;
  threshold: number;
  points: number;
  level: number;
  progressValue: number;
  unlockedAt: string;
};

export type NextClosestAchievement = {
  key: string;
  name: string;
  category: string;
  threshold: number;
  points: number;
  currentValue: number;
  remainingValue: number;
  progressPercentage: number;
  remainingLabel: string;
};

export type CategoryProgressItem = {
  category: string;
  progressPercentage: number;
};

export type AchievementStats = {
  totalTasksDone: number;
  currentStreak: number;
  totalFocusSessions: number;
  goalsCompleted: number;
  totalStudyMinutes: number;
};

export type AchievementsApiResponse = {
  unlockedAchievements: UnlockedAchievement[];
  totalUnlockedCount: number;
  totalPoints: number;
  userLevel: 1 | 2 | 3;
  nextClosestAchievements: NextClosestAchievement[];
  categoryProgress: CategoryProgressItem[];
  achievementTimeline: UnlockedAchievement[];
  stats: AchievementStats;
};

export const CATEGORY_THEME: Record<AchievementCategory, { accent: string; soft: string; text: string; emoji: string }> = {
  productivity: {
    accent: "bg-blue-500",
    soft: "bg-blue-100 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-300",
    emoji: "📘",
  },
  consistency: {
    accent: "bg-amber-500",
    soft: "bg-amber-100 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-300",
    emoji: "🔥",
  },
  focus: {
    accent: "bg-purple-500",
    soft: "bg-purple-100 dark:bg-purple-950/30",
    text: "text-purple-600 dark:text-purple-300",
    emoji: "🧠",
  },
  goals: {
    accent: "bg-emerald-500",
    soft: "bg-emerald-100 dark:bg-emerald-950/30",
    text: "text-emerald-600 dark:text-emerald-300",
    emoji: "🎯",
  },
  time: {
    accent: "bg-rose-500",
    soft: "bg-rose-100 dark:bg-rose-950/30",
    text: "text-rose-600 dark:text-rose-300",
    emoji: "⏱️",
  },
};

export const CATEGORY_ORDER: AchievementCategory[] = ["productivity", "consistency", "focus", "goals", "time"];

export const normalizeCategory = (category: string): AchievementCategory => {
  if (category in CATEGORY_THEME) {
    return category as AchievementCategory;
  }
  return "productivity";
};
