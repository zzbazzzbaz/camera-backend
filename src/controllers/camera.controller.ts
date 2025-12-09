import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import { ApiResponse, ErrorCode } from '../utils/response'
import { findApiKeyBySerial } from '../models/deviceApiKey.model'
import {
  findDeviceBySerialNumber,
  updateDeviceUploadMeta,
  incrementDevicePhotoCount
} from '../models/device.model'
import { createPhoto } from '../models/photo.model'
import { putObject } from '../utils/oss'
import { nowCST } from '../utils/time'

const normalizeSerial = (serial: string) => serial.trim().toUpperCase()

// POST /api/camera/upload
export const uploadFromCamera = async (req: Request, res: Response) => {
  const serialHeader = req.headers['x-device-serial']
  const apiKeyHeader = req.headers['x-api-key']
  const serial = typeof serialHeader === 'string' ? normalizeSerial(serialHeader) : null
  const apiKey = typeof apiKeyHeader === 'string' ? apiKeyHeader : null

  if (!serial) {
    return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '缺少设备序列号')
  }
  if (!apiKey) {
    return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '缺少设备 API Key')
  }

  const device = await findDeviceBySerialNumber(serial)
  const credential = await findApiKeyBySerial(serial)

  if (!device || !credential || credential.api_key !== apiKey) {
    return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '设备认证失败')
  }

  const file = req.file
  if (!file) {
    return ApiResponse.error(res, ErrorCode.BAD_REQUEST, '缺少文件')
  }

  const ext = (req.body?.format as string) || file.mimetype.split('/')[1] || 'jpg'
  const photoId = uuidv4().replace(/-/g, '')
  const now = nowCST()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const ossKey = `${device.device_id}/${year}/${month}/${photoId}.${ext}`
  const thumbnailKey = `${device.device_id}/${year}/${month}/${photoId}_thumb.${ext}`

  try {
    const image = sharp(file.buffer)
    const metadata = await image.metadata()

    const thumbBuffer = await image.resize(200, 200, { fit: 'inside' }).toBuffer()
    await putObject(ossKey, file.buffer, file.mimetype)
    await putObject(thumbnailKey, thumbBuffer, file.mimetype)

    await createPhoto({
      photo_id: photoId,
      device_id: device.device_id,
      oss_key: ossKey,
      thumbnail_key: thumbnailKey,
      file_size: file.size,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      format: ext,
      upload_time: now
    })

    await updateDeviceUploadMeta(device.device_id, now)
    await incrementDevicePhotoCount(device.device_id, 1)

    return ApiResponse.success(res, {
      photo_id: photoId,
      device_id: device.device_id,
      oss_key: ossKey,
      thumbnail_key: thumbnailKey,
      upload_time: now
    })
  } catch (error) {
    console.error('照片上传失败', error)
    return ApiResponse.error(res, ErrorCode.PHOTO_UPLOAD_FAILED, '照片上传失败')
  }
}
