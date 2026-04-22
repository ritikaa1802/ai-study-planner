import { Request, Response } from "express"
import prisma from "../prisma"
import { catchAsync } from "../utils/catchAsync"
import { runDailyGoalLifecycle } from "../services/goalLifecycle.service"

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {

  const userId = (req as any).userId

  await runDailyGoalLifecycle({ userId })

  const totalGoals = await prisma.goal.count({
    where: { userId }
  })

  const totalTasks = await prisma.task.count({
    where: { userId }
  })

  const completedTasks = await prisma.task.count({
    where: {
      userId,
      completed: true
    }
  })

  const completionRate =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100)

  const activities = await prisma.dailyActivity.findMany({
    where: { userId }
  })

  const totalActiveDays = activities.length

  res.json({
    totalGoals,
    totalTasks,
    completedTasks,
    completionRate,
    totalActiveDays
  })
})