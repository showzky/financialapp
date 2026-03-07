import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { deletePushToken, registerPushToken } from '../controllers/notificationController.js'

export const notificationRouter = Router()

const notificationWriteRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
})

notificationRouter.post('/push-tokens', notificationWriteRateLimiter, registerPushToken)
notificationRouter.delete('/push-tokens', notificationWriteRateLimiter, deletePushToken)