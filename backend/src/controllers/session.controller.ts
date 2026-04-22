import { addUserNotification } from "./user.controller";
import { Request, Response } from "express";
import prisma from "../prisma";

export const createStudySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as number;
    const { subject, duration } = (req.body ?? {}) as { subject?: string; duration?: number };

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }

    if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
      res.status(400).json({ error: "Duration must be a positive number of minutes" });
      return;
    }

    const normalizedDuration = Math.round(duration);
    if (normalizedDuration < 1 || normalizedDuration > 600) {
      res.status(400).json({ error: "Duration must be between 1 and 600 minutes" });
      return;
    }

    const session = await prisma.userStudySession.create({
      data: {
        userId,
        subject: subject.trim(),
        duration: normalizedDuration,
      },
    });

    await addUserNotification(userId, {
      text: `Study session for "${subject}" (${normalizedDuration} min) logged!`,
    });
    // Award XP for study session (duration/5, min 1)
    const { addUserXP } = require("./user.controller")
    await addUserXP(userId, Math.max(1, Math.floor(normalizedDuration / 5)))
    res.status(201).json(session);
  } catch (error) {
    console.error("CREATE SESSION ERROR:", error);
    res.status(500).json({ error: "Failed to save study session" });
  }
};

export const getStudySessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as number;

    const sessions = await prisma.userStudySession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 100,
    });

    res.json(sessions);
  } catch (error) {
    console.error("GET SESSIONS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch study sessions" });
  }
};
