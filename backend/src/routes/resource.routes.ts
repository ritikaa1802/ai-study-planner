import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { protect } from "../middleware/protect";
import multer from "multer";
import path from "path";

const router = Router();

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Get all resources for the current user only
router.get("/", protect, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId;
        const resources = await prisma.resource.findMany({
            where: { uploaderId: userId },
            include: {
                uploader: { select: { id: true, name: true } },
                studyCircle: { select: { id: true, name: true } }
            },
            orderBy: { uploadedAt: "desc" }
        });
        res.json({ resources });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch resources" });
    }
});

// Create a resource
router.post("/", protect, (req: Request, res: Response, next) => {
    upload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: "File too large. Maximum size is 100MB." });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(500).json({ error: "File upload failed due to an unknown error." });
        }
        next();
    });
}, async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, url, description, studyCircleId } = req.body;
        const file = req.file;

        if (!title || (!url && !file)) {
            res.status(400).json({ error: "Title and either a URL or a file are required" });
            return;
        }

        const resource = await prisma.resource.create({
            data: {
                title,
                url: url || null,
                fileUrl: file ? `/uploads/${file.filename}` : null,
                fileType: file ? file.mimetype : null,
                description,
                studyCircleId: studyCircleId ? Number(studyCircleId) : undefined,
                uploaderId: (req as any).userId
            }
        });

        res.status(201).json({ resource });
    } catch (error) {
        res.status(500).json({ error: "Failed to create resource" });
    }
});

// Delete a resource
router.delete("/:id", protect, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const reqAny = req as any;

        const resource = await prisma.resource.findUnique({ where: { id: Number(id) } });
        if (!resource) {
            res.status(404).json({ error: "Resource not found" });
            return;
        }

        if (resource.uploaderId !== reqAny.userId && reqAny.userRole !== "ADMIN") {
            res.status(403).json({ error: "Not authorized to delete this resource" });
            return;
        }

        await prisma.resource.delete({ where: { id: Number(id) } });
        res.json({ message: "Resource deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete resource" });
    }
});

export default router;
