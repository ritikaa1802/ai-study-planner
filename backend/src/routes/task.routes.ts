import express from "express"
import { protect } from "../middleware/protect"
import {
  createTask,
  createTasksBulk,
  getTasksByGoal,
  updateTask,
  deleteTask,
  getTaskById,
  getAllTasks
} from "../controllers/task.controller"

const router = express.Router()

router.post("/", protect, createTask)
router.post("/bulk", protect, createTasksBulk)
router.get("/", protect, getAllTasks)
router.get("/goal/:goalId", protect, getTasksByGoal)
router.get("/:id", protect, getTaskById)
router.patch("/:id", protect, updateTask)
router.delete("/:id", protect, deleteTask)

export default router