import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ApiResponse, ErrorCode } from '../utils/response'

interface TokenPayload extends jwt.JwtPayload {
  userId: string
}

// 认证中间件：解析 Authorization Bearer Token，校验后将 userId 写入 req.user
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '未授权，请先登录')
  }

  const token = authHeader.slice(7)
  const secret = process.env.JWT_SECRET

  if (!secret) {
    console.error('JWT_SECRET 未配置，无法验证 Token')
    return ApiResponse.error(res, ErrorCode.SERVER_ERROR, '服务器配置错误')
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload
    if (!decoded.userId) {
      return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, 'Token 无效')
    }

    req.user = { userId: decoded.userId }
    next()
  } catch (error) {
    console.warn('JWT 校验失败:', error)
    return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '登录状态已失效，请重新登录')
  }
}
