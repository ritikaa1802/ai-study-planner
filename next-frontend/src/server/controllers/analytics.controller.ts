import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";

export const getAnalytics = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: "asc" },
    });

    const tk = [0, 0, 0, 0, 0, 0, 0];
    const wk = [0, 0, 0, 0, 0, 0, 0];

    activities.forEach((act: any) => {
      const day = new Date(act.date).getDay();
      tk[day] += act.count;
    });

    const sessionsLast7Days = await prisma.userStudySession.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
      },
    });

    sessionsLast7Days.forEach((session: any) => {
      const day = new Date(session.date).getDay();
      wk[day] += session.duration / 60;
    });

    const wkRounded = wk.map((hours: number) => Number(hours.toFixed(1)));

    const subjectBreakdown = await prisma.userStudySession.groupBy({
      by: ["subject"],
      where: { userId },
      _sum: { duration: true },
      orderBy: { _sum: { duration: "desc" } },
      take: 8,
    });

    const subj = subjectBreakdown.map((row: any) => ({
      n: String(row.subject).substring(0, 10),
      h: Number((((row._sum.duration ?? 0) as number) / 60).toFixed(1)),
    }));

    if (subj.length === 0) {
      subj.push({ n: "General", h: 0 });
    }

    const totalStudyAgg = await prisma.userStudySession.aggregate({
      where: { userId },
      _sum: { duration: true },
    });

    const totalStudyHours = Number((((totalStudyAgg._sum.duration ?? 0) as number) / 60).toFixed(1));
    const weeklyStudyHours = Number(wkRounded.reduce((sum: number, h: number) => sum + h, 0).toFixed(1));

    const currentTasksDone = await prisma.task.count({
      where: { userId, completed: true },
    });

    const currentTasksCreated = await prisma.task.count({
      where: { userId },
    });

    let userTaskTotals: {
      lifetimeTasksCreated: number | null;
      lifetimeTasksCompleted: number | null;
      lifetimeGoalsCompleted: number | null;
      lifetimeGoalsMissed: number | null;
    } | null = null;
    try {
      userTaskTotals = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          lifetimeTasksCreated: true,
          lifetimeTasksCompleted: true,
          lifetimeGoalsCompleted: true,
          lifetimeGoalsMissed: true,
        },
      });
    } catch (error) {
      // Allow analytics to keep working if production DB schema is behind recent Prisma fields.
      console.warn("Analytics fallback: lifetime counters unavailable", error);
    }

    const totalTasksDone = Math.max(userTaskTotals?.lifetimeTasksCompleted ?? 0, currentTasksDone);
    const totalTasksCreated = Math.max(userTaskTotals?.lifetimeTasksCreated ?? 0, currentTasksCreated);

    const completionRate = totalTasksCreated > 0 ? Math.round((totalTasksDone / totalTasksCreated) * 100) : 0;

    let activeDaysThisWeek = 0;
    tk.forEach((count: number) => {
      if (count > 0) {
        activeDaysThisWeek++;
      }
    });

    const activityLoad = activities.reduce((sum: number, a: any) => sum + a.count, 0);
    const productivity = Math.min(100, Math.round((weeklyStudyHours / 14) * 70 + (Math.min(activityLoad, 14) / 14) * 30));

    return json(200, {
      tk,
      wk: wkRounded,
      subj,
      totalTasksDone,
      totalTasksCreated,
      completionRate,
      lifetimeGoalsCompleted: Number(userTaskTotals?.lifetimeGoalsCompleted ?? 0),
      lifetimeGoalsMissed: Number(userTaskTotals?.lifetimeGoalsMissed ?? 0),
      activeDaysThisWeek,
      productivity,
      totalStudyHours,
      weeklyStudyHours,
    });
  } catch (error) {
    return json(500, { error: "Failed to fetch analytics" });
  }
};
