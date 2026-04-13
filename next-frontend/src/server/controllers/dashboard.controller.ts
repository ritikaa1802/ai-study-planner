import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";

export const getDashboardStats = async (ctx: ServerContext) => {
  const userId = ctx.userId as number;

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
  });
};
