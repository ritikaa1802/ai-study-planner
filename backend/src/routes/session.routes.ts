import { Router } from "express";
import { protect } from "../middleware/protect";
import { createStudySession, getStudySessions } from "../controllers/session.controller";

const router = Router();

router.post("/", protect, createStudySession);
router.get("/", protect, getStudySessions);

export default router;
