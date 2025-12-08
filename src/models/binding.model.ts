import { UserDeviceBinding } from '@prisma/client'
import { prisma } from '../utils/prisma'

/**
 * 用户设备绑定模型 - 对应 user_device_bindings 表
 *
 * 表结构说明（参考 docs/05_数据库设计.md §2.3）：
 * - binding_id: 主键，UUID格式
 * - user_id: 用户ID，外键关联 users 表
 * - device_id: 设备ID，外键关联 devices 表
 * - device_name: 用户自定义设备名称，默认'相机设备'
 * - is_owner: 是否为设备所有者，0-否/1-是
 * - bind_time: 绑定时间，数据库自动维护
 * - 复合唯一索引 uk_user_device (user_id, device_id)
 *
 * 业务场景：
 * - 支持一个设备被多个用户绑定（设备共享）
 * - 支持一个用户绑定多个设备
 * - 用户可自定义设备名称便于识别
 * - is_owner 标记设备所有者，用于权限控制
 */
export type BindingRow = UserDeviceBinding

/**
 * 创建绑定参数接口
 */
export interface CreateBindingParams {
  binding_id: string // UUID格式的绑定ID
  user_id: string // 用户ID
  device_id: string // 设备ID
  device_name?: string // 自定义设备名称，默认'相机设备'
  is_owner?: number // 是否为所有者，0-否/1-是，默认0
}

/**
 * 查询用户-设备绑定关系
 * @param userId - 用户ID
 * @param deviceId - 设备ID
 * @returns 绑定记录或null
 * @description
 * - 利用 uk_user_device 复合唯一索引，查询性能优化
 * - 用于验证用户是否有权限访问设备照片
 */
export const findBinding = async (userId: string, deviceId: string): Promise<BindingRow | null> => {
  return prisma.userDeviceBinding.findUnique({
    where: { uk_user_device: { user_id: userId, device_id: deviceId } }
  })
}

/**
 * 创建用户设备绑定
 * @param params - 绑定创建参数
 * @returns 新创建的绑定记录
 * @description
 * - 用户输入设备序列号后创建绑定关系
 * - device_name 默认为'相机设备'，用户可后续修改
 * - is_owner 默认为0（非所有者），首次绑定可设为1
 * - uk_user_device 唯一索引防止重复绑定
 */
export const createBinding = async (params: CreateBindingParams): Promise<BindingRow> => {
  const { binding_id, user_id, device_id, device_name = '相机设备', is_owner = 0 } = params
  return prisma.userDeviceBinding.create({
    data: { binding_id, user_id, device_id, device_name, is_owner }
  })
}

/**
 * 查询用户的所有设备绑定
 * @param userId - 用户ID
 * @returns 绑定记录列表，按绑定时间倒序
 * @description
 * - 用于设备列表页面展示用户绑定的所有设备
 * - 按 bind_time 降序排列，最新绑定的设备在前
 */
export const listBindingsByUser = async (userId: string): Promise<BindingRow[]> => {
  return prisma.userDeviceBinding.findMany({
    where: { user_id: userId },
    orderBy: { bind_time: 'desc' }
  })
}

/**
 * 查询设备的所有用户绑定
 * @param deviceId - 设备ID
 * @returns 绑定记录列表，按绑定时间倒序
 * @description
 * - 用于查看设备被哪些用户绑定（设备共享场景）
 * - 按 bind_time 降序排列
 */
export const listBindingsByDevice = async (deviceId: string): Promise<BindingRow[]> => {
  return prisma.userDeviceBinding.findMany({
    where: { device_id: deviceId },
    orderBy: { bind_time: 'desc' }
  })
}

/**
 * 删除用户设备绑定
 * @param bindingId - 绑定ID
 * @returns 被删除的绑定记录
 * @description
 * - 用户解绑设备时调用
 * - 物理删除，不可恢复
 * - 删除绑定不影响设备和照片数据
 */
export const deleteBinding = async (bindingId: string): Promise<BindingRow> => {
  return prisma.userDeviceBinding.delete({ where: { binding_id: bindingId } })
}
