import express from "express"
import { protect } from "../middleware/protect"
import { getActivity } from "../controllers/activity.controller"

const router = express.Router()

router.get("/", protect, getActivity)

export default router
