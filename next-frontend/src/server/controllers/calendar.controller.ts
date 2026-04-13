import { prisma } from "../prisma";
import { json, type ServerContext } from "../shared/http";

export const getEvents = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;
    const events = await prisma.calendarEvent.findMany({
      where: { userId },
    });
    return json(200, { events });
  } catch (error) {
    return json(500, { error: "Failed to fetch calendar events" });
  }
};

export const createEvent = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;
    const { title, tag, date, time, day } = ctx.body ?? {};

    if (!title || !tag || !date || !time || !day) {
      return json(400, { error: "Missing required fields" });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        tag,
        date,
        time,
        day: Number(day),
        userId,
      },
    });

    return json(201, { event });
  } catch (error) {
    return json(500, { error: "Failed to create calendar event" });
  }
};

export const deleteEvent = async (ctx: ServerContext) => {
  try {
    const userId = ctx.userId as number;
    const { id } = ctx.params ?? {};

    const event = await prisma.calendarEvent.findUnique({
      where: { id: Number(id) },
    });

    if (!event) {
      return json(404, { error: "Event not found" });
    }

    if (event.userId !== userId) {
      return json(403, { error: "Unauthorized" });
    }

    await prisma.calendarEvent.delete({
      where: { id: Number(id) },
    });

    return json(200, { message: "Event deleted successfully" });
  } catch (error) {
    return json(500, { error: "Failed to delete calendar event" });
  }
};
