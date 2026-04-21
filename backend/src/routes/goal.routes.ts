import { Router } from "express";
import { createGoal, getGoals } from "../controllers/goal.controller";
import { protect } from "../middleware/protect";
import { deleteGoal } from "../controllers/goal.controller"
import { getGoalById } from "../controllers/goal.controller"
import { updateGoal } from "../controllers/goal.controller"
import { toggleGoalImportant } from "../controllers/goal.controller"
const router = Router();

router.post("/", protect, createGoal);
router.get("/", protect, getGoals);

router.get("/:id", protect, getGoalById)
router.patch("/:id", protect, updateGoal)
router.patch("/:id/important", protect, toggleGoalImportant)
router.delete("/:id", protect, deleteGoal)
export default router;
