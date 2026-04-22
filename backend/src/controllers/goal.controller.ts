import { Request, Response } from "express"
import prisma from "../prisma"
import { Prisma } from "@prisma/client"
import { AppError } from "../utils/appError"
import { catchAsync } from "../utils/catchAsync"
import { updateGoalSchema } from "../validators/goal.validator"
import { ensureGoalStatsRecord, getGoalLifetimeStats, runDailyGoalLifecycle } from "../services/goalLifecycle.service"

// CREATE GOAL
export const createGoal = async (req: any, res: any) => {
  try {
    const { title, type, studyCircleId, isImportant } = req.body
    const userId = req.userId   // ✅ FIXED

    const allowedTypes = [
      "BRAIN_GAINS",
      "MONEY_MOVES",
      "MAIN_CHARACTER_ENERGY",
      "COOKING_PROJECTS",
      "LOCK_IN_MODE",
    ]

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Goal title is required" })
    }

    if (typeof type !== "string" || !allowedTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid goal type" })
    }

    const goal = await (prisma.goal.create as any)({
      data: {
        title: title.trim(),
        type,
        isImportant: Boolean(isImportant),
        studyCircleId: studyCircleId ? Number(studyCircleId) : undefined,
        userId
      },
    })

    res.status(201).json(goal)
  } catch (error) {
    console.error("createGoal error", error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return res.status(401).json({ error: "Session expired. Please sign in again." })
      }

      if (error.code === "P2021") {
        return res.status(500).json({ error: "Database schema is out of date. Please run migrations." })
      }
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return res.status(500).json({ error: "Database connection failed. Check DATABASE_URL." })
    }

    res.status(500).json({ error: "Unable to create goal right now." })
  }
}


// GET ALL GOALS
export const getGoals = async (req: any, res: any) => {
  try {
    const userId = req.userId   // ✅ FIXED

    await runDailyGoalLifecycle({ userId })
    await ensureGoalStatsRecord()
    const stats = await getGoalLifetimeStats()

    const goals = await (prisma.goal.findMany as any)({
      where: {
        userId
      },
      include: {
        tasks: true
      }
    })

    res.json({
      goals,
      lifetimeGoalsCompleted: stats.lifetimeGoalsCompleted,
      lifetimeGoalsMissed: stats.lifetimeGoalsMissed,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch goals" })
  }
}


export const updateGoal = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, type, isImportant } = req.body;
    const userId = req.userId;

    const goal = await prisma.goal.findFirst({
      where: {
        id: Number(id),
        userId
      }
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const updatedGoal = await (prisma.goal.update as any)({
      where: { id: Number(id) },
      data: {
        ...(typeof title === "string" ? { title } : {}),
        ...(typeof type === "string" ? { type } : {}),
        ...(typeof isImportant === "boolean" ? { isImportant } : {}),
      }
    });

    res.json(updatedGoal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update goal" });
  }
};


export const deleteGoal = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const goal = await prisma.goal.findFirst({
      where: {
        id: Number(id),
        userId
      }
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await prisma.task.deleteMany({
      where: { goalId: Number(id) }
    });

    await prisma.goal.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
};


export const getGoalById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const goal = await (prisma.goal.findFirst as any)({
      where: {
        id: Number(id),
        userId
      }
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch goal" });
  }
};

export const toggleGoalImportant = async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { isImportant } = req.body
    const userId = req.userId

    if (typeof isImportant !== "boolean") {
      return res.status(400).json({ error: "isImportant must be a boolean" })
    }

    const goal = await (prisma.goal.findFirst as any)({
      where: {
        id: Number(id),
        userId,
      }
    })

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" })
    }

    const updatedGoal = await (prisma.goal.update as any)({
      where: { id: Number(id) },
      data: { isImportant }
    })

    return res.json(updatedGoal)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to update goal importance" })
  }
}