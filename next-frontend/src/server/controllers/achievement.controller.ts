import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";
import {
  checkAndUnlockAchievements,
  getCategoryProgress,
  getClosestAchievements,
  getUserAchievementStats,
  getUserLevelFromPoints,
} from "../services/achievement.service";

export const getAchievements = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;

    const stats = await getUserAchievementStats(userId);
    await checkAndUnlockAchievements(userId, stats);

    const unlockedAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: "desc" },
    });

    const unlockedList = unlockedAchievements
      .filter((entry) => !entry.achievement.isHidden || !!entry.unlockedAt)
      .map((entry) => ({
        id: entry.achievement.id,
        key: entry.achievement.key,
        name: entry.achievement.name,
        description: entry.achievement.description,
        category: entry.achievement.category,
        threshold: entry.achievement.threshold,
        points: entry.achievement.points,
        level: entry.achievement.level,
        progressValue: entry.progressValue,
        unlockedAt: entry.unlockedAt,
      }));

    const totalUnlockedCount = unlockedList.length;
    const totalPoints = unlockedList.reduce((sum, achievement) => sum + achievement.points, 0);
    const userLevel = getUserLevelFromPoints(totalPoints);

    const [closestAchievements, categoryProgress] = await Promise.all([
      getClosestAchievements(userId, stats),
      getCategoryProgress(userId, stats),
    ]);

    const achievementTimeline = unlockedList
      .slice()
      .sort((a, b) => +new Date(b.unlockedAt) - +new Date(a.unlockedAt))
      .slice(0, 10);

    return json(200, {
      unlockedAchievements: unlockedList,
      totalUnlockedCount,
      totalPoints,
      userLevel,
      nextClosestAchievements: closestAchievements,
      categoryProgress,
      achievementTimeline,
      stats,
    });
  } catch (error) {
    console.error("GET ACHIEVEMENTS ERROR:", error);
    return json(500, { error: "Failed to fetch achievements" });
  }
};
