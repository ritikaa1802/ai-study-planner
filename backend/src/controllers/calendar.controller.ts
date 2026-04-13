import { Request, Response } from "express";
import prisma from "../prisma";

export const getEvents = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const events = await prisma.calendarEvent.findMany({
            where: { userId }
        });
        res.json({ events });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch calendar events" });
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { title, tag, date, time, day } = req.body;

        if (!title || !tag || !date || !time || !day) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const event = await prisma.calendarEvent.create({
            data: {
                title,
                tag,
                date,
                time,
                day: Number(day),
                userId
            }
        });

        res.status(201).json({ event });
    } catch (error) {
        res.status(500).json({ error: "Failed to create calendar event" });
    }
};

export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const event = await prisma.calendarEvent.findUnique({
            where: { id: Number(id) }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        if (event.userId !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await prisma.calendarEvent.delete({
            where: { id: Number(id) }
        });

        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete calendar event" });
    }
};
