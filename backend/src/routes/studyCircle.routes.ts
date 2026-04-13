import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { protect } from "../middleware/protect";
import crypto from "crypto";

const router = Router();

// Get user's study circles
router.get("/", protect, async (req: Request, res: Response): Promise<void> => {
    try {
        const circles = await prisma.studyCircle.findMany({
            where: {
                members: {
                    some: { userId: (req as any).userId }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true }
                        }
                    }
                },
                _count: { select: { members: true } }
            }
        });
        res.json({ circles });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch study circles" });
    }
});

// Create a study circle
router.post("/", protect, async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description } = req.body;

        if (!name) {
            res.status(400).json({ error: "Name is required" });
            return;
        }

        // Generate random invite code
        const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        const circle = await prisma.studyCircle.create({
            data: {
                name,
                description,
                inviteCode,
                members: {
                    create: { userId: (req as any).userId! } // creator is automatically a member
                }
            }
        });

        res.status(201).json({ circle });
    } catch (error) {
        res.status(500).json({ error: "Failed to create study circle" });
    }
});

// Join a study circle with invite code
router.post("/join", protect, async (req: Request, res: Response): Promise<void> => {
    try {
        const { inviteCode } = req.body;

        if (!inviteCode) {
            res.status(400).json({ error: "Invite code is required" });
            return;
        }

        const circle = await prisma.studyCircle.findUnique({
            where: { inviteCode }
        });

        if (!circle) {
            res.status(404).json({ error: "Invalid invite code" });
            return;
        }

        // Check member limit (Max 8)
        const memberCount = await prisma.studyCircleMembership.count({
            where: { studyCircleId: circle.id }
        });
        if (memberCount >= 8) {
            res.status(400).json({ error: "This study circle is full (max 8 members)" });
            return;
        }

        // Check if already a member
        const existing = await prisma.studyCircleMembership.findUnique({
            where: {
                userId_studyCircleId: {
                    userId: (req as any).userId!,
                    studyCircleId: circle.id
                }
            }
        });

        if (existing) {
            res.status(400).json({ error: "Already a member of this study circle" });
            return;
        }

        await prisma.studyCircleMembership.create({
            data: {
                userId: (req as any).userId!,
                studyCircleId: circle.id
            }
        });

        res.json({ message: "Successfully joined study circle", circle });
    } catch (error) {
        res.status(500).json({ error: "Failed to join study circle" });
    }
});

// --- MVP ADDITIONS ---

// Get Circle Leaderboard (Weekly)
router.get("/:id/leaderboard", protect, async (req: Request, res: Response) => {
    try {
        const circleId = Number(req.params.id);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const memberships = await prisma.studyCircleMembership.findMany({
            where: { studyCircleId: circleId },
            include: { user: { select: { id: true, name: true, avatar: true } } }
        });

        const userIds = memberships.map(m => m.userId);

        const activities = await prisma.dailyActivity.groupBy({
            by: ['userId'],
            where: {
                userId: { in: userIds },
                date: { gte: sevenDaysAgo }
            },
            _sum: { count: true }
        });

        const leaderboard = memberships.map(m => {
            const userAct = activities.find(a => a.userId === m.userId);
            return {
                user: m.user,
                tasksCompleted: userAct?._sum.count || 0
            };
        }).sort((a, b) => b.tasksCompleted - a.tasksCompleted);

        res.json({ leaderboard });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});

// Get Shared Goals
router.get("/:id/goals", protect, async (req: Request, res: Response) => {
    try {
        const goals = await prisma.goal.findMany({
            where: { studyCircleId: Number(req.params.id) },
            include: { tasks: true, user: { select: { name: true } } }
        });
        res.json({ goals });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch shared goals" });
    }
});

// Chat Messages
router.get("/:id/messages", protect, async (req: Request, res: Response) => {
    try {
        const messages = await prisma.circleMessage.findMany({
            where: { circleId: Number(req.params.id) },
            include: { sender: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: "desc" },
            take: 50
        });
        res.json({ messages: messages.reverse() });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

router.post("/:id/messages", protect, async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        if (!content) {
            res.status(400).json({ error: "Message content cannot be empty" });
            return;
        }
        const message = await prisma.circleMessage.create({
            data: {
                content,
                circleId: Number(req.params.id),
                senderId: (req as any).userId
            },
            include: { sender: { select: { id: true, name: true, avatar: true } } }
        });
        res.json({ message });
    } catch (error) {
        res.status(500).json({ error: "Failed to send message" });
    }
});

router.delete("/:id/messages/:msgId", protect, async (req: Request, res: Response): Promise<void> => {
    try {
        const msg = await prisma.circleMessage.findUnique({ where: { id: Number(req.params.msgId) } });
        if (!msg || msg.senderId !== (req as any).userId) {
            res.status(403).json({ error: "Not authorized" });
            return;
        }
        await prisma.circleMessage.delete({ where: { id: Number(req.params.msgId) } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete message" });
    }
});

// Schedule
router.get("/:id/schedule", protect, async (req: Request, res: Response) => {
    try {
        const schedules = await prisma.circleSchedule.findMany({
            where: { circleId: Number(req.params.id) },
            orderBy: { startTime: "asc" }
        });
        res.json({ schedules });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch schedule" });
    }
});

router.post("/:id/schedule", protect, async (req: Request, res: Response) => {
    try {
        const { title, startTime, endTime } = req.body;
        const schedule = await prisma.circleSchedule.create({
            data: {
                title,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                circleId: Number(req.params.id)
            }
        });
        res.json({ schedule });
    } catch (error) {
        res.status(500).json({ error: "Failed to create schedule" });
    }
});

// Live Session Logic
router.get("/:id/session", protect, async (req: Request, res: Response) => {
    try {
        const session = await prisma.studySession.findFirst({
            where: { circleId: Number(req.params.id), status: "ACTIVE" },
            include: {
                participants: {
                    where: { status: "ACTIVE" },
                    include: { user: { select: { id: true, name: true, avatar: true } } }
                }
            }
        });
        res.json({ session });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch active session" });
    }
});

router.post("/:id/session/start", protect, async (req: Request, res: Response) => {
    try {
        const { duration } = req.body;
        const circleId = Number(req.params.id);
        const userId = (req as any).userId;

        // End any existing
        await prisma.studySession.updateMany({
            where: { circleId, status: "ACTIVE" },
            data: { status: "FINISHED" }
        });

        const session = await prisma.studySession.create({
            data: {
                circleId,
                duration: duration || 25,
                participants: {
                    create: { userId }
                }
            },
            include: {
                participants: { include: { user: { select: { id: true, name: true, avatar: true } } } }
            }
        });
        res.json({ session });
    } catch (error) {
        res.status(500).json({ error: "Failed to start session" });
    }
});

router.post("/:id/session/ping", protect, async (req: Request, res: Response) => {
    try {
        const sessionId = req.body.sessionId;
        const userId = (req as any).userId;

        const participant = await prisma.sessionParticipant.findUnique({
            where: { sessionId_userId: { sessionId, userId } }
        });

        if (participant) {
            await prisma.sessionParticipant.update({
                where: { id: participant.id },
                data: { lastPing: new Date(), status: "ACTIVE" }
            });
        } else {
            await prisma.sessionParticipant.create({
                data: { sessionId, userId }
            });
        }

        // Auto-mark others as LEFT if no ping in 15 seconds
        const timeout = new Date(Date.now() - 15000);
        await prisma.sessionParticipant.updateMany({
            where: { sessionId, lastPing: { lt: timeout }, status: "ACTIVE" },
            data: { status: "LEFT" }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Ping failed" });
    }
});

export default router;
