import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";

export const getDashboardStats = async (ctx: ServerContext) => {
  const userId = ctx.userId as number;

  let lifetimeGoalsCompleted = 0;
  let lifetimeGoalsMissed = 0;

  try {
    const user = await (prisma.user.findUnique as any)({
      where: { id: userId },
      select: {
        lifetimeGoalsCompleted: true,
        lifetimeGoalsMissed: true,
      },
    });

    lifetimeGoalsCompleted = Number(user?.lifetimeGoalsCompleted ?? 0);
    lifetimeGoalsMissed = Number(user?.lifetimeGoalsMissed ?? 0);
  } catch (error) {
    console.warn("Dashboard fallback: lifetime goal counters unavailable", error);
  }

  const totalGoals = await prisma.goal.count({
    where: { userId },
  });

  const totalTasks = await prisma.task.count({
    where: { userId },
  });

  const completedTasks = await prisma.task.count({
    where: {
      userId,
      completed: true,
    },
  });

  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const activities = await prisma.dailyActivity.findMany({
    where: { userId },
  });

  const totalActiveDays = activities.length;

  return json(200, {
    totalGoals,
    totalTasks,
    completedTasks,
    completionRate,
    totalActiveDays,
    lifetimeGoalsCompleted,
    lifetimeGoalsMissed,
  });
};
