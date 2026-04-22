import prisma from "../prisma"
import { addUserNotification } from "../controllers/user.controller"

export const recalculateGoalProgress = async (goalId: number) => {
  const totalTasks = await prisma.task.count({
    where: { goalId }
  })

  const completedTasks = await prisma.task.count({
    where: {
      goalId,
      completed: true
    }
  })

  const progress =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100)

  const completed = progress >= 100

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      progress,
      completed
    }
  })

  // Notify user and award XP if goal is completed
  if (completed) {
    const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { userId: true, title: true } })
    if (goal?.userId) {
      await addUserNotification(goal.userId, {
        text: `Goal "${goal.title}" completed! Congratulations!`,
      })
      // Award XP for completing a goal
      const { addUserXP } = require("../controllers/user.controller")
      await addUserXP(goal.userId, 50)
    }
  }
}

export const logDailyActivity = async (userId: number) => {
  const now = new Date()

  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ))

  const existingActivity = await prisma.dailyActivity.findUnique({
    where: {
      date_userId: {
        date: utcDate,
        userId
      }
    }
  })

  if (existingActivity) {
    await prisma.dailyActivity.update({
      where: {
        date_userId: {
          date: utcDate,
          userId
        }
      },
      data: {
        count: existingActivity.count + 1
      }
    })
  } else {
    await prisma.dailyActivity.create({
      data: {
        date: utcDate,
        count: 1,
        userId
      }
    })
  }
}