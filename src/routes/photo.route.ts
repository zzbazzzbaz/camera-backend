import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { deletePhotos, downloadLinks, listPhotos } from '../controllers/photo.controller'
import { validateFields } from '../middlewares/validator.middleware'

const router = Router()

router.get(
  '/photo/list',
  authMiddleware,
  validateFields([{ field: 'device_id', required: true, type: 'string' }], 'query'),
  listPhotos
)

router.delete(
  '/photo/delete',
  authMiddleware,
  validateFields(
    [
      { field: 'device_id', required: true, type: 'string' },
      { field: 'photo_ids', required: true }
    ],
    'body'
  ),
  deletePhotos
)

router.get(
  '/photo/download',
  authMiddleware,
  validateFields([{ field: 'device_id', required: true, type: 'string' }], 'query'),
  downloadLinks
)

export default router
