import { UserDeviceBinding } from '@prisma/client'
import { prisma } from '../utils/prisma'

// user_device_bindings 表（docs/05_数据库设计.md §2.3）：binding_id PK，user_id/device_id 组合唯一 uk_user_device，默认 device_name='相机设备'，is_owner 标记所有者
export type BindingRow = UserDeviceBinding

export interface CreateBindingParams {
  binding_id: string
  user_id: string
  device_id: string
  device_name?: string
  is_owner?: number
}

// 查用户-设备唯一绑定
export const findBinding = async (userId: string, deviceId: string): Promise<BindingRow | null> => {
  return prisma.userDeviceBinding.findUnique({
    where: { uk_user_device: { user_id: userId, device_id: deviceId } }
  })
}

// 创建绑定记录
export const createBinding = async (params: CreateBindingParams): Promise<BindingRow> => {
  const { binding_id, user_id, device_id, device_name = '相机设备', is_owner = 0 } = params
  return prisma.userDeviceBinding.create({
    data: { binding_id, user_id, device_id, device_name, is_owner }
  })
}

// 按用户列出绑定
export const listBindingsByUser = async (userId: string): Promise<BindingRow[]> => {
  return prisma.userDeviceBinding.findMany({
    where: { user_id: userId },
    orderBy: { bind_time: 'desc' }
  })
}

// 按设备列出绑定
export const listBindingsByDevice = async (deviceId: string): Promise<BindingRow[]> => {
  return prisma.userDeviceBinding.findMany({
    where: { device_id: deviceId },
    orderBy: { bind_time: 'desc' }
  })
}

// 删除单条绑定
export const deleteBinding = async (bindingId: string): Promise<BindingRow> => {
  return prisma.userDeviceBinding.delete({ where: { binding_id: bindingId } })
}
