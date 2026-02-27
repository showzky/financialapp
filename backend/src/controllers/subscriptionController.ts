import type { Request, Response } from 'express'
import { subscriptionModel } from '../models/subscriptionModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

export const listSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const rows = await subscriptionModel.listByUser(req.auth.userId)
  res.status(200).json(rows)
})

