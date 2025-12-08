import multer from 'multer'
import { Request, Response, NextFunction } from 'express'
import { ApiResponse, ErrorCode } from '../utils/response'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif'])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const baseUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('不支持的文件类型，仅允许 jpg/png/heic'))
    }
    cb(null, true)
  }
})

// 单文件上传（默认字段名 file），内存存储 + 白名单校验 + 大小限制
export const uploadSingleImage =
  (fieldName = 'file') =>
  (req: Request, res: Response, next: NextFunction) => {
    baseUpload.single(fieldName)(req, res, err => {
      if (!err) return next()

      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return ApiResponse.error(res, ErrorCode.BAD_REQUEST, '文件大小超出限制(10MB)')
      }

      return ApiResponse.error(res, ErrorCode.BAD_REQUEST, err.message || '文件上传失败')
    })
  }

// 导出底层实例，便于后续扩展多文件/自定义字段
export const upload = baseUpload
