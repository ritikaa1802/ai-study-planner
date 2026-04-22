import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.findFirst({ where: { name: 'ram' } })
    if (!user) {
        console.log('User not found')
        return
    }
    console.log('User ID:', user.id)

    const tasks: any[] = await prisma.$queryRaw`SELECT id, title, completed, "completedAt", "focusMinutes" FROM task WHERE "userId" = ${user.id} AND completed = true`

    console.log('Completed Tasks (Raw):', JSON.stringify(tasks, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
