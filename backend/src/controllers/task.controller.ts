import { Request, Response } from "express"
import prisma from "../prisma"
import { AppError } from "../utils/appError"
import { catchAsync } from "../utils/catchAsync"
import { recalculateGoalProgress, logDailyActivity } from "../services/task.service"
import { createTaskSchema, createTasksBulkSchema, updateTaskSchema } from "../validators/task.validator"


// CREATE TASK
export const createTask = catchAsync(async (req: Request, res: Response) => {

  const parsed = createTaskSchema.parse(req.body)
  const { title, goalId, focusMinutes } = parsed

  const userId = (req as any).userId

  const goal = await prisma.goal.findFirst({
    where: {
      id: Number(goalId),
      userId
    }
  })

  if (!goal) {
    throw new AppError("Goal not found", 404)
  }

  const task = await prisma.task.create({
    data: {
      title,
      goalId: Number(goalId),
      focusMinutes,
      userId
    }
  })

  await recalculateGoalProgress(Number(goalId))

  res.status(201).json(task)
})

export const createTasksBulk = catchAsync(async (req: Request, res: Response) => {

  const parsed = createTasksBulkSchema.parse(req.body)
  const { goalId, tasks } = parsed

  const userId = (req as any).userId

  const goal = await prisma.goal.findFirst({
    where: {
      id: Number(goalId),
      userId
    }
  })

  if (!goal) {
    throw new AppError("Goal not found", 404)
  }

  const result = await prisma.task.createMany({
    data: tasks.map((task) => ({
      title: task.title,
      goalId: Number(goalId),
      focusMinutes: task.focusMinutes,
      userId
    }))
  })

  await recalculateGoalProgress(Number(goalId))

  res.status(201).json({
    createdCount: result.count
  })
})

// GET TASKS BY GOAL
export const getTasksByGoal = catchAsync(async (req: Request, res: Response) => {

  const { goalId } = req.params
  const userId = (req as any).userId

  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 5
  const skip = (page - 1) * limit

  const goal = await prisma.goal.findFirst({
    where: {
      id: Number(goalId),
      userId
    }
  })

  if (!goal) {
    throw new AppError("Goal not found", 404)
  }

  const total = await prisma.task.count({
    where: {
      goalId: Number(goalId),
      userId
    }
  })

  const tasks = await prisma.task.findMany({
    where: {
      goalId: Number(goalId),
      userId
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc"
    }
  })

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    tasks
  })
})
// UPDATE TASK
export const updateTask = catchAsync(async (req: Request, res: Response) => {

  const parsed = updateTaskSchema.parse(req.body)
  const { completed } = parsed

  const { id } = req.params
  const userId = (req as any).userId

  console.log("Updating task", id, "to completed:", completed, "for user", userId)

  const task = await prisma.task.findFirst({
    where: {
      id: Number(id),
      userId
    }
  })

  if (!task) {
    console.log("Task not found")
    throw new AppError("Task not found", 404)
  }

  const updatedTask = await prisma.task.update({
    where: { id: Number(id) },
    data: { completed }
  })

  await recalculateGoalProgress(task.goalId)

  if (completed === true) {
    await logDailyActivity(userId)
  }

  console.log("Task updated successfully", updatedTask)

  res.json(updatedTask)
})


// DELETE TASK
export const deleteTask = catchAsync(async (req: Request, res: Response) => {

  const { id } = req.params
  const userId = (req as any).userId

  const task = await prisma.task.findFirst({
    where: {
      id: Number(id),
      userId
    }
  })

  if (!task) {
    throw new AppError("Task not found", 404)
  }

  await prisma.task.delete({
    where: { id: Number(id) }
  })

  await recalculateGoalProgress(task.goalId)

  res.json({ message: "Task deleted successfully" })
})


// GET SINGLE TASK
export const getTaskById = catchAsync(async (req: Request, res: Response) => {

  const { id } = req.params
  const userId = (req as any).userId

  const task = await prisma.task.findFirst({
    where: {
      id: Number(id),
      userId
    }
  })

  if (!task) {
    throw new AppError("Task not found", 404)
  }

  res.json(task)
})

// GET ALL TASKS
export const getAllTasks = catchAsync(async (req: Request, res: Response) => {

  const userId = (req as any).userId

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc"
    }
  })

  res.json(tasks)
})