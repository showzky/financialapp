// ADD THIS: transaction controllers with strict validation
import { z } from 'zod'
import type { Request, Response } from 'express'
import { transactionModel } from '../models/transactionModel.js'
import { userModel } from '../models/userModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'
import { env } from '../config/env.js'

const createTransactionSchema = z.object({
  categoryId: z.string().trim().min(1),
  accountId: z.string().trim().min(1).optional(),
  amount: z.number().finite().nonnegative(),
  note: z.string().trim().max(400).optional(),
  transactionDate: z.string().trim().date(),
  isPaid: z.boolean().optional(),
  countsTowardBills: z.boolean().optional(),
})

const updateTransactionSchema = z
  .object({
    categoryId: z.string().trim().min(1).optional(),
    accountId: z.string().trim().min(1).nullable().optional(),
    amount: z.number().finite().nonnegative().optional(),
    note: z.string().trim().max(400).nullable().optional(),
    transactionDate: z.string().trim().date().optional(),
    isPaid: z.boolean().optional(),
    countsTowardBills: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.categoryId !== undefined ||
      value.accountId !== undefined ||
      value.amount !== undefined ||
      value.note !== undefined ||
      value.transactionDate !== undefined ||
      value.isPaid !== undefined ||
      value.countsTowardBills !== undefined,
    {
      message: 'At least one field must be provided',
    },
  )

const transactionIdSchema = z.object({ id: z.string().trim().min(1) })
const categoryIdSchema = z.object({ categoryId: z.string().trim().min(1) })

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  // Only create a fallback user row when missing; preserve saved profile fields.
  try {
    const existingUser = await userModel.getById(req.auth.userId)
    if (!existingUser) {
      await userModel.upsertFromAuth({
        id: req.auth.userId,
        email: req.auth.email ?? `${req.auth.userId}@financetracker.local`,
        displayName: req.auth.email?.split('@')[0] ?? env.LOCAL_AUTH_USER_NAME,
      })
    }
  } catch (userError) {
    const msg = userError instanceof Error ? userError.message : String(userError)
    throw new AppError(`Failed to ensure user exists: ${msg}`, 500)
  }

  const payload = createTransactionSchema.parse(req.body)
  try {
    const created = await transactionModel.create({ ...payload, userId: req.auth.userId })

    res.status(201).json(created)
  } catch (transactionError) {
    const msg = transactionError instanceof Error ? transactionError.message : String(transactionError)
    throw new AppError(`Failed to create transaction: ${msg}`, 500)
  }
})

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const rows = await transactionModel.listByUser(req.auth.userId)

  res.status(200).json(rows)
})

export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = transactionIdSchema.parse(req.params)
  const row = await transactionModel.getById(id, req.auth.userId)

  if (!row) {
    throw new AppError('Transaction not found', 404)
  }

  res.status(200).json(row)
})

export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = transactionIdSchema.parse(req.params)
  const payload = updateTransactionSchema.parse(req.body)

  const updated = await transactionModel.update(id, req.auth.userId, payload)
  if (!updated) {
    throw new AppError('Transaction not found', 404)
  }

  res.status(200).json(updated)
})

export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { id } = transactionIdSchema.parse(req.params)
  const removed = await transactionModel.remove(id, req.auth.userId)

  if (!removed) {
    throw new AppError('Transaction not found', 404)
  }

  res.status(204).send()
})

export const deleteTransactionsByCategory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const { categoryId } = categoryIdSchema.parse(req.params)
  const removedCount = await transactionModel.removeByCategory(categoryId, req.auth.userId)

  res.status(200).json({ removedCount })
})
