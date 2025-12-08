import { Router } from 'express'
import { wechatLogin } from '../controllers/wechat.controller'

const router = Router()

router.post('/wechat/login', wechatLogin)

export default router
