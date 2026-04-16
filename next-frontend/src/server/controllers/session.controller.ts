import { prisma } from "../prisma";
import { checkAndUnlockAchievements, getUserAchievementStats } from "../services/achievement.service";
import { json, type ServerContext } from "../shared/http";

export const createStudySession = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;
    const { subject, duration } = (ctx.body ?? {}) as { subject?: string; duration?: number };

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return json(400, { error: "Subject is required" });
    }

    if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
      return json(400, { error: "Duration must be a positive number of minutes" });
    }

    const normalizedDuration = Math.round(duration);
    if (normalizedDuration < 1 || normalizedDuration > 600) {
      return json(400, { error: "Duration must be between 1 and 600 minutes" });
    }

    const session = await prisma.userStudySession.create({
      data: {
        userId,
        subject: subject.trim(),
        duration: normalizedDuration,
      },
    });

    const stats = await getUserAchievementStats(userId);
    await checkAndUnlockAchievements(userId, stats);

    return json(201, session);
  } catch (error) {
    console.error("CREATE SESSION ERROR:", error);
    return json(500, { error: "Failed to save study session" });
  }
};

export const getStudySessions = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;

    const sessions = await prisma.userStudySession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 100,
    });

    return json(200, sessions);
  } catch (error) {
    console.error("GET SESSIONS ERROR:", error);
    return json(500, { error: "Failed to fetch study sessions" });
  }
};
