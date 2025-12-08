import { Request, Response, NextFunction } from 'express'
import { ApiResponse, ErrorCode } from '../utils/response'

export const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('错误:', err)

  if (err.message === '设备已绑定') {
    return ApiResponse.error(res, ErrorCode.DEVICE_ALREADY_BOUND, err.message)
  }

  if (err.message === '照片不存在') {
    return ApiResponse.error(res, ErrorCode.PHOTO_NOT_FOUND, err.message)
  }

  return ApiResponse.error(res, ErrorCode.SERVER_ERROR, '服务器错误')
}
