import { Photo } from '@prisma/client'
import { prisma } from '../utils/prisma'
import { nowCST } from '../utils/time'

/**
 * 照片模型 - 对应 photos 表
 *
 * 表结构说明（参考 docs/05_数据库设计.md §2.4）：
 * - photo_id: 主键，UUID格式
 * - device_id: 设备ID，外键关联 devices 表
 * - oss_key: OSS存储路径（原图）
 * - thumbnail_key: OSS缩略图路径
 * - file_size: 文件大小（字节），BIGINT类型
 * - width: 图片宽度（像素）
 * - height: 图片高度（像素）
 * - format: 图片格式（jpg/png/heic等）
 * - upload_time: 上传时间，默认当前时间
 * - is_deleted: 软删除标记，0-正常/1-已删除
 * - deleted_at: 删除时间
 * - 复合索引 idx_device_upload (device_id, upload_time, is_deleted)
 *
 * 业务场景：
 * - 相机上传照片后创建记录
 * - 用户查看照片列表（分页查询）
 * - 软删除支持回收站功能（30天后物理删除）
 * - 存储原图和缩略图的OSS路径
 */
export type PhotoRow = Photo

/**
 * 创建照片参数接口
 */
export interface CreatePhotoParams {
  photo_id: string // UUID格式的照片ID
  device_id: string // 设备ID
  oss_key: string // OSS原图路径
  thumbnail_key?: string | null // OSS缩略图路径，可选
  file_size?: number | bigint | null // 文件大小（字节）
  width?: number | null // 图片宽度
  height?: number | null // 图片高度
  format?: string | null // 图片格式
  upload_time?: Date | string // 上传时间，默认当前时间
}

/**
 * 照片列表查询选项
 */
export interface ListPhotosOptions {
  limit?: number // 每页数量，默认20
  offset?: number // 偏移量，默认0
  includeDeleted?: boolean // 是否包含已删除照片，默认false
}

/**
 * 根据照片ID查询照片
 * @param photoId - 照片ID（主键）
 * @returns 照片记录或null
 */
export const findPhotoById = async (photoId: string): Promise<PhotoRow | null> => {
  return prisma.photo.findUnique({ where: { photo_id: photoId } })
}

/**
 * 创建照片记录
 * @param params - 照片创建参数
 * @returns 新创建的照片记录
 * @description
 * - 相机上传照片后调用，保存照片元数据
 * - file_size 使用 BIGINT 类型存储，支持大文件
 * - upload_time 默认为当前时间
 * - 原图和缩略图路径格式：{deviceId}/{year}/{month}/{photoId}.{ext}
 */
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

/**
 * 按设备分页查询照片列表
 * @param deviceId - 设备ID
 * @param options - 查询选项（分页、是否包含已删除）
 * @returns 照片记录列表，按上传时间倒序
 * @description
 * - 利用 idx_device_upload 复合索引，查询性能优化
 * - 默认只返回未删除照片（is_deleted=0）
 * - 设置 includeDeleted=true 可查询回收站照片
 * - 按 upload_time 降序排列，最新照片在前
 */
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

/**
 * 软删除照片
 * @param photoId - 照片ID
 * @returns 更新后的照片记录
 * @description
 * - 标记 is_deleted=1，记录 deleted_at 时间
 * - 不物理删除，支持回收站恢复功能
 * - 30天后由定时任务物理删除（删除OSS文件和数据库记录）
 */
export const softDeletePhoto = async (photoId: string): Promise<PhotoRow> => {
  return prisma.photo.update({
    where: { photo_id: photoId },
    data: { is_deleted: 1, deleted_at: nowCST() }
  })
}

/**
 * 统计设备照片数量
 * @param deviceId - 设备ID
 * @param includeDeleted - 是否包含已删除照片，默认false
 * @returns 照片总数
 * @description 用于分页查询时计算总页数
 */
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
