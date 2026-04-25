import { prisma } from "../prisma";
import { AppError } from "../utils/appError";
import { recalculateGoalProgress, logDailyActivity } from "../services/task.service";
import { checkAndUnlockAchievements, getUserAchievementStats } from "../services/achievement.service";
import { createTaskSchema, createTasksBulkSchema, updateTaskSchema } from "../validators/task.validator";
import { json, type ServerContext } from "../shared/http";

const appErrorJson = (error: unknown) => {
  if (error instanceof AppError) {
    return json(error.statusCode, { error: error.message });
  }
  return json(500, { error: "Internal server error" });
};

export const createTask = async (ctx: ServerContext) => {
  try {
    const parsed = createTaskSchema.parse(ctx.body);
    const { title, goalId, focusMinutes } = parsed;

    const userId = ctx.userId as number;

    const goal = await prisma.goal.findFirst({
      where: {
        id: Number(goalId),
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!goal) {
      throw new AppError("Goal not found", 404);
    }

    const task = await prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          title,
          goalId: Number(goalId),
          focusMinutes,
          userId,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          lifetimeTasksCreated: { increment: 1 },
        },
      });

      return createdTask;
    });

    await recalculateGoalProgress(Number(goalId));

    return json(201, task);
  } catch (error) {
    return appErrorJson(error);
  }
};

export const createTasksBulk = async (ctx: ServerContext) => {
  try {
    const parsed = createTasksBulkSchema.parse(ctx.body);
    const { goalId, tasks } = parsed;

    const userId = ctx.userId as number;

    const goal = await prisma.goal.findFirst({
      where: {
        id: Number(goalId),
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!goal) {
      throw new AppError("Goal not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.task.createMany({
        data: tasks.map((task) => ({
          title: task.title,
          goalId: Number(goalId),
          focusMinutes: task.focusMinutes,
          userId,
        })),
      });

      if (created.count > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            lifetimeTasksCreated: { increment: created.count },
          },
        });
      }

      return created;
    });

    await recalculateGoalProgress(Number(goalId));

    return json(201, {
      createdCount: result.count,
    });
  } catch (error) {
    return appErrorJson(error);
  }
};

export const getTasksByGoal = async (ctx: ServerContext) => {
  try {
    const { goalId } = ctx.params ?? {};
    const userId = ctx.userId as number;

    const page = Number(ctx.query?.page) || 1;
    const limit = Number(ctx.query?.limit) || 5;
    const skip = (page - 1) * limit;

    const goal = await prisma.goal.findFirst({
      where: {
        id: Number(goalId),
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!goal) {
      throw new AppError("Goal not found", 404);
    }

    const total = await prisma.task.count({
      where: {
        goalId: Number(goalId),
        userId,
      },
    });

    const tasks = await prisma.task.findMany({
      where: {
        goalId: Number(goalId),
        userId,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    return json(200, {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      tasks,
    });
  } catch (error) {
    return appErrorJson(error);
  }
};

export const updateTask = async (ctx: ServerContext) => {
  try {
    const parsed = updateTaskSchema.parse(ctx.body);
    const { completed } = parsed;

    const { id } = ctx.params ?? {};
    const userId = ctx.userId as number;

    console.log("Updating task", id, "to completed:", completed, "for user", userId);

    const task = await prisma.task.findFirst({
      where: {
        id: Number(id),
        userId,
      },
    });

    if (!task) {
      console.log("Task not found");
      throw new AppError("Task not found", 404);
    }

    let updatedTask;

    if (completed === true && task.completed === false && task.completionCounted === false) {
      updatedTask = await prisma.$transaction(async (tx) => {
        const nextTask = await tx.task.update({
          where: { id: Number(id) },
          data: { completed: true, completionCounted: true, completedAt: new Date() },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            lifetimeTasksCompleted: { increment: 1 },
          },
        });

        return nextTask;
      });
    } else {
      updatedTask = await prisma.task.update({
        where: { id: Number(id) },
        data: {
          completed,
          completedAt: completed === true ? new Date() : null
        },
      });
    }

    await recalculateGoalProgress(task.goalId);

    if (completed === true) {
      await logDailyActivity(userId);
      
      const { addUserXP, addUserNotification } = await import("./user.controller");
      await addUserXP(userId, 10);
      await addUserNotification(userId, {
        text: `Task "${updatedTask.title}" completed! Great job!`,
      });

      const stats = await getUserAchievementStats(userId);
      await checkAndUnlockAchievements(userId, stats);
    }

    console.log("Task updated successfully", updatedTask);

    return json(200, updatedTask);
  } catch (error) {
    return appErrorJson(error);
  }
};

export const deleteTask = async (ctx: ServerContext) => {
  try {
    const { id } = ctx.params ?? {};
    const userId = ctx.userId as number;

    const task = await prisma.task.findFirst({
      where: {
        id: Number(id),
        userId,
      },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    await prisma.task.delete({
      where: { id: Number(id) },
    });

    await recalculateGoalProgress(task.goalId);

    return json(200, { message: "Task deleted successfully" });
  } catch (error) {
    return appErrorJson(error);
  }
};

export const getTaskById = async (ctx: ServerContext) => {
  try {
    const { id } = ctx.params ?? {};
    const userId = ctx.userId as number;

    const task = await prisma.task.findFirst({
      where: {
        id: Number(id),
        userId,
      },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return json(200, task);
  } catch (error) {
    return appErrorJson(error);
  }
};

export const getAllTasks = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return json(200, tasks);
  } catch (error) {
    return appErrorJson(error);
  }
};
