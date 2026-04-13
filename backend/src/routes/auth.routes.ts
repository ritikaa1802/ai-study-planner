import express from "express"
import { register, login, refreshToken } from "../controllers/auth.controller"
import { forgotPassword, resetPassword, changePassword } from "../controllers/auth.controller"
import { protect } from "../middleware/protect"
const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/refresh", refreshToken)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)
router.post("/change-password", protect, changePassword)
export default router
