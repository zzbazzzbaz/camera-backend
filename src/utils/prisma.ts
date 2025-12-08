import { PrismaClient } from '@prisma/client'

// 单例 Prisma 客户端
export const prisma = new PrismaClient()

// 启动时快速探测数据库连通性
export const testPrismaConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Prisma 数据库连接成功')
  } catch (error) {
    console.error('❌ Prisma 数据库连接失败:', error)
    process.exit(1)
  }
}
