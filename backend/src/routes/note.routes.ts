import { Router } from "express";
import { authRequired } from "../middleware/auth.middleware";
import { getNotes, createNote, updateNote, deleteNote } from "../controllers/note.controller";

const router = Router();

router.use(authRequired);

router.get("/", getNotes);
router.post("/", createNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;
