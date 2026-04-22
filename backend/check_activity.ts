import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst({ where: { name: 'ram' } })
    if (!user) return

    const activity = await prisma.dailyActivity.findMany({
        where: { userId: user.id }
    })
    console.log('Daily Activity:', JSON.stringify(activity, null, 2))

    const latestTasks = await prisma.task.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    })
    console.log('Latest Tasks:', JSON.stringify(latestTasks, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
