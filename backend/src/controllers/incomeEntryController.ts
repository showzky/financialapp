import { z } from 'zod'
import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import { incomeEntryModel } from '../models/incomeEntryModel.js'
import { userModel } from '../models/userModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

const createIncomeEntrySchema = z.object({
  incomeCategoryId: z.string().trim().min(1).optional(),
  accountId: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).max(100),
  name: z.string().trim().max(200).optional(),
  amount: z.number().finite().positive(),
  receivedAt: z.string().trim().datetime(),
  accountName: z.string().trim().max(100).optional(),
  isPaid: z.boolean().optional(),
})

const updateIncomeEntrySchema = z
  .object({
    category: z.string().trim().min(1).max(100).optional(),
    incomeCategoryId: z.string().trim().min(1).nullable().optional(),
    accountId: z.string().trim().min(1).nullable().optional(),
    name: z.string().trim().max(200).nullable().optional(),
    amount: z.number().finite().positive().optional(),
    receivedAt: z.string().trim().datetime().optional(),
    accountName: z.string().trim().max(100).nullable().optional(),
    isPaid: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.category !== undefined ||
      value.incomeCategoryId !== undefined ||
      value.accountId !== undefined ||
      value.name !== undefined ||
      value.amount !== undefined ||
      value.receivedAt !== undefined ||
      value.accountName !== undefined ||
      value.isPaid !== undefined,
    { message: 'At least one field must be provided' },
  )

const incomeEntryIdSchema = z.object({ id: z.string().trim().min(1) })

export const createIncomeEntry = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const existingUser = await userModel.getById(req.auth.userId)
  if (!existingUser) {
    await userModel.upsertFromAuth({
      id: req.auth.userId,
      email: req.auth.email ?? `${req.auth.userId}@financetracker.local`,
      displayName: req.auth.email?.split('@')[0] ?? env.LOCAL_AUTH_USER_NAME,
    })
  }

  const payload = createIncomeEntrySchema.parse(req.body)
  const created = await incomeEntryModel.create({
    userId: req.auth.userId,
    incomeCategoryId: payload.incomeCategoryId,
    accountId: payload.accountId,
    category: payload.category,
    name: payload.name,
    amount: payload.amount,
    receivedAt: payload.receivedAt,
    accountName: payload.accountName,
    isPaid: payload.isPaid,
  })

  res.status(201).json(created)
})

export const listIncomeEntries = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const rows = await incomeEntryModel.listByUser(req.auth.userId)
  res.status(200).json(rows)
})

export const getIncomeEntryById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = incomeEntryIdSchema.parse(req.params)
  const row = await incomeEntryModel.getById(id, req.auth.userId)

  if (!row) {
    throw new AppError('Income entry not found', 404)
  }

  res.status(200).json(row)
})

export const updateIncomeEntry = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = incomeEntryIdSchema.parse(req.params)
  const payload = updateIncomeEntrySchema.parse(req.body)
  const updated = await incomeEntryModel.update(id, req.auth.userId, payload)

  if (!updated) {
    throw new AppError('Income entry not found', 404)
  }

  res.status(200).json(updated)
})

export const deleteIncomeEntry = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = incomeEntryIdSchema.parse(req.params)
  const removed = await incomeEntryModel.remove(id, req.auth.userId)

  if (!removed) {
    throw new AppError('Income entry not found', 404)
  }

  res.status(204).send()
})
