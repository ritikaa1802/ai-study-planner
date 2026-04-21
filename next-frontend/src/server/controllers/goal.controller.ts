import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";
import { getGoalStats } from "../services/goalLifecycle.service";

export const createGoal = async (ctx: ServerContext) => {
  try {
    const { title, type, studyCircleId, isImportant } = ctx.body ?? {};
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

    let goal: { id: number; title: string; type: string; isImportant: boolean };

    try {
      goal = await prisma.goal.create({
        data: {
          title: title.trim(),
          type,
          isImportant: Boolean(isImportant),
          studyCircleId: studyCircleId ? Number(studyCircleId) : undefined,
          userId,
        },
        select: {
          id: true,
          title: true,
          type: true,
          isImportant: true,
        },
      });
    } catch (error) {
      // Fallback for databases that don't have optional/newer goal columns yet.
      console.warn("Goal create fallback: retrying without optional fields", error);
      goal = await prisma.goal.create({
        data: {
          title: title.trim(),
          type,
          isImportant: Boolean(isImportant),
          userId,
        },
        select: {
          id: true,
          title: true,
          type: true,
          isImportant: true,
        },
      });
    }

    return json(201, goal);
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return json(500, { error: "Database schema not initialized. Run Prisma db push/migrations on deployment." });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return json(500, { error: "Database connection failed. Check DATABASE_URL in deployment env." });
    }
    return json(500, { error: "Failed to create goal" });
  }
};

export const getGoals = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;

    let goals: Array<{
      id: number;
      title: string;
      type: string;
      isImportant: boolean;
      tasks: Array<{
        id: number;
        title: string;
        completed: boolean;
        focusMinutes?: number | null;
      }>;
    }> = [];

    try {
      goals = await prisma.goal.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          title: true,
          type: true,
          isImportant: true,
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
    } catch (error) {
      console.warn("Goals fallback: focusMinutes unavailable", error);
      try {
        const fallbackGoals = await prisma.goal.findMany({
          where: {
            userId,
          },
          select: {
            id: true,
            title: true,
            type: true,
            isImportant: true,
            tasks: {
              select: {
                id: true,
                title: true,
                completed: true,
              },
            },
          },
        });

        goals = fallbackGoals.map((goal) => ({
          ...goal,
          tasks: goal.tasks.map((task) => ({
            ...task,
            focusMinutes: null,
          })),
        }));
      } catch (fallbackError) {
        console.warn("Goals fallback: tasks relation unavailable", fallbackError);
        const minimalGoals = await prisma.goal.findMany({
          where: { userId },
          select: {
            id: true,
            title: true,
            type: true,
          },
        });

        goals = minimalGoals.map((goal) => ({
          ...goal,
          tasks: [],
        }));
      }
    }

    const stats = await getGoalStats();

    return json(200, {
      goals,
      lifetimeGoalsCompleted: Number(stats.lifetimeGoalsCompleted ?? 0),
      lifetimeGoalsMissed: Number(stats.lifetimeGoalsMissed ?? 0),
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return json(500, { error: "Database schema not initialized. Run Prisma db push/migrations on deployment." });
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return json(500, { error: "Database connection failed. Check DATABASE_URL in deployment env." });
    }
    return json(500, { error: "Failed to fetch goals" });
  }
};

export const updateGoal = async (ctx: ServerContext) => {
  try {
    const { id } = ctx.params ?? {};
    const { title, type, isImportant } = ctx.body ?? {};
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
      data: {
        ...(typeof title === "string" ? { title } : {}),
        ...(typeof type === "string" ? { type } : {}),
        ...(typeof isImportant === "boolean" ? { isImportant } : {}),
      },
      select: {
        id: true,
        title: true,
        type: true,
        isImportant: true,
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
        isImportant: true,
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

export const toggleGoalImportant = async (ctx: ServerContext) => {
  try {
    const { id } = ctx.params ?? {};
    const userId = ctx.userId as number;
    const { isImportant } = ctx.body ?? {};

    if (typeof isImportant !== "boolean") {
      return json(400, { error: "isImportant must be a boolean" });
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: Number(id),
        userId,
      },
      select: { id: true },
    });

    if (!goal) {
      return json(404, { error: "Goal not found" });
    }

    const updated = await prisma.goal.update({
      where: { id: Number(id) },
      data: { isImportant },
      select: {
        id: true,
        title: true,
        type: true,
        isImportant: true,
      },
    });

    return json(200, updated);
  } catch (error) {
    console.error(error);
    return json(500, { error: "Failed to toggle goal importance" });
  }
};
