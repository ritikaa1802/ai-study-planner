import crypto from "crypto";
import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";

export const getStudyCircles = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;

    const circles = await prisma.studyCircle.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });

    return json(200, { circles });
  } catch (error) {
    return json(500, { error: "Failed to fetch study circles" });
  }
};

export const createStudyCircle = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;
    const { name, description } = ctx.body ?? {};

    if (!name) {
      return json(400, { error: "Name is required" });
    }

    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const circle = await prisma.studyCircle.create({
      data: {
        name,
        description,
        inviteCode,
        members: {
          create: { userId },
        },
      },
    });

    return json(201, { circle });
  } catch (error) {
    return json(500, { error: "Failed to create study circle" });
  }
};

export const joinStudyCircle = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;
    const { inviteCode } = ctx.body ?? {};

    if (!inviteCode) {
      return json(400, { error: "Invite code is required" });
    }

    const circle = await prisma.studyCircle.findUnique({
      where: { inviteCode },
    });

    if (!circle) {
      return json(404, { error: "Invalid invite code" });
    }

    const memberCount = await prisma.studyCircleMembership.count({
      where: { studyCircleId: circle.id },
    });

    if (memberCount >= 8) {
      return json(400, { error: "This study circle is full (max 8 members)" });
    }

    const existing = await prisma.studyCircleMembership.findUnique({
      where: {
        userId_studyCircleId: {
          userId,
          studyCircleId: circle.id,
        },
      },
    });

    if (existing) {
      return json(400, { error: "Already a member of this study circle" });
    }

    await prisma.studyCircleMembership.create({
      data: {
        userId,
        studyCircleId: circle.id,
      },
    });

    return json(200, { message: "Successfully joined study circle", circle });
  } catch (error) {
    return json(500, { error: "Failed to join study circle" });
  }
};

export const getCircleLeaderboard = async (ctx: ServerContext) => {
  try {
    const circleId = Number(ctx.params?.id);

    if (!Number.isFinite(circleId) || circleId <= 0) {
      return json(400, { error: "Invalid circle id" });
    }

    const memberships = await prisma.studyCircleMembership.findMany({
      where: { studyCircleId: circleId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    // Use real circle goal-task data so new circles start from zero activity.
    const completedTasks = await prisma.task.groupBy({
      by: ["userId"],
      where: {
        completed: true,
        goal: {
          studyCircleId: circleId,
        },
      },
      _count: {
        _all: true,
      },
    });

    const leaderboard = memberships
      .map((m) => {
        const userTaskCount = completedTasks.find((a) => a.userId === m.userId);
        return {
          user: m.user,
          tasksCompleted: userTaskCount?._count._all || 0,
        };
      })
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted);

    return json(200, { leaderboard });
  } catch (error) {
    return json(500, { error: "Failed to fetch leaderboard" });
  }
};

export const getCircleGoals = async (ctx: ServerContext) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { studyCircleId: Number(ctx.params?.id) },
      include: { tasks: true, user: { select: { name: true } } },
    });

    return json(200, { goals });
  } catch (error) {
    return json(500, { error: "Failed to fetch shared goals" });
  }
};

export const getCircleMessages = async (ctx: ServerContext) => {
  try {
    const messages = await prisma.circleMessage.findMany({
      where: { circleId: Number(ctx.params?.id) },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return json(200, { messages: messages.reverse() });
  } catch (error) {
    return json(500, { error: "Failed to fetch messages" });
  }
};

export const createCircleMessage = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;
    const { content } = ctx.body ?? {};

    if (!content) {
      return json(400, { error: "Message content cannot be empty" });
    }

    const message = await prisma.circleMessage.create({
      data: {
        content,
        circleId: Number(ctx.params?.id),
        senderId: userId,
      },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });

    return json(200, { message });
  } catch (error) {
    return json(500, { error: "Failed to send message" });
  }
};

export const deleteCircleMessage = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;
    const messageId = Number(ctx.params?.msgId);

    const msg = await prisma.circleMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.senderId !== userId) {
      return json(403, { error: "Not authorized" });
    }

    await prisma.circleMessage.delete({ where: { id: messageId } });

    return json(200, { success: true });
  } catch (error) {
    return json(500, { error: "Failed to delete message" });
  }
};

export const getCircleSchedule = async (ctx: ServerContext) => {
  try {
    const schedules = await prisma.circleSchedule.findMany({
      where: { circleId: Number(ctx.params?.id) },
      orderBy: { startTime: "asc" },
    });

    return json(200, { schedules });
  } catch (error) {
    return json(500, { error: "Failed to fetch schedule" });
  }
};

export const createCircleSchedule = async (ctx: ServerContext) => {
  try {
    const { title, startTime, endTime } = ctx.body ?? {};

    const schedule = await prisma.circleSchedule.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        circleId: Number(ctx.params?.id),
      },
    });

    return json(200, { schedule });
  } catch (error) {
    return json(500, { error: "Failed to create schedule" });
  }
};
