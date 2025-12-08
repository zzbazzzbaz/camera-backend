import { DeviceApiKey } from '@prisma/client'
import { prisma } from '../utils/prisma'

/**
 * 设备密钥模型 - 存储 X-Device-Serial 与 X-Api-Key 的对应关系
 *
 * 表结构（prisma.schema DeviceApiKey）：
 * - credential_id: 主键，UUID
 * - device_id: 设备ID，唯一外键关联 devices.device_id
 * - serial_number: 设备序列号，唯一索引，便于通过请求头快速查找
 * - api_key: 设备 API Key（建议存储哈希值）
 * - created_at / updated_at: 时间戳
 *
 * 业务场景：
 * - 相机上传接口根据序列号查询 api_key，校验后放行
 * - 支持后续密钥轮换（更新 api_key）
 */
export type DeviceApiKeyRow = DeviceApiKey

export interface CreateDeviceApiKeyParams {
  credential_id: string
  device_id: string
  serial_number: string
  api_key: string // 建议传入已加盐哈希后的值
}

/**
 * 根据序列号查询设备密钥
 */
export const findApiKeyBySerial = async (
  serialNumber: string
): Promise<DeviceApiKeyRow | null> => {
  return prisma.deviceApiKey.findUnique({ where: { serial_number: serialNumber } })
}

/**
 * 根据设备ID查询设备密钥
 */
export const findApiKeyByDeviceId = async (
  deviceId: string
): Promise<DeviceApiKeyRow | null> => {
  return prisma.deviceApiKey.findUnique({ where: { device_id: deviceId } })
}

/**
 * 创建设备密钥记录
 */
export const createDeviceApiKey = async (
  params: CreateDeviceApiKeyParams
): Promise<DeviceApiKeyRow> => {
  const { credential_id, device_id, serial_number, api_key } = params
  return prisma.deviceApiKey.create({
    data: { credential_id, device_id, serial_number, api_key }
  })
}

/**
 * 轮换/更新指定设备的 API Key
 */
export const updateDeviceApiKey = async (
  deviceId: string,
  apiKey: string
): Promise<DeviceApiKeyRow> => {
  return prisma.deviceApiKey.update({
    where: { device_id: deviceId },
    data: { api_key: apiKey }
  })
}

/**
 * 删除设备密钥记录（设备解绑或失效处理）
 */
export const deleteDeviceApiKeyByDeviceId = async (
  deviceId: string
): Promise<DeviceApiKeyRow> => {
  return prisma.deviceApiKey.delete({ where: { device_id: deviceId } })
}
