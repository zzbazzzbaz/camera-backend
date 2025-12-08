import { Device } from '@prisma/client'
import { prisma } from '../utils/prisma'

/**
 * 设备模型 - 对应 devices 表
 *
 * 表结构说明（参考 docs/05_数据库设计.md §2.2）：
 * - device_id: 主键，UUID格式
 * - serial_number: 设备序列号，有唯一索引 idx_serial_number
 * - status: 设备状态，0-禁用/1-正常
 * - photo_count: 照片总数统计
 * - first_upload_time: 首次上传时间
 * - last_upload_time: 最后上传时间
 * - created_at: 创建时间，数据库自动维护
 * - updated_at: 更新时间，数据库自动维护
 *
 * 业务场景：
 * - 相机上传照片时通过 serial_number 查询或创建设备
 * - 用户绑定设备时验证 serial_number 是否存在
 * - 统计设备照片数量和上传时间范围
 */

/**
 * 设备状态枚举
 */
export enum DeviceStatus {
  Disabled = 0, // 禁用状态，设备无法上传照片
  Active = 1 // 正常状态，设备可正常使用
}

export type DeviceRow = Device

/**
 * 创建设备参数接口
 */
export interface CreateDeviceParams {
  device_id: string // UUID格式的设备ID
  serial_number: string // 设备序列号，唯一标识
  status?: DeviceStatus // 设备状态，默认为Active
}

/**
 * 根据设备ID查询设备
 * @param deviceId - 设备ID（主键）
 * @returns 设备记录或null
 */
export const findDeviceById = async (deviceId: string): Promise<DeviceRow | null> => {
  return prisma.device.findUnique({ where: { device_id: deviceId } })
}

/**
 * 根据序列号查询设备
 * @param serialNumber - 设备序列号
 * @returns 设备记录或null
 * @description
 * - 利用 idx_serial_number 唯一索引，查询性能优化
 * - 用于相机上传照片时查找设备
 * - 用于用户绑定设备时验证序列号
 */
export const findDeviceBySerialNumber = async (serialNumber: string): Promise<DeviceRow | null> => {
  return prisma.device.findUnique({ where: { serial_number: serialNumber } })
}

/**
 * 创建新设备
 * @param params - 设备创建参数
 * @returns 新创建的设备记录
 * @description
 * - 相机首次上传照片时自动创建设备记录
 * - status 默认为 Active（正常状态）
 * - photo_count 初始值为 0
 */
export const createDevice = async (params: CreateDeviceParams): Promise<DeviceRow> => {
  const { device_id, serial_number, status = DeviceStatus.Active } = params
  return prisma.device.create({
    data: { device_id, serial_number, status }
  })
}

/**
 * 更新设备状态
 * @param deviceId - 设备ID
 * @param status - 新状态（0-禁用/1-正常）
 * @returns 更新后的设备记录
 * @description 用于管理员禁用或启用设备
 */
export const updateDeviceStatus = async (
  deviceId: string,
  status: DeviceStatus
): Promise<DeviceRow> => {
  return prisma.device.update({ where: { device_id: deviceId }, data: { status } })
}

/**
 * 更新设备上传时间元数据
 * @param deviceId - 设备ID
 * @param uploadTime - 上传时间
 * @returns 更新后的设备记录或null
 * @description
 * - 首次上传时写入 first_upload_time，之后不再修改
 * - 每次上传都更新 last_upload_time
 * - 用于统计设备使用时间范围
 */
export const updateDeviceUploadMeta = async (
  deviceId: string,
  uploadTime: Date | string
): Promise<DeviceRow | null> => {
  const device = await prisma.device.findUnique({
    where: { device_id: deviceId },
    select: { first_upload_time: true }
  })

  if (!device) return null

  const uploadDate = new Date(uploadTime)

  return prisma.device.update({
    where: { device_id: deviceId },
    data: {
      // 首次上传时间只在第一次出现时写入，之后仅刷新末次时间
      first_upload_time: device.first_upload_time ?? uploadDate,
      last_upload_time: uploadDate
    }
  })
}

/**
 * 增加设备照片计数
 * @param deviceId - 设备ID
 * @param delta - 增量值，默认为1
 * @returns 更新后的设备记录
 * @description
 * - 每次上传照片后调用，增加 photo_count
 * - 支持批量增加（传入 delta > 1）
 * - 使用 Prisma 的 increment 操作，保证原子性
 */
export const incrementDevicePhotoCount = async (
  deviceId: string,
  delta = 1
): Promise<DeviceRow> => {
  return prisma.device.update({
    where: { device_id: deviceId },
    data: { photo_count: { increment: delta } }
  })
}
