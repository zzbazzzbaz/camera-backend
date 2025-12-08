import { Photo } from '@prisma/client'
import { prisma } from '../utils/prisma'

// photos 表（docs/05_数据库设计.md §2.4）：photo_id PK，依赖 device_id 外键；软删字段 is_deleted/deleted_at 支撑回收站，file_size 为 BIGINT，upload_time 默认当前时间
export type PhotoRow = Photo

export interface CreatePhotoParams {
  photo_id: string
  device_id: string
  oss_key: string
  thumbnail_key?: string | null
  file_size?: number | bigint | null
  width?: number | null
  height?: number | null
  format?: string | null
  upload_time?: Date | string
}

export interface ListPhotosOptions {
  limit?: number
  offset?: number
  includeDeleted?: boolean
}

// 主键查照片
export const findPhotoById = async (photoId: string): Promise<PhotoRow | null> => {
  return prisma.photo.findUnique({ where: { photo_id: photoId } })
}

// 新增照片记录
export const createPhoto = async (params: CreatePhotoParams): Promise<PhotoRow> => {
  const {
    photo_id,
    device_id,
    oss_key,
    thumbnail_key = null,
    file_size = null,
    width = null,
    height = null,
    format = null,
    upload_time = new Date()
  } = params

  return prisma.photo.create({
    data: {
      photo_id,
      device_id,
      oss_key,
      thumbnail_key,
      // file_size 以 BIGINT 存储，转成 BigInt 写入
      file_size: file_size === null ? null : BigInt(file_size as number),
      width,
      height,
      format,
      upload_time: upload_time instanceof Date ? upload_time : new Date(upload_time)
    }
  })
}

// 按设备分页列表（可含软删）
export const listPhotosByDevice = async (
  deviceId: string,
  options: ListPhotosOptions = {}
): Promise<PhotoRow[]> => {
  const { limit = 20, offset = 0, includeDeleted = false } = options
  return prisma.photo.findMany({
    where: {
      device_id: deviceId,
      // 默认只查未软删记录，需要回收站场景时开启 includeDeleted
      ...(includeDeleted ? {} : { is_deleted: 0 })
    },
    orderBy: { upload_time: 'desc' },
    take: limit,
    skip: offset
  })
}

// 软删除
export const softDeletePhoto = async (photoId: string): Promise<PhotoRow> => {
  return prisma.photo.update({
    where: { photo_id: photoId },
    data: { is_deleted: 1, deleted_at: new Date() }
  })
}

// 计数
export const countPhotosByDevice = async (
  deviceId: string,
  includeDeleted = false
): Promise<number> => {
  return prisma.photo.count({
    where: {
      device_id: deviceId,
      ...(includeDeleted ? {} : { is_deleted: 0 })
    }
  })
}
