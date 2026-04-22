import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Backfilling completedAt for existing tasks...')
    const result = await (prisma.task as any).updateMany({
        where: {
            completed: true,
            completedAt: null
        },
        data: {
            completedAt: new Date()
        }
    })
    console.log('Backfilled items:', result.count)
}

main().catch(console.error).finally(() => prisma.$disconnect())
