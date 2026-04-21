import cron from "node-cron"
import { ensureGoalStatsRecord, runDailyGoalLifecycle } from "../services/goalLifecycle.service"

declare global {
  // eslint-disable-next-line no-var
  var __goalLifecycleCronStarted__: boolean | undefined
}

export const startGoalLifecycleCron = () => {
  if (global.__goalLifecycleCronStarted__) {
    return
  }

  global.__goalLifecycleCronStarted__ = true

  ensureGoalStatsRecord().catch((error) => {
    console.error("Failed to initialize goal stats record", error)
  })

  cron.schedule("0 0 * * *", async () => {
    try {
      const result = await runDailyGoalLifecycle()
      console.log(
        `[GoalLifecycle] Reset processed=${result.processedGoals} completed=${result.completedCount} missed=${result.missedCount}`
      )
    } catch (error) {
      console.error("[GoalLifecycle] Midnight reset failed", error)
    }
  })
}
