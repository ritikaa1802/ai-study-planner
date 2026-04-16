import { prisma } from "../prisma";

export type AchievementStats = {
  totalTasksDone: number;
  currentStreak: number;
  totalFocusSessions: number;
  goalsCompleted: number;
  totalStudyMinutes: number;
};

type AchievementCategory = "productivity" | "consistency" | "focus" | "goals" | "time";

type AchievementSeed = {
  key: string;
  name: string;
  description: string;
  category: AchievementCategory;
  threshold: number;
  points: number;
  level: number;
  isHidden: boolean;
};

type ClosestAchievement = {
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

const ACHIEVEMENT_SEEDS: AchievementSeed[] = [
  { key: "FIRST_TASK", name: "First Task", description: "Complete your first task.", category: "productivity", threshold: 1, points: 10, level: 1, isHidden: false },
  { key: "TASK_STARTER", name: "Task Starter", description: "Complete 5 tasks.", category: "productivity", threshold: 5, points: 25, level: 1, isHidden: false },
  { key: "TASK_MASTER", name: "Task Master", description: "Complete 20 tasks.", category: "productivity", threshold: 20, points: 50, level: 2, isHidden: false },

  { key: "STREAK_3", name: "3-Day Streak", description: "Maintain a 3 day streak.", category: "consistency", threshold: 3, points: 10, level: 1, isHidden: false },
  { key: "STREAK_7", name: "7-Day Streak", description: "Maintain a 7 day streak.", category: "consistency", threshold: 7, points: 25, level: 2, isHidden: false },

  { key: "FOCUS_BEGINNER", name: "Focus Beginner", description: "Complete 5 focus sessions.", category: "focus", threshold: 5, points: 10, level: 1, isHidden: false },
  { key: "FOCUS_PRO", name: "Focus Pro", description: "Complete 15 focus sessions.", category: "focus", threshold: 15, points: 25, level: 2, isHidden: false },

  { key: "GOAL_ACHIEVER", name: "Goal Achiever", description: "Complete 1 goal.", category: "goals", threshold: 1, points: 25, level: 1, isHidden: false },
  { key: "GOAL_CRUSHER", name: "Goal Crusher", description: "Complete 3 goals.", category: "goals", threshold: 3, points: 50, level: 2, isHidden: false },

  { key: "STUDY_2_HOURS", name: "2 Hours Studied", description: "Study for 120 total minutes.", category: "time", threshold: 120, points: 10, level: 1, isHidden: false },
  { key: "STUDY_10_HOURS", name: "10 Hours Studied", description: "Study for 600 total minutes.", category: "time", threshold: 600, points: 50, level: 3, isHidden: false },
];

const getMetricValue = (key: string, stats: AchievementStats): number => {
  switch (key) {
    case "FIRST_TASK":
    case "TASK_STARTER":
    case "TASK_MASTER":
      return stats.totalTasksDone;
    case "STREAK_3":
    case "STREAK_7":
      return stats.currentStreak;
    case "FOCUS_BEGINNER":
    case "FOCUS_PRO":
      return stats.totalFocusSessions;
    case "GOAL_ACHIEVER":
    case "GOAL_CRUSHER":
      return stats.goalsCompleted;
    case "STUDY_2_HOURS":
    case "STUDY_10_HOURS":
      return stats.totalStudyMinutes;
    default:
      return 0;
  }
};

const getRemainingLabel = (key: string, remaining: number): string => {
  switch (key) {
    case "FIRST_TASK":
    case "TASK_STARTER":
    case "TASK_MASTER":
      return `${remaining} tasks left`;
    case "STREAK_3":
    case "STREAK_7":
      return `${remaining} days left`;
    case "FOCUS_BEGINNER":
    case "FOCUS_PRO":
      return `${remaining} sessions left`;
    case "GOAL_ACHIEVER":
    case "GOAL_CRUSHER":
      return `${remaining} goals left`;
    case "STUDY_2_HOURS":
    case "STUDY_10_HOURS":
      return `${remaining} minutes left`;
    default:
      return `${remaining} left`;
  }
};

const utcDateKey = (date: Date): string => date.toISOString().split("T")[0];

const calculateCurrentStreak = async (userId: number): Promise<number> => {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const activities = await prisma.dailyActivity.findMany({
    where: {
      userId,
      count: { gt: 0 },
    },
    select: { date: true },
    orderBy: { date: "desc" },
    take: 400,
  });

  const activitySet = new Set<string>(activities.map((a) => utcDateKey(a.date)));

  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    if (activitySet.has(utcDateKey(d))) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

export const getUserAchievementStats = async (userId: number): Promise<AchievementStats> => {
  const [
    totalTasksDone,
    totalFocusSessions,
    goalsCompleted,
    totalStudyAgg,
    currentStreak,
  ] = await Promise.all([
    prisma.task.count({ where: { userId, completed: true } }),
    prisma.userStudySession.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, progress: { gte: 100 } } }),
    prisma.userStudySession.aggregate({ where: { userId }, _sum: { duration: true } }),
    calculateCurrentStreak(userId),
  ]);

  return {
    totalTasksDone,
    currentStreak,
    totalFocusSessions,
    goalsCompleted,
    totalStudyMinutes: totalStudyAgg._sum.duration ?? 0,
  };
};

export const ensureAchievementDefinitions = async () => {
  await Promise.all(
    ACHIEVEMENT_SEEDS.map((seed) =>
      prisma.achievementDefinition.upsert({
        where: { key: seed.key },
        update: {
          name: seed.name,
          description: seed.description,
          category: seed.category,
          threshold: seed.threshold,
          points: seed.points,
          level: seed.level,
          isHidden: seed.isHidden,
        },
        create: {
          key: seed.key,
          name: seed.name,
          description: seed.description,
          category: seed.category,
          threshold: seed.threshold,
          points: seed.points,
          level: seed.level,
          isHidden: seed.isHidden,
        },
      })
    )
  );
};

export const checkAndUnlockAchievements = async (userId: number, stats: AchievementStats) => {
  await ensureAchievementDefinitions();

  const definitions = await prisma.achievementDefinition.findMany({
    where: { key: { in: ACHIEVEMENT_SEEDS.map((seed) => seed.key) } },
  });

  for (const definition of definitions) {
    const currentValue = getMetricValue(definition.key, stats);
    const progressValue = Math.max(0, currentValue);

    await prisma.userAchievement.updateMany({
      where: {
        userId,
        achievementId: definition.id,
      },
      data: {
        progressValue,
      },
    });

    if (progressValue >= definition.threshold) {
      await prisma.$executeRaw`
        INSERT INTO "user_achievements" ("user_id", "achievement_id", "unlocked_at", "progress_value", "level_unlocked")
        VALUES (${userId}, ${definition.id}, NOW(), ${progressValue}, ${definition.level})
        ON CONFLICT ("user_id", "achievement_id") DO NOTHING
      `;
    }
  }
};

export const getUserLevelFromPoints = (points: number): number => {
  if (points >= 300) return 3;
  if (points >= 100) return 2;
  return 1;
};

export const getClosestAchievements = async (userId: number, stats: AchievementStats): Promise<ClosestAchievement[]> => {
  await ensureAchievementDefinitions();

  const [definitions, unlocked] = await Promise.all([
    prisma.achievementDefinition.findMany({ orderBy: [{ category: "asc" }, { threshold: "asc" }] }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);

  const unlockedIds = new Set<number>(unlocked.map((item) => item.achievementId));

  const pending = definitions
    .filter((definition) => !unlockedIds.has(definition.id))
    .filter((definition) => !definition.isHidden)
    .map((definition) => {
      const currentValue = getMetricValue(definition.key, stats);
      const remainingValue = Math.max(definition.threshold - currentValue, 0);
      const progressPercentage = Math.min(100, Math.round((Math.max(currentValue, 0) / definition.threshold) * 100));

      return {
        key: definition.key,
        name: definition.name,
        category: definition.category,
        threshold: definition.threshold,
        points: definition.points,
        currentValue,
        remainingValue,
        progressPercentage,
        remainingLabel: getRemainingLabel(definition.key, remainingValue),
      };
    })
    .sort((a, b) => {
      if (a.remainingValue !== b.remainingValue) return a.remainingValue - b.remainingValue;
      return b.progressPercentage - a.progressPercentage;
    });

  return pending.slice(0, 3);
};

export const getCategoryProgress = async (userId: number, stats: AchievementStats) => {
  await ensureAchievementDefinitions();

  const [definitions, unlocked] = await Promise.all([
    prisma.achievementDefinition.findMany({ orderBy: [{ category: "asc" }, { threshold: "asc" }] }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);

  const unlockedIds = new Set<number>(unlocked.map((item) => item.achievementId));
  const categories = ["productivity", "consistency", "focus", "goals", "time"];

  return categories.map((category) => {
    const inCategory = definitions.filter((definition) => definition.category === category);
    if (inCategory.length === 0) {
      return { category, progressPercentage: 0 };
    }

    const totalProgress = inCategory.reduce((sum, definition) => {
      if (unlockedIds.has(definition.id)) {
        return sum + 100;
      }

      const currentValue = getMetricValue(definition.key, stats);
      const progress = Math.min(100, Math.round((Math.max(currentValue, 0) / definition.threshold) * 100));
      return sum + progress;
    }, 0);

    return {
      category,
      progressPercentage: Math.round(totalProgress / inCategory.length),
    };
  });
};
