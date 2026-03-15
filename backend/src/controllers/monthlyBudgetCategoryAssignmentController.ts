import { z } from 'zod'
import type { Request, Response } from 'express'

import { env } from '../config/env.js'
import { monthlyBudgetCategoryAssignmentModel } from '../models/monthlyBudgetCategoryAssignmentModel.js'
import { userModel } from '../models/userModel.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/appError.js'

const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
})

const categoryIdSchema = z.object({
  categoryId: z.string().trim().min(1),
})

const upsertSchema = z.object({
  allocated: z.number().finite().nonnegative(),
})

async function ensureUser(req: Request) {
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

  return req.auth.userId
}

function toMonthStart(month: string) {
  return `${month}-01`
}

export const listMonthlyBudgetCategoryAssignments = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const { month } = monthQuerySchema.parse(req.query)
  const rows = await monthlyBudgetCategoryAssignmentModel.listByUserAndMonth(userId, toMonthStart(month))

  res.status(200).json({
    month,
    assignments: rows,
  })
})

export const upsertMonthlyBudgetCategoryAssignment = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const { month } = monthQuerySchema.parse(req.query)
  const { categoryId } = categoryIdSchema.parse(req.params)
  const { allocated } = upsertSchema.parse(req.body)
  const row = await monthlyBudgetCategoryAssignmentModel.upsert(
    userId,
    categoryId,
    toMonthStart(month),
    allocated,
  )

  res.status(200).json({
    month,
    assignment: row,
  })
})

export const deleteMonthlyBudgetCategoryAssignment = asyncHandler(async (req: Request, res: Response) => {
  const userId = await ensureUser(req)
  const { month } = monthQuerySchema.parse(req.query)
  const { categoryId } = categoryIdSchema.parse(req.params)
  const removed = await monthlyBudgetCategoryAssignmentModel.remove(
    userId,
    categoryId,
    toMonthStart(month),
  )

  if (!removed) {
    throw new AppError('Budget assignment not found', 404)
  }

  res.status(204).send()
})
