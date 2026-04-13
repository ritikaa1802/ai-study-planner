import { Router } from "express";
import multer from "multer";
import { createUser, loginUser, getProfile, updateProfile, updateProfileAvatar } from "../controllers/user.controller";
import { protect } from "../middleware/protect";

const router = Router();

const storage = multer.diskStorage({
	destination: "uploads/",
	filename: (_req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`);
	}
});

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (!file.mimetype.startsWith("image/")) {
			cb(new Error("Only image files are allowed"));
			return;
		}
		cb(null, true);
	}
});

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, upload.single("photo"), updateProfileAvatar);

export default router;
