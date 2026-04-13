import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";

export const getActivity = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;

    const now = new Date();

    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const pastYear = new Date(today);
    pastYear.setUTCDate(today.getUTCDate() - 364);

    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId,
        date: {
          gte: pastYear,
          lte: today,
        },
      },
    });

    const activityMap = new Map<string, number>(activities.map((a: any) => [a.date.toISOString().split("T")[0], a.count as number]));

    const result = [];
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalActiveDays = 0;

    for (let i = 0; i < 365; i++) {
      const date = new Date(pastYear);
      date.setUTCDate(pastYear.getUTCDate() + i);

      const key = date.toISOString().split("T")[0];
      const count: number = activityMap.get(key) ?? 0;

      result.push({
        date: key,
        count,
      });

      if (count > 0) {
        totalActiveDays++;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    for (let i = result.length - 1; i >= 0; i--) {
      if (result[i].count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    return json(200, {
      activity: result,
      currentStreak,
      longestStreak,
      totalActiveDays,
    });
  } catch (error) {
    console.error(error);
    return json(500, { message: "Server error" });
  }
};
