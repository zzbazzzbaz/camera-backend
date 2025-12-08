import { Device } from '@prisma/client'
import { prisma } from '../utils/prisma'

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

export const findDeviceById = async (deviceId: string): Promise<DeviceRow | null> => {
  return prisma.device.findUnique({ where: { device_id: deviceId } })
}

export const findDeviceBySerialNumber = async (serialNumber: string): Promise<DeviceRow | null> => {
  return prisma.device.findUnique({ where: { serial_number: serialNumber } })
}

export const createDevice = async (params: CreateDeviceParams): Promise<DeviceRow> => {
  const { device_id, serial_number, status = DeviceStatus.Active } = params
  return prisma.device.create({
    data: { device_id, serial_number, status }
  })
}

export const updateDeviceStatus = async (
  deviceId: string,
  status: DeviceStatus
): Promise<DeviceRow> => {
  return prisma.device.update({ where: { device_id: deviceId }, data: { status } })
}

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
      first_upload_time: device.first_upload_time ?? uploadDate,
      last_upload_time: uploadDate
    }
  })
}

export const incrementDevicePhotoCount = async (
  deviceId: string,
  delta = 1
): Promise<DeviceRow> => {
  return prisma.device.update({
    where: { device_id: deviceId },
    data: { photo_count: { increment: delta } }
  })
}
