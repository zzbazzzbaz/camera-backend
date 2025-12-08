import { Photo } from '@prisma/client'
import { prisma } from '../utils/prisma'

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

export const findPhotoById = async (photoId: string): Promise<PhotoRow | null> => {
  return prisma.photo.findUnique({ where: { photo_id: photoId } })
}

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
      file_size: file_size === null ? null : BigInt(file_size as number),
      width,
      height,
      format,
      upload_time: upload_time instanceof Date ? upload_time : new Date(upload_time)
    }
  })
}

export const listPhotosByDevice = async (
  deviceId: string,
  options: ListPhotosOptions = {}
): Promise<PhotoRow[]> => {
  const { limit = 20, offset = 0, includeDeleted = false } = options
  return prisma.photo.findMany({
    where: {
      device_id: deviceId,
      ...(includeDeleted ? {} : { is_deleted: 0 })
    },
    orderBy: { upload_time: 'desc' },
    take: limit,
    skip: offset
  })
}

export const softDeletePhoto = async (photoId: string): Promise<PhotoRow> => {
  return prisma.photo.update({
    where: { photo_id: photoId },
    data: { is_deleted: 1, deleted_at: new Date() }
  })
}

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
