import prisma from "../prisma"

const GOAL_STATS_ID = "global"

export const ensureGoalStatsRecord = async () => {
  return (prisma as any).goalStats.upsert({
    where: { id: GOAL_STATS_ID },
    update: {},
    create: { id: GOAL_STATS_ID },
  })
}

export const getGoalLifetimeStats = async () => {
  const stats = await ensureGoalStatsRecord()
  return {
    lifetimeGoalsCompleted: stats.lifetimeGoalsCompleted,
    lifetimeGoalsMissed: stats.lifetimeGoalsMissed,
  }
}

export const runDailyGoalLifecycle = async () => {
  await ensureGoalStatsRecord()

  const goalsToReset = await (prisma.goal.findMany as any)({
    where: { isImportant: false },
    select: {
      id: true,
      completed: true,
      progress: true,
    },
  })

  if (goalsToReset.length === 0) {
    return {
      processedGoals: 0,
      completedCount: 0,
      missedCount: 0,
    }
  }

  const completedCount = goalsToReset.filter((goal) => goal.completed || goal.progress >= 100).length
  const missedCount = goalsToReset.length - completedCount
  const goalIds = goalsToReset.map((goal) => goal.id)

  await prisma.$transaction([
    (prisma as any).goalStats.update({
      where: { id: GOAL_STATS_ID },
      data: {
        lifetimeGoalsCompleted: { increment: completedCount },
        lifetimeGoalsMissed: { increment: missedCount },
      },
    }),
    prisma.task.deleteMany({
      where: {
        goalId: { in: goalIds },
      },
    }),
    prisma.goal.deleteMany({
      where: {
        id: { in: goalIds },
      },
    }),
  ])

  return {
    processedGoals: goalsToReset.length,
    completedCount,
    missedCount,
  }
}
