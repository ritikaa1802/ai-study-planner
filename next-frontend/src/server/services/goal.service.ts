import { prisma } from "../prisma";

const AUTO_DELETE_AFTER_HOURS = 24;

const getUtcDayStart = (date = new Date()) =>
	new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export const incrementDeletedCompletedGoalsToday = async (userId: number, by = 1) => {
	if (by <= 0) return;

	const todayUtc = getUtcDayStart();

	const user = await (prisma.user.findUnique as any)({
		where: { id: userId },
		select: {
			deletedCompletedGoalsCount: true,
			deletedCompletedGoalsDate: true,
		},
	});

	if (!user) return;

	const lastDate = user.deletedCompletedGoalsDate
		? getUtcDayStart(new Date(user.deletedCompletedGoalsDate))
		: null;

	const isSameDay = !!lastDate && lastDate.getTime() === todayUtc.getTime();

	await (prisma.user.update as any)({
		where: { id: userId },
		data: {
			deletedCompletedGoalsCount: isSameDay ? user.deletedCompletedGoalsCount + by : by,
			deletedCompletedGoalsDate: todayUtc,
		},
	});
};

export const purgeExpiredCompletedGoals = async (userId: number) => {
	const now = new Date();
	const cutoff = new Date(now.getTime() - AUTO_DELETE_AFTER_HOURS * 60 * 60 * 1000);

	// Backfill completion timestamp for already-complete goals so countdown can start.
	await prisma.goal.updateMany({
		where: {
			userId,
			progress: 100,
			completedAt: null,
		},
		data: {
			completedAt: now,
		},
	});

	const expiredGoals = await prisma.goal.findMany({
		where: {
			userId,
			progress: 100,
			completedAt: {
				lte: cutoff,
			},
		},
		select: {
			id: true,
		},
	});

	if (expiredGoals.length > 0) {
		const goalIds = expiredGoals.map((goal) => goal.id);

		await prisma.$transaction([
			prisma.task.deleteMany({
				where: {
					goalId: {
						in: goalIds,
					},
				},
			}),
			prisma.goal.deleteMany({
				where: {
					id: {
						in: goalIds,
					},
				},
			}),
		]);

		await incrementDeletedCompletedGoalsToday(userId, goalIds.length);
	}

	const expiredIncompleteGoals = await prisma.goal.findMany({
		where: {
			userId,
			progress: {
				lt: 100,
			},
			createdAt: {
				lte: cutoff,
			},
		},
		select: {
			id: true,
		},
	});

	if (expiredIncompleteGoals.length > 0) {
		const incompleteIds = expiredIncompleteGoals.map((goal) => goal.id);

		await prisma.$transaction([
			prisma.task.deleteMany({
				where: {
					goalId: {
						in: incompleteIds,
					},
				},
			}),
			prisma.goal.deleteMany({
				where: {
					id: {
						in: incompleteIds,
					},
				},
			}),
			(prisma.user.update as any)({
				where: { id: userId },
				data: { lifetimeGoalsMissed: { increment: incompleteIds.length } },
			}),
		]);
	}

	return {
		autoDeletedCompleted: expiredGoals.length,
		autoDeletedMissed: expiredIncompleteGoals.length,
	};
};
