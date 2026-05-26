import express from "express"
import { protect } from "../middleware/protect"
import prisma from "../prisma"

const router = express.Router()

// DEBUG: Get task completion status
router.get("/task/:taskId", protect, async (req, res) => {
  try {
    const { taskId } = req.params
    const userId = (req as any).userId

    const task = await prisma.task.findFirst({
      where: {
        id: Number(taskId),
        userId
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            progress: true
          }
        }
      }
    })

    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    res.json({
      task,
      status: task.completed ? "completed" : "pending",
      completedAt: task.completedAt,
      focusMinutes: task.focusMinutes,
      goal: task.goal
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// DEBUG: Get all tasks for user with completion status
router.get("/tasks/status", protect, async (req, res) => {
  try {
    const userId = (req as any).userId

    const tasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        completed: true,
        completedAt: true,
        focusMinutes: true,
        createdAt: true,
        goal: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })

    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      tasks
    }

    res.json(stats)
  } catch (error) {
    console.error("Debug tasks endpoint error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
