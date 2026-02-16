// ADD THIS: user controllers with schema-validated payloads
import { z } from 'zod'
import type { Request, Response } from 'express'
import { userModel } from '../models/userModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

const upsertUserSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
})

const updateUserSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).optional(),
    monthlyIncome: z.number().finite().nonnegative().optional(),
  })
  .refine((value) => value.displayName !== undefined || value.monthlyIncome !== undefined, {
    message: 'At least one field must be provided',
  })

export const upsertCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.email) {
    throw new AppError('Token does not include an email claim', 400)
  }

  const payload = upsertUserSchema.parse(req.body)
  const created = await userModel.upsertFromAuth({
    id: req.auth.userId,
    email: req.auth.email,
    displayName: payload.displayName,
  })

  res.status(201).json(created)
})

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const row = await userModel.getById(req.auth.userId)

  if (!row) {
    throw new AppError('User not found', 404)
  }

  res.status(200).json(row)
})

export const updateCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const payload = updateUserSchema.parse(req.body)
  const updated = await userModel.update(req.auth.userId, payload)

  if (!updated) {
    throw new AppError('User not found', 404)
  }

  res.status(200).json(updated)
})

export const deleteCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const removed = await userModel.remove(req.auth.userId)

  if (!removed) {
    throw new AppError('User not found', 404)
  }

  res.status(204).send()
})
