import { Router } from 'express'
import { uploadSingleImage } from '../middlewares/upload.middleware'
import { uploadFromCamera } from '../controllers/camera.controller'

const router = Router()

router.post('/camera/upload', uploadSingleImage('file'), uploadFromCamera)

export default router
