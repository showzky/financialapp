import { z } from 'zod'
import type { Request, Response } from 'express'
import { revolutImportStateModel } from '../models/revolutImportStateModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

const revolutImportRowSchema = z.object({
  id: z.string().trim().min(1),
  date: z.string().trim().min(1),
  description: z.string().trim().min(1),
  amount: z.number().finite(),
  currency: z.string().trim().min(1),
})

const revolutImportSummarySchema = z.object({
  rows: z.array(revolutImportRowSchema),
  totalSpent: z.number().finite(),
  totalIncome: z.number().finite(),
  currencies: z.array(z.string().trim()),
})

const revolutOverrideSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer', 'loan', 'ignore', 'review']).optional(),
  categoryId: z.string().trim().min(1).optional(),
  fundingSource: z.enum(['food-fund', 'lommepenger', 'none']).optional(),
})

const appliedRowRecordSchema = z.object({
  status: z.enum(['applied', 'failed', 'duplicate-blocked']),
  fingerprint: z.string().trim().min(1),
  appliedAt: z.string().trim().min(1).optional(),
  transactionId: z.string().trim().min(1).optional(),
  errorMessage: z.string().trim().min(1).optional(),
})

const revolutImportStateSchema = z.object({
  fileName: z.string(),
  summary: revolutImportSummarySchema,
  overrides: z.record(z.string(), revolutOverrideSchema).optional(),
  appliedRows: z.record(z.string(), appliedRowRecordSchema).optional(),
})

export const getRevolutImportState = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const row = await revolutImportStateModel.getByUser(req.auth.userId)
  res.status(200).json(
    row?.state ?? {
      fileName: '',
      summary: { rows: [], totalSpent: 0, totalIncome: 0, currencies: [] },
      overrides: {},
      appliedRows: {},
    },
  )
})

export const upsertRevolutImportState = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  const payload = revolutImportStateSchema.parse(req.body)
  const saved = await revolutImportStateModel.upsertByUser(req.auth.userId, payload)

  res.status(200).json(saved.state)
})

export const deleteRevolutImportState = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401)
  }

  await revolutImportStateModel.removeByUser(req.auth.userId)
  res.status(204).send()
})
