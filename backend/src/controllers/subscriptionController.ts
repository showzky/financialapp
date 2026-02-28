import type { Request, Response } from 'express'
import { subscriptionModel } from '../models/subscriptionModel.js'
import {
  createSubscriptionSchema,
  subscriptionIdSchema,
  toggleSubscriptionStatusSchema,
  updateSubscriptionSchema,
} from '../schemas/subscriptionSchema.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

export const listSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const rows = await subscriptionModel.listByUser(req.auth.userId)
  res.status(200).json(rows)
})

export const createSubscription = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const payload = createSubscriptionSchema.parse(req.body)

  const created = await subscriptionModel.create({
    userId: req.auth.userId,
    name: payload.name,
    provider: payload.provider,
    category: payload.category,
    status: payload.status,
    cadence: payload.cadence,
    priceCents: payload.priceCents,
    nextRenewalDate: payload.nextRenewalDate,
    notes: payload.notes ?? null,
  })

  res.status(201).json(created)
})

export const updateSubscription = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = subscriptionIdSchema.parse(req.params)
  const payload = updateSubscriptionSchema.parse(req.body)

  const updated = await subscriptionModel.update(id, req.auth.userId, payload)
  if (!updated) {
    throw new AppError('Subscription not found', 404)
  }

  res.status(200).json(updated)
})

export const deleteSubscription = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = subscriptionIdSchema.parse(req.params)
  const removed = await subscriptionModel.remove(id, req.auth.userId)

  if (!removed) {
    throw new AppError('Subscription not found', 404)
  }

  res.status(204).send()
})

export const toggleSubscriptionStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = subscriptionIdSchema.parse(req.params)
  const { status } = toggleSubscriptionStatusSchema.parse(req.body)

  const updated = await subscriptionModel.toggleStatus(id, req.auth.userId, status)
  if (!updated) {
    throw new AppError('Subscription not found', 404)
  }

  res.status(200).json(updated)
})

