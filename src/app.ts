import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorMiddleware } from './middlewares/error.middleware'
import { loggerMiddleware } from './middlewares/logger.middleware'
import routes from './routes'

dotenv.config()

const app = express()

// CORS 配置：允许跨域请求
app.use(cors({
  origin: '*', // 允许所有来源，生产环境建议配置具体域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-device-serial', 'x-api-key', 'Authorization'],
  credentials: true
}))

// 基础中间件：解析请求体并记录请求
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(loggerMiddleware)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// 路由
app.use('/api', routes)

// 统一错误处理
app.use(errorMiddleware)

export default app
