// ADD THIS: transaction controllers with strict validation
import { z } from 'zod'
import type { Request, Response } from 'express'
import { transactionModel } from '../models/transactionModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

const createTransactionSchema = z.object({
  categoryId: z.string().trim().min(1),
  amount: z.number().finite().nonnegative(),
  note: z.string().trim().max(400).optional(),
  transactionDate: z.string().trim().date(),
})

const updateTransactionSchema = z
  .object({
    categoryId: z.string().trim().min(1).optional(),
    amount: z.number().finite().nonnegative().optional(),
    note: z.string().trim().max(400).nullable().optional(),
    transactionDate: z.string().trim().date().optional(),
  })
  .refine(
    (value) =>
      value.categoryId !== undefined ||
      value.amount !== undefined ||
      value.note !== undefined ||
      value.transactionDate !== undefined,
    {
      message: 'At least one field must be provided',
    },
  )

const transactionIdSchema = z.object({ id: z.string().trim().min(1) })

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const payload = createTransactionSchema.parse(req.body)
  const created = await transactionModel.create({ ...payload, userId: req.auth.userId })

  res.status(201).json(created)
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
