import { Router } from 'express'
import wechatRouter from './wechat.route'
import deviceRouter from './device.route'
import photoRouter from './photo.route'
import cameraRouter from './camera.route'

const router = Router()

router.use('/', wechatRouter)
router.use('/', deviceRouter)
router.use('/', photoRouter)
router.use('/', cameraRouter)

export default router
