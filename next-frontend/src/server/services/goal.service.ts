import { prisma } from "../prisma";

const AUTO_DELETE_AFTER_HOURS = 24;

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

	if (expiredGoals.length === 0) {
		return 0;
	}

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

	return goalIds.length;
};
