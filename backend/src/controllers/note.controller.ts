import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getNotes = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.user?.id);
        const notes = await prisma.note.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        res.json(notes);
    } catch (error) {
        console.error("Fetch notes error:", error);
        res.status(500).json({ error: "Failed to fetch notes" });
    }
};

export const createNote = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.user?.id);
        const { text, tag, color, isPinned } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Note text is required" });
        }

        const note = await prisma.note.create({
            data: {
                text,
                tag: tag || "Other",
                color: color || "yellow",
                isPinned: Boolean(isPinned),
                userId,
            },
        });

        res.status(201).json(note);
    } catch (error) {
        console.error("Create note error:", error);
        res.status(500).json({ error: "Failed to create note" });
    }
};

export const updateNote = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.user?.id);
        const { id } = req.params;
        const { isPinned, text, tag, color } = req.body;

        const note = await prisma.note.findFirst({
            where: { id: Number(id), userId },
        });

        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        const updatedNote = await prisma.note.update({
            where: { id: Number(id) },
            data: {
                ...(typeof isPinned === "boolean" && { isPinned }),
                ...(typeof text === "string" && { text }),
                ...(typeof tag === "string" && { tag }),
                ...(typeof color === "string" && { color }),
            },
        });

        res.json(updatedNote);
    } catch (error) {
        console.error("Update note error:", error);
        res.status(500).json({ error: "Failed to update note" });
    }
};

export const deleteNote = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.user?.id);
        const { id } = req.params;

        const note = await prisma.note.findFirst({
            where: { id: Number(id), userId },
        });

        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        await prisma.note.delete({
            where: { id: Number(id) },
        });

        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Delete note error:", error);
        res.status(500).json({ error: "Failed to delete note" });
    }
};
