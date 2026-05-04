import prisma from "../prisma";
import { addUserNotification } from "../controllers/user.controller";

// Helper to get today's date string (YYYY-MM-DD)
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// Notify users of today's events and missed events
export async function notifyCalendarEvents() {
  const todayStr = getTodayDateString();
  const now = new Date();
  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    // Events for today
    const events = await prisma.calendarEvent.findMany({
      where: { userId: user.id, date: todayStr },
    });
    for (const event of events) {
      // If event time is in the future, send reminder
      const eventDateTime = new Date(`${event.date}T${event.time}`);
      if (eventDateTime > now) {
        await addUserNotification(user.id, {
          text: `Reminder: You have '${event.title}' at ${event.time} today.`,
        });
      } else {
        // If event time is in the past, send missed notification
        await addUserNotification(user.id, {
          text: `Missed event: '${event.title}' at ${event.time} today.`,
        });
      }
    }
  }
}

// Notify users of missed tasks (not completed, created before today)
export async function notifyMissedTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    // Find tasks not completed and created before today
    const missedTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        completed: false,
        createdAt: { lt: today },
      },
    });
    if (missedTasks.length > 0) {
      await addUserNotification(user.id, {
        text: `You have ${missedTasks.length} missed tasks from previous days.`,
      });
    }
  }
}

// Main job runner
// Notify users of new study circle events created in the last 3 hours
export async function notifyStudyCircleEvents() {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  // Find all new circle schedules created in the last 3 hours
  const newEvents = await prisma.circleSchedule.findMany({
    where: { createdAt: { gte: threeHoursAgo } },
    include: { studyCircle: { include: { members: { include: { user: true } } } } },
  });
  for (const event of newEvents) {
    const circleName = event.studyCircle?.name || "a study circle";
    for (const member of event.studyCircle?.members || []) {
      await addUserNotification(member.userId, {
        text: `New event in '${circleName}': '${event.title}' from ${event.startTime.toLocaleString()} to ${event.endTime.toLocaleString()}`,
      });
    }
  }
}

export async function runNotificationJobs() {
  await notifyCalendarEvents();
  await notifyMissedTasks();
  await notifyStudyCircleEvents();
}
