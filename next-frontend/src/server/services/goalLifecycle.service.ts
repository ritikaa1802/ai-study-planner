import { prisma } from "../prisma";

const GOAL_STATS_ID = "global";

function getIstDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function getIstDayStartUtc(date: Date) {
  const { year, month, day } = getIstDateParts(date);
  return new Date(Date.UTC(year, month - 1, day, -5, -30, 0, 0));
}

function getIstDateKey(date: Date) {
  const { year, month, day } = getIstDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export async function ensureGoalStats() {
  return prisma.goalStats.upsert({
    where: { id: GOAL_STATS_ID },
    update: {},
    create: { id: GOAL_STATS_ID },
  });
}

export async function getGoalStats() {
  const stats = await ensureGoalStats();
  return {
    lifetimeGoalsCompleted: stats.lifetimeGoalsCompleted,
    lifetimeGoalsMissed: stats.lifetimeGoalsMissed,
    lastRunDate: stats.lastRunDate,
  };
}

export async function runDailyGoalReset() {
  const now = new Date();
  const istDayStartUtc = getIstDayStartUtc(now);

  return prisma.$transaction(async (tx) => {
    await tx.goalStats.upsert({
      where: { id: GOAL_STATS_ID },
      update: {},
      create: { id: GOAL_STATS_ID },
    });

    const claim = await tx.goalStats.updateMany({
      where: {
        id: GOAL_STATS_ID,
        OR: [
          { lastRunDate: null },
          { lastRunDate: { lt: istDayStartUtc } },
        ],
      },
      data: {
        lastRunDate: now,
      },
    });

    if (claim.count === 0) {
      return {
        skipped: true,
        reason: "already-ran-today",
        resetDate: getIstDateKey(now),
        processedGoals: 0,
        completedCount: 0,
        missedCount: 0,
      };
    }

    const goals = await tx.goal.findMany({
      where: { isImportant: false },
      select: {
        id: true,
        progress: true,
      },
    });

    if (goals.length === 0) {
      return {
        skipped: false,
        reason: "no-goals",
        resetDate: getIstDateKey(now),
        processedGoals: 0,
        completedCount: 0,
        missedCount: 0,
      };
    }

    const goalIds = goals.map((goal) => goal.id);
    const completedCount = goals.filter((goal) => goal.progress >= 100).length;
    const missedCount = goals.length - completedCount;

    await tx.task.deleteMany({
      where: {
        goalId: { in: goalIds },
      },
    });

    await tx.goal.deleteMany({
      where: {
        id: { in: goalIds },
      },
    });

    await tx.goalStats.update({
      where: { id: GOAL_STATS_ID },
      data: {
        lifetimeGoalsCompleted: { increment: completedCount },
        lifetimeGoalsMissed: { increment: missedCount },
      },
    });

    return {
      skipped: false,
      reason: "processed",
      resetDate: getIstDateKey(now),
      processedGoals: goals.length,
      completedCount,
      missedCount,
    };
  });
}
