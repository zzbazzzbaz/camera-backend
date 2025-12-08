import { Device } from '@prisma/client'
import { prisma } from '../utils/prisma'

// devices 表（docs/05_数据库设计.md §2.2）：device_id PK，serial_number 唯一，status 0-禁用/1-正常，记录首末次上传时间与照片计数
export enum DeviceStatus {
  Disabled = 0,
  Active = 1
}

export type DeviceRow = Device

export interface CreateDeviceParams {
  device_id: string
  serial_number: string
  status?: DeviceStatus
}

// 根据主键查设备
export const findDeviceById = async (deviceId: string): Promise<DeviceRow | null> => {
  return prisma.device.findUnique({ where: { device_id: deviceId } })
}

// 序列号查设备
export const findDeviceBySerialNumber = async (serialNumber: string): Promise<DeviceRow | null> => {
  return prisma.device.findUnique({ where: { serial_number: serialNumber } })
}

// 创建设备
export const createDevice = async (params: CreateDeviceParams): Promise<DeviceRow> => {
  const { device_id, serial_number, status = DeviceStatus.Active } = params
  return prisma.device.create({
    data: { device_id, serial_number, status }
  })
}

// 更新设备状态
export const updateDeviceStatus = async (
  deviceId: string,
  status: DeviceStatus
): Promise<DeviceRow> => {
  return prisma.device.update({ where: { device_id: deviceId }, data: { status } })
}

// 写入首次/末次上传时间
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

// 调整照片计数
export const incrementDevicePhotoCount = async (
  deviceId: string,
  delta = 1
): Promise<DeviceRow> => {
  return prisma.device.update({
    where: { device_id: deviceId },
    data: { photo_count: { increment: delta } }
  })
}
