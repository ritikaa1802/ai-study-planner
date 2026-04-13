import { Router } from "express";
import { getAnalytics } from "../controllers/analytics.controller";
import { protect } from "../middleware/protect";

const router = Router();

router.get("/", protect, getAnalytics);

export default router;
