// 扩展全局 Express 命名空间，给 Request 注入 user 字段
import 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
      }
    }
  }
}
