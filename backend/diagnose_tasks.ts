import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst({ where: { name: 'ram' } })
    if (!user) {
        console.log('User not found')
        return
    }
    console.log('User ID:', user.id)

    const tasks = await prisma.task.findMany({
        where: { userId: user.id, completed: true },
        select: { id: true, title: true, completed: true, completedAt: true, focusMinutes: true }
    })

    console.log('Completed Tasks:', JSON.stringify(tasks, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
