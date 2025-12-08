import { UserDeviceBinding } from '@prisma/client'
import { prisma } from '../utils/prisma'

export type BindingRow = UserDeviceBinding

export interface CreateBindingParams {
  binding_id: string
  user_id: string
  device_id: string
  device_name?: string
  is_owner?: number
}

export const findBinding = async (userId: string, deviceId: string): Promise<BindingRow | null> => {
  return prisma.userDeviceBinding.findUnique({
    where: { uk_user_device: { user_id: userId, device_id: deviceId } }
  })
}

export const createBinding = async (params: CreateBindingParams): Promise<BindingRow> => {
  const { binding_id, user_id, device_id, device_name = '相机设备', is_owner = 0 } = params
  return prisma.userDeviceBinding.create({
    data: { binding_id, user_id, device_id, device_name, is_owner }
  })
}

export const listBindingsByUser = async (userId: string): Promise<BindingRow[]> => {
  return prisma.userDeviceBinding.findMany({
    where: { user_id: userId },
    orderBy: { bind_time: 'desc' }
  })
}

export const listBindingsByDevice = async (deviceId: string): Promise<BindingRow[]> => {
  return prisma.userDeviceBinding.findMany({
    where: { device_id: deviceId },
    orderBy: { bind_time: 'desc' }
  })
}

export const deleteBinding = async (bindingId: string): Promise<BindingRow> => {
  return prisma.userDeviceBinding.delete({ where: { binding_id: bindingId } })
}
