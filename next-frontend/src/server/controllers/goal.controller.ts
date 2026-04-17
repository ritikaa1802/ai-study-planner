import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";
import { incrementDeletedCompletedGoalsToday, purgeExpiredCompletedGoals } from "../services/goal.service";

export const createGoal = async (ctx: ServerContext) => {
  try {
    const { title, type, studyCircleId } = ctx.body ?? {};
    const userId = ctx.userId as number;

    const allowedTypes = [
      "BRAIN_GAINS",
      "MONEY_MOVES",
      "MAIN_CHARACTER_ENERGY",
      "COOKING_PROJECTS",
      "LOCK_IN_MODE",
    ];

    if (typeof title !== "string" || !title.trim()) {
      return json(400, { error: "Goal title is required" });
    }

    if (typeof type !== "string" || !allowedTypes.includes(type)) {
      return json(400, { error: "Invalid goal type" });
    }

    const goal = await prisma.goal.create({
      data: {
        title: title.trim(),
        type,
        studyCircleId: studyCircleId ? Number(studyCircleId) : undefined,
        userId,
      },
      select: {
        id: true,
        title: true,
        type: true,
      },
    });

    return json(201, goal);
  } catch (error) {
    console.error(error);
    return json(500, { error: "Failed to create goal" });
  }
};

export const getGoals = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;

    await purgeExpiredCompletedGoals(userId);

    const goals = await prisma.goal.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        type: true,
        tasks: {
          select: {
            id: true,
            title: true,
            completed: true,
            focusMinutes: true,
          },
        },
      },
    });

    let user: {
      deletedCompletedGoalsCount?: number;
      deletedCompletedGoalsDate?: Date | null;
      lifetimeGoalsCompleted?: number;
      lifetimeGoalsMissed?: number;
    } | null = null;

    try {
      user = await (prisma.user.findUnique as any)({
        where: { id: userId },
        select: {
          deletedCompletedGoalsCount: true,
          deletedCompletedGoalsDate: true,
          lifetimeGoalsCompleted: true,
          lifetimeGoalsMissed: true,
        },
      });
    } catch (error) {
      // Fallback for deployments where lifetime fields are not migrated yet.
      console.warn("Goals fallback: lifetime counters unavailable", error);
      try {
        user = await (prisma.user.findUnique as any)({
          where: { id: userId },
          select: {
            deletedCompletedGoalsCount: true,
            deletedCompletedGoalsDate: true,
          },
        });
      } catch (fallbackError) {
        console.warn("Goals fallback: deleted-completed counters unavailable", fallbackError);
        user = null;
      }
    }

    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const retainedDate = user?.deletedCompletedGoalsDate
      ? new Date(Date.UTC(
          user.deletedCompletedGoalsDate.getUTCFullYear(),
          user.deletedCompletedGoalsDate.getUTCMonth(),
          user.deletedCompletedGoalsDate.getUTCDate()
        ))
      : null;

    const deletedCompletedGoalsToday =
      retainedDate && retainedDate.getTime() === todayUtc.getTime()
        ? user?.deletedCompletedGoalsCount ?? 0
        : 0;

    return json(200, {
      goals,
      deletedCompletedGoalsToday,
      lifetimeGoalsCompleted: Number(user?.lifetimeGoalsCompleted ?? 0),
      lifetimeGoalsMissed: Number(user?.lifetimeGoalsMissed ?? 0),
    });
  } catch (error) {
    console.error(error);
    return json(500, { error: "Failed to fetch goals" });
  }
};

export const updateGoal = async (ctx: ServerContext) => {
  try {
    const { id } = ctx.params ?? {};
    const { title, type } = ctx.body ?? {};
    const userId = ctx.userId as number;

    const goal = await prisma.goal.findFirst({
      where: {
        id: Number(id),
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!goal) {
      return json(404, { error: "Goal not found" });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: Number(id) },
      data: { title, type },
      select: {
        id: true,
        title: true,
        type: true,
      },
    });

    return json(200, updatedGoal);
  } catch (error) {
    console.error(error);
    return json(500, { error: "Failed to update goal" });
  }
};

export const deleteGoal = async (ctx: ServerContext) => {
  try {
    const { id } = ctx.params ?? {};
    const userId = ctx.userId as number;

    const goal = await prisma.goal.findFirst({
      where: {
        id: Number(id),
        userId,
      },
      select: {
        id: true,
        progress: true,
      },
    });

    if (!goal) {
      return json(404, { error: "Goal not found" });
    }

    await prisma.task.deleteMany({
      where: { goalId: Number(id) },
    });

    await prisma.goal.delete({
      where: { id: Number(id) },
    });

    if (goal.progress >= 100) {
      await incrementDeletedCompletedGoalsToday(userId, 1);
    }

    return json(200, { message: "Goal deleted successfully" });
  } catch (error) {
    console.error(error);
    return json(500, { error: "Failed to delete goal" });
  }
};

export const getGoalById = async (ctx: ServerContext) => {
  try {
    const { id } = ctx.params ?? {};
    const userId = ctx.userId as number;

    const goal = await prisma.goal.findFirst({
      where: {
        id: Number(id),
        userId,
      },
      select: {
        id: true,
        title: true,
        type: true,
      },
    });

    if (!goal) {
      return json(404, { error: "Goal not found" });
    }

    return json(200, goal);
  } catch (error) {
    console.error(error);
    return json(500, { error: "Failed to fetch goal" });
  }
};
