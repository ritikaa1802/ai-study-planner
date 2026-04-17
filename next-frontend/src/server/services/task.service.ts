import { prisma } from "../prisma";
import { checkAndUnlockAchievements, getUserAchievementStats } from "./achievement.service";

export const recalculateGoalProgress = async (goalId: number) => {
  let goalBefore:
    | {
        id: number;
        userId: number;
        progress: number;
        completedAt?: Date | null;
        completionCounted?: boolean;
      }
    | null = null;

  try {
    goalBefore = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { id: true, userId: true, progress: true, completedAt: true, completionCounted: true },
    });
  } catch {
    // Fallback for environments without lifetime goal columns.
    goalBefore = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { id: true, userId: true, progress: true },
    });
  }

  if (!goalBefore) {
    return;
  }

  const totalTasks = await prisma.task.count({
    where: { goalId },
  });

  const completedTasks = await prisma.task.count({
    where: {
      goalId,
      completed: true,
    },
  });

  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const completedAt =
    progress >= 100
      ? goalBefore.completedAt ?? new Date()
      : null;

  const becameCompleted = goalBefore.progress < 100 && progress >= 100;
  const supportsLifetimeGoalFields = typeof goalBefore.completionCounted === "boolean";
  const shouldCountLifetimeCompleted = becameCompleted && supportsLifetimeGoalFields && !goalBefore.completionCounted;

  if (shouldCountLifetimeCompleted) {
    await prisma.$transaction([
      prisma.goal.update({
        where: { id: goalId },
        data: { progress, completedAt, completionCounted: true },
      }),
      (prisma.user.update as any)({
        where: { id: goalBefore.userId },
        data: { lifetimeGoalsCompleted: { increment: 1 } },
      }),
    ]);
  } else {
    try {
      await prisma.goal.update({
        where: { id: goalId },
        data: { progress, completedAt },
      });
    } catch {
      // Fallback for schemas without completedAt column.
      await prisma.goal.update({
        where: { id: goalId },
        data: { progress },
      });
    }
  }

  if (becameCompleted) {
    const stats = await getUserAchievementStats(goalBefore.userId);
    await checkAndUnlockAchievements(goalBefore.userId, stats);
  }
};

export const logDailyActivity = async (userId: number) => {
  const now = new Date();

  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const existingActivity = await prisma.dailyActivity.findUnique({
    where: {
      date_userId: {
        date: utcDate,
        userId,
      },
    },
  });

  if (existingActivity) {
    await prisma.dailyActivity.update({
      where: {
        date_userId: {
          date: utcDate,
          userId,
        },
      },
      data: {
        count: existingActivity.count + 1,
      },
    });
  } else {
    await prisma.dailyActivity.create({
      data: {
        date: utcDate,
        count: 1,
        userId,
      },
    });
  }

  const stats = await getUserAchievementStats(userId);
  await checkAndUnlockAchievements(userId, stats);
};
