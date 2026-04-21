import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";

export const getNotes = async (ctx: ServerContext) => {
    try {
        const userId = ctx.userId as number;
        const notes = await prisma.note.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return json(200, notes);
    } catch (error) {
        console.error("Failed to fetch notes:", error);
        return json(500, { error: "Failed to fetch notes" });
    }
};

export const createNote = async (ctx: ServerContext) => {
    try {
        const userId = ctx.userId as number;
        const { text, tag, color, isPinned } = ctx.body ?? {};

        if (!text || typeof text !== "string") {
            return json(400, { error: "Note text is required" });
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

        return json(201, note);
    } catch (error) {
        console.error("Failed to create note:", error);
        return json(500, { error: "Failed to create note" });
    }
};

export const updateNote = async (ctx: ServerContext) => {
    try {
        const userId = ctx.userId as number;
        const { id } = ctx.params ?? {};
        const { isPinned, text, tag, color } = ctx.body ?? {};

        const note = await prisma.note.findFirst({
            where: { id: Number(id), userId },
        });

        if (!note) {
            return json(404, { error: "Note not found" });
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

        return json(200, updatedNote);
    } catch (error) {
        console.error("Failed to update note:", error);
        return json(500, { error: "Failed to update note" });
    }
};

export const deleteNote = async (ctx: ServerContext) => {
    try {
        const userId = ctx.userId as number;
        const { id } = ctx.params ?? {};

        const note = await prisma.note.findFirst({
            where: { id: Number(id), userId },
        });

        if (!note) {
            return json(404, { error: "Note not found" });
        }

        await prisma.note.delete({
            where: { id: Number(id) },
        });

        return json(200, { message: "Note deleted successfully" });
    } catch (error) {
        console.error("Failed to delete note:", error);
        return json(500, { error: "Failed to delete note" });
    }
};
