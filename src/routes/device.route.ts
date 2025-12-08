import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { bindDevice, getDeviceList } from '../controllers/device.controller'
import { validateFields } from '../middlewares/validator.middleware'

const router = Router()

router.get('/device/list', authMiddleware, getDeviceList)

router.post(
  '/device/bind',
  authMiddleware,
  validateFields([{ field: 'serial_number', required: true, type: 'string' }]),
  bindDevice
)

export default router
