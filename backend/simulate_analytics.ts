import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst({ where: { name: 'ram' } })
    if (!user) return
    const userId = user.id

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const activities = await prisma.dailyActivity.findMany({
        where: { userId, date: { gte: sevenDaysAgo } },
        orderBy: { date: "asc" }
    });

    const tk = [0, 0, 0, 0, 0, 0, 0];
    const wk = [0, 0, 0, 0, 0, 0, 0];

    activities.forEach((act: any) => {
        const day = new Date(act.date).getDay();
        tk[day] += act.count;
    });

    const sessionsLast7Days = await prisma.userStudySession.findMany({
        where: { userId, date: { gte: sevenDaysAgo } }
    });

    sessionsLast7Days.forEach((session: any) => {
        const day = new Date(session.date).getDay();
        wk[day] += session.duration / 60;
    });

    console.log('Sessions wk:', wk)

    const completedTasksLast7Days = await prisma.task.findMany({
        where: {
            userId,
            completed: true,
            completedAt: { gte: sevenDaysAgo }
        }
    });

    console.log('Found completed tasks with status:', completedTasksLast7Days.length)

    completedTasksLast7Days.forEach((task: any) => {
        if (task.completedAt && task.focusMinutes) {
            const day = new Date(task.completedAt).getDay();
            console.log(`Task ${task.id} (focus ${task.focusMinutes}) on day ${day}`);
            wk[day] += task.focusMinutes / 60;
        }
    });

    console.log('Final wk:', wk)

    const wkRounded = wk.map((hours: number) => Number(hours.toFixed(1)));
    console.log('Rounded wk:', wkRounded)

    const weeklyStudyHours = Number(wkRounded.reduce((sum: number, h: number) => sum + h, 0).toFixed(1));
    console.log('Weekly Study Hours:', weeklyStudyHours)
}

main().catch(console.error).finally(() => prisma.$disconnect())
