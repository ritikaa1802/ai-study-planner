import express from "express"
import { protect } from "../middleware/protect"
import { getDashboardStats } from "../controllers/dashboard.controller"
import { isAdmin } from "../middleware/admin"
const router = express.Router()

router.get("/stats", protect, getDashboardStats)
router.get("/admin-dashboard", protect, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin" })
})
export default router
