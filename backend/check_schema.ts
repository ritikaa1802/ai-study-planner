import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const columns: any[] = await prisma.$queryRaw`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'task'
  `
    console.log('Columns in task table:', columns.map((c: any) => c.column_name))
}

main().catch(console.error).finally(() => prisma.$disconnect())
