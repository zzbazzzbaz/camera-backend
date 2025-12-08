import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { ApiResponse, ErrorCode } from '../utils/response'

type KnownError = Error & { statusCode?: number; code?: number | string }

export const errorMiddleware = (
  err: KnownError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 记录请求维度的错误日志便于排查
  console.error(`[Error] ${req.method} ${req.path}`, err)

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.error(res, ErrorCode.BAD_REQUEST, '文件大小超出限制(10MB)')
    }
    return ApiResponse.error(res, ErrorCode.BAD_REQUEST, err.message)
  }

  if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
    return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '登录状态已失效，请重新登录')
  }

  const messageMap: Record<string, number> = {
    设备已绑定: ErrorCode.DEVICE_ALREADY_BOUND,
    照片不存在: ErrorCode.PHOTO_NOT_FOUND,
    '不支持的文件类型，仅允许 jpg/png/heic': ErrorCode.BAD_REQUEST
  }

  if (messageMap[err.message]) {
    return ApiResponse.error(res, messageMap[err.message], err.message)
  }

  if (typeof err.statusCode === 'number') {
    return ApiResponse.error(res, err.statusCode, err.message)
  }

  if (typeof err.code === 'number') {
    return ApiResponse.error(res, err.code, err.message)
  }

  return ApiResponse.error(res, ErrorCode.SERVER_ERROR, '服务器错误')
}
