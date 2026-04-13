import { Router } from "express";
import { getEvents, createEvent, deleteEvent } from "../controllers/calendar.controller";
import { protect } from "../middleware/protect";

const router = Router();

router.get("/", protect, getEvents);
router.post("/", protect, createEvent);
router.delete("/:id", protect, deleteEvent);

export default router;
