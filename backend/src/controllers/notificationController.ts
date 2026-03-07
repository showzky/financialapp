import type { Request, Response } from 'express'
import { z } from 'zod'
import { pushNotificationTokenModel } from '../models/pushNotificationTokenModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

const pushTokenSchema = z.object({
  token: z.string().trim().min(1).max(4096),
  platform: z.enum(['ios', 'android']),
})

const deletePushTokenSchema = z.object({
  token: z.string().trim().min(1).max(4096),
})

export const registerPushToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const payload = pushTokenSchema.parse(req.body)
  const token = await pushNotificationTokenModel.upsert({
    userId: req.auth.userId,
    token: payload.token,
    platform: payload.platform,
  })

  res.status(201).json(token)
})

export const deletePushToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const payload = deletePushTokenSchema.parse(req.body)
  await pushNotificationTokenModel.removeByUserAndToken(req.auth.userId, payload.token)

  res.status(204).send()
})