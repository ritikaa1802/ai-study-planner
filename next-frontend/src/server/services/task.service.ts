import { prisma } from "../prisma";

export const recalculateGoalProgress = async (goalId: number) => {
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

  await prisma.goal.update({
    where: { id: goalId },
    data: { progress },
  });
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
};
