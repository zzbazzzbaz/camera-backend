import { Request, Response } from 'express'
import { ApiResponse, ErrorCode } from '../utils/response'
import { findBinding } from '../models/binding.model'
import {
  countPhotosByDevice,
  findPhotoById,
  listPhotosByDevice,
  softDeletePhoto
} from '../models/photo.model'
import { signUrl } from '../utils/oss'

const MAX_PAGE_SIZE = 100

// GET /api/photo/list
export const listPhotos = async (req: Request, res: Response) => {
  const userId = req.user?.userId
  if (!userId) return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '未授权')

  const { device_id, page = 1, page_size = 20 } = req.query

  if (!device_id || typeof device_id !== 'string') {
    return ApiResponse.error(res, ErrorCode.BAD_REQUEST, 'device_id 必填')
  }

  const pageNum = Math.max(1, Number(page) || 1)
  const pageSizeNum = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(page_size) || 20))
  const includeDeleted = false // 仅返回未删除图片

  const binding = await findBinding(userId, device_id)
  if (!binding) return ApiResponse.error(res, ErrorCode.FORBIDDEN, '无权限访问该设备')

  const offset = (pageNum - 1) * pageSizeNum
  const [items, total] = await Promise.all([
    listPhotosByDevice(device_id, { limit: pageSizeNum, offset, includeDeleted }),
    countPhotosByDevice(device_id, includeDeleted)
  ])

  const mapped = items.map(item => ({
    photo_id: item.photo_id,
    device_id: item.device_id,
    thumbnail_url: item.thumbnail_key ? signUrl(item.thumbnail_key) : null,
    original_url: signUrl(item.oss_key),
    file_size: item.file_size ? Number(item.file_size) : null,
    width: item.width,
    height: item.height,
    format: item.format,
    upload_time: item.upload_time,
    is_deleted: item.is_deleted
  }))

  return ApiResponse.success(res, {
    page: pageNum,
    page_size: pageSizeNum,
    total,
    has_more: offset + items.length < total,
    items: mapped
  })
}

// DELETE /api/photo/delete
export const deletePhotos = async (req: Request, res: Response) => {
  const userId = req.user?.userId
  if (!userId) return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '未授权')

  const { device_id, photo_ids } = req.body || {}

  if (!device_id || typeof device_id !== 'string') {
    return ApiResponse.error(res, ErrorCode.BAD_REQUEST, 'device_id 必填')
  }
  if (!Array.isArray(photo_ids) || photo_ids.length === 0) {
    return ApiResponse.error(res, ErrorCode.BAD_REQUEST, 'photo_ids 至少包含1个')
  }

  const binding = await findBinding(userId, device_id)
  if (!binding) return ApiResponse.error(res, ErrorCode.FORBIDDEN, '无权限访问该设备')

  const deletedIds: string[] = []
  const failed: Array<{ photo_id: string; code: number; message: string }> = []

  for (const pid of photo_ids) {
    if (typeof pid !== 'string') {
      failed.push({
        photo_id: String(pid),
        code: ErrorCode.BAD_REQUEST,
        message: 'photo_id 非字符串'
      })
      continue
    }

    const photo = await findPhotoById(pid)
    if (!photo || photo.device_id !== device_id) {
      failed.push({ photo_id: pid, code: ErrorCode.PHOTO_NOT_FOUND, message: '照片不存在' })
      continue
    }

    await softDeletePhoto(pid)
    deletedIds.push(pid)
  }

  return ApiResponse.success(res, {
    deleted_ids: deletedIds,
    failed,
    deleted_at: new Date()
  })
}

// GET /api/photo/download
export const downloadLinks = async (req: Request, res: Response) => {
  const userId = req.user?.userId
  if (!userId) return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '未授权')

  const { device_id } = req.query
  let { photo_ids } = req.query

  if (!device_id || typeof device_id !== 'string') {
    return ApiResponse.error(res, ErrorCode.BAD_REQUEST, 'device_id 必填')
  }

  if (typeof photo_ids === 'string') {
    photo_ids = photo_ids.split(',').filter(Boolean)
  }

  if (!Array.isArray(photo_ids) || photo_ids.length === 0) {
    return ApiResponse.error(res, ErrorCode.BAD_REQUEST, 'photo_ids 必填')
  }

  const binding = await findBinding(userId, device_id)
  if (!binding) return ApiResponse.error(res, ErrorCode.FORBIDDEN, '无权限访问该设备')

  const links: Array<{ photo_id: string; download_url: string; expires_at: Date }> = []
  const failed: Array<{ photo_id: string; code: number; message: string }> = []

  for (const pid of photo_ids as string[]) {
    const photo = await findPhotoById(pid)
    if (!photo || photo.device_id !== device_id || photo.is_deleted === 1) {
      failed.push({ photo_id: pid, code: ErrorCode.PHOTO_NOT_FOUND, message: '照片不存在' })
      continue
    }

    const expiresIn = 600 // 10分钟
    const url = signUrl(photo.oss_key, expiresIn)
    const expiresAt = new Date(Date.now() + expiresIn * 1000)
    links.push({ photo_id: pid, download_url: url, expires_at: expiresAt })
  }

  return ApiResponse.success(res, { links, failed })
}
