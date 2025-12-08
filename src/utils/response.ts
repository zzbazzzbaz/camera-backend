import { Response } from 'express'

// 响应封装：统一格式/错误码
export class ApiResponse {
  static success<T>(res: Response, data: T, message = '成功') {
    return res.json({
      code: 200,
      message,
      data
    })
  }

  static error(res: Response, code: number, message: string) {
    return res.status(code >= 500 ? 500 : 400).json({
      code,
      message,
      data: null
    })
  }
}

export const ErrorCode = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  DEVICE_NOT_FOUND: 1001,
  DEVICE_ALREADY_BOUND: 1002,
  PHOTO_UPLOAD_FAILED: 1003,
  PHOTO_NOT_FOUND: 1004
}
