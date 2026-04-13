import { Request, Response } from "express"
import prisma from "../prisma"

export const getActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    // ✅ Create UTC "today"
    const now = new Date()

    const today = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ))

    const pastYear = new Date(today)
    pastYear.setUTCDate(today.getUTCDate() - 364)

    // Fetch activity from DB
    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId,
        date: {
          gte: pastYear,
          lte: today
        }
      }
    })

    // Convert to map using ISO (UTC safe)
    const activityMap = new Map(
      activities.map((a: any) => [
        a.date.toISOString().split("T")[0],
        a.count
      ])
    )

    const result = []
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let totalActiveDays = 0

    for (let i = 0; i < 365; i++) {
      const date = new Date(pastYear)
      date.setUTCDate(pastYear.getUTCDate() + i)

      const key = date.toISOString().split("T")[0]
      const count = activityMap.get(key) || 0

      result.push({
        date: key,
        count
      })

      if (count > 0) {
        totalActiveDays++
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Calculate current streak (from today backwards)
    for (let i = result.length - 1; i >= 0; i--) {
      if (result[i].count > 0) {
        currentStreak++
      } else {
        break
      }
    }

    res.json({
      activity: result,
      currentStreak,
      longestStreak,
      totalActiveDays
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}