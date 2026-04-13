import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";

export const createGoal = async (ctx: ServerContext) => {
  try {
    const { title, type, studyCircleId } = ctx.body ?? {};
    const userId = ctx.userId as number;

    const goal = await prisma.goal.create({
      data: {
        title,
        type,
        studyCircleId: studyCircleId ? Number(studyCircleId) : undefined,
        userId,
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

    const goals = await prisma.goal.findMany({
      where: {
        userId,
      },
      include: {
        tasks: true,
      },
    });

    return json(200, goals);
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
    });

    if (!goal) {
      return json(404, { error: "Goal not found" });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: Number(id) },
      data: { title, type },
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
