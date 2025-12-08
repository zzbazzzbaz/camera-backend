import app from './app'
import { testPrismaConnection } from './utils/prisma'

const PORT = process.env.PORT || 3000

const start = async () => {
  try {
    // 测试数据库连接
    await testPrismaConnection()

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
      console.log(`📝 环境: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    console.error('启动失败:', error)
    process.exit(1)
  }
}

start()
