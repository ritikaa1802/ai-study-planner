import { Request, Response } from "express"
import prisma from "../prisma"
import { AppError } from "../utils/appError"
import { catchAsync } from "../utils/catchAsync"
import { updateGoalSchema } from "../validators/goal.validator"

// CREATE GOAL
export const createGoal = async (req: any, res: any) => {
  try {
    const { title, type, studyCircleId } = req.body
    const userId = req.userId   // ✅ FIXED

    const goal = await prisma.goal.create({
      data: {
        title,
        type,
        studyCircleId: studyCircleId ? Number(studyCircleId) : undefined,
        userId
      },
    })

    res.status(201).json(goal)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to create goal" })
  }
}


// GET ALL GOALS
export const getGoals = async (req: any, res: any) => {
  try {
    const userId = req.userId   // ✅ FIXED

    const goals = await prisma.goal.findMany({
      where: {
        userId
      },
      include: {
        tasks: true
      }
    })

    res.json(goals)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch goals" })
  }
}


export const updateGoal = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, type } = req.body;
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

    const updatedGoal = await prisma.goal.update({
      where: { id: Number(id) },
      data: { title, type }
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

    const goal = await prisma.goal.findFirst({
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