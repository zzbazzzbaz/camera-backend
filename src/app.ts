import express from 'express'
import dotenv from 'dotenv'
import { errorMiddleware } from './middlewares/error.middleware'
import { loggerMiddleware } from './middlewares/logger.middleware'

dotenv.config()

const app = express()

// 中间件
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(loggerMiddleware)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// 路由（后续添加）
// app.use('/api', routes)

// 错误处理
app.use(errorMiddleware)

export default app
