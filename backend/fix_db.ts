import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Adding columns via raw SQL...')
    try {
        await prisma.$executeRaw`ALTER TABLE task ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3)`
        console.log('Added completedAt column')
    } catch (e) {
        console.error('Failed to add completedAt:', e)
    }

    try {
        await prisma.$executeRaw`ALTER TABLE task ADD COLUMN IF NOT EXISTS "completionCounted" BOOLEAN NOT NULL DEFAULT false`
        console.log('Added completionCounted column')
    } catch (e) {
        console.error('Failed to add completionCounted:', e)
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
