import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export const testPrismaConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Prisma 数据库连接成功')
  } catch (error) {
    console.error('❌ Prisma 数据库连接失败:', error)
    process.exit(1)
  }
}
