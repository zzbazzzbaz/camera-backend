import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { ApiResponse, ErrorCode } from '../utils/response'
import { findDeviceBySerialNumber, createDevice, DeviceStatus } from '../models/device.model'
import { findBinding, createBinding } from '../models/binding.model'
import { prisma } from '../utils/prisma'
import { countPhotosByDevice } from '../models/photo.model'

const normalizeSerial = (serial: string) => serial.trim().toUpperCase()
const serialRegex = /^CAM-[A-Z0-9-]{5,}$/

// GET /api/device/list
export const getDeviceList = async (req: Request, res: Response) => {
  const userId = req.user?.userId
  if (!userId) return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '未授权')

  const bindings = await prisma.userDeviceBinding.findMany({
    where: { user_id: userId },
    orderBy: { bind_time: 'desc' },
    include: { device: true }
  })

  const devices = await Promise.all(
    bindings.map(async b => {
      const photoCount = await countPhotosByDevice(b.device_id, false)
      return {
        binding_id: b.binding_id,
        device_id: b.device_id,
        serial_number: b.device?.serial_number ?? '',
        device_name: b.device_name,
        is_owner: b.is_owner,
        status: b.device?.status ?? 0,
        photo_count: photoCount, // 仅统计未删除照片
        first_upload_time: b.device?.first_upload_time,
        last_upload_time: b.device?.last_upload_time,
        bind_time: b.bind_time
      }
    })
  )

  return ApiResponse.success(res, { devices })
}

// POST /api/device/bind
export const bindDevice = async (req: Request, res: Response) => {
  const userId = req.user?.userId
  if (!userId) return ApiResponse.error(res, ErrorCode.UNAUTHORIZED, '未授权')

  const { serial_number, device_name, is_owner } = req.body || {}
  if (!serial_number || typeof serial_number !== 'string') {
    return ApiResponse.error(res, ErrorCode.BAD_REQUEST, 'serial_number 必填')
  }

  const normalizedSerial = normalizeSerial(serial_number)
  if (!serialRegex.test(normalizedSerial)) {
    return ApiResponse.error(res, ErrorCode.BAD_REQUEST, '序列号格式不正确')
  }

  let device = await findDeviceBySerialNumber(normalizedSerial)
  const createdDevice = !device

  if (!device) {
    device = await createDevice({
      device_id: uuidv4().replace(/-/g, ''),
      serial_number: normalizedSerial,
      status: DeviceStatus.Active
    })
  }

  const existingBinding = await findBinding(userId, device.device_id)
  if (existingBinding) {
    return ApiResponse.error(res, ErrorCode.DEVICE_ALREADY_BOUND, '设备已绑定')
  }

  const binding = await createBinding({
    binding_id: uuidv4().replace(/-/g, ''),
    user_id: userId,
    device_id: device.device_id,
    device_name: device_name || '相机设备',
    is_owner: typeof is_owner === 'number' ? is_owner : is_owner ? 1 : 0
  })

  return ApiResponse.success(res, {
    binding_id: binding.binding_id,
    device_id: device.device_id,
    created_device: createdDevice,
    device: {
      serial_number: device.serial_number,
      status: device.status,
      photo_count: device.photo_count,
      first_upload_time: device.first_upload_time,
      last_upload_time: device.last_upload_time
    },
    binding: {
      device_name: binding.device_name,
      is_owner: binding.is_owner,
      bind_time: binding.bind_time
    }
  })
}
